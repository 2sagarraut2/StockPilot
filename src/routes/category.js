const express = require("express");
const Category = require("../models/category");

const categoryRouter = express.Router();

categoryRouter.post("/category/add", async (req, res) => {
  try {
    const { name, description } = req.body;

    // TODO: Check if category is unique
    const existing_category = await Category.find({ name, active: true });
    if (existing_category.length > 0) {
      return res.status(400).json({ message: "Category already exists" });
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
