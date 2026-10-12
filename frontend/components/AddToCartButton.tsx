
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
  const { addToCart } = useCart()
  const [selectedColor, setSelectedColor] = useState(
    colors[0] ?? ''
  )
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')

function handleAddToCart() {
  if (!selectedColor || stock < 1) return

  addToCart(productId, selectedColor, quantity, stock)
  setMessage('Produk berhasil ditambahkan ke keranjang.')
}

  return (
    <div className="mt-8">
      <h2 className="text-sm font-medium">Pilih warna</h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setSelectedColor(color)}
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
            onClick={() => setQuantity((current) => current - 1)}
            className="h-10 w-10 rounded-full border border-neutral-200 disabled:opacity-40"
          >
            −
          </button>

          <span className="min-w-6 text-center">{quantity}</span>

          <button
            type="button"
            aria-label="Tambah jumlah"
            disabled={quantity >= stock}
            onClick={() => setQuantity((current) => current + 1)}
            className="h-10 w-10 rounded-full border border-neutral-200 disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={stock < 1 || !selectedColor}
        onClick={handleAddToCart}
        className="mt-8 w-full rounded-full bg-black px-6 py-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {stock > 0 ? 'Add to Cart' : 'Out of Stock'}
      </button>

      {message && (
        <p role="status" className="mt-4 text-sm text-green-700">
          {message}
        </p>
      )}
    </div>
  )
}
