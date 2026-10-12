
'use client'

import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { products } from '@/data/products'
import { useCart } from '@/context/CartContext'

export default function CartPage() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart()

  const cartDetails = cartItems
    .map((item) => ({
      ...item,
      product: products.find(
        (product) => product.id === item.productId
      ),
    }))
    .filter((item) => item.product !== undefined)

  const totalItems = cartDetails.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const subtotal = cartDetails.reduce(
    (total, item) =>
      total + item.product.price * item.quantity,
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
            {totalItems} item
            {totalItems === 1 ? '' : 's'}
          </p>
        </div>

        {cartDetails.length === 0 ? (
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
              {cartDetails.map(({ productId, color, quantity, product }) => (
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
                      sizes="144px"
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
                      </div>

                      <p className="whitespace-nowrap text-sm font-medium">
                        Rp {(product.price * quantity).toLocaleString('id-ID')}
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
                              quantity - 1
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
                          disabled={quantity >= product.stock}
                          onClick={() =>
                            updateQuantity(
                              productId,
                              color,
                              quantity + 1
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
                  </div>
                </article>
              ))}

              <button
                type="button"
                onClick={clearCart}
                className="text-sm text-neutral-500 underline underline-offset-4 hover:text-black"
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

              <p className="mt-4 text-xs leading-5 text-neutral-500">
                Biaya pengiriman dan pembayaran belum dihitung.
              </p>

              <button
                type="button"
                disabled
                className="mt-7 w-full cursor-not-allowed rounded-full bg-neutral-200 px-5 py-3 text-sm text-neutral-500"
              >
                Checkout — tahap berikutnya
              </button>

              <Link
                href="/products"
                className="mt-4 block text-center text-sm text-neutral-500 hover:text-black"
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
