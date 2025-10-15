const mongoose = require("mongoose");
const { isEqual } = require("../utils/utils");

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
      changes: { type: Object, default: {} },
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
        // CREATE
        await HistoryModel.create({
          refModel: modelName,
          refId: this._id,
          action: "CREATE",
          modifiedBy: userId,
          changes: { created: this.toObject() },
        });
      } else {
        // UPDATE
        await HistoryModel.create({
          refModel: modelName,
          refId: this._id,
          action: "UPDATE",
          modifiedBy: userId,
          changes: { updated: this.toObject() },
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

      const updateObj = this.getUpdate() || {};
      const setFields = updateObj.$set || updateObj;
      const changes = {};

      for (const [key, newVal] of Object.entries(setFields)) {
        if (["_id", "__v", "createdAt", "updatedAt"].includes(key)) continue;
        const oldVal = this._oldData[key];
        if (!isEqual(oldVal, newVal)) {
          changes[key] = { from: oldVal, to: newVal };
        }
      }

      if (Object.keys(changes).length === 0) return;

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
        changes,
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
