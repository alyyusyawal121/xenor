
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "100kb" }));

// Data dummy sementara. Belum menggunakan database.
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
  {
    id: 5,
    name: "Everyday Cotton Tee",
    price: 159000,
    category: "T-Shirts",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    description:
      "A versatile cotton t-shirt for a simple everyday look.",
    stock: 25,
    colors: ["Black", "White"],
  },
];

// Helper untuk membaca dan memvalidasi filter harga.
function parsePriceFilter(value, fieldName) {
  if (value === undefined) {
    return { valid: true, value: undefined };
  }

  // Menolak query berulang seperti ?minPrice=100&minPrice=200.
  if (typeof value !== "string" || value.trim() === "") {
    return { valid: false, value: undefined };
  }

  const price = Number(value);

  if (!Number.isFinite(price) || price < 0) {
    return {
      valid: false,
      value: undefined,
      message: `${fieldName} harus berupa angka nol atau lebih.`,
    };
  }

  return { valid: true, value: price };
}

// Health check: memastikan backend berjalan.
app.get("/", (req, res) => {
  res.json({
    message: "Nexora API is running",
  });
});

// Mengambil kategori secara otomatis dari data produk.
app.get("/api/products/categories", (req, res) => {
  const categories = [
    ...new Set(products.map((product) => product.category)),
  ];

  res.json({
    data: categories,
    total: categories.length,
  });
});

// Mengambil produk dengan pencarian dan filter harga/kategori.
app.get("/api/products", (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;

  if (
    (q !== undefined && typeof q !== "string") ||
    (category !== undefined && typeof category !== "string")
  ) {
    return res.status(400).json({
      message: "Parameter pencarian atau kategori tidak valid.",
    });
  }

  const minimumResult = parsePriceFilter(minPrice, "minPrice");
  const maximumResult = parsePriceFilter(maxPrice, "maxPrice");

  if (!minimumResult.valid) {
    return res.status(400).json({
      message:
        minimumResult.message || "Parameter minPrice tidak valid.",
    });
  }

  if (!maximumResult.valid) {
    return res.status(400).json({
      message:
        maximumResult.message || "Parameter maxPrice tidak valid.",
    });
  }

  const minimum = minimumResult.value;
  const maximum = maximumResult.value;

  if (
    minimum !== undefined &&
    maximum !== undefined &&
    minimum > maximum
  ) {
    return res.status(400).json({
      message: "minPrice tidak boleh lebih besar dari maxPrice.",
    });
  }

  let result = [...products];

  // Pencarian berdasarkan nama, kategori, atau deskripsi.
  if (q && q.trim()) {
    const keyword = q.trim().toLowerCase();

    result = result.filter((product) => {
      return (
        product.name.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword) ||
        product.description.toLowerCase().includes(keyword)
      );
    });
  }

  // Filter kategori.
  if (category && category !== "All") {
    result = result.filter(
      (product) => product.category === category
    );
  }

  // Filter harga minimum.
  if (minimum !== undefined) {
    result = result.filter((product) => product.price >= minimum);
  }

  // Filter harga maksimum.
  if (maximum !== undefined) {
    result = result.filter((product) => product.price <= maximum);
  }

  return res.json({
    data: result,
    total: result.length,
  });
});

// Mengambil detail satu produk berdasarkan ID.
app.get("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({
      message: "ID produk harus berupa bilangan bulat positif.",
    });
  }

  const product = products.find((item) => item.id === id);

  if (!product) {
    return res.status(404).json({
      message: "Produk tidak ditemukan.",
    });
  }

  return res.json({
    data: product,
  });
});

// Menangani JSON request yang tidak valid.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "Format JSON request tidak valid.",
    });
  }

  return next(err);
});

module.exports = app;
