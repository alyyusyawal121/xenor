
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const sessionMiddleware = require("./config/session");
const app = express();
const { requireAdmin } = require("./middleware/authMiddleware");
const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));


app.use(sessionMiddleware);
app.use("/api/auth", authRoutes);
// Data dummy sementara.
const products = [
  {
    id: 1,
    name: "Essential Oversized Tee",
    price: 189000,
    category: "T-Shirts",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    description: "A relaxed oversized t-shirt designed for everyday comfort.",
    stock: 20,
    colors: ["Black", "White", "Gray"],
  },
  {
    id: 2,
    name: "Minimal Hoodie",
    price: 349000,
    category: "Hoodies",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7",
    description: "A clean and comfortable hoodie with a minimalist design.",
    stock: 15,
    colors: ["Black", "Cream"],
  },
  {
    id: 3,
    name: "Classic Sneakers",
    price: 499000,
    category: "Shoes",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    description: "Classic sneakers that combine everyday comfort and style.",
    stock: 12,
    colors: ["White", "Red"],
  },
  {
    id: 4,
    name: "Relaxed Cargo Pants",
    price: 299000,
    category: "Pants",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f",
    description: "Relaxed cargo pants designed for versatile daily outfits.",
    stock: 18,
    colors: ["Black", "Olive"],
  },
  {
    id: 5,
    name: "Everyday Cotton Tee",
    price: 159000,
    category: "T-Shirts",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    description: "A versatile cotton t-shirt for a simple everyday look.",
    stock: 25,
    colors: ["Black", "White"],
  },
    {
    id: 6,
    name: "Premium Cream Shirt",
    price: 159000,
    category: "Shirts",
    image:
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10",
    description:
      "A versatile cotton t-shirt for a simple everyday look.",
    stock: 25,
    colors: ["Black", "White"],
  }
];

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

// Memvalidasi seluruh field produk.
function validateProduct(body) {
  if (!isPlainObject(body)) {
    return "Body harus berupa object JSON.";
  }

  const allowedFields = [
    "name",
    "price",
    "category",
    "image",
    "description",
    "stock",
    "colors",
  ];

  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length > 0) {
    return `Field tidak dikenal: ${unknownFields.join(", ")}.`;
  }

  const { name, price, category, image, description, stock, colors } = body;

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 100
  ) {
    return "Nama harus berisi 2–100 karakter.";
  }

  if (
    typeof price !== "number" ||
    !Number.isSafeInteger(price) ||
    price < 0
  ) {
    return "Harga harus bilangan bulat nol atau lebih.";
  }

  if (
    typeof category !== "string" ||
    category.trim().length < 2 ||
    category.trim().length > 50
  ) {
    return "Kategori harus berisi 2–50 karakter.";
  }

  if (typeof image !== "string" || image.trim() === "") {
    return "URL gambar wajib diisi.";
  }

  try {
    const parsedUrl = new URL(image.trim());

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return "URL gambar harus menggunakan HTTP atau HTTPS.";
    }
  } catch {
    return "URL gambar tidak valid.";
  }

  if (
    typeof description !== "string" ||
    description.trim().length < 5 ||
    description.trim().length > 1000
  ) {
    return "Deskripsi harus berisi 5–1000 karakter.";
  }

  if (
    typeof stock !== "number" ||
    !Number.isSafeInteger(stock) ||
    stock < 0
  ) {
    return "Stok harus bilangan bulat nol atau lebih.";
  }

  if (
    !Array.isArray(colors) ||
    colors.length === 0 ||
    colors.length > 20 ||
    !colors.every(
      (color) =>
        typeof color === "string" &&
        color.trim().length > 0 &&
        color.trim().length <= 30
    )
  ) {
    return "Warna harus berupa array berisi 1–20 nama warna yang valid.";
  }

  const normalizedColors = colors.map((color) => color.trim());
  const uniqueColors = new Set(
    normalizedColors.map((color) => color.toLowerCase())
  );

  if (uniqueColors.size !== normalizedColors.length) {
    return "Nama warna tidak boleh duplikat.";
  }

  return null;
}

function normalizeProduct(body, id) {
  return {
    id,
    name: body.name.trim(),
    price: body.price,
    category: body.category.trim(),
    image: body.image.trim(),
    description: body.description.trim(),
    stock: body.stock,
    colors: body.colors.map((color) => color.trim()),
  };
}

