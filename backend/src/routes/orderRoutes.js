
const express = require("express");
const prisma = require("../prisma");
const {
  requireAuth,
  requireAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

const VALID_ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

function parseOrderId(value) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

// Membuat pesanan baru.
router.post("/", requireAuth, async (req, res) => {
  const { items, shippingAddress } = req.body;

  if (
    typeof shippingAddress !== "string" ||
    shippingAddress.trim().length < 10 ||
    shippingAddress.trim().length > 1000
  ) {
    return res.status(400).json({
      success: false,
      message: "Alamat pengiriman harus berisi 10–1000 karakter.",
    });
  }

  if (!Array.isArray(items) || items.length < 1 || items.length > 50) {
    return res.status(400).json({
      success: false,
      message: "Pesanan harus berisi 1–50 item.",
    });
  }

  const normalizedItems = [];

  for (const item of items) {
    if (
      !item ||
      !Number.isSafeInteger(item.productId) ||
      item.productId < 1 ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 100 ||
      typeof item.color !== "string" ||
      item.color.trim().length < 1 ||
      item.color.trim().length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Data produk, jumlah, atau warna tidak valid.",
      });
    }

    normalizedItems.push({
      productId: item.productId,
      quantity: item.quantity,
      color: item.color.trim(),
    });
  }

  const itemKeys = normalizedItems.map(
    (item) => `${item.productId}:${item.color.toLowerCase()}`
  );

  if (new Set(itemKeys).size !== itemKeys.length) {
    return res.status(400).json({
      success: false,
      message: "Item dengan produk dan warna yang sama tidak boleh duplikat.",
    });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const productIds = [
        ...new Set(normalizedItems.map((item) => item.productId)),
      ];

      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
        },
      });

      const productMap = new Map(
        products.map((product) => [product.id, product])
      );

      if (products.length !== productIds.length) {
        const error = new Error("Salah satu produk tidak ditemukan.");
        error.statusCode = 404;
        throw error;
      }

      let total = 0;
      const orderItems = [];

      for (const item of normalizedItems) {
        const product = productMap.get(item.productId);

        const availableColors = Array.isArray(product.colors)
          ? product.colors
          : [];

        const selectedColor = availableColors.find(
          (color) =>
            typeof color === "string" &&
            color.toLowerCase() === item.color.toLowerCase()
        );

        if (!selectedColor) {
          const error = new Error(
            `Warna ${item.color} tidak tersedia untuk ${product.name}.`
          );
          error.statusCode = 400;
          throw error;
        }

        total += product.price * item.quantity;

        if (!Number.isSafeInteger(total)) {
          const error = new Error("Total pesanan terlalu besar.");
          error.statusCode = 400;
          throw error;
        }

        orderItems.push({
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: item.quantity,
          selectedColor,
        });
      }

      const quantitiesByProduct = new Map();

      for (const item of normalizedItems) {
        quantitiesByProduct.set(
          item.productId,
          (quantitiesByProduct.get(item.productId) || 0) +
            item.quantity
        );
      }

      for (const [productId, quantity] of quantitiesByProduct) {
        const result = await tx.product.updateMany({
          where: {
            id: productId,
            stock: { gte: quantity },
          },
          data: {
            stock: { decrement: quantity },
          },
        });

        if (result.count !== 1) {
          const error = new Error(
            "Stok produk tidak mencukupi. Silakan periksa keranjang."
          );
          error.statusCode = 409;
          throw error;
        }
      }

      return tx.order.create({
        data: {
          userId: req.session.user.id,
          total,
          shippingAddress: shippingAddress.trim(),
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
        },
      });
    });

    return res.status(201).json({
      success: true,
      message: "Pesanan berhasil dibuat.",
      data: order,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat membuat pesanan.",
    });
  }
});

// ADMIN: melihat seluruh pesanan dan informasi pelanggan.
router.get("/admin", requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: orders,
      total: orders.length,
    });
  } catch (error) {
    console.error("Get all orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil seluruh pesanan.",
    });
  }
});

// ADMIN: memperbarui status pesanan.
router.patch("/admin/:id/status", requireAdmin, async (req, res) => {
  const id = parseOrderId(req.params.id);
  const { status } = req.body || {};

  if (id === null) {
    return res.status(400).json({
      success: false,
      message: "ID pesanan harus berupa bilangan bulat positif.",
    });
  }

  if (
    typeof status !== "string" ||
    !VALID_ORDER_STATUSES.includes(status)
  ) {
    return res.status(400).json({
      success: false,
      message: "Status pesanan tidak valid.",
      allowedStatuses: VALID_ORDER_STATUSES,
    });
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    return res.json({
      success: true,
      message: "Status pesanan berhasil diperbarui.",
      data: order,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan.",
      });
    }

    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui status pesanan.",
    });
  }
});

// Pengguna biasa: hanya melihat pesanan miliknya sendiri.
router.get("/", requireAuth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.session.user.id,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: orders,
      total: orders.length,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar pesanan.",
    });
  }
});

module.exports = router;
