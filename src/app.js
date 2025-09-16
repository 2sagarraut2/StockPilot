const express = require("express");
const connectDB = require("./config/database");
const app = express();
require("dotenv").config();

app.use("/products", (req, res) => {
  try {
    return res.send({ message: "Products retrieved successfully" });
  } catch (err) {
    res.status(400).send("Something went wrong" + err.message);
  }
});

connectDB()
  .then(() => {
    console.log("Database connection established!");
    app.listen(5555, () => {
      console.log("Server started on port 5555");
    });
  })
  .catch((err) => {
    console.error("Database connection failed");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Full error:", err);
  });
