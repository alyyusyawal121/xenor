import Link from "next/link";
import ProductCard from "./ProductCard";
import { products } from "@/data/products";

export default function FeaturedProducts() {
  const featuredProducts = products.slice(0, 3);

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">
            Curated for you
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Featured pieces
          </h2>
        </div>

        <Link
          href="/products"
          className="hidden text-sm text-neutral-500 transition hover:text-black sm:block"
        >
          Shop all →
        </Link>
      </div>

      <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {featuredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </section>
  );
}