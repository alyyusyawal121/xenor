
'use client'


import { useDebounce } from '@/hooks/useDebounce'
import { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/types/product'
import { getProducts } from '@/lib/productApi'
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface ProductsResponse {
  data: Product[]
  total: number
}

export default function ProductListing() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const debouncedSearch = useDebounce(search, 400)

  
  
useEffect(() => {
  const controller = new AbortController()

  async function loadProducts() {
    try {
      setIsLoading(true)
      setError('')

      const result = await getProducts(
        {
          q: debouncedSearch,
          category,
          minPrice,
          maxPrice,
        },
        controller.signal
      )

      setProducts(result)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat produk.'
      )
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }

  loadProducts()

  return () => controller.abort()
}, [search, category, minPrice, maxPrice])

  // Ambil data produk dari backend ketika halaman dibuka.
  useEffect(() => {
    const controller = new AbortController()

    async function fetchProducts() {
      try {
        setIsLoading(true)
        setError('')

        const response = await fetch(
          `${API_URL}/api/products`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error(
            `Gagal mengambil produk. Status: ${response.status}`
          )
        }

        const result: ProductsResponse = await response.json()

        if (!Array.isArray(result.data)) {
          throw new Error('Format data produk dari API tidak valid.')
        }

        setProducts(result.data)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat mengambil produk.'
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchProducts()

    return () => controller.abort()
  }, [])

  const categories = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(products.map((product) => product.category))
      ),
    ],
    [products]
  )

  // Membaca kategori dari URL, misalnya /products?category=Hoodies.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestedCategory = params.get('category')

    if (
      requestedCategory &&
      categories.includes(requestedCategory)
    ) {
      setCategory(requestedCategory)
    }
  }, [categories])

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword) ||
        product.description.toLowerCase().includes(keyword)

      const matchesCategory =
        category === 'All' || product.category === category

      const matchesMinPrice =
        minPrice === '' ||
        product.price >= Number(minPrice)

      const matchesMaxPrice =
        maxPrice === '' ||
        product.price <= Number(maxPrice)

      return (
        matchesSearch &&
        matchesCategory &&
        matchesMinPrice &&
        matchesMaxPrice
      )
    })
  }, [products, search, category, minPrice, maxPrice])

  function resetFilters() {
    setSearch('')
    setCategory('All')
    setMinPrice('')
    setMaxPrice('')
  }

  const formatPrice = (price: number) =>
    `Rp ${price.toLocaleString('id-ID')}`

  const invalidPriceRange =
    minPrice !== '' &&
    maxPrice !== '' &&
    Number(minPrice) > Number(maxPrice)

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-neutral-900">
        <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          {/* Header */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
                Discover
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                All Products
              </h1>

              <p className="mt-3 text-neutral-500">
                Find your everyday essentials.
              </p>
            </div>

            <p className="text-sm text-neutral-500">
              {isLoading
                ? 'Loading products...'
                : `${filteredProducts.length} Products`}
            </p>
          </div>

          {/* Search */}
          <div className="mt-10">
            <label
              htmlFor="product-search"
              className="mb-2 block text-sm font-medium"
            >
              Search products
            </label>

            <input
              id="product-search"
              type="search"
              placeholder="Search by name, category, or description..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-full border border-neutral-300 px-5 py-3 text-sm outline-none transition focus:border-black"
            />
          </div>

          {/* Category filter */}
          <div className="mt-6">
            <p className="mb-3 text-sm font-medium">Category</p>

            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  aria-pressed={category === item}
                  className={`rounded-full px-5 py-2 text-sm transition ${
                    category === item
                      ? 'bg-black text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Price filter */}
          <div className="mt-6">
            <p className="mb-3 text-sm font-medium">Price range</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="min-price"
                  className="mb-2 block text-sm text-neutral-500"
                >
                  Minimum price (Rp)
                </label>

                <input
                  id="min-price"
                  type="number"
                  min="0"
                  placeholder="e.g. 100000"
                  value={minPrice}
                  onChange={(event) =>
                    setMinPrice(event.target.value)
                  }
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label
                  htmlFor="max-price"
                  className="mb-2 block text-sm text-neutral-500"
                >
                  Maximum price (Rp)
                </label>

                <input
                  id="max-price"
                  type="number"
                  min="0"
                  placeholder="e.g. 400000"
                  value={maxPrice}
                  onChange={(event) =>
                    setMaxPrice(event.target.value)
                  }
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>

            {invalidPriceRange && (
              <p className="mt-3 text-sm text-red-600">
                Minimum price cannot exceed maximum price.
              </p>
            )}
          </div>

          {/* Reset filters */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-500">
              {category !== 'All' && `Category: ${category}`}
              {minPrice !== '' &&
                ` · Min: ${formatPrice(Number(minPrice))}`}
              {maxPrice !== '' &&
                ` · Max: ${formatPrice(Number(maxPrice))}`}
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium underline underline-offset-4 transition hover:text-neutral-500"
            >
              Reset filters
            </button>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div
              role="status"
              className="py-24 text-center text-neutral-500"
            >
              Loading products from API...
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div
              role="alert"
              className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6"
            >
              <h2 className="font-medium text-red-800">
                Unable to load products
              </h2>

              <p className="mt-2 text-sm text-red-700">
                {error}
              </p>

              <p className="mt-2 text-sm text-red-700">
                Pastikan backend berjalan di {API_URL}.
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-full bg-black px-5 py-2 text-sm text-white transition hover:bg-neutral-800"
              >
                Try again
              </button>
            </div>
          )}

          {/* Product grid */}
          {!isLoading && !error && !invalidPriceRange && (
            filteredProducts.length > 0 ? (
              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <h2 className="text-xl font-medium">
                  No products found
                </h2>

                <p className="mt-2 text-sm text-neutral-500">
                  Try another keyword or adjust your filters.
                </p>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-full bg-black px-6 py-3 text-sm text-white transition hover:bg-neutral-800"
                >
                  Clear filters
                </button>
              </div>
            )
          )}
        </section>
      </main>

      <Footer />
    </>
  )
}
