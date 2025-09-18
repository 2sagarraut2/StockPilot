const express = require("express");
const mongoose = require("mongoose");
const Category = require("../models/category");

const categoryRouter = express.Router();

categoryRouter.get("/category", async (req, res) => {
  try {
    const categories = await Category.find({ active: true }).select(
      "name description"
    );

    if (categories.length === 0) {
      throw new Error("Category not found");
    }

    return res.send({
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
});

categoryRouter.get("/category/:categoryId", async (req, res) => {
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
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
});

categoryRouter.post("/category/add", async (req, res) => {
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

    // TODO: Check if category is unique
    const existingCategory = await Category.findOne({ name, active: true });
    if (existingCategory) {
      return res.status(409).json({ error: "Category already exists" });
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
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
});

categoryRouter.delete("/category/delete/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;

    const isValid = mongoose.Types.ObjectId.isValid(categoryId);
    if (!isValid) {
      throw new Error("Invalid category id");
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
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
});

categoryRouter.patch("/category/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;

    const isValid = mongoose.Types.ObjectId.isValid(categoryId);
    if (!isValid) {
      throw new Error("Invalid category id");
    }

    const allowedEditFields = ["description"];

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

    const updatedCategory = await Category.findOneAndUpdate(
      {
        _id: categoryId,
        active: true,
      },
      { description: req.body.description },
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
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
});

module.exports = categoryRouter;
