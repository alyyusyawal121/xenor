
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
  data: unknown
  total?: number
}

interface ProductResponse {
  data: unknown
}

interface CategoriesResponse {
  data: unknown
}

// Membaca JSON dan menangani respons HTTP yang gagal.
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

// Memeriksa apakah nilai merupakan objek.
function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

// Memvalidasi satu produk sebelum digunakan frontend.
function validateProduct(value: unknown): Product {
  if (!isRecord(value)) {
    throw new Error('Data produk harus berupa objek.')
  }

  const { id, name, price, category, image, description, stock, colors } =
    value

  if (
    typeof id !== 'number' ||
    !Number.isInteger(id) ||
    id < 1
  ) {
    throw new Error('ID produk harus berupa bilangan bulat positif.')
  }

  if (typeof name !== 'string' || !name.trim()) {
    throw new Error(`Nama produk dengan ID ${id} tidak valid.`)
  }

  if (
    typeof price !== 'number' ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    throw new Error(`Harga produk "${name}" tidak valid.`)
  }

  if (typeof category !== 'string' || !category.trim()) {
    throw new Error(`Kategori produk "${name}" tidak valid.`)
  }

  if (typeof image !== 'string') {
    throw new Error(`Data gambar produk "${name}" harus berupa teks.`)
  }

  if (typeof description !== 'string') {
    throw new Error(`Deskripsi produk "${name}" tidak valid.`)
  }

  if (
    typeof stock !== 'number' ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    throw new Error(`Stok produk "${name}" harus bilangan bulat minimal 0.`)
  }

  if (
    !Array.isArray(colors) ||
    !colors.every(
      (color) => typeof color === 'string' && color.trim().length > 0
    )
  ) {
    throw new Error(`Daftar warna produk "${name}" tidak valid.`)
  }

  return {
    id,
    name: name.trim(),
    price,
    category: category.trim(),
    // String kosong ditangani ProductCard sebagai gambar fallback.
    image: image.trim(),
    description: description.trim(),
    stock,
    colors: colors.map((color) => color.trim()),
  }
}

// Mengambil daftar produk dengan pencarian dan filter.
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

  if (!isRecord(result) || !Array.isArray(result.data)) {
    throw new Error('Format daftar produk dari API tidak valid.')
  }

  return result.data.map((item, index) => {
    try {
      return validateProduct(item)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Data tidak valid.'

      throw new Error(`Produk ke-${index + 1}: ${message}`)
    }
  })
}

// Mengambil dan memvalidasi satu produk berdasarkan ID.
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

  if (!isRecord(result) || !('data' in result)) {
    throw new Error('Format detail produk dari API tidak valid.')
  }

  return validateProduct(result.data)
}

// Mengambil kategori yang tersedia dari API.
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
    !isRecord(result) ||
    !Array.isArray(result.data) ||
    !result.data.every(
      (category) => typeof category === 'string' && category.trim().length > 0
    )
  ) {
    throw new Error('Format kategori dari API tidak valid.')
  }

  return [
    'All',
    ...new Set(
      result.data
        .map((category) => category.trim())
        .filter((category) => category !== 'All')
    ),
  ]
}
