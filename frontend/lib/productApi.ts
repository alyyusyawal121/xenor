
import type { Product } from '@/types/product'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export interface ProductFilters {
  q?: string
  category?: string
  minPrice?: string
  maxPrice?: string
}

interface ProductsResponse {
  data: Product[]
  total: number
}

export async function getProducts(
  filters: ProductFilters = {},
  signal?: AbortSignal
): Promise<Product[]> {
  const params = new URLSearchParams()

  if (filters.q?.trim()) {
    params.set('q', filters.q.trim())
  }

  if (filters.category && filters.category !== 'All') {
    params.set('category', filters.category)
  }

  if (filters.minPrice !== undefined && filters.minPrice !== '') {
    params.set('minPrice', filters.minPrice)
  }

  if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
    params.set('maxPrice', filters.maxPrice)
  }

  const query = params.toString()
  const url = `${API_URL}/api/products${query ? `?${query}` : ''}`

  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`Gagal mengambil produk: ${response.status}`)
  }

  const result: ProductsResponse = await response.json()

  if (!Array.isArray(result.data)) {
    throw new Error('Format data produk dari API tidak valid.')
  }

  return result.data
}

export async function getProductById(
  id: number,
  signal?: AbortSignal
): Promise<Product> {
  const response = await fetch(`${API_URL}/api/products/${id}`, {
    signal,
  })

  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? 'Produk tidak ditemukan.'
        : `Gagal mengambil produk: ${response.status}`
    )
  }

  const result: { data: Product } = await response.json()

  if (!result.data || typeof result.data.id !== 'number') {
    throw new Error('Format detail produk tidak valid.')
  }

  return result.data
}
