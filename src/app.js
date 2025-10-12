const express = require("express");
const connectDB = require("./config/database");
const app = express();
require("dotenv").config();
const cors = require("cors");

const cookieParser = require("cookie-parser");

app.use(
  cors({
    origin: "http://localhost:1234",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const productRouter = require("./routes/product");
const categoryRouter = require("./routes/category");
const stockRouter = require("./routes/stock");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const product = require("./models/product");

app.use("/", productRouter);
app.use("/", categoryRouter);
app.use("/", stockRouter);
app.use("/", authRouter);
app.use("/", profileRouter);

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
