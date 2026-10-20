
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AddToCartButton from '@/components/AddToCartButton'
import { getProductById } from '@/lib/productApi'
import type { Product } from '@/types/product'

type ProductDetailClientProps = {
  id: string
}

function ProductImageFallback() {
  return (
    <div
      role="img"
      aria-label="Gambar produk tidak tersedia"
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#f3eee7] text-neutral-400"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="52"
        height="52"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>

      <p className="mt-3 text-sm">
        Gambar tidak tersedia
      </p>
    </div>
  )
}

export default function ProductDetailClient({
  id,
}: ProductDetailClientProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const productId = Number(id)

    async function loadProduct() {
      if (!Number.isSafeInteger(productId) || productId < 1) {
        setProduct(null)
        setError('ID produk tidak valid.')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError('')
        setProduct(null)
        setImageError(false)

        const result = await getProductById(
          productId,
          controller.signal
        )

        setProduct(result)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Gagal memuat detail produk.'
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadProduct()

    return () => controller.abort()
  }, [id])

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12">
          <Link
            href="/products"
            className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-black"
          >
            <span aria-hidden="true">←</span>
            Kembali ke katalog
          </Link>

          {isLoading && (
            <div
              role="status"
              aria-label="Memuat detail produk"
              className="grid animate-pulse gap-10 lg:grid-cols-2 lg:gap-16"
            >
              <div className="aspect-[4/5] rounded-3xl bg-neutral-100" />

              <div className="flex flex-col justify-center">
                <div className="h-3 w-24 rounded bg-neutral-200" />
                <div className="mt-5 h-10 w-3/4 rounded bg-neutral-200" />
                <div className="mt-4 h-6 w-36 rounded bg-neutral-200" />
                <div className="my-8 h-px bg-neutral-200" />
                <div className="h-4 w-full rounded bg-neutral-200" />
                <div className="mt-3 h-4 w-5/6 rounded bg-neutral-200" />
                <div className="mt-3 h-4 w-2/3 rounded bg-neutral-200" />
                <div className="mt-10 h-12 rounded-full bg-neutral-200" />
              </div>

              <span className="sr-only">
                Sedang memuat informasi produk.
              </span>
            </div>
          )}

          {!isLoading && error && (
            <section
              role="alert"
              className="rounded-3xl border border-neutral-200 px-6 py-16 text-center sm:px-10"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">
                Product information
              </p>

              <h1 className="mt-4 text-2xl font-semibold">
                Produk tidak dapat ditampilkan
              </h1>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-neutral-500">
                {error}
              </p>

              <Link
                href="/products"
                className="mt-7 inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Kembali ke katalog
              </Link>
            </section>
          )}

          {!isLoading && !error && product && (
            <section className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
              {/* Gambar produk */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#f3eee7]">
                {!imageError && product.image.trim() ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    onError={() => setImageError(true)}
                    className="object-cover transition duration-500 hover:scale-[1.02]"
                  />
                ) : (
                  <ProductImageFallback />
                )}
              </div>

              {/* Informasi produk */}
              <div className="flex flex-col py-2 lg:sticky lg:top-24">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-500">
                  {product.category}
                </p>

                <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
                  {product.name}
                </h1>

                <p className="mt-5 text-2xl font-medium tracking-tight">
                  Rp {product.price.toLocaleString('id-ID')}
                </p>

                <div className="my-7 h-px bg-neutral-200" />

                <h2 className="text-sm font-semibold">
                  Deskripsi produk
                </h2>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-neutral-500">
                  {product.description?.trim() ||
                    'Deskripsi produk belum tersedia.'}
                </p>

                <div className="mt-7 flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      product.stock > 0
                        ? 'bg-green-600'
                        : 'bg-red-500'
                    }`}
                    aria-hidden="true"
                  />

                  <p
                    className={`text-sm ${
                      product.stock > 0
                        ? 'text-neutral-600'
                        : 'font-medium text-red-600'
                    }`}
                  >
                    {product.stock > 0
                      ? `${product.stock} item tersedia`
                      : 'Stok sedang habis'}
                  </p>
                </div>

                <AddToCartButton
                  productId={product.id}
                  colors={product.colors}
                  stock={product.stock}
                />

                <div className="mt-8 border-t border-neutral-200 pt-5">
                  <p className="text-xs leading-6 text-neutral-500">
                    Informasi harga dan stok ditampilkan berdasarkan
                    data produk yang diterima dari API.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
