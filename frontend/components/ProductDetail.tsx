
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import type { Product } from '@/types/product'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface ProductResponse {
  data: Product
}

interface ProductDetailClientProps {
  productId: string
}

export default function ProductDetailClient({
  productId,
}: ProductDetailClientProps) {
  const { addToCart } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function fetchProduct() {
      try {
        setIsLoading(true)
        setError('')

        const response = await fetch(
          `${API_URL}/api/products/${productId}`,
          { signal: controller.signal }
        )

        if (response.status === 404) {
          throw new Error('Produk tidak ditemukan.')
        }

        if (!response.ok) {
          throw new Error(
            `Gagal mengambil produk. Status: ${response.status}`
          )
        }

        const result: ProductResponse = await response.json()
        const fetchedProduct = result.data

        if (
          !fetchedProduct ||
          !Array.isArray(fetchedProduct.colors)
        ) {
          throw new Error('Format data produk tidak valid.')
        }

        setProduct(fetchedProduct)
        setSelectedColor(fetchedProduct.colors[0] ?? '')
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat mengambil produk.'
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchProduct()

    return () => controller.abort()
  }, [productId])

  function handleAddToCart() {
    if (!product || !selectedColor || product.stock < 1) {
      return
    }

    if (quantity > product.stock) {
      setMessage('Jumlah melebihi stok yang tersedia.')
      return
    }

    addToCart(product.id, selectedColor, quantity)
    setMessage(`${product.name} berhasil ditambahkan ke keranjang.`)
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-24 text-center">
        <p className="text-neutral-500">Loading product details...</p>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">
          {error || 'Produk tidak ditemukan'}
        </h1>

        <p className="mt-3 text-neutral-500">
          Periksa koneksi backend atau pilih produk lainnya.
        </p>

        <Link
          href="/products"
          className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-sm text-white transition hover:bg-neutral-800"
        >
          Back to shop
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        <Link
          href="/products"
          className="mb-10 inline-flex text-sm text-neutral-500 transition hover:text-black"
        >
          ← Back to shop
        </Link>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Product image */}
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

          {/* Product information */}
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

            <h2 className="text-sm font-medium">Description</h2>

            <p className="mt-3 max-w-lg text-sm leading-7 text-neutral-500">
              {product.description}
            </p>

            {/* Color selection */}
            <div className="mt-8">
              <h2 className="text-sm font-medium">
                Select color
              </h2>

              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color)
                      setMessage('')
                    }}
                    aria-pressed={selectedColor === color}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      selectedColor === color
                        ? 'border-black bg-black text-white'
                        : 'border-neutral-200 text-neutral-600 hover:border-black'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock information */}
            <p className="mt-8 text-sm text-neutral-500">
              {product.stock > 0
                ? `${product.stock} items available`
                : 'Out of stock'}
            </p>

            {/* Quantity */}
            <div className="mt-5">
              <label
                htmlFor="product-quantity"
                className="mb-2 block text-sm font-medium"
              >
                Quantity
              </label>

              <div className="flex w-fit items-center rounded-full border border-neutral-200">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() =>
                    setQuantity((current) => Math.max(1, current - 1))
                  }
                  className="px-5 py-3 disabled:opacity-30"
                >
                  −
                </button>

                <input
                  id="product-quantity"
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(event) => {
                    const value = Number(event.target.value)

                    if (Number.isInteger(value) && value >= 1) {
                      setQuantity(
                        Math.min(value, Math.max(product.stock, 1))
                      )
                    }
                  }}
                  className="w-14 bg-transparent text-center text-sm outline-none"
                />

                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= product.stock}
                  onClick={() =>
                    setQuantity((current) =>
                      Math.min(product.stock, current + 1)
                    )
                  }
                  className="px-5 py-3 disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock < 1 || !selectedColor}
              className="mt-8 w-full rounded-full bg-black px-6 py-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>

            {message && (
              <p
                role="status"
                className="mt-4 text-sm text-neutral-600"
              >
                {message}
              </p>
            )}

            <Link
              href="/cart"
              className="mt-4 text-center text-sm underline underline-offset-4"
            >
              View shopping cart
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
