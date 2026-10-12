
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
    quantity: number
  ) => void
  updateQuantity: (
    productId: number,
    color: string,
    quantity: number
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

  // Membaca keranjang yang tersimpan saat aplikasi dibuka.
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
              typeof item.color === 'string' &&
              typeof item.quantity === 'number' &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0
          )

          setCartItems(validItems)
        }
      }
    } catch {
      // Jika data penyimpanan rusak, aplikasi tetap bisa berjalan.
      setCartItems([])
    } finally {
      setIsHydrated(true)
    }
  }, [])

  // Menyimpan perubahan keranjang setelah data awal selesai dibaca.
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
    quantity: number
  ) {
    if (
      !Number.isInteger(quantity) ||
      quantity < 1
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
        return currentItems.map((item) =>
          item.productId === productId &&
          item.color === color
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item
        )
      }

      return [
        ...currentItems,
        { productId, color, quantity },
      ]
    })
  }

  function updateQuantity(
    productId: number,
    color: string,
    quantity: number
  ) {
    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return
    }

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId &&
        item.color === color
          ? { ...item, quantity }
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
