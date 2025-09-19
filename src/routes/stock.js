const express = require("express");
const Stock = require("../models/stock");
const Product = require("../models/product");
const validator = require("validator");
const mongoose = require("mongoose");

const stockRouter = express.Router();

stockRouter.get("/stock", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 10 ? 10 : limit;

    const skip = (page - 1) * limit;

    const stockOfProducts = await Stock.find({ active: true })
      .select("quantity")
      .populate({
        path: "product",
        select: "name description price sku",
        populate: {
          path: "category",
          select: "name",
        },
      })
      .skip(skip)
      .limit(limit);

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

    // TODO: Check if stock already exists if yes not allow to add instead ask for update
    const existing_stock = await Stock.findOne({
      product: productId,
      active: true,
    });

    if (existing_stock) {
      throw new Error("Product stock already exists, please update");
    }

    const stockToInsert = new Stock({
      product: productId,
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

stockRouter.patch("/stock/:stockId", async (req, res) => {
  try {
    const { stockId } = req.params;

    const isValid = mongoose.Types.ObjectId.isValid(stockId);
    if (!isValid) {
      throw new Error("Invalid stock id provided");
    }

    const allowedEditFields = ["quantity"];

    const keys = Object.keys(req.body);

    const isEditAllowed = keys.every((field) =>
      allowedEditFields.includes(field)
    );
    if (!isEditAllowed) {
      throw new Error("Update not allowed");
    }

    const updatedStock = await Stock.findOneAndUpdate(
      { _id: stockId, active: true },
      { quantity: req.body.quantity },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.json({
      message: "Stock updated successfully",
      data: updatedStock,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
});

module.exports = stockRouter;
