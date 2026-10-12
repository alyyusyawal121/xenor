
'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

export type CartItem = {
  productId: number
  color: string
  quantity: number
}

type CartContextType = {
  cartItems: CartItem[]
  addToCart: (
    productId: number,
    color: string,
    quantity: number,
    stock: number
  ) => void
  updateQuantity: (
    productId: number,
    color: string,
    quantity: number,
    stock: number
  ) => void
  removeFromCart: (productId: number, color: string) => void
  clearCart: () => void
}

const STORAGE_KEY = 'nexora-cart'

const CartContext = createContext<CartContextType | undefined>(
  undefined
)

export function useCart() {
  const context = useContext(CartContext)

  if (context === undefined) {
    throw new Error('useCart must be used within CartProvider')
  }

  return context
}

export default function CartProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY)

      if (savedCart) {
        const parsedCart: unknown = JSON.parse(savedCart)

        if (Array.isArray(parsedCart)) {
          const validItems = parsedCart.filter(
            (item): item is CartItem =>
              item !== null &&
              typeof item === 'object' &&
              typeof item.productId === 'number' &&
              Number.isInteger(item.productId) &&
              item.productId > 0 &&
              typeof item.color === 'string' &&
              item.color.length > 0 &&
              typeof item.quantity === 'number' &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0
          )

          setCartItems(validItems)
        }
      }
    } catch {
      setCartItems([])
    } finally {
      setIsHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(cartItems)
      )
    } catch {
      console.error('Keranjang gagal disimpan di browser.')
    }
  }, [cartItems, isHydrated])

  function addToCart(
    productId: number,
    color: string,
    quantity: number,
    stock: number
  ) {
    if (
      !Number.isInteger(productId) ||
      productId < 1 ||
      !color ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      !Number.isInteger(stock) ||
      stock < 1
    ) {
      return
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) =>
          item.productId === productId &&
          item.color === color
      )

      if (existingItem) {
        const nextQuantity = Math.min(
          existingItem.quantity + quantity,
          stock
        )

        return currentItems.map((item) =>
          item.productId === productId &&
          item.color === color
            ? { ...item, quantity: nextQuantity }
            : item
        )
      }

      return [
        ...currentItems,
        {
          productId,
          color,
          quantity: Math.min(quantity, stock),
        },
      ]
    })
  }

function updateQuantity(
  productId: number,
  color: string,
  quantity: number,
  stock: number
) {
  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    !Number.isInteger(stock) ||
    stock < 1
  ) {
    return
  }

  setCartItems((currentItems) =>
    currentItems.map((item) =>
      item.productId === productId && item.color === color
        ? { ...item, quantity: Math.min(quantity, stock) }
        : item
    )
  )
}

  function removeFromCart(
    productId: number,
    color: string
  ) {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.color === color
          )
      )
    )
  }

  function clearCart() {
    setCartItems([])
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
