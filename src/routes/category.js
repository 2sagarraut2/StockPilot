const express = require("express");
const Category = require("../models/category");

const categoryRouter = express.Router();

categoryRouter.post("/category/add", async (req, res) => {
  try {
    const { name, description } = req.body;

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

module.exports = categoryRouter;
