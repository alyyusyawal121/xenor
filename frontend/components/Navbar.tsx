
'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'

export default function Navbar() {
  const { cartItems } = useCart()

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  )

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 text-neutral-900 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 md:h-20">
        {/* Logo */}
        <Link
          href="/"
          aria-label="NEXORA Home"
          className="shrink-0 text-xl font-bold tracking-[-0.06em]"
        >
          NEXORA
        </Link>

        {/* Navigasi desktop */}
        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-7 text-sm text-neutral-500 md:flex"
        >
          <Link
            href="/"
            className="transition-colors hover:text-black"
          >
            Home
          </Link>

          <Link
            href="/products"
            className="transition-colors hover:text-black"
          >
            Shop
          </Link>
        </nav>

        {/* Aksi */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/products"
            aria-label="Cari produk"
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl transition-colors hover:bg-neutral-100"
          >
            ⌕
          </Link>

          <Link
            href="/cart"
            aria-label={`Keranjang belanja, ${cartCount} barang`}
            className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 sm:px-5"
          >
            <span>Cart</span>

            <span className="flex min-w-5 items-center justify-center rounded-full bg-white/15 px-1.5 py-0.5 text-xs">
              {cartCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
