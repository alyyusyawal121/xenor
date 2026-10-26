
'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { API_URL } from '@/lib/productApi'

type User = {
  id: number
  name: string
  email: string
  role: 'ADMIN' | 'USER'
}

type SessionResponse = {
  success: boolean
  data?: User
  message?: string
}

type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED'

type OrderItem = {
  id: number
  productId: number
  productName: string
  price: number
  quantity: number
  selectedColor: string
}

type Order = {
  id: number
  total: number
  status: OrderStatus
  shippingAddress: string
  createdAt: string
  items: OrderItem[]
}

type OrdersResponse = {
  success: boolean
  data?: Order[]
  total?: number
  message?: string
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)

const formatDate = (date: string) => {
  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Tanggal tidak tersedia'
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate)
}

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Menunggu Pembayaran',
  PAID: 'Sudah Dibayar',
  PROCESSING: 'Sedang Diproses',
  SHIPPED: 'Dalam Pengiriman',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
}

function getStatusStyle(status: OrderStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-50 text-green-700'
    case 'CANCELLED':
      return 'bg-red-50 text-red-700'
    case 'PAID':
      return 'bg-blue-50 text-blue-700'
    case 'PROCESSING':
    case 'SHIPPED':
      return 'bg-purple-50 text-purple-700'
    case 'PENDING':
    default:
      return 'bg-amber-50 text-amber-800'
  }
}

