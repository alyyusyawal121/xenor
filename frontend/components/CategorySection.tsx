import Link from "next/link";
import Image from "next/image";

const categories = [
  {
    name: "T-Shirts",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
  },
  {
    name: "Hoodies",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7",
  },
  {
    name: "Shoes",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
  },
];

export default function CategorySection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">
            Explore
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Shop by category
          </h2>
        </div>

        <Link
          href="/products"
          className="hidden text-sm text-neutral-500 transition hover:text-black sm:block"
        >
          View all →
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={`/products?category=${category.name}`}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-100"
          >
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover transition duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />

            <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/20" />

            <div className="absolute bottom-6 left-6">
              <h3 className="text-2xl font-medium tracking-tight text-white">
                {category.name}
              </h3>

              <p className="mt-1 text-sm text-white/70">
                Discover collection →
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}