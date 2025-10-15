const mongoose = require("mongoose");
const historyPlugin = require("../middlewares/historyPlugin");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

categorySchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { active: true } }
);

categorySchema.plugin(historyPlugin, { modelName: "Category" });

module.exports = mongoose.model("Category", categorySchema);