export default function ProfilePage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [ordersError, setOrdersError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // Mengambil profil dan riwayat pesanan pengguna yang login.
  const loadProfileAndOrders = useCallback(async (signal: AbortSignal) => {
    setIsLoading(true)
    setIsLoadingOrders(true)
    setErrorMessage('')
    setOrdersError('')

    try {
      const profileResponse = await fetch(`${API_URL}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        signal,
      })

      if (profileResponse.status === 401) {
        router.replace('/login?next=%2Fprofile')
        return
      }

      const profileResult: SessionResponse = await profileResponse.json()

      if (
        !profileResponse.ok ||
        !profileResult.success ||
        !profileResult.data
      ) {
        throw new Error(
          profileResult.message || 'Gagal mengambil data profil.'
        )
      }

      setUser(profileResult.data)
      setIsLoading(false)

      // Mengambil pesanan berdasarkan session pengguna di backend.
      try {
        const ordersResponse = await fetch(`${API_URL}/api/orders`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          signal,
        })

        if (ordersResponse.status === 401) {
          router.replace('/login?next=%2Fprofile')
          return
        }

        const ordersResult: OrdersResponse = await ordersResponse.json()

        if (!ordersResponse.ok || !ordersResult.success) {
          throw new Error(
            ordersResult.message || 'Gagal mengambil riwayat pesanan.'
          )
        }

        if (!Array.isArray(ordersResult.data)) {
          throw new Error('Format riwayat pesanan dari server tidak valid.')
        }

        setOrders(ordersResult.data)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        setOrdersError(
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan saat mengambil riwayat pesanan.'
        )
      } finally {
        if (!signal.aborted) {
          setIsLoadingOrders(false)
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat mengambil profil.'
      )
    } finally {
      if (!signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [router])

  useEffect(() => {
    const controller = new AbortController()

    loadProfileAndOrders(controller.signal)

    return () => {
      controller.abort()
    }
  }, [loadProfileAndOrders, reloadKey])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setReloadKey((current) => current + 1)
  }

  useEffect(() => {
    if (!isRefreshing) return

    if (!isLoading && !isLoadingOrders) {
      setIsRefreshing(false)
    }
  }, [isRefreshing, isLoading, isLoadingOrders])

  const avatarInitial = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : 'U'

  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f6] text-neutral-900">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 md:py-16">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
            My Account
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Profile & Orders
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
            Kelola informasi akun dan pantau pesanan belanja kamu di NEXORA.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8">
            <p className="animate-pulse text-sm text-neutral-500">
              Memuat informasi profil...
            </p>
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-white p-6">
            <p role="alert" className="text-sm text-red-600">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="mt-4 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {isRefreshing ? 'Memuat...' : 'Coba Lagi'}
            </button>
          </div>
        ) : user ? (
          <>
            {/* Informasi profil */}
            <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-[#eee7dc] text-2xl font-semibold">
                  {avatarInitial}
                </div>

                <div className="min-w-0">
                  <h2 className="break-words text-xl font-semibold">
                    {user.name}
                  </h2>

                  <p className="mt-1 break-all text-sm text-neutral-500">
                    {user.email}
                  </p>

                  <span className="mt-3 inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                    {user.role === 'ADMIN' ? 'Administrator' : 'Customer'}
                  </span>
                </div>
              </div>

              <div className="border-t border-neutral-100 p-6 sm:p-8">
                <h3 className="text-sm font-semibold">Informasi Akun</h3>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-neutral-500">Nama lengkap</p>
                    <p className="mt-2 break-words text-sm font-medium">
                      {user.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500">Email</p>
                    <p className="mt-2 break-all text-sm font-medium">
                      {user.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500">ID Pengguna</p>
                    <p className="mt-2 text-sm font-medium">{user.id}</p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500">Jenis Akun</p>
                    <p className="mt-2 text-sm font-medium">
                      {user.role === 'ADMIN' ? 'Administrator' : 'Customer'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Riwayat pesanan */}
            <section className="mt-10">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    Shopping Activity
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    Riwayat Pesanan
                  </h2>

                  <p className="mt-2 text-sm text-neutral-500">
                    {orders.length} pesanan tercatat di akun kamu.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoadingOrders}
                  className="inline-flex w-fit items-center justify-center rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-medium transition hover:border-black hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRefreshing || isLoadingOrders
                    ? 'Memuat pesanan...'
                    : '↻ Muat Ulang'}
                </button>
              </div>

              {isLoadingOrders ? (
                <div className="rounded-2xl border border-neutral-200 bg-white p-8">
                  <p className="animate-pulse text-sm text-neutral-500">
                    Memuat riwayat pesanan...
                  </p>
                </div>
              ) : ordersError ? (
                <div className="rounded-2xl border border-red-200 bg-white p-6">
                  <p role="alert" className="text-sm text-red-600">
                    {ordersError}
                  </p>

                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="mt-4 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Coba Muat Ulang
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eee7dc] text-2xl">
                    ♡
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    Belum Ada Pesanan
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-500">
                    Pesanan yang kamu buat akan muncul di halaman ini.
                    Yuk, temukan produk favoritmu.
                  </p>

                  <Link
                    href="/products"
                    className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                  >
                    Mulai Belanja
                  </Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {orders.map((order) => (
                    <article
                      key={order.id}
                      className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-sm"
                    >
                      {/* Header pesanan */}
                      <div className="flex flex-col gap-4 border-b border-neutral-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <div>
                          <p className="text-xs text-neutral-500">
                            Nomor Pesanan
                          </p>

                          <h3 className="mt-1 font-semibold">
                            #{String(order.id).padStart(5, '0')}
                          </h3>

                          <p className="mt-2 text-xs text-neutral-500">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(order.status)}`}
                        >
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>

                      {/* Daftar produk dalam pesanan */}
                      <div className="space-y-4 p-5 sm:p-6">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="break-words text-sm font-medium">
                                {item.productName}
                              </p>

                              <p className="mt-1 text-xs text-neutral-500">
                                Warna: {item.selectedColor} · Jumlah:{' '}
                                {item.quantity}
                              </p>
                            </div>

                            <p className="shrink-0 text-sm font-medium">
                              {formatRupiah(item.price * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Total pesanan dan alamat */}
                      <div className="border-t border-neutral-100 bg-[#faf9f6] p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-neutral-500">
                            Total Pesanan
                          </span>

                          <span className="text-base font-semibold">
                            {formatRupiah(order.total)}
                          </span>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Alamat Pengiriman
                          </p>

                          <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-neutral-700">
                            {order.shippingAddress}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <div className="mt-8">
              <Link
                href="/products"
                className="inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Kembali Belanja
              </Link>
            </div>
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  )
}
