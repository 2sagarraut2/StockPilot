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

    // Check if existing user
    const existingUser = await User.findOne({ email: email, active: true });
    console.log("existingUser " + existingUser);

    if (existingUser) {
      throw new Error("Existing user please login");
    }

    // Encrypt the password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      email,
      password: passwordHash,
      active: true,
    });

    await user.save();

    return res.json({ message: "User created successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validator.isEmail(email)) {
      throw new Error("The email address provided is not valid.");
    }

    const user = await User.findOne({ email: email });

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
      error: "" + err,
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
      error: "" + err,
    });
    console.log(err);
  }
});

module.exports = authRouter;
