const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
      unique: true,
      minLength: 3,
      maxLength: 20,
    },
    description: {
      type: String,
      require: true,
      minLength: 3,
      maxLength: 50,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "Category",
    },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      require: true,
      min: 1,
    },
    sku: {
      type: String,
      require: true,
      unique: true,
    },
    active: {
      type: Boolean,
      require: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
