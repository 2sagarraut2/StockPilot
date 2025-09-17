const express = require("express");
const Product = require("../models/product");
const Category = require("../models/category");
const mongoose = require("mongoose");

const productRouter = express.Router();

productRouter.get("/products/get", async (req, res) => {
  try {
    const products = await Product.find({ active: true });

    if (!products) {
      return res.status(404).json({ message: "No products found!" });
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
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await Product.findById({
      _id: product_id,
      active: true,
    }).populate("category");

    if (!product) {
      return res.status(404).json({ message: "No products found!" });
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
    const { name, description, category, price, sku } = req.body;

    // TODO: Check if product name already exists
    const existing_product = await Product.find({ name: name, active: true });
    console.log(existing_product);

    if (existing_product.length > 0) {
      return res.status(400).json({ message: "Product already exists" });
    }

    if (name.length < 3 && description.length < 3) {
      return res.status(400).json({
        error: "Product name and description should have three characters",
      });
    }

    // TODO: Check if category exists
    const existing_category = await Category.find({
      name: category,
      active: true,
    });

    if (existing_category.length < 1) {
      return res.status(400).json({ message: "Category does not exists" });
    }

    if (price < 1) {
      return res.status(400).json({ error: "Price should be atleast 1" });
    }

    // TODO: Check if sku is unique
    const existing_sku = await Product.find({ active: true });

    if (existing_sku) {
      return res.status(400).json({ message: "SKU should be unique" });
    }

    const product = new Product({
      name,
      description,
      category: existing_category[0]._id,
      price,
      sku,
      active: true,
    });

    await product.save();

    return res.json({
      message: "Product added successfully",
      product: product,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
});

module.exports = productRouter;
