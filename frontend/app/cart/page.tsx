
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useCart } from '@/context/CartContext'
import { getProducts } from '@/lib/productApi'
import type { Product } from '@/types/product'

export default function CartPage() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart()

  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Mengambil daftar produk dari backend API.
  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      try {
        setIsLoading(true)
        setError('')

        const result = await getProducts({}, controller.signal)
        setProducts(result)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Gagal mengambil data produk.'
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadProducts()

    return () => controller.abort()
  }, [])

  // Menghubungkan ID produk di keranjang dengan data dari API.
  const cartDetails = useMemo(
    () =>
      cartItems.map((item) => ({
        ...item,
        product: products.find(
          (product) => product.id === item.productId
        ),
      })),
    [cartItems, products]
  )

  const availableItems = cartDetails.filter(
    (item) => item.product !== undefined
  )

  const unavailableItems = cartDetails.filter(
    (item) => item.product === undefined
  )

  const totalItems = availableItems.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const subtotal = availableItems.reduce(
    (total, item) =>
      total + item.product!.price * item.quantity,
    0
  )

  return (
    <>
      <Navbar />

      <main className="mx-auto min-h-[60vh] w-full max-w-7xl px-6 py-12 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
              Your selection
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Shopping Cart
            </h1>
          </div>

          <p className="text-sm text-neutral-500">
            {totalItems} item{totalItems === 1 ? '' : 's'}
          </p>
        </div>

        {isLoading ? (
          <div
            role="status"
            className="py-24 text-center text-sm text-neutral-500"
          >
            Memuat keranjang belanja...
          </div>
        ) : error ? (
          <div
            role="alert"
            className="mt-10 rounded-2xl border border-neutral-200 p-8"
          >
            <h2 className="text-lg font-medium">
              Gagal memuat produk
            </h2>

            <p className="mt-3 text-sm text-neutral-500">
              {error}
            </p>

            <p className="mt-2 text-sm text-neutral-500">
              Pastikan backend API aktif dan alamat API sudah benar.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm text-white transition hover:bg-neutral-800"
            >
              Kembali ke katalog
            </Link>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="py-24 text-center">
            <h2 className="text-xl font-medium">
              Keranjang kamu masih kosong
            </h2>

            <p className="mt-3 text-sm text-neutral-500">
              Temukan produk yang cocok untuk gaya kamu.
            </p>

            <Link
              href="/products"
              className="mt-7 inline-flex rounded-full bg-black px-6 py-3 text-sm text-white transition hover:bg-neutral-800"
            >
              Jelajahi produk
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_340px]">
            <section className="space-y-6">
              {availableItems.map(
                ({ productId, color, quantity, product }) => {
                  if (!product) return null

                  return (
                    <article
                      key={`${productId}-${color}`}
                      className="flex gap-4 border-b border-neutral-200 pb-6 sm:gap-6"
                    >
                      <Link
                        href={`/products/${product.id}`}
                        className="relative h-36 w-28 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-44 sm:w-36"
                      >
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 112px, 144px"
                          className="object-cover"
                        />
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-neutral-400">
                              {product.category}
                            </p>

                            <Link
                              href={`/products/${product.id}`}
                              className="mt-1 block font-medium hover:underline"
                            >
                              {product.name}
                            </Link>

                            <p className="mt-2 text-sm text-neutral-500">
                              Warna: {color}
                            </p>

                            <p className="mt-1 text-sm text-neutral-500">
                              Harga satuan: Rp{' '}
                              {product.price.toLocaleString('id-ID')}
                            </p>
                          </div>

                          <p className="whitespace-nowrap text-sm font-medium">
                            Rp{' '}
                            {(product.price * quantity).toLocaleString(
                              'id-ID'
                            )}
                          </p>
                        </div>

                        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              aria-label={`Kurangi jumlah ${product.name}`}
                              disabled={quantity <= 1}
                              onClick={() =>
                                updateQuantity(
                                  productId,
                                  color,
                                  quantity - 1,
                                  product.stock
                                )
                              }
                              className="h-8 w-8 rounded-full border border-neutral-200 disabled:opacity-40"
                            >
                              −
                            </button>

                            <span className="min-w-4 text-center text-sm">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              aria-label={`Tambah jumlah ${product.name}`}
                              disabled={
                                quantity >= product.stock ||
                                product.stock < 1
                              }
                              onClick={() =>
                                updateQuantity(
                                  productId,
                                  color,
                                  quantity + 1,
                                  product.stock
                                )
                              }
                              className="h-8 w-8 rounded-full border border-neutral-200 disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(productId, color)
                            }
                            className="text-sm text-neutral-500 underline underline-offset-4 transition hover:text-black"
                          >
                            Hapus
                          </button>
                        </div>

                        {product.stock < 1 && (
                          <p className="mt-2 text-sm text-red-600">
                            Stok produk habis. Hapus produk ini dari
                            keranjang.
                          </p>
                        )}

                        {quantity > product.stock && product.stock > 0 && (
                          <p className="mt-2 text-sm text-amber-700">
                            Jumlah melebihi stok terbaru. Kurangi jumlah
                            sebelum melanjutkan.
                          </p>
                        )}
                      </div>
                    </article>
                  )
                }
              )}

              {unavailableItems.length > 0 && (
                <div className="rounded-2xl border border-amber-200 p-5">
                  <h2 className="font-medium">
                    Produk tidak tersedia
                  </h2>

                  <p className="mt-2 text-sm text-neutral-500">
                    Beberapa produk dalam keranjang tidak ditemukan di
                    API. Hapus produk tersebut untuk membersihkan
                    keranjang.
                  </p>

                  <div className="mt-4 space-y-3">
                    {unavailableItems.map((item) => (
                      <div
                        key={`${item.productId}-${item.color}`}
                        className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-3"
                      >
                        <div className="text-sm">
                          <p>Produk ID: {item.productId}</p>
                          <p className="text-neutral-500">
                            Warna: {item.color}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(item.productId, item.color)
                          }
                          className="text-sm underline underline-offset-4"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={clearCart}
                className="text-sm text-neutral-500 underline underline-offset-4 transition hover:text-black"
              >
                Kosongkan keranjang
              </button>
            </section>

            <aside className="h-fit rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-lg font-medium">
                Ringkasan pesanan
              </h2>

              <div className="mt-6 flex justify-between gap-4 text-sm">
                <span className="text-neutral-500">
                  Subtotal ({totalItems} item)
                </span>

                <span className="font-medium">
                  Rp {subtotal.toLocaleString('id-ID')}
                </span>
              </div>

              {unavailableItems.length > 0 && (
                <p className="mt-4 text-sm text-amber-700">
                  Ada produk yang tidak tersedia. Periksa keranjang
                  sebelum checkout.
                </p>
              )}

              <p className="mt-4 text-xs leading-5 text-neutral-500">
                Biaya pengiriman dan pembayaran belum dihitung.
              </p>

              <button
                type="button"
                disabled={
                  availableItems.length === 0 ||
                  unavailableItems.length > 0 ||
                  availableItems.some(
                    (item) =>
                      !item.product ||
                      item.product.stock < 1 ||
                      item.quantity > item.product.stock
                  )
                }
                className="mt-7 w-full rounded-full bg-black px-5 py-3 text-sm text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
              >
                Checkout — tahap berikutnya
              </button>

              <Link
                href="/products"
                className="mt-4 block text-center text-sm text-neutral-500 transition hover:text-black"
              >
                Lanjut belanja
              </Link>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
