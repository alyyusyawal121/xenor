import Image from "next/image";
import Link from "next/link";
import { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  return (
    <article className="group">
      {/* Product Image */}
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-100"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />

        {/* Category Badge */}
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-neutral-800">
          {product.category}
        </span>

        {/* Hover Action */}
        <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="rounded-full bg-white py-3 text-center text-sm font-medium text-black shadow-lg">
            View Product →
          </div>
        </div>
      </Link>

      {/* Product Information */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium text-neutral-900">
            {product.name}
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            {product.category}
          </p>
        </div>

        <p className="whitespace-nowrap text-sm font-semibold text-neutral-900">
          Rp {product.price.toLocaleString("id-ID")}
        </p>
      </div>
    </article>
  );
}