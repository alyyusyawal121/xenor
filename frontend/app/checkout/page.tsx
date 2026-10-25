
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useCart } from '@/context/CartContext'
import { API_URL, getProducts } from '@/lib/productApi'
import type { Product } from '@/types/product'

type OrderResponse = {
  success: boolean
  message?: string
  data?: {
    id: number
    total: number
    status: string
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cartItems, clearCart } = useCart()

  const [products, setProducts] = useState<Product[]>([])
  const [shippingAddress, setShippingAddress] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
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
            : 'Gagal memuat data produk.'
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProducts(false)
        }
      }
    }

    loadProducts()

    return () => controller.abort()
  }, [])

  const checkoutItems = useMemo(
    () =>
      cartItems.map((item) => ({
        ...item,
        product: products.find(
          (product) => product.id === item.productId
        ),
      })),
    [cartItems, products]
  )

  const subtotal = checkoutItems.reduce((total, item) => {
    if (!item.product) return total

    return total + item.product.price * item.quantity
  }, 0)

  const stockProblem = checkoutItems.some((item) => {
    if (!item.product) return true

    const validColor = item.product.colors.some(
      (color) => color.toLowerCase() === item.color.toLowerCase()
    )

    return (
      !validColor ||
      item.product.stock < 1 ||
      item.quantity > item.product.stock
    )
  })

  const canSubmit =
    !loadingProducts &&
    !error &&
    cartItems.length > 0 &&
    !stockProblem &&
    shippingAddress.trim().length >= 10 &&
    !submitting

  function formatPrice(price: number) {
    return `Rp ${price.toLocaleString('id-ID')}`
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (cartItems.length === 0) {
      setError('Keranjang kamu masih kosong.')
      return
    }

    if (shippingAddress.trim().length < 10) {
      setError('Alamat pengiriman minimal 10 karakter.')
      return
    }

    if (stockProblem) {
      setError(
        'Ada produk yang tidak tersedia atau stoknya tidak mencukupi. Periksa keranjang kamu.'
      )
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          shippingAddress: shippingAddress.trim(),
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            color: item.color,
          })),
        }),
      })

      const result = (await response.json()) as OrderResponse

      if (response.status === 401) {
        const next = encodeURIComponent('/checkout')
        router.push(`/login?next=${next}`)
        return
      }

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || 'Pesanan gagal dibuat.')
      }

      clearCart()
      setCreatedOrderId(result.data.id)
      setSuccessMessage(
        `Pesanan #${result.data.id} berhasil dibuat dengan status ${result.data.status}.`
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat membuat pesanan.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />

      <main className="mx-auto min-h-[60vh] w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
          NEXORA / Checkout
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Checkout
        </h1>

        <p className="mt-3 text-sm text-neutral-500">
          Lengkapi alamat pengiriman untuk membuat pesanan.
        </p>

        {successMessage ? (
          <section
            role="status"
            className="mt-10 rounded-2xl border border-neutral-200 bg-[#f5f1eb] p-6 sm:p-10"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
              Order Created
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              Pesanan berhasil dibuat
            </h2>

            <p className="mt-3 text-sm leading-6 text-neutral-600">
              {successMessage}
            </p>

            <p className="mt-2 text-sm text-neutral-600">
              Pembayaran belum dikonfirmasi. Status pesanan awal adalah
              PENDING.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/profile"
                className="rounded-full bg-black px-6 py-3 text-sm text-white transition hover:bg-neutral-800"
              >
                Buka profil
              </Link>

              <Link
                href="/products"
                className="rounded-full border border-neutral-300 px-6 py-3 text-sm transition hover:bg-white"
              >
                Lanjut belanja
              </Link>
            </div>

            {createdOrderId !== null && (
              <p className="mt-5 text-xs text-neutral-500">
                Nomor pesanan: #{createdOrderId}
              </p>
            )}
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-10 grid items-start gap-10 lg:grid-cols-[1fr_360px]"
          >
            <section className="rounded-2xl border border-neutral-200 p-5 sm:p-7">
              <h2 className="text-xl font-medium">
                Alamat pengiriman
              </h2>

              <label
                htmlFor="shippingAddress"
                className="mt-6 block text-sm font-medium"
              >
                Alamat lengkap
              </label>

              <textarea
                id="shippingAddress"
                required
                minLength={10}
                maxLength={1000}
                rows={5}
                value={shippingAddress}
                onChange={(event) =>
                  setShippingAddress(event.target.value)
                }
                placeholder="Nama jalan, nomor rumah, kelurahan, kota, provinsi, dan kode pos"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-black"
              />

              <p className="mt-2 text-xs text-neutral-500">
                Masukkan alamat yang cukup lengkap agar pesanan dapat dikirim.
              </p>

              {loadingProducts && (
                <p role="status" className="mt-5 text-sm text-neutral-500">
                  Memeriksa produk dan stok...
                </p>
              )}

              {!loadingProducts && stockProblem && (
                <p role="alert" className="mt-5 text-sm text-amber-700">
                  Ada produk yang stoknya tidak mencukupi atau warna yang
                  dipilih sudah tidak tersedia. Periksa keranjang sebelum
                  melanjutkan.
                </p>
              )}

              {error && (
                <p
                  role="alert"
                  className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}
            </section>

            <aside className="rounded-2xl bg-[#f5f1eb] p-5 sm:p-7">
              <h2 className="text-xl font-medium">
                Ringkasan pesanan
              </h2>

              {checkoutItems.length === 0 ? (
                <div className="mt-6">
                  <p className="text-sm text-neutral-600">
                    Keranjang kamu masih kosong.
                  </p>

                  <Link
                    href="/products"
                    className="mt-4 inline-block text-sm underline underline-offset-4"
                  >
                    Cari produk
                  </Link>
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {checkoutItems.map((item) => (
                    <div
                      key={`${item.productId}-${item.color}`}
                      className="border-b border-neutral-300 pb-4"
                    >
                      <p className="font-medium">
                        {item.product?.name || `Produk #${item.productId}`}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Warna: {item.color} · Jumlah: {item.quantity}
                      </p>

                      <p className="mt-2 text-sm">
                        {item.product
                          ? formatPrice(item.product.price * item.quantity)
                          : 'Produk tidak tersedia'}
                      </p>
                    </div>
                  ))}

                  <div className="flex items-center justify-between gap-4 pt-2">
                    <span className="text-sm text-neutral-600">
                      Subtotal
                    </span>
                    <span className="font-semibold">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  <p className="text-xs leading-5 text-neutral-500">
                    Ongkos kirim belum dihitung. Total akhir akan dihitung
                    kembali oleh backend berdasarkan harga database.
                  </p>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full rounded-full bg-black px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting
                      ? 'Membuat pesanan...'
                      : 'Buat Pesanan'}
                  </button>

                  <Link
                    href="/cart"
                    className="block text-center text-sm text-neutral-600 underline underline-offset-4"
                  >
                    Kembali ke keranjang
                  </Link>
                </div>
              )}
            </aside>
          </form>
        )}
      </main>

      <Footer />
    </>
  )
}
