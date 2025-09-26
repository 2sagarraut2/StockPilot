const validator = require("validator");

const validateSignupData = (req) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName && !lastName) {
    throw new Error("Invalid name provided");
  } else if (!validator.isEmail(email)) {
    throw new Error("Invalid Email address");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Please enter a trong password");
  }
};

module.exports = { validateSignupData };
