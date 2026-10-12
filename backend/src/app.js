
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Data dummy sementara.
// Nantinya data ini bisa dipindahkan ke database.
const products = [
  {
    id: 1,
    name: "Essential Oversized Tee",
    price: 189000,
    category: "T-Shirts",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    description:
      "A relaxed oversized t-shirt designed for everyday comfort.",
    stock: 20,
    colors: ["Black", "White", "Gray"],
  },
  {
    id: 5,
    name: "Essential Oversized Tee",
    price: 189000,
    category: "T-Shirts",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    description:
      "A relaxed oversized t-shirt designed for everyday comfort.",
    stock: 20,
    colors: ["Black", "White", "Gray"],
  },
  {
    id: 2,
    name: "Minimal Hoodie",
    price: 349000,
    category: "Hoodies",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7",
    description:
      "A clean and comfortable hoodie with a minimalist design.",
    stock: 15,
    colors: ["Black", "Cream"],
  },
  {
    id: 3,
    name: "Classic Sneakers",
    price: 499000,
    category: "Shoes",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    description:
      "Classic sneakers that combine everyday comfort and style.",
    stock: 12,
    colors: ["White", "Red"],
  },
  {
    id: 4,
    name: "Relaxed Cargo Pants",
    price: 299000,
    category: "Pants",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f",
    description:
      "Relaxed cargo pants designed for versatile daily outfits.",
    stock: 18,
    colors: ["Black", "Olive"],
  },
];


app.get('/api/products/categories', (req, res) => {
  const categories = [
    ...new Set(products.map((product) => product.category)),
  ]

  res.json({
    data: categories,
    total: categories.length,
  })
})


// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Nexora API is running",
  });
});

// Mengambil semua produk.
// Mendukung query: q, category, minPrice, maxPrice.
app.get("/api/products", (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;

  let result = [...products];

  if (typeof q === "string" && q.trim()) {
    const keyword = q.trim().toLowerCase();

    result = result.filter((product) => {
      return (
        product.name.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword) ||
        product.description.toLowerCase().includes(keyword)
      );
    });
  }

  if (typeof category === "string" && category !== "All") {
    result = result.filter(
      (product) => product.category === category
    );
  }

  if (minPrice !== undefined && minPrice !== "") {
    const minimum = Number(minPrice);

    if (!Number.isFinite(minimum) || minimum < 0) {
      return res.status(400).json({
        message: "minPrice must be a valid non-negative number.",
      });
    }

    result = result.filter((product) => product.price >= minimum);
  }

  if (maxPrice !== undefined && maxPrice !== "") {
    const maximum = Number(maxPrice);

    if (!Number.isFinite(maximum) || maximum < 0) {
      return res.status(400).json({
        message: "maxPrice must be a valid non-negative number.",
      });
    }

    result = result.filter((product) => product.price <= maximum);
  }

  res.json({
    data: result,
    total: result.length,
  });
});

// Mengambil satu produk berdasarkan ID
app.get("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({
      message: "Product ID must be an integer.",
    });
  }

  const product = products.find((item) => item.id === id);

  if (!product) {
    return res.status(404).json({
      message: "Product not found.",
    });
  }

  res.json({
    data: product,
  });
});

module.exports = app;
