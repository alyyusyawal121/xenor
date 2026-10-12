
'use client'

import { useEffect, useState } from 'react'

import { useDebounce } from '@/hooks/useDebounce'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { getCategories, getProducts } from '@/lib/productApi'
import type { Product } from '@/types/product'

const PAGE_SIZE = 9

export default function ProductListing() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>(['All'])

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
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

  // Membaca filter dari URL saat halaman pertama dibuka.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    setSearch(params.get('q') ?? '')
    setCategory(params.get('category') || 'All')
    setMinPrice(params.get('minPrice') ?? '')
    setMaxPrice(params.get('maxPrice') ?? '')

    setUrlReady(true)
  }, [])

  // Memperbarui URL ketika filter berubah.
  useEffect(() => {
    if (!urlReady) return

    const params = new URLSearchParams()

    if (search.trim()) params.set('q', search.trim())
    if (category !== 'All') params.set('category', category)
    if (minPrice !== '') params.set('minPrice', minPrice)
    if (maxPrice !== '') params.set('maxPrice', maxPrice)

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

  // Mengambil kategori dari API.
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

  // Mengambil produk berdasarkan filter.
  useEffect(() => {
    if (!urlReady) return

    const controller = new AbortController()

    async function loadProducts() {
      if (invalidPriceRange) {
        setIsLoading(false)
        setError('')
        setProducts([])
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

  // Kembali ke halaman pertama ketika filter berubah.
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, category, minPrice, maxPrice])

  const totalPages = Math.max(
    1,
    Math.ceil(products.length / PAGE_SIZE)
  )

  // Mencegah halaman aktif melewati jumlah halaman yang tersedia.
  const safePage = Math.min(currentPage, totalPages)

  const startIndex =
    products.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE

  const visibleProducts = products.slice(
    startIndex,
    startIndex + PAGE_SIZE
  )

  const firstProduct = products.length === 0 ? 0 : startIndex + 1
  const lastProduct = Math.min(
    startIndex + PAGE_SIZE,
    products.length
  )

  function resetFilters() {
    setSearch('')
    setCategory('All')
    setMinPrice('')
    setMaxPrice('')
    setCurrentPage(1)
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
          {/* Heading */}
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
              <>
                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                  <p
                    className="text-sm text-neutral-500"
                    aria-live="polite"
                  >
                    Showing {firstProduct}–{lastProduct} of {products.length} products
                  </p>

                  <nav
                    aria-label="Product pagination"
                    className="flex items-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      disabled={safePage === 1}
                      className="rounded-full border border-neutral-300 px-4 py-2 text-sm transition hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>

                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1
                    ).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        aria-label={`Go to page ${page}`}
                        aria-current={safePage === page ? 'page' : undefined}
                        className={`h-10 min-w-10 rounded-full px-3 text-sm transition ${
                          safePage === page
                            ? 'bg-black text-white'
                            : 'border border-neutral-300 hover:border-black'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(totalPages, page + 1)
                        )
                      }
                      disabled={safePage === totalPages}
                      className="rounded-full border border-neutral-300 px-4 py-2 text-sm transition hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </>
            ) : (
              <div className="py-24 text-center">
                <h2 className="text-xl font-medium">No products found</h2>

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
