const express = require("express");
const { validateSignupData } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const validator = require("validator");

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

    const user = new User({
      firstName,
      lastName,
      email: updatedEmail,
      password: passwordHash,
      active: true,
    });

    await user.save();

    return res.json({ message: "User created successfully" });
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

    const user = await User.findOne({ email: updatedEmail });

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
