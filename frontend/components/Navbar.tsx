
'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
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

export default function Navbar() {
  const { cartItems } = useCart()
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Menghitung jumlah seluruh barang di keranjang.
  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  )

  // Memeriksa apakah browser memiliki session login yang valid.
  useEffect(() => {
    let isMounted = true

    async function checkSession() {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })

        if (!response.ok) {
          if (isMounted) {
            setUser(null)
          }
          return
        }

        const result: SessionResponse = await response.json()

        if (isMounted && result.success && result.data) {
          setUser(result.data)
        }
      } catch {
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false)
        }
      }
    }

    checkSession()

    return () => {
      isMounted = false
    }
  }, [])

  // Menutup menu profil ketika pengguna mengeklik area di luarnya.
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  // Mengakhiri session pengguna melalui backend.
  async function handleLogout() {
    setIsLoggingOut(true)
    setErrorMessage('')

    try {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Logout gagal.')
      }

      setUser(null)
      setIsProfileMenuOpen(false)

      // Memperbarui halaman setelah logout berhasil.
      router.push('/')
      router.refresh()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat logout.'
      )
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Membuat inisial nama untuk avatar sementara.
  const avatarInitial = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : 'U'

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 text-neutral-900 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 md:h-20">
        {/* Logo toko */}
        <Link
          href="/"
          aria-label="NEXORA Home"
          className="shrink-0 text-xl font-bold tracking-[-0.06em]"
        >
          NEXORA
        </Link>

        {/* Navigasi utama */}
        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-7 text-sm text-neutral-500 md:flex"
        >
          <Link href="/" className="transition-colors hover:text-black">
            Home
          </Link>

          <Link
            href="/products"
            className="transition-colors hover:text-black"
          >
            Shop
          </Link>
        </nav>

        {/* Tombol pencarian, keranjang, dan akun */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/products"
            aria-label="Cari produk"
            className="flex h-10 w-10 items-center justify-center rounded-full text-2xl transition-colors hover:bg-neutral-100"
          >
            ⌕
          </Link>

          <Link
            href="/cart"
            aria-label={`Keranjang belanja, ${cartCount} barang`}
            className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 sm:px-5"
          >
            <span>Cart</span>
            <span className="flex min-w-5 items-center justify-center rounded-full bg-white/15 px-1.5 py-0.5 text-xs">
              {cartCount}
            </span>
          </Link>

          {/* Tampilan ketika status login sedang diperiksa */}
          {isCheckingSession ? (
            <div
              aria-label="Memeriksa status login"
              className="h-10 w-10 animate-pulse rounded-full bg-neutral-200"
            />
          ) : user ? (
            /* Tampilan jika sudah login */
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                aria-label="Buka menu profil"
                aria-expanded={isProfileMenuOpen}
                onClick={() => {
                  setIsProfileMenuOpen((current) => !current)
                  setErrorMessage('')
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-[#eee7dc] text-sm font-semibold text-neutral-900 transition hover:border-black hover:bg-[#e5dac9] focus:outline-none focus:ring-2 focus:ring-neutral-400"
              >
                {avatarInitial}
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl border border-neutral-200 bg-white py-2 shadow-xl">
                  <div className="border-b border-neutral-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {user.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-neutral-500">
                      {user.email}
                    </p>
                    <p className="mt-2 inline-flex rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-semibold tracking-wide text-neutral-600">
                      {user.role === 'ADMIN' ? 'ADMINISTRATOR' : 'CUSTOMER'}
                    </p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-black"
                  >
                    Profile Settings
                  </Link>

                  {errorMessage && (
                    <p
                      role="alert"
                      className="px-4 py-2 text-xs text-red-600"
                    >
                      {errorMessage}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoggingOut ? 'Sedang logout...' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Tampilan jika belum login */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-black sm:px-4"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-full border border-neutral-900 px-3 py-2 text-sm font-medium transition-colors hover:bg-neutral-900 hover:text-white sm:px-4"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
