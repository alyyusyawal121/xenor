const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Nexora API is running",
  });
});

app.get("/api/products", (req, res) => {
  res.json([
    {
      id: 1,
      name: "Minimalist T-Shirt",
      price: 150000,
    },
    {
      id: 2,
      name: "Classic Sneakers",
      price: 450000,
    },
  ]);
});

module.exports = app;