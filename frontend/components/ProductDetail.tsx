'use client'

import { useContext, useState } from "react"
import { notFound } from "next/navigation"

import { CartContext } from "@/context/CartContext"
import { products } from "@/data/products"

export default function ProductDetail({
  params,
}: {
  params: {
    id: string
  }
}) {
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)

  const { addToCart } = useContext(CartContext)

  const id = Number(params.id)

  const product = products.find(
    product => product.id === id
  )

  if (product === undefined) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">

        {/* Product Image */}
        <div className="flex items-center justify-center rounded-2xl bg-gray-100 p-8">
          <img
            src={product.img}
            alt={product.name}
            className="max-h-[500px] w-full object-contain"
          />
        </div>

        {/* Product Information */}
        <div className="flex flex-col justify-center">

          <p className="mb-2 text-sm text-gray-500">
            {product.tipe}
          </p>

          <h1 className="mb-4 text-3xl font-bold text-gray-900">
            {product.name}
          </h1>

          <p className="mb-4 text-2xl font-semibold text-gray-900">
            Rp {product.price.toLocaleString("id-ID")}
          </p>

          <p className="mb-6 leading-7 text-gray-600">
            {product.deskripsi}
          </p>

          {/* Color */}
          <div className="mb-6">
            <h2 className="mb-3 font-semibold text-gray-900">
              Color
            </h2>

            <div className="flex gap-3">
              {product.variants.map((variant) => (
                <button
                  key={variant.color}
                  onClick={() => setSelectedColor(variant.color)}
                  className={`rounded-lg border px-4 py-2 transition ${
                    selectedColor === variant.color
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white text-gray-700"
                  }`}
                >
                  {variant.color}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <h2 className="mb-3 font-semibold text-gray-900">
              Quantity
            </h2>

            <div className="flex w-fit items-center rounded-lg border border-gray-300">

              <button
                onClick={() =>
                  setQuantity(Math.max(1, quantity - 1))
                }
                className="px-4 py-2 text-lg"
              >
                −
              </button>

              <span className="px-4 py-2">
                {quantity}
              </span>

              <button
                onClick={() =>
                  setQuantity(quantity + 1)
                }
                className="px-4 py-2 text-lg"
              >
                +
              </button>

            </div>
          </div>

          {/* Stock */}
          <p className="mb-6 text-sm text-gray-500">
            Stock: {product.stock}
          </p>

          {/* Add Cart */}
          <button
            onClick={() => {
              if (!selectedColor) {
                alert("Please select a color")
                return
              }

              addToCart(
                product.id,
                selectedColor,
                quantity
              )
            }}
            className="rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
          >
            Add to Cart
          </button>

        </div>
      </div>
    </main>
  )
}