
'use client'

import { useEffect, useMemo, useState } from 'react'
import ProductCardSkeleton from '@/components/ProductCardSkeleton'
import { useDebounce } from '@/hooks/useDebounce'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { getCategories, getProducts } from '@/lib/productApi'
import type { Product } from '@/types/product'

const PAGE_SIZE = 9

type ProductSortOption =
  | 'featured'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'

const VALID_SORT_OPTIONS: ProductSortOption[] = [
  'featured',
  'price-asc',
  'price-desc',
  'name-asc',
]

export default function ProductListing() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>(['All'])

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState<ProductSortOption>('featured')

  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [urlReady, setUrlReady] = useState(false)

  const debouncedSearch = useDebounce(search, 400)

  const invalidPriceRange =
    (minPrice !== '' &&
      (!Number.isFinite(Number(minPrice)) ||
        Number(minPrice) < 0)) ||
    (maxPrice !== '' &&
      (!Number.isFinite(Number(maxPrice)) ||
        Number(maxPrice) < 0)) ||
    (minPrice !== '' &&
      maxPrice !== '' &&
      Number(minPrice) > Number(maxPrice))

  // Membaca filter dan pengurutan dari URL saat halaman dibuka.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sortParam = params.get('sort')

    setSearch(params.get('q') ?? '')
    setCategory(params.get('category') || 'All')
    setMinPrice(params.get('minPrice') ?? '')
    setMaxPrice(params.get('maxPrice') ?? '')

    setSort(
      sortParam && VALID_SORT_OPTIONS.includes(
        sortParam as ProductSortOption
      )
        ? (sortParam as ProductSortOption)
        : 'featured'
    )

    setUrlReady(true)
  }, [])

  // Memperbarui URL ketika filter atau pengurutan berubah.
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

    if (sort !== 'featured') {
      params.set('sort', sort)
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
  }, [urlReady, search, category, minPrice, maxPrice, sort])

  // Mengambil daftar kategori dari backend.
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

  // Mengambil produk dari backend sesuai pencarian dan filter.
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

  // Mengurutkan produk tanpa mengubah array asli dari API.
  const sortedProducts = useMemo(() => {
    const result = [...products]

    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break

      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break

      case 'name-asc':
        result.sort((a, b) =>
          a.name.localeCompare(b.name, 'id')
        )
        break

      case 'featured':
      default:
        // Mempertahankan urutan produk dari API.
        break
    }

    return result
  }, [products, sort])

  // Kembali ke halaman pertama saat pencarian/filter berubah.
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, category, minPrice, maxPrice, sort])

  // Perhitungan pagination berdasarkan hasil pengurutan.
  const totalPages = Math.max(
    1,
    Math.ceil(sortedProducts.length / PAGE_SIZE)
  )

  const safePage = Math.min(currentPage, totalPages)

  const startIndex =
    sortedProducts.length === 0
      ? 0
      : (safePage - 1) * PAGE_SIZE

  const visibleProducts = sortedProducts.slice(
    startIndex,
    startIndex + PAGE_SIZE
  )

  const firstProduct =
    sortedProducts.length === 0 ? 0 : startIndex + 1

  const lastProduct = Math.min(
    startIndex + PAGE_SIZE,
    sortedProducts.length
  )

  // Menghapus seluruh filter dan mengembalikan urutan default.
  function resetFilters() {
    setSearch('')
    setCategory('All')
    setMinPrice('')
    setMaxPrice('')
    setSort('featured')
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
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
          {/* Heading katalog */}
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

            <p
              className="text-sm text-neutral-500"
              aria-live="polite"
            >
              {!urlReady || isLoading
                ? 'Loading products...'
                : `${sortedProducts.length} Products`}
            </p>
          </div>

          {/* Pencarian produk */}
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

          {/* Filter kategori */}
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

          {/* Filter rentang harga */}
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
                  step="any"
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
                  step="any"
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
              <p
                role="alert"
                className="mt-3 text-sm text-red-600"
              >
                Masukkan harga yang valid dan pastikan harga minimum
                tidak melebihi harga maksimum.
              </p>
            )}
          </div>

          {/* Pengurutan produk */}
          <div className="mt-6">
            <label
              htmlFor="product-sort"
              className="mb-2 block text-sm font-medium"
            >
              Sort products
            </label>

            <select
              id="product-sort"
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as ProductSortOption)
              }
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black sm:max-w-xs"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">
                Price: Low to High
              </option>
              <option value="price-desc">
                Price: High to Low
              </option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>

          {/* Informasi filter aktif dan tombol reset */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-500">
              {category !== 'All' && `Category: ${category}`}
              {minPrice !== '' &&
                ` · Min: ${formatPrice(Number(minPrice))}`}
              {maxPrice !== '' &&
                ` · Max: ${formatPrice(Number(maxPrice))}`}
              {sort !== 'featured' &&
                ` · Sort: ${
                  sort === 'price-asc'
                    ? 'Price: Low to High'
                    : sort === 'price-desc'
                      ? 'Price: High to Low'
                      : 'Name: A to Z'
                }`}
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
          {(!urlReady || isLoading) && !invalidPriceRange && (
            <div
              role="status"
              aria-label="Memuat produk"
              className="mt-10"
            >
              <p className="mb-6 text-sm text-neutral-500">
                Memuat produk...
              </p>

              <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            </div>
          )}

          {/* Error state */}
          {urlReady &&
            !isLoading &&
            error &&
            !invalidPriceRange && (
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

          {/* Grid produk dan pagination */}
          {urlReady &&
            !isLoading &&
            !error &&
            !invalidPriceRange &&
            (sortedProducts.length > 0 ? (
              <>
                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                  <p
                    className="text-sm text-neutral-500"
                    aria-live="polite"
                  >
                    Showing {firstProduct}–{lastProduct} of{' '}
                    {sortedProducts.length} products
                  </p>

                  <nav
                    aria-label="Product pagination"
                    className="flex flex-wrap items-center justify-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.max(1, page - 1)
                        )
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
                        aria-current={
                          safePage === page ? 'page' : undefined
                        }
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
              /* Empty state */
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
