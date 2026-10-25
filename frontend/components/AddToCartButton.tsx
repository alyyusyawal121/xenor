'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { API_URL } from '@/lib/productApi'

type AddToCartButtonProps = {
  productId: number
  colors: string[]
  stock: number
}

type SessionResponse = {
  success: boolean
  data?: {
    id: number
    role: 'ADMIN' | 'USER'
  }
}

export default function AddToCartButton({
  productId,
  colors,
  stock,
}: AddToCartButtonProps) {
  const { cartItems, addToCart } = useCart()

  // Menyimpan pilihan pelanggan selama halaman terbuka.
  const [selectedColor, setSelectedColor] = useState(colors[0] ?? '')
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')
  const [checkingSession, setCheckingSession] = useState(false)

  // Mencari item dengan produk dan warna yang sama.
  const existingItem = cartItems.find(
    (item) =>
      item.productId === productId &&
      item.color === selectedColor
  )

  const existingQuantity = existingItem?.quantity ?? 0

  // Membatasi penambahan berdasarkan stok yang tersedia.
  const availableStock = Math.max(0, stock - existingQuantity)

  // Dijalankan saat tombol Add to Cart ditekan.
  async function handleAddToCart() {
    setMessage('')

    if (!selectedColor) {
      setMessage('Silakan pilih warna produk.')
      return
    }

    if (stock < 1) {
      setMessage('Maaf, stok produk sedang habis.')
      return
    }

    if (availableStock < 1) {
      setMessage('Jumlah maksimal untuk warna ini sudah ada di keranjang.')
      return
    }

    setCheckingSession(true)

    try {
      // Memeriksa sesi login melalui backend.
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      // Jika belum login, arahkan ke login.
      if (response.status === 401) {
        const next = `/products/${productId}`

        window.location.assign(
          `/login?next=${encodeURIComponent(next)}`
        )
        return
      }

      if (!response.ok) {
        throw new Error('Sesi login belum dapat diperiksa. Coba lagi.')
      }

      const session: SessionResponse = await response.json()

      // Hanya akun pelanggan yang boleh menambahkan produk.
      if (!session.success || session.data?.role !== 'USER') {
        setMessage(
          'Silakan login menggunakan akun pelanggan untuk menambahkan produk.'
        )
        return
      }

      // Batasi jumlah yang ditambahkan sesuai stok.
      const quantityToAdd = Math.min(quantity, availableStock)

      // Menambahkan produk ke CartContext.
      addToCart(
        productId,
        selectedColor,
        quantityToAdd,
        stock
      )

      setMessage('Produk berhasil ditambahkan ke keranjang.')
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : 'Gagal memeriksa sesi login.'
      )
    } finally {
      setCheckingSession(false)
    }
  }

  // Mengganti warna dan mengembalikan jumlah ke satu.
  function handleSelectColor(color: string) {
    setSelectedColor(color)
    setQuantity(1)
    setMessage('')
  }

  const canAddToCart =
    Boolean(selectedColor) &&
    stock > 0 &&
    availableStock > 0 &&
    !checkingSession

  return (
    <div className="mt-8">
      <h2 className="text-sm font-medium">Pilih warna</h2>

      {colors.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleSelectColor(color)}
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
      ) : (
        <p className="mt-3 text-sm text-neutral-500">
          Pilihan warna belum tersedia.
        </p>
      )}

      <div className="mt-6">
        <label className="text-sm font-medium">Jumlah</label>

        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            aria-label="Kurangi jumlah"
            disabled={quantity <= 1}
            onClick={() => {
              setQuantity((current) => Math.max(1, current - 1))
              setMessage('')
            }}
            className="h-10 w-10 rounded-full border border-neutral-200 disabled:opacity-40"
          >
            −
          </button>

          <span aria-live="polite" className="min-w-6 text-center">
            {quantity}
          </span>

          <button
            type="button"
            aria-label="Tambah jumlah"
            disabled={!canAddToCart || quantity >= availableStock}
            onClick={() => {
              setQuantity((current) =>
                Math.min(availableStock, current + 1)
              )
              setMessage('')
            }}
            className="h-10 w-10 rounded-full border border-neutral-200 disabled:opacity-40"
          >
            +
          </button>
        </div>

        <p className="mt-3 text-xs text-neutral-500">
          {stock < 1
            ? 'Stok produk habis.'
            : `${availableStock} item masih dapat ditambahkan untuk warna ini.`}
        </p>
      </div>

      <button
        type="button"
        disabled={!canAddToCart}
        onClick={handleAddToCart}
        className="mt-8 w-full rounded-full bg-black px-6 py-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {checkingSession
          ? 'Memeriksa login...'
          : stock < 1
            ? 'Stok Habis'
            : availableStock < 1
              ? 'Stok Maksimal di Keranjang'
              : 'Add to Cart'}
      </button>

      {message && (
        <p
          role="status"
          className={`mt-4 text-sm ${
            message.includes('berhasil')
              ? 'text-green-700'
              : 'text-amber-700'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  )
}