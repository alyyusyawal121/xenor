
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { products } from '@/data/products'
import AddToCartButton from '@/components/AddToCartButton'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const productId = Number(id)

  const product = products.find(
    (item) => item.id === productId
  )

  if (!Number.isInteger(productId) || !product) {
    notFound()
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-neutral-900">
        <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
          <Link
            href="/products"
            className="mb-10 inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-black"
          >
            ← Kembali ke katalog
          </Link>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-neutral-100">
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            <div className="flex flex-col justify-center">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">
                {product.category}
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
                {product.name}
              </h1>

              <p className="mt-5 text-xl font-medium">
                Rp {product.price.toLocaleString('id-ID')}
              </p>

              <div className="my-8 h-px bg-neutral-200" />

              <h2 className="text-sm font-medium">
                Deskripsi produk
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-7 text-neutral-500">
                {product.description}
              </p>

              <p className="mt-8 text-sm text-neutral-500">
                {product.stock > 0
                  ? `${product.stock} item tersedia`
                  : 'Stok habis'}
              </p>

              <AddToCartButton
                productId={product.id}
                colors={product.colors}
                stock={product.stock}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
