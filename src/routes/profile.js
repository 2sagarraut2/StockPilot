const express = require("express");
const { validateSignupData } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { userAuth } = require("../middlewares/auth");

const profileRouter = express.Router();

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const { firstName, lastName, email, role } = req.user;
    const loggedInUser = {
      firstName,
      lastName,
      email,
      role,
    };

    return res.json({
      message: "User retrieved successfully",
      data: loggedInUser,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err.message || "Something went wrong",
    });
  }
});

module.exports = profileRouter;
