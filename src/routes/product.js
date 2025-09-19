const express = require("express");
const Product = require("../models/product");
const Category = require("../models/category");
const Stock = require("../models/stock");
const mongoose = require("mongoose");

const productRouter = express.Router();

productRouter.get("/product", async (req, res) => {
  try {
    const products = await Product.find({ active: true })
      .select("name description categoryId price sku")
      .populate({
        path: "category",
        select: "name",
      });

    if (products.length === 0) {
      throw new Error("Product not found!");
    }

    return res.send({
      message: "Products fetched successfully",
      data: products,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
});

productRouter.get("/product/:product_id", async (req, res) => {
  try {
    const { product_id } = req.params;
    const isValid = mongoose.Types.ObjectId.isValid(product_id);

    if (!isValid) {
      throw new Error("Invalid product id");
    }

    const product = await Product.findOne({
      _id: product_id,
      active: true,
    })
      .select("name description categoryId price sku")
      .populate({ path: "category", select: "name" });

    if (!product) {
      throw new Error("Product not found!");
    }

    return res.json({
      message: "Product fetched successfully!",
      data: product,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
});

productRouter.post("/product/add", async (req, res) => {
  try {
    const { name, description, categoryId, price, sku } = req.body;

    if (!name || !description || !categoryId || !price || !sku) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (name.length < 3 || description.length < 3) {
      return res.status(400).json({
        error:
          "Product name and description must each be at least 3 characters long.",
      });
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

// Delete one product
productRouter.delete("/product/delete/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const isValid = mongoose.Types.ObjectId.isValid(productId);
    if (!isValid) {
      throw new Error("Invalid product id");
    }

    const deletedProduct = await Product.findByIdAndUpdate(
      productId,
      { active: false },
      {
        new: true,
        runValidators: true,
      }
    );

    // TODO: Deleting product will delete its corresponding stock entry as well
    // If Stock is > 0 then don't allow product delete show warning - Product inStock cannot be deleted

    if (!deletedProduct) {
      throw new Error("Product not found");
    }

    return res.json({ message: "Product updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
});

productRouter.patch("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const isValid = mongoose.Types.ObjectId.isValid(productId);

    if (!isValid) {
      throw new Error("Invalid product id");
    }

    const allowedEditFields = ["description", "category", "price"];

    const keys = Object.keys(req.body);

    if (keys.length === 0) {
      throw new Error("No fields provided to update");
    }

    const isUpdateAllowed =
      keys.length > 0 &&
      keys.every((field) => allowedEditFields.includes(field));

    if (!isUpdateAllowed) {
      throw new Error("Update not allowed");
    }

    const isCategory = mongoose.Types.ObjectId.isValid(req.body.category);
    if (!isCategory) {
      throw new Error("Category doesn't exists, please create one");
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, active: true },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      throw new Error("Product not found");
    }

    return res.json({
      message: "Product update successful",
      data: updatedProduct,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
});

productRouter.patch("/product/full-update/:productId", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId } = req.params;
    const { price, description, category, quantity } = req.body;

    if (!price || !description || !category || !quantity) {
      throw new Error(
        "Price, description, category and quantity are required fields"
      );
    }

    // Update product
    const product = await Product.findByIdAndUpdate(
      productId,
      { price, description, category },
      { new: true, session }
    );

    if (!product) throw new Error("Product not found");

    // Update stock
    const stock = await Stock.findOneAndUpdate(
      { product: productId },
      { quantity },
      { new: true, session }
    );

    if (!stock) throw new Error("Stock not found");

    // Commit both updates
    await session.commitTransaction();
    session.endSession();

    return res.json({
      message: "Product and stock updated successfully",
    });

    // return res.json({
    //   message: "Product and stock updated successfully",
    //   product,
    //   stock,
    // });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      error: "Full update failed. Changes rolled back. " + err.message,
    });
  }
});

module.exports = productRouter;
