
import type { Product } from '@/types/product'

export const API_URL =
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

interface ProductResponse {
  data: Product
}

interface CategoriesResponse {
  data: string[]
}

async function readJson<T>(
  response: Response,
  defaultError: string
): Promise<T> {
  if (!response.ok) {
    throw new Error(`${defaultError} (${response.status})`)
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new Error('Server mengembalikan format JSON yang tidak valid.')
  }
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

  const result = await readJson<ProductsResponse>(
    response,
    'Gagal mengambil produk'
  )

  if (!result || !Array.isArray(result.data)) {
    throw new Error('Format daftar produk dari API tidak valid.')
  }

  return result.data
}

export async function getProductById(
  id: number,
  signal?: AbortSignal
): Promise<Product> {
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('ID produk tidak valid.')
  }

  const response = await fetch(`${API_URL}/api/products/${id}`, {
    signal,
  })

  const result = await readJson<ProductResponse>(
    response,
    'Gagal mengambil detail produk'
  )

  if (
    !result?.data ||
    typeof result.data.id !== 'number'
  ) {
    throw new Error('Format detail produk dari API tidak valid.')
  }

  return result.data
}

export async function getCategories(
  signal?: AbortSignal
): Promise<string[]> {
  const response = await fetch(`${API_URL}/api/products/categories`, {
    signal,
  })

  const result = await readJson<CategoriesResponse>(
    response,
    'Gagal mengambil kategori'
  )

  if (
    !result ||
    !Array.isArray(result.data) ||
    !result.data.every((category) => typeof category === 'string')
  ) {
    throw new Error('Format kategori dari API tidak valid.')
  }

  return [
    'All',
    ...new Set(result.data.filter((category) => category !== 'All')),
  ]
}
