const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      throw new Error("Invalid token provided");
    }

    const decodedObj = await jwt.verify(token, process.env.SECRET_KEY);

    const { _id } = decodedObj;

    const user = await User.findOne({ _id, active: true });

    if (!user) {
      throw new Error("User not found");
    }

    req.user = user;
    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "An unexpected error occurred. Please try again later. " + err,
    });
  }
};

module.exports = { userAuth };
