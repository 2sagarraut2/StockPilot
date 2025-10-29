const mongoose = require("mongoose");
const { isEqual } = require("../utils/utils");

// Utility function to compare old vs new document fields (excluding system fields)
const getChangedFields = (oldDoc = {}, newDoc = {}) => {
  const changes = [];
  const ignoredFields = ["_id", "__v", "createdAt", "updatedAt"];

  for (const [key, newValue] of Object.entries(newDoc)) {
    if (ignoredFields.includes(key)) continue; // skip system fields

    const oldValue = oldDoc ? oldDoc[key] : undefined;

    // Compare deeply using JSON.stringify (simple for plain objects)
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: key,
        from: oldValue ?? null,
        to: newValue ?? null,
      });
    }
  }

  return changes;
};

let HistoryModel;

if (!mongoose.models.History) {
  const historySchema = new mongoose.Schema(
    {
      refModel: { type: String, required: true },
      refId: { type: mongoose.Schema.Types.ObjectId, required: true },
      action: {
        type: String,
        enum: ["CREATE", "UPDATE", "DELETE"],
        required: true,
      },
      modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      changes: [
        {
          field: String,
          from: mongoose.Schema.Types.Mixed,
          to: mongoose.Schema.Types.Mixed,
        },
      ],
      reason: { type: String, trim: true },
      referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "referenceModel",
      },
      referenceModel: { type: String, trim: true },
      notes: { type: String, trim: true },
      timestamp: { type: Date, default: Date.now },
    },
    { timestamps: true }
  );

  HistoryModel = mongoose.model("History", historySchema);
} else {
  HistoryModel = mongoose.models.History;
}

function historyPlugin(schema, options = {}) {
  const modelName = options.modelName || "UnknownModel";

  schema.pre("save", function (next) {
    // Ensure user is attached before save
    this._wasNew = this.isNew;
    if (this.$locals?.user) {
      this._user = this.$locals.user;
    }
    next();
  });

  schema.pre("save", function (next) {
    this._wasNew = this.isNew;
    if (this.$locals?.user) {
      this._user = this.$locals.user;
    }
    next();
  });

  schema.post("save", async function () {
    console.log(`📘 [${modelName}] post-save triggered`);

    try {
      const userId = this._user?._id || this.$locals?.user?._id || null;

      if (this._wasNew) {
        // ✅ CREATE - save all fields as "to" values
        const newChanges = getChangedFields({}, this.toObject());

        // CREATE
        await HistoryModel.create({
          refModel: modelName,
          refId: this._id,
          action: "CREATE",
          modifiedBy: userId,
          changes: newChanges,
        });
      } else {
        // ✅ UPDATE - compare old and new docs
        const oldDoc = await this.constructor.findById(this._id).lean();
        const newChanges = getChangedFields(oldDoc, this.toObject());

        // UPDATE
        await HistoryModel.create({
          refModel: modelName,
          refId: this._id,
          action: "UPDATE",
          modifiedBy: userId,
          changes: newChanges,
        });
      }
    } catch (err) {
      console.error(`❌ Error saving history for ${modelName}:`, err);
    }
  });

  schema.pre(["findOneAndUpdate", "findByIdAndUpdate"], async function (next) {
    try {
      const oldDoc = await this.model.findOne(this.getQuery()).lean();
      this._oldData = oldDoc;
      next();
    } catch (err) {
      console.error(`❌ Error fetching old data for ${modelName}:`, err);
      next(err);
    }
  });

  schema.post(["findOneAndUpdate", "findByIdAndUpdate"], async function (res) {
    try {
      if (!res || !this._oldData) return;

      const updatedDoc = await this.model.findById(res._id).lean();
      if (!updatedDoc) return;

      // ✅ Use helper to generate change list
      const newChanges = getChangedFields(this._oldData, updatedDoc);
      if (newChanges.length === 0) return;

      const userId =
        this.getOptions()?.context?.user?._id ||
        this.options?.context?.user?._id ||
        updatedDoc.updatedBy ||
        null;

      await HistoryModel.create({
        refModel: modelName,
        refId: updatedDoc._id,
        action: "UPDATE",
        modifiedBy: userId,
        changes: newChanges,
      });
    } catch (err) {
      console.error(`❌ Error saving UPDATE history for ${modelName}:`, err);
    }
  });

  schema.pre(["findOneAndUpdate", "findByIdAndUpdate"], async function (next) {
    const update = this.getUpdate();
    if (update && update.active === false) {
      this._isDelete = true;
      this._deletedDoc = await this.model.findOne(this.getQuery()).lean();
    }
    next();
  });

  schema.post(["findOneAndUpdate", "findByIdAndUpdate"], async function () {
    try {
      if (!this._isDelete || !this._deletedDoc) return;

      const userId =
        this.getOptions()?.context?.user?._id ||
        this._deletedDoc.updatedBy ||
        null;

      await HistoryModel.create({
        refModel: modelName,
        refId: this._deletedDoc._id,
        action: "DELETE",
        modifiedBy: userId,
        changes: { deleted: this._deletedDoc },
      });
    } catch (err) {
      console.error(`❌ Error saving DELETE history for ${modelName}:`, err);
    }
  });
}

module.exports = historyPlugin;
