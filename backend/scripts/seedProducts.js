
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const initialProducts = [
  {
    name: "Essential Oversized Tee",
    price: 189000,
    category: "T-Shirts",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    description: "A relaxed oversized t-shirt designed for everyday comfort.",
    stock: 20,
    colors: ["Black", "White", "Gray"],
  },
  {
    name: "Minimal Hoodie",
    price: 349000,
    category: "Hoodies",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7",
    description: "A clean and comfortable hoodie with a minimalist design.",
    stock: 15,
    colors: ["Black", "Cream"],
  },
  {
    name: "Classic Sneakers",
    price: 499000,
    category: "Shoes",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    description: "Classic sneakers that combine everyday comfort and style.",
    stock: 12,
    colors: ["White", "Red"],
  },
  {
    name: "Relaxed Cargo Pants",
    price: 299000,
    category: "Pants",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f",
    description: "Relaxed cargo pants designed for versatile daily outfits.",
    stock: 18,
    colors: ["Black", "Olive"],
  },
  {
    name: "Everyday Cotton Tee",
    price: 159000,
    category: "T-Shirts",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    description: "A versatile cotton t-shirt for a simple everyday look.",
    stock: 25,
    colors: ["Black", "White"],
  },
  {
    name: "Premium Cream Shirt",
    price: 159000,
    category: "Shirts",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10",
    description: "A versatile shirt for a simple everyday look.",
    stock: 25,
    colors: ["Black", "White"],
  },
];

async function main() {
  const count = await prisma.product.count();

  if (count > 0) {
    console.log(
      `Seed dilewati: tabel Product sudah berisi ${count} produk.`
    );
    return;
  }

  const result = await prisma.product.createMany({
    data: initialProducts,
  });

  console.log(`${result.count} produk awal berhasil disimpan ke MySQL.`);
}

main()
  .catch((error) => {
    console.error("Gagal mengisi produk awal:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
