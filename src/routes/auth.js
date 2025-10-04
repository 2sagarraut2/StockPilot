const express = require("express");
const { validateSignupData } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const validator = require("validator");
const Role = require("../models/role");
const role = require("../models/role");

const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  try {
    validateSignupData(req);

    const { firstName, lastName, email, password } = req.body;
    const updatedEmail = email.toLowerCase();
    console.log(updatedEmail);

    // Check if existing user
    const existingUser = await User.findOne({
      email: updatedEmail,
      active: true,
    });

    if (existingUser) {
      throw new Error("Existing user please login");
    }

    // Encrypt the password
    const passwordHash = await bcrypt.hash(password, 10);

    // find out the reader role
    const role = await Role.findOne({ label: "reader", active: true });

    // Create user
    const user = new User({
      firstName,
      lastName,
      email: updatedEmail,
      password: passwordHash,
      role: role._id,
      active: true,
    });

    const addedUser = await user.save();

    const populatedUser = await User.findById(addedUser._id).populate(
      "role",
      "label"
    );

    const userDataToSend = {
      firstName: populatedUser.firstName,
      lastName: populatedUser.lastName,
      email: populatedUser.email,
      role: populatedUser.role, // get the role label
    };

    return res.json({
      message: "User created successfully",
      data: userDataToSend,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err.message || "Something went wrong",
    });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const updatedEmail = email.toLowerCase();

    if (!validator.isEmail(updatedEmail)) {
      throw new Error("The email address provided is not valid.");
    }

    const user = await User.findOne({ email: updatedEmail }).populate(
      "role",
      "label"
    );

    if (!user) {
      throw new Error("The email or password you entered is incorrect.");
    }

    const isPasswordValid = await user.validatePassword(password);

    if (isPasswordValid) {
      const token = await user.getJWT();

      res.cookie("token", token, {
        expires: new Date(Date.now() + 12 * 36000000),
      });

      const userDataToSend = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      };

      return res.json({ message: "Login successful", data: userDataToSend });
    } else {
      throw new Error("The email or password you entered is incorrect.");
    }
  } catch (err) {
    res.status(400).send({
      error: err.message || "Something went wrong",
    });
    console.log(err);
  }
});

authRouter.post("/logout", async (req, res) => {
  try {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
    });

    res.json({ message: "Logout successful" });
  } catch (err) {
    res.status(400).send({
      error: err.message || "Something went wrong",
    });
    console.log(err);
  }
});

module.exports = authRouter;
