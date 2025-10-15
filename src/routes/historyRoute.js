const express = require("express");
const mongoose = require("mongoose");
const { userAuth } = require("../middlewares/auth");
const History = mongoose.model("History");

const historyRouter = express.Router();

historyRouter.get("/history/:model/:id", userAuth, async (req, res) => {
  const { model, id } = req.params;
  try {
    const history = await History.find({
      refModel: model,
      refId: id,
    })
      .populate({
        path: "modifiedBy",
        select: "firstName lastName email role",
        populate: {
          path: "role",
          select: "label",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ message: "History retrieved successfully", data: history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = historyRouter;
