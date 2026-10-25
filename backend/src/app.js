
const express = require("express");
const cors = require("cors");
const prisma = require("./prisma");
const authRoutes = require("./routes/authRoutes");
const sessionMiddleware = require("./config/session");
const { requireAdmin } = require("./middleware/authMiddleware");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
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
app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Nexora API is running" });
});

// Validasi data produk.
function validateProduct(body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
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
    (key) => !allowedFields.includes(key)
  );

  if (unknownFields.length > 0) {
    return `Field tidak dikenal: ${unknownFields.join(", ")}.`;
  }

  const { name, price, category, image, description, stock, colors } =
    body;

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

  if (typeof image !== "string" || !image.trim()) {
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
    colors.length < 1 ||
    colors.length > 20 ||
    !colors.every(
      (color) =>
        typeof color === "string" &&
        color.trim().length > 0 &&
        color.trim().length <= 30
    )
  ) {
    return "Warna harus berupa array berisi 1–20 warna valid.";
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

// Membersihkan data sebelum disimpan ke database.
function normalizeProduct(body) {
  return {
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
    return {
      valid: false,
      message: `${fieldName} tidak valid.`,
    };
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

function handleServerError(res, error, message) {
  console.error(message, error.message);

  return res.status(500).json({
    success: false,
    message,
  });
}

// Pemeriksaan koneksi database.
app.get("/api/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      success: true,
      message: "Koneksi MySQL melalui Prisma berhasil.",
    });
  } catch (error) {
    console.error("Database connection error:", error.message);

    return res.status(503).json({
      success: false,
      message: "Database belum dapat diakses.",
    });
  }
});

// GET kategori dari database.
app.get("/api/products/categories", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    const categories = products.map((item) => item.category);

    return res.json({
      data: categories,
      total: categories.length,
    });
  } catch (error) {
    return handleServerError(
      res,
      error,
      "Gagal mengambil kategori produk."
    );
  }
});

// GET katalog, pencarian, dan filter harga.
app.get("/api/products", async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;

    if (
      (q !== undefined && typeof q !== "string") ||
      (category !== undefined && typeof category !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Parameter pencarian atau kategori tidak valid.",
      });
    }

    const minimumResult = parsePriceFilter(minPrice, "minPrice");
    const maximumResult = parsePriceFilter(maxPrice, "maxPrice");

    if (!minimumResult.valid) {
      return res.status(400).json({
        success: false,
        message: minimumResult.message,
      });
    }

    if (!maximumResult.valid) {
      return res.status(400).json({
        success: false,
        message: maximumResult.message,
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
        success: false,
        message: "minPrice tidak boleh lebih besar dari maxPrice.",
      });
    }

    const where = {};

    if (q && q.trim()) {
      const keyword = q.trim();

      where.OR = [
        { name: { contains: keyword } },
        { category: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    if (category && category !== "All") {
      where.category = category;
    }

    if (minimum !== undefined || maximum !== undefined) {
      where.price = {};

      if (minimum !== undefined) {
        where.price.gte = minimum;
      }

      if (maximum !== undefined) {
        where.price.lte = maximum;
      }
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      data: products,
      total: products.length,
    });
  } catch (error) {
    return handleServerError(
      res,
      error,
      "Gagal mengambil daftar produk."
    );
  }
});

// POST: hanya admin yang dapat menambah produk.
app.post("/api/products", requireAdmin, async (req, res) => {
  const validationError = validateProduct(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  try {
    const product = await prisma.product.create({
      data: normalizeProduct(req.body),
    });

    return res.status(201).json({
      success: true,
      message: "Produk berhasil ditambahkan.",
      data: product,
    });
  } catch (error) {
    return handleServerError(
      res,
      error,
      "Gagal menambahkan produk."
    );
  }
});

// PUT: hanya admin yang dapat memperbarui produk.
app.put("/api/products/:id", requireAdmin, async (req, res) => {
  const id = parseProductId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      success: false,
      message: "ID harus berupa bilangan bulat positif.",
    });
  }

  const validationError = validateProduct(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan.",
      });
    }

    const product = await prisma.product.update({
      where: { id },
      data: normalizeProduct(req.body),
    });

    return res.json({
      success: true,
      message: "Produk berhasil diperbarui.",
      data: product,
    });
  } catch (error) {
    return handleServerError(
      res,
      error,
      "Gagal memperbarui produk."
    );
  }
});

// DELETE: hanya admin yang dapat menghapus produk.
app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  const id = parseProductId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      success: false,
      message: "ID harus berupa bilangan bulat positif.",
    });
  }

  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan.",
      });
    }

    const product = await prisma.product.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Produk berhasil dihapus.",
      data: product,
    });
  } catch (error) {
    // Produk yang sudah terhubung dengan pesanan tidak boleh
    // dihapus karena relasi OrderItem menggunakan onDelete: Restrict.
    if (error.code === "P2003") {
      return res.status(409).json({
        success: false,
        message:
          "Produk sudah digunakan dalam pesanan dan tidak dapat dihapus.",
      });
    }

    return handleServerError(
      res,
      error,
      "Gagal menghapus produk."
    );
  }
});

// GET detail produk.
app.get("/api/products/:id", async (req, res) => {
  const id = parseProductId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      success: false,
      message: "ID harus berupa bilangan bulat positif.",
    });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan.",
      });
    }

    return res.json({ data: product });
  } catch (error) {
    return handleServerError(
      res,
      error,
      "Gagal mengambil detail produk."
    );
  }
});

// Menangani JSON yang formatnya rusak.
app.use((err, req, res, next) => {
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    return res.status(400).json({
      success: false,
      message: "Format JSON request tidak valid.",
    });
  }

  return next(err);
});

module.exports = app;
