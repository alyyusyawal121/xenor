
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
  const [retryCount, setRetryCount] = useState(0)
  const [failedImages, setFailedImages] = useState<number[]>([])

  // Mengambil produk dari backend.
  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      setIsLoading(true)
      setError('')

      try {
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
  }, [retryCount])

  // Menghubungkan item keranjang dengan data produk dari API.
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

  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const subtotal = availableItems.reduce(
    (total, item) =>
      total + item.product!.price * item.quantity,
    0
  )

  const hasStockProblem = availableItems.some(
    (item) =>
      !item.product ||
      item.product.stock < 1 ||
      item.quantity > item.product.stock
  )

  const canCheckout =
    !isLoading &&
    !error &&
    cartItems.length > 0 &&
    unavailableItems.length === 0 &&
    !hasStockProblem

  function formatPrice(price: number) {
    return `Rp ${price.toLocaleString('id-ID')}`
  }

  return (
    <>
      <Navbar />

      <main className="mx-auto min-h-[60vh] w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16">
        {/* Judul halaman */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
              Your selection
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Shopping Cart
            </h1>
          </div>

          <p className="text-sm text-neutral-500" aria-live="polite">
            {totalItems} item{totalItems === 1 ? '' : 's'}
          </p>
        </div>

        {/* Kondisi loading */}
        {isLoading && (
          <div
            role="status"
            className="mt-10 rounded-2xl bg-[#f5f1eb] p-6 text-sm text-neutral-600"
          >
            Memuat informasi produk dan stok...
          </div>
        )}

        {/* Error API tidak mengunci fungsi hapus keranjang */}
        {!isLoading && error && (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5"
          >
            <h2 className="font-medium">
              Informasi produk belum dapat dimuat
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              {error}
            </p>

            <p className="mt-2 text-sm text-neutral-600">
              Kamu masih bisa menghapus item atau mengosongkan
              keranjang. Checkout dinonaktifkan sampai data produk
              berhasil dimuat kembali.
            </p>

            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="mt-4 rounded-full bg-black px-5 py-2.5 text-sm text-white transition hover:bg-neutral-800"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Keranjang kosong */}
        {!isLoading && !error && cartItems.length === 0 && (
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
        )}

        {/* Isi keranjang tetap dapat dikelola saat API gagal */}
        {cartItems.length > 0 && (
          <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1fr_340px]">
            <section className="space-y-6">
              {cartDetails.map(
                ({ productId, color, quantity, product }) => {
                  const key = `${productId}-${color}`

                  // Jika API gagal atau produk sudah tidak ada,
                  // pengguna tetap dapat menghapus item tersebut.
                  if (!product) {
                    return (
                      <article
                        key={key}
                        className="rounded-2xl border border-amber-200 p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="font-medium">
                              Produk tidak tersedia
                            </p>

                            <p className="mt-2 text-sm text-neutral-500">
                              ID produk: {productId}
                            </p>

                            <p className="mt-1 text-sm text-neutral-500">
                              Warna: {color} · Jumlah: {quantity}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(productId, color)
                            }
                            className="text-sm underline underline-offset-4 hover:text-neutral-500"
                          >
                            Hapus
                          </button>
                        </div>
                      </article>
                    )
                  }

                  const imageUnavailable =
                    !product.image.trim() ||
                    failedImages.includes(productId)

                  return (
                    <article
                      key={key}
                      className="flex gap-4 border-b border-neutral-200 pb-6 sm:gap-6"
                    >
                      {/* Gambar produk dengan fallback */}
                      <Link
                        href={`/products/${product.id}`}
                        className="relative h-36 w-28 shrink-0 overflow-hidden rounded-xl bg-[#f3eee7] sm:h-44 sm:w-36"
                      >
                        {!imageUnavailable ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 112px, 144px"
                            onError={() =>
                              setFailedImages((current) =>
                                current.includes(productId)
                                  ? current
                                  : [...current, productId]
                              )
                            }
                            className="object-cover transition duration-300 hover:scale-105"
                          />
                        ) : (
                          <div
                            role="img"
                            aria-label={`Gambar ${product.name} tidak tersedia`}
                            className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center text-neutral-400"
                          >
                            <span aria-hidden="true" className="text-3xl">
                              ◇
                            </span>

                            <span className="mt-2 text-xs">
                              Gambar tidak tersedia
                            </span>
                          </div>
                        )}
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
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
                              {formatPrice(product.price)} / item
                            </p>
                          </div>

                          <p className="whitespace-nowrap text-sm font-medium">
                            {formatPrice(product.price * quantity)}
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
                              className="h-9 w-9 rounded-full border border-neutral-200 transition hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              −
                            </button>

                            <span
                              className="min-w-5 text-center text-sm"
                              aria-live="polite"
                            >
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
                              className="h-9 w-9 rounded-full border border-neutral-200 transition hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
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

                        {product.stock === 0 && (
                          <p className="mt-3 text-sm text-red-600">
                            Stok habis. Hapus produk ini sebelum checkout.
                          </p>
                        )}

                        {quantity > product.stock &&
                          product.stock > 0 && (
                            <p className="mt-3 text-sm text-amber-700">
                              Jumlah melebihi stok terbaru. Kurangi
                              jumlah menjadi {product.stock} atau kurang.
                            </p>
                          )}
                      </div>
                    </article>
                  )
                }
              )}

              <button
                type="button"
                onClick={clearCart}
                className="text-sm text-neutral-500 underline underline-offset-4 transition hover:text-black"
              >
                Kosongkan keranjang
              </button>
            </section>

            {/* Ringkasan pesanan */}
            <aside className="h-fit rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-lg font-medium">
                Ringkasan pesanan
              </h2>

              <div className="mt-6 flex justify-between gap-4 text-sm">
                <span className="text-neutral-500">
                  Total item
                </span>

                <span>{totalItems}</span>
              </div>

              <div className="mt-4 flex justify-between gap-4 text-sm">
                <span className="text-neutral-500">
                  Subtotal produk tersedia
                </span>

                <span className="font-medium">
                  {formatPrice(subtotal)}
                </span>
              </div>

              {unavailableItems.length > 0 && (
                <p className="mt-4 text-sm text-amber-700">
                  {unavailableItems.length} item tidak dapat
                  diverifikasi dari API.
                </p>
              )}

              {hasStockProblem && !error && (
                <p className="mt-4 text-sm text-amber-700">
                  Periksa jumlah barang karena terdapat masalah stok.
                </p>
              )}

              <p className="mt-5 text-xs leading-5 text-neutral-500">
                Ongkos kirim dan biaya pembayaran belum dihitung.
                Harga akhir harus diverifikasi kembali oleh backend
                sebelum transaksi.
              </p>

              <button
                type="button"
                disabled={!canCheckout}
                title={
                  canCheckout
                    ? 'Checkout belum tersedia'
                    : 'Pastikan data produk dan stok valid terlebih dahulu'
                }
                className="mt-7 w-full rounded-full bg-black px-5 py-3 text-sm text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
              >
                Checkout — segera hadir
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
