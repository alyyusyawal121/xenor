
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import ProductCard from '@/components/ProductCard'
import ProductCardSkeleton from '@/components/ProductCardSkeleton'
import { getProducts } from '@/lib/productApi'
import type { Product } from '@/types/product'

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      try {
        setIsLoading(true)
        setError('')

        const result = await getProducts({}, controller.signal)
        setProducts(result.slice(0, 3))
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Gagal memuat produk unggulan.'
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadProducts()

    return () => controller.abort()
  }, [retryCount])

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">
            Curated for you
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Featured Pieces
          </h2>

          <p className="mt-3 text-sm text-neutral-500">
            Selected essentials for your everyday style.
          </p>
        </div>

        <Link
          href="/products"
          className="hidden text-sm text-neutral-500 transition hover:text-black sm:block"
        >
          Shop all →
        </Link>
      </div>

      {isLoading && (
        <div
          role="status"
          aria-label="Memuat produk unggulan"
          className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div
          role="alert"
          className="rounded-2xl border border-neutral-200 p-6"
        >
          <h3 className="font-medium text-neutral-900">
            Produk belum dapat dimuat
          </h3>

          <p className="mt-2 text-sm text-neutral-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="mt-4 rounded-full bg-black px-5 py-3 text-sm text-white transition hover:bg-neutral-800"
          >
            Coba lagi
          </button>

          <Link
            href="/products"
            className="ml-4 inline-block text-sm underline underline-offset-4"
          >
            Lihat katalog
          </Link>
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-neutral-600">
            Belum ada produk unggulan.
          </p>

          <Link
            href="/products"
            className="mt-4 inline-block text-sm underline underline-offset-4"
          >
            Lihat semua produk
          </Link>
        </div>
      )}

      {!isLoading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <Link
        href="/products"
        className="mt-8 inline-block text-sm text-neutral-600 underline underline-offset-4 sm:hidden"
      >
        Shop all →
      </Link>
    </section>
  )
}
