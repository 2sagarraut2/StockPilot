const express = require("express");
const Product = require("../models/product");
const Category = require("../models/category");
const Stock = require("../models/stock");
const mongoose = require("mongoose");
const { userAuth } = require("../middlewares/auth");

const productRouter = express.Router();

productRouter.get("/product", userAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 10 ? 10 : limit;

    const skip = (page - 1) * limit;

    const products = await Product.find({ active: true })
      .select("name description categoryId price sku")
      .populate({
        path: "category",
        select: "name",
      })
      .skip(skip)
      .limit(limit);

    // exclude active: false items
    const total = await Product.countDocuments({ active: true });

    if (products.length === 0) {
      throw new Error("Product not found!");
    }

    return res.send({
      message: "Products fetched successfully",
      data: products,
      total,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      error: err.message || "Something went wrong",
    });
  }
});

productRouter.get("/product/:product_id", userAuth, async (req, res) => {
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
      error: err.message || "Something went wrong",
    });
  }
});

productRouter.post("/product/add", userAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { name, description, categoryId, price, sku } = req.body;

    if (!name || !description || !categoryId || !price || !sku) {
      throw new Error("All fields are required");
    }

    if (name.length < 3 || description.length < 3) {
      throw new Error(
        "Product name and description must each be at least 3 characters long."
      );
    }

    // Check if product name already exists
    const existing_product = await Product.findOne({
      name: name,
      active: true,
    });

    if (existing_product) {
      throw new Error("Product already exists");
    }

    if (name.length < 3 || description.length < 3) {
      throw new Error(
        "Product name and description must each be at least 3 characters long."
      );
    }

    // Check if category exists
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

    const existing_sku = await Product.findOne({ sku, active: true });

    if (existing_sku) {
      throw new Error("SKU should be unique");
    }

    const product = new Product({
      name,
      description,
      category: existing_category._id,
      price,
      sku,
      active: true,
    });

    // While adding product add 0 stock for every new addded product
    const stockToInsert = new Stock({
      product: product._id,
      quantity: 0,
      active: true,
    });

    try {
      await product.save();
      const newStock = await stockToInsert.save();
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "Something went wrong" });
      }
      throw err;
    }

    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      message: "Product added successfully",
      data: product,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.log(err);
    res.status(500).json({
      error: err.message || "Something went wrong",
    });
  }
});

// Delete one product
productRouter.delete(
  "/product/delete/:productId",
  userAuth,
  async (req, res) => {
    try {
      const { productId } = req.params;
      console.log(productId, "productId");

      const isValid = mongoose.Types.ObjectId.isValid(productId);
      if (!isValid) {
        throw new Error("Invalid product id");
      }

      // Check if product exists
      const isProductExists = await Product.findOne({
        _id: productId,
        active: true,
      });

      if (!isProductExists) {
        throw new Error("Product does not exists");
      }

      // If Stock is > 0 then don't allow product delete show warning - Product inStock cannot be deleted
      const existing_stock = await Stock.findOne({
        product: productId,
        active: true,
      });

      if (existing_stock.quantity > 0) {
        throw new Error("Product in stock cannot be deleted");
      }

      const deletedProduct = await Product.findByIdAndUpdate(
        productId,
        { active: false },
        {
          new: true,
          runValidators: true,
        }
      );

      const deletedStock = await Stock.findOneAndUpdate(
        { product: productId },
        { active: false },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!deletedProduct) {
        throw new Error("Product not found");
      }

      return res.json({ message: "Product deleted" });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        error: err.message || "Something went wrong",
      });
    }
  }
);

productRouter.patch(
  "/product/update/:productId",
  userAuth,
  async (req, res) => {
    try {
      const { productId } = req.params;
      const { name, description, category, price, sku } = req.body;

      const isValid = mongoose.Types.ObjectId.isValid(productId);

      if (!isValid) {
        throw new Error("Invalid product id");
      }

      const allowedEditFields = [
        "name",
        "description",
        "category",
        "price",
        "sku",
      ];

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

      // Check if product name already exists
      const existing_product = await Product.findOne({
        name: name,
        active: true,
      });

      if (existing_product) {
        throw new Error("Product already exists");
      }

      const isCategory = mongoose.Types.ObjectId.isValid(req.body.category);
      if (!isCategory) {
        throw new Error("Category doesn't exists, please create one");
      }

      // Check if category exists
      const existing_category = await Category.findOne({
        _id: category,
        active: true,
      });

      if (!existing_category) {
        throw new Error("Category does not exists, please create one");
      }

      // Check if sku exists
      // Check if category exists
      const existing_sku = await Product.findOne({
        sku: sku,
        active: true,
      });

      if (existing_sku) {
        throw new Error("SKU should be unique");
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
        error: err.message || "Something went wrong",
      });
    }
  }
);

productRouter.patch(
  "/product/full-update/:productId",
  userAuth,
  async (req, res) => {
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
  }
);

module.exports = productRouter;
