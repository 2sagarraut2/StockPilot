const { default: mongoose } = require("mongoose");

const isEqual = (a, b) => {
  if (mongoose.isValidObjectId(a) && mongoose.isValidObjectId(b)) {
    return String(a) === String(b);
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  if (a == null && b == null) return true;
  return JSON.stringify(a) === JSON.stringify(b);
};

module.exports = { isEqual };
