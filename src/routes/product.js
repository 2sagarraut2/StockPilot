const express = require("express");
const Product = require("../models/product");
const Category = require("../models/category");
const mongoose = require("mongoose");

const productRouter = express.Router();

productRouter.get("/products/get", async (req, res) => {
  try {
    const products = await Product.find({ active: true });

    if (!products) {
      throw new Error("No products found!");
    }

    return res.send({
      message: "Products fetched successfully",
      products: products,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
});

productRouter.get("/products/get/:product_id", async (req, res) => {
  try {
    const { product_id } = req.params;
    const isValid = mongoose.Types.ObjectId.isValid(product_id);

    if (!isValid) {
      throw new Error("Invalid product id");
    }

    const product = await Product.findOne({
      _id: product_id,
      active: true,
    }).populate("category");

    if (!product) {
      throw new Error("No products found!");
    }

    return res.json({ message: "Product fetched successfully!", product });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
});

productRouter.post("/products/add", async (req, res) => {
  try {
    const { name, description, categoryId, price, sku } = req.body;

    if (!name || !description || !categoryId || !price || !sku) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // TODO: Check if product name already exists
    const existing_product = await Product.findOne({
      name: name,
      active: true,
    });

    if (existing_product) {
      return res.status(400).json({ message: "Product already exists" });
    }

    if (name.length < 3 || description.length < 3) {
      return res.status(400).json({
        error:
          "Product name and description must each be at least 3 characters long.",
      });
    }

    // TODO: Check if category exists
    const existing_category = await Category.findOne({
      _id: categoryId,
      active: true,
    });

    if (!existing_category) {
      return res.status(400).json({ message: "Category does not exists" });
    }

    if (price < 1) {
      return res.status(400).json({ error: "Price should be atleast 1" });
    }

    // TODO: Check if sku is unique
    const existing_sku = await Product.findOne({ sku, active: true });

    if (existing_sku) {
      return res.status(409).json({ message: "SKU should be unique" });
    }

    const product = new Product({
      name,
      description,
      category: existing_category._id,
      price,
      sku,
      active: true,
    });

    try {
      await product.save();
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "SKU already exists" });
      }
      throw err;
    }

    return res.status(201).json({
      message: "Product added successfully",
      product,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
});

module.exports = productRouter;
