const express = require("express");
const Stock = require("../models/stock");
const Product = require("../models/product");
const validator = require("validator");
const mongoose = require("mongoose");

const stockRouter = express.Router();

stockRouter.get("/stock", async (req, res) => {
  try {
    const stockOfProducts = await Stock.find({ active: true });

    if (stockOfProducts.length === 0) {
      throw new Error("No stock found");
    }

    return res.json({
      message: "Stock retrieved successfully",
      data: stockOfProducts,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
});

stockRouter.post("/stock", async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if product id is valid
    const isValidProductId = mongoose.Types.ObjectId.isValid(productId);
    if (!isValidProductId) {
      throw new Error("Invalid product Id");
    }

    // Check if product exists
    const existing_product = await Product.findById({ _id: productId });
    if (!existing_product) {
      throw new Error("Product doesn't exists, please insert one");
    }

    if (quantity < 0) {
      return res
        .status(401)
        .json({ error: "Quantity cannot be less than zero" });
    }

    const stockToInsert = new Stock({
      productId,
      quantity,
      active: 1,
    });

    const newStock = await stockToInsert.save();

    return res.json({ message: "Stock added successfully", data: newStock });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
});

stockRouter.patch("/stock/:stockId", async (req, res) => {});

module.exports = stockRouter;
