'use client'

import { createContext, useState } from "react"

type CartItem = {
  productId: number
  color: string
  quantity: number
}

export const CartContext = createContext<any>(null)

export default function CartProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  function addToCart(
    productId: number,
    color: string,
    quantity: number
  ) {
    const newItem = {
      productId,
      color,
      quantity,
    }

    setCartItems([
      ...cartItems,
      newItem,
    ])
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}