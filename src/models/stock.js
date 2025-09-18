const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    trim: true,
  },
  active: {
    type: Boolean,
    required: true,
    default: true,
  },
  //   lastUpdatedBy: {
  //     type: mongoose.Schema.Types.ObjectId,
  //     required: true,
  //   },
});

module.exports = mongoose.model("Stock", stockSchema);
