const mongoose = require("mongoose");
const historyPlugin = require("../middlewares/historyPlugin");

const stockSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: "Product",
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

stockSchema.plugin(historyPlugin, { modelName: "Stock" });

module.exports = mongoose.model("Stock", stockSchema);