function parseProductId(value) {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) ? id : null;
}

function parsePriceFilter(value, fieldName) {
  if (value === undefined) {
    return { valid: true, value: undefined };
  }

  if (typeof value !== "string" || value.trim() === "") {
    return { valid: false, message: `${fieldName} tidak valid.` };
  }

  const price = Number(value);

  if (!Number.isSafeInteger(price) || price < 0) {
    return {
      valid: false,
      message: `${fieldName} harus bilangan bulat nol atau lebih.`,
    };
  }

  return { valid: true, value: price };
}

// Health check.
app.get("/", (req, res) => {
  res.json({ message: "Nexora API is running" });
});

// Daftar kategori dinamis.
app.get("/api/products/categories", (req, res) => {
  const categories = [
    ...new Set(products.map((product) => product.category)),
  ];

  res.json({ data: categories, total: categories.length });
});

// Daftar produk, pencarian, dan filter.
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
    return res.status(400).json({ message: minimumResult.message });
  }

  if (!maximumResult.valid) {
    return res.status(400).json({ message: maximumResult.message });
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

  if (q && q.trim()) {
    const keyword = q.trim().toLowerCase();

    result = result.filter((product) =>
      [product.name, product.category, product.description].some(
        (value) => value.toLowerCase().includes(keyword)
      )
    );
  }

  if (category && category !== "All") {
    result = result.filter((product) => product.category === category);
  }

  if (minimum !== undefined) {
    result = result.filter((product) => product.price >= minimum);
  }

  if (maximum !== undefined) {
    result = result.filter((product) => product.price <= maximum);
  }

  return res.json({ data: result, total: result.length });
});

// POST: menambahkan produk baru.
app.post("/api/products", requireAdmin, (req, res) => {
  const error = validateProduct(req.body);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const nextId =
    products.reduce((maxId, product) => Math.max(maxId, product.id), 0) + 1;

  const newProduct = normalizeProduct(req.body, nextId);
  products.push(newProduct);

  return res.status(201).json({
    message: "Produk berhasil ditambahkan.",
    data: newProduct,
  });
});

// PUT: mengganti seluruh data produk yang sudah ada.
app.put("/api/products/:id", requireAdmin, (req, res) => {
  const id = parseProductId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      message: "ID harus berupa bilangan bulat positif.",
    });
  }

  const productIndex = products.findIndex((product) => product.id === id);

  if (productIndex === -1) {
    return res.status(404).json({
      message: "Produk tidak ditemukan.",
    });
  }

  const error = validateProduct(req.body);

  if (error) {
    return res.status(400).json({ message: error });
  }

  // Ganti produk hanya setelah semua validasi lolos.
  const updatedProduct = normalizeProduct(req.body, id);
  products[productIndex] = updatedProduct;

  return res.json({
    message: "Produk berhasil diperbarui.",
    data: updatedProduct,
  });
});

// DELETE: menghapus produk, khusus admin.
app.delete("/api/products/:id", requireAdmin, (req, res) => {
  const id = parseProductId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      success: false,
      message: "ID harus berupa bilangan bulat positif.",
    });
  }

  const productIndex = products.findIndex(
    (product) => product.id === id
  );

  if (productIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Produk tidak ditemukan.",
    });
  }

  const deletedProduct = products.splice(productIndex, 1)[0];

  return res.status(200).json({
    success: true,
    message: "Produk berhasil dihapus.",
    data: deletedProduct,
  });
});

// Detail produk.
app.get("/api/products/:id", (req, res) => {
  const id = parseProductId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      message: "ID harus berupa bilangan bulat positif.",
    });
  }

  const product = products.find((item) => item.id === id);

  if (!product) {
    return res.status(404).json({
      message: "Produk tidak ditemukan.",
    });
  }

  return res.json({ data: product });
});

// Error handler untuk JSON yang rusak.
app.use((err, req, res, next) => {
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    return res.status(400).json({
      message: "Format JSON request tidak valid.",
    });
  }

  return next(err);
});


const prisma = require("./prisma");

app.get("/api/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "Koneksi MySQL melalui Prisma berhasil.",
    });
  } catch (error) {
    console.error("Database connection error:", error.message);

    res.status(503).json({
      success: false,
      message: "Database belum dapat diakses.",
    });
  }
});


module.exports = app;
