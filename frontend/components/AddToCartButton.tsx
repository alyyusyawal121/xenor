
'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'

type AddToCartButtonProps = {
  productId: number
  colors: string[]
  stock: number
}

export default function AddToCartButton({
  productId,
  colors,
  stock,
}: AddToCartButtonProps) {
  const { cartItems, addToCart } = useCart()

  const [selectedColor, setSelectedColor] = useState(
    colors[0] ?? ''
  )
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')

  // Hitung jumlah produk dengan warna yang sama di keranjang.
  const existingItem = cartItems.find(
    (item) =>
      item.productId === productId &&
      item.color === selectedColor
  )

  const existingQuantity = existingItem?.quantity ?? 0

  // Stok yang masih dapat ditambahkan ke keranjang.
  const availableStock = Math.max(0, stock - existingQuantity)

  function handleAddToCart() {
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

    const quantityToAdd = Math.min(quantity, availableStock)

    addToCart(
      productId,
      selectedColor,
      quantityToAdd,
      stock
    )

    if (quantityToAdd < quantity) {
      setMessage(
        `Hanya ${quantityToAdd} item tambahan yang tersedia.`
      )
    } else {
      setMessage('Produk berhasil ditambahkan ke keranjang.')
    }
  }

  function handleSelectColor(color: string) {
    setSelectedColor(color)
    setQuantity(1)
    setMessage('')
  }

  function handleDecreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1))
    setMessage('')
  }

  function handleIncreaseQuantity() {
    setQuantity((current) =>
      Math.min(availableStock, current + 1)
    )
    setMessage('')
  }

  const canAddToCart =
    Boolean(selectedColor) &&
    stock > 0 &&
    availableStock > 0

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
        <label
          htmlFor="product-quantity"
          className="text-sm font-medium"
        >
          Jumlah
        </label>

        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            aria-label="Kurangi jumlah"
            disabled={quantity <= 1}
            onClick={handleDecreaseQuantity}
            className="h-10 w-10 rounded-full border border-neutral-200 disabled:opacity-40"
          >
            −
          </button>

          <span
            id="product-quantity"
            aria-live="polite"
            className="min-w-6 text-center"
          >
            {quantity}
          </span>

          <button
            type="button"
            aria-label="Tambah jumlah"
            disabled={
              !canAddToCart ||
              quantity >= availableStock
            }
            onClick={handleIncreaseQuantity}
            className="h-10 w-10 rounded-full border border-neutral-200 disabled:opacity-40"
          >
            +
          </button>
        </div>

        <p className="mt-3 text-xs text-neutral-500">
          {stock < 1
            ? 'Stok produk habis.'
            : availableStock > 0
              ? `${availableStock} item masih dapat ditambahkan untuk warna ini.`
              : 'Stok warna ini sudah mencapai batas di keranjang.'}
        </p>
      </div>

      <button
        type="button"
        disabled={!canAddToCart}
        onClick={handleAddToCart}
        className="mt-8 w-full rounded-full bg-black px-6 py-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {stock < 1
          ? 'Out of Stock'
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
