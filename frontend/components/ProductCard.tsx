
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/types/product'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <article className="group">
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-100"
      >
        {!imageError && product.image.trim() ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImageError(true)}
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            role="img"
            aria-label={`Gambar ${product.name} tidak tersedia`}
            className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 text-neutral-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>

            <span className="mt-3 text-xs">
              Image unavailable
            </span>
          </div>
        )}

        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-neutral-800">
          {product.category}
        </span>

        <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="rounded-full bg-white py-3 text-center text-sm font-medium text-black shadow-lg">
            View Product →
          </div>
        </div>
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-medium text-neutral-900">
            {product.name}
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            {product.category}
          </p>
        </div>

        <p className="whitespace-nowrap text-sm font-semibold text-neutral-900">
          Rp {product.price.toLocaleString('id-ID')}
        </p>
      </div>
    </article>
  )
}
