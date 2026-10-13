
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

function isValidCartItem(item: unknown): item is CartItem {
  if (
    typeof item !== 'object' ||
    item === null ||
    Array.isArray(item)
  ) {
    return false
  }

  const value = item as Record<string, unknown>

  return (
    typeof value.productId === 'number' &&
    Number.isSafeInteger(value.productId) &&
    value.productId > 0 &&
    typeof value.color === 'string' &&
    value.color.trim().length > 0 &&
    typeof value.quantity === 'number' &&
    Number.isSafeInteger(value.quantity) &&
    value.quantity > 0
  )
}

function normalizeCart(items: unknown[]): CartItem[] {
  const mergedItems = new Map<string, CartItem>()

  for (const item of items) {
    if (!isValidCartItem(item)) continue

    const normalizedItem: CartItem = {
      productId: item.productId,
      color: item.color.trim(),
      quantity: item.quantity,
    }

    const key = JSON.stringify([
      normalizedItem.productId,
      normalizedItem.color,
    ])

    const existingItem = mergedItems.get(key)

    if (existingItem) {
      existingItem.quantity = Math.min(
        Number.MAX_SAFE_INTEGER,
        existingItem.quantity + normalizedItem.quantity
      )
    } else {
      mergedItems.set(key, normalizedItem)
    }
  }

  return Array.from(mergedItems.values())
}

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

  // Pulihkan keranjang dari localStorage.
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY)

      if (savedCart) {
        const parsedCart: unknown = JSON.parse(savedCart)

        if (Array.isArray(parsedCart)) {
          setCartItems(normalizeCart(parsedCart))
        }
      }
    } catch {
      setCartItems([])
    } finally {
      setIsHydrated(true)
    }
  }, [])

  // Simpan perubahan setelah proses pemulihan selesai.
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
    const normalizedColor = color.trim()

    if (
      !Number.isSafeInteger(productId) ||
      productId < 1 ||
      !normalizedColor ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      !Number.isSafeInteger(stock) ||
      stock < 1
    ) {
      return
    }

    setCartItems((currentItems) => {
      const cleanedItems = normalizeCart(currentItems)

      const existingItem = cleanedItems.find(
        (item) =>
          item.productId === productId &&
          item.color === normalizedColor
      )

      if (existingItem) {
        const nextQuantity = Math.min(
          existingItem.quantity + quantity,
          stock
        )

        return cleanedItems.map((item) =>
          item.productId === productId &&
          item.color === normalizedColor
            ? { ...item, quantity: nextQuantity }
            : item
        )
      }

      return [
        ...cleanedItems,
        {
          productId,
          color: normalizedColor,
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
      !Number.isSafeInteger(productId) ||
      productId < 1 ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      return
    }

    const normalizedColor = color.trim()

    setCartItems((currentItems) =>
      normalizeCart(currentItems).map((item) => {
        if (
          item.productId !== productId ||
          item.color !== normalizedColor
        ) {
          return item
        }

        // Stok habis: izinkan pengurangan jumlah,
        // tetapi jangan izinkan jumlah dinaikkan.
        if (stock === 0) {
          return {
            ...item,
            quantity: Math.min(item.quantity, quantity),
          }
        }

        // Stok tersedia: batasi jumlah sesuai stok terbaru.
        return {
          ...item,
          quantity: Math.min(quantity, stock),
        }
      })
    )
  }

  function removeFromCart(
    productId: number,
    color: string
  ) {
    const normalizedColor = color.trim()

    setCartItems((currentItems) =>
      normalizeCart(currentItems).filter(
        (item) =>
          !(
            item.productId === productId &&
            item.color === normalizedColor
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
