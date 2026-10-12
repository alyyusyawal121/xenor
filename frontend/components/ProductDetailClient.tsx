
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

export default function ProductDetailClient({
  id,
}: ProductDetailClientProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const productId = Number(id)

    async function loadProduct() {
      if (!Number.isInteger(productId) || productId < 1) {
        setError('ID produk tidak valid.')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError('')

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
        <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
          <Link
            href="/products"
            className="mb-10 inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-black"
          >
            ← Kembali ke katalog
          </Link>

          {isLoading && (
            <div role="status" className="py-24 text-center text-neutral-500">
              Memuat detail produk...
            </div>
          )}

          {!isLoading && error && (
            <div
              role="alert"
              className="rounded-2xl border border-neutral-200 p-8"
            >
              <h1 className="text-xl font-semibold">
                Produk tidak dapat ditampilkan
              </h1>

              <p className="mt-3 text-sm text-neutral-500">
                {error}
              </p>

              <Link
                href="/products"
                className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-sm text-white transition hover:bg-neutral-800"
              >
                Kembali ke katalog
              </Link>
            </div>
          )}

          {!isLoading && !error && product && (
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
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

              <div className="flex flex-col justify-center">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">
                  {product.category}
                </p>

                <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                  {product.name}
                </h1>

                <p className="mt-5 text-xl font-medium">
                  Rp {product.price.toLocaleString('id-ID')}
                </p>

                <div className="my-8 h-px bg-neutral-200" />

                <h2 className="text-sm font-medium">
                  Deskripsi produk
                </h2>

                <p className="mt-3 max-w-lg text-sm leading-7 text-neutral-500">
                  {product.description}
                </p>

                <p className="mt-8 text-sm text-neutral-500">
                  {product.stock > 0
                    ? `${product.stock} item tersedia`
                    : 'Stok habis'}
                </p>

                <AddToCartButton
                  productId={product.id}
                  colors={product.colors}
                  stock={product.stock}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
