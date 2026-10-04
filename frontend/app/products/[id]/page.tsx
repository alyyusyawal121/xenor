import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { products } from "@/data/products";

export default function ProductDetail({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const id = Number(params.id);

  const product = products.find(
    (product) => product.id === id
  );

  if (product === undefined) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">

        {/* Back */}
        <Link
          href="/products"
          className="mb-10 inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-black"
        >
          ← Back to shop
        </Link>

        {/* Product */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">

          {/* Image */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-neutral-100">
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          {/* Information */}
          <div className="flex flex-col justify-center">

            <p className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">
              {product.category}
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
              {product.name}
            </h1>

            <p className="mt-5 text-xl font-medium">
              Rp {product.price.toLocaleString("id-ID")}
            </p>

            <div className="my-8 h-px bg-neutral-200" />

            {/* Description */}
            <div>
              <h2 className="text-sm font-medium">
                Description
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-7 text-neutral-500">
                {product.description}
              </p>
            </div>

            {/* Colors */}
            <div className="mt-8">
              <h2 className="text-sm font-medium">
                Available colors
              </h2>

              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <span
                    key={color}
                    className="rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-600"
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>

            {/* Stock */}
            <div className="mt-8">
              <p className="text-sm text-neutral-500">
                {product.stock > 0
                  ? `${product.stock} items available`
                  : "Out of stock"}
              </p>
            </div>

            {/* Add to Cart */}
            <button
              disabled={product.stock === 0}
              className="mt-8 w-full rounded-full bg-black px-6 py-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {product.stock > 0
                ? "Add to Cart"
                : "Out of Stock"}
            </button>

          </div>
        </div>
      </div>
    </main>
  );
}