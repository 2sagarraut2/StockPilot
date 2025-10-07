const express = require("express");
const mongoose = require("mongoose");
const Category = require("../models/category");
const { userAuth } = require("../middlewares/auth");
const Product = require("../models/product");

const categoryRouter = express.Router();

categoryRouter.get("/category", userAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 10 ? 10 : limit;

    const skip = (page - 1) * limit;

    const categories = await Category.find({ active: true })
      .select("name description")
      .skip(skip)
      .limit(limit);

    const total = await Category.countDocuments();

    if (categories.length === 0) {
      throw new Error("Category not found");
    }

    return res.send({
      message: "Categories fetched successfully",
      data: categories,
      total,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      error: err.message || "Something went wrong",
    });
  }
});

categoryRouter.get("/category/:categoryId", userAuth, async (req, res) => {
  try {
    const { categoryId } = req.params;

    const isValid = mongoose.Types.ObjectId.isValid(categoryId);
    if (!isValid) {
      throw new Error("Invalid category id");
    }

    const category = await Category.findOne({
      _id: categoryId,
      active: true,
    }).select("name description");

    if (!category) {
      throw new Error("Category not found");
    }

    return res.json({
      message: "Category retrieved successfully!",
      data: category,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      error: err.message || "Something went wrong",
    });
  }
});

categoryRouter.post("/category/add", userAuth, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (name.length < 3 || description.length < 3) {
      return res.status(400).json({
        error:
          "Category name and description must each be at least 3 characters long.",
      });
    }

    // Check if category is unique
    const existingCategory = await Category.findOne({ name, active: true });
    if (existingCategory) {
      throw new Error("Category already exists");
    }

    const category = new Category({
      name,
      description,
      active: true,
    });

    await category.save();

    return res.json({ message: "Category added successfully", category });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      error: err.message || "Something went wrong",
    });
  }
});

categoryRouter.delete(
  "/category/delete/:categoryId",
  userAuth,
  async (req, res) => {
    try {
      const { categoryId } = req.params;

      const isValid = mongoose.Types.ObjectId.isValid(categoryId);
      if (!isValid) {
        throw new Error("Invalid category id");
      }

      // Check if category exists
      const categoryExists = await Category.findOne({
        _id: categoryId,
        active: true,
      });
      if (!categoryExists) {
        throw new Error("Category does not exists");
      }

      // Check category id has any associated products then dont allow delete
      const associatedProducts = await Product.findOne({
        category: categoryId,
        active: true,
      });

      if (associatedProducts) {
        throw new Error(
          "Products associated to category in stock, cannot delete category"
        );
      }

      const deletedCategory = await Category.findByIdAndUpdate(
        categoryId,
        { active: false },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!deletedCategory) {
        throw new Error("Category not found");
      }

      return res.json({ message: "Category deleted successfully" });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        error: err.message || "Something went wrong",
      });
    }
  }
);

categoryRouter.patch(
  "/category/update/:categoryId",
  userAuth,
  async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { name, description } = req.body;

      const isValid = mongoose.Types.ObjectId.isValid(categoryId);
      if (!isValid) {
        throw new Error("Invalid category id");
      }

      const allowedEditFields = ["name", "description"];

      const keys = Object.keys(req.body);

      if (keys.length === 0) {
        throw new Error("No fields provided to update");
      }

      const isEditAllowed =
        keys.length > 0 &&
        keys.every((field) => allowedEditFields.includes(field));

      if (!isEditAllowed) {
        throw new Error("Update not allowed");
      }

      // Check if category name already exists then down allow
      const duplicateCategory = await Category.findOne({
        name: name,
        active: true,
      });

      if (duplicateCategory) {
        throw new Error("Category name should be unique");
      }

      // Check if category exists
      const categoryExists = await Category.findOne({
        _id: categoryId,
        active: true,
      });

      if (!categoryExists) {
        throw new Error("Category does not exists");
      }

      const updatedCategory = await Category.findOneAndUpdate(
        {
          _id: categoryId,
          active: true,
        },
        { name, description },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedCategory) {
        throw new Error("Category not found");
      }

      return res.json({
        message: "Category updated successfully",
        data: updatedCategory,
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        error: err.message || "Something went wrong",
      });
    }
  }
);

module.exports = categoryRouter;
