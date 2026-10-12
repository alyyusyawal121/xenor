
'use client'

import { useEffect, useState } from 'react'

import { useDebounce } from '@/hooks/useDebounce'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { getCategories, getProducts } from '@/lib/productApi'
import type { Product } from '@/types/product'

export default function ProductListing() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>(['All'])

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [urlReady, setUrlReady] = useState(false)

  const debouncedSearch = useDebounce(search, 400)

  const invalidPriceRange =
    (minPrice !== '' &&
      (!Number.isFinite(Number(minPrice)) || Number(minPrice) < 0)) ||
    (maxPrice !== '' &&
      (!Number.isFinite(Number(maxPrice)) || Number(maxPrice) < 0)) ||
    (minPrice !== '' &&
      maxPrice !== '' &&
      Number(minPrice) > Number(maxPrice))

  // 1. Membaca filter dari URL saat halaman pertama dibuka.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    setSearch(params.get('q') ?? '')
    setCategory(params.get('category') || 'All')
    setMinPrice(params.get('minPrice') ?? '')
    setMaxPrice(params.get('maxPrice') ?? '')

    setUrlReady(true)
  }, [])

  // 2. Memperbarui URL saat pengguna mengubah filter.
  useEffect(() => {
    if (!urlReady) return

    const params = new URLSearchParams()

    if (search.trim()) {
      params.set('q', search.trim())
    }

    if (category !== 'All') {
      params.set('category', category)
    }

    if (minPrice !== '') {
      params.set('minPrice', minPrice)
    }

    if (maxPrice !== '') {
      params.set('maxPrice', maxPrice)
    }

    const query = params.toString()
    const newUrl = `${window.location.pathname}${
      query ? `?${query}` : ''
    }${window.location.hash}`

    const currentUrl =
      `${window.location.pathname}${window.location.search}${window.location.hash}`

    if (newUrl !== currentUrl) {
      window.history.replaceState(null, '', newUrl)
    }
  }, [urlReady, search, category, minPrice, maxPrice])

  // 3. Mengambil daftar kategori dari API.
  useEffect(() => {
    const controller = new AbortController()

    async function loadCategories() {
      try {
        const result = await getCategories(controller.signal)
        setCategories(result)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        console.error('Gagal memuat kategori:', err)
      }
    }

    loadCategories()

    return () => controller.abort()
  }, [])

  // 4. Mengambil produk berdasarkan filter yang aktif.
  useEffect(() => {
    if (!urlReady) return

    const controller = new AbortController()

    async function loadProducts() {
      if (invalidPriceRange) {
        setIsLoading(false)
        setError('')
        return
      }

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
            : 'Terjadi kesalahan saat mengambil produk.'
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadProducts()

    return () => controller.abort()
  }, [
    urlReady,
    debouncedSearch,
    category,
    minPrice,
    maxPrice,
    invalidPriceRange,
    retryCount,
  ])

  function resetFilters() {
    setSearch('')
    setCategory('All')
    setMinPrice('')
    setMaxPrice('')
  }

  function formatPrice(price: number) {
    return `Rp ${price.toLocaleString('id-ID')}`
  }

  function retryLoadingProducts() {
    setRetryCount((current) => current + 1)
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-neutral-900">
        <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
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
              {!urlReady || isLoading
                ? 'Loading products...'
                : `${products.length} Products`}
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
                  onChange={(event) => setMinPrice(event.target.value)}
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
                  onChange={(event) => setMaxPrice(event.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>

            {invalidPriceRange && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                Masukkan harga yang valid dan pastikan harga minimum
                tidak melebihi harga maksimum.
              </p>
            )}
          </div>

          {/* Active filters */}
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

          {/* Loading */}
          {(!urlReady || isLoading) && !invalidPriceRange && (
            <div
              role="status"
              className="py-24 text-center text-neutral-500"
            >
              Loading products from API...
            </div>
          )}

          {/* Error */}
          {urlReady && !isLoading && error && !invalidPriceRange && (
            <div
              role="alert"
              className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6"
            >
              <h2 className="font-medium text-red-800">
                Unable to load products
              </h2>

              <p className="mt-2 text-sm text-red-700">{error}</p>

              <p className="mt-2 text-sm text-red-700">
                Periksa apakah backend API berjalan dan alamat API
                sudah dikonfigurasi dengan benar.
              </p>

              <button
                type="button"
                onClick={retryLoadingProducts}
                className="mt-4 rounded-full bg-black px-5 py-2 text-sm text-white transition hover:bg-neutral-800"
              >
                Try again
              </button>
            </div>
          )}

          {/* Product grid */}
          {urlReady &&
            !isLoading &&
            !error &&
            !invalidPriceRange &&
            (products.length > 0 ? (
              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <h2 className="text-xl font-medium">
                  No products found
                </h2>

                <p className="mt-2 text-sm text-neutral-500">
                  Coba kata kunci atau rentang harga yang berbeda.
                </p>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-full bg-black px-6 py-3 text-sm text-white transition hover:bg-neutral-800"
                >
                  Clear filters
                </button>
              </div>
            ))}
        </section>
      </main>

      <Footer />
    </>
  )
}
