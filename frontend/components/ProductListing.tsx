"use client";

import { useState } from "react";
import { products } from "@/data/products";
import ProductCard from "./ProductCard";

export default function ProductListing() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const categories = [
    "All",
    ...Array.from(
      new Set(products.map((product) => product.category))
    ),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
            Discover
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            All Products
          </h1>

          <p className="mt-3 text-neutral-500">
            Find your everyday essentials.
          </p>
        </div>

        <p className="text-sm text-neutral-500">
          {filteredProducts.length} Products
        </p>
      </div>

      {/* Search */}
      <div className="mt-10">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-full border border-neutral-300 px-5 py-3 text-sm outline-none transition focus:border-black"
        />
      </div>

      {/* Category Filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`rounded-full px-5 py-2 text-sm transition ${
              category === item
                ? "bg-black text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
          <h2 className="text-xl font-medium">
            No products found
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Try searching for another product.
          </p>
        </div>
      )}
    </section>
  );
}