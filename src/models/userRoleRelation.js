const mongoose = require("mongoose");

const userRoleRelationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    active: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userRoleRelationSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { active: true } }
);
