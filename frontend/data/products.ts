export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  stock: number;
  colors: string[];
}

export const products: Product[] = [
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
];