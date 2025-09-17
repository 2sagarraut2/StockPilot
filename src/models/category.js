const mongoose = require("mongoose");

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

module.exports = mongoose.model("Category", categorySchema);
