
import ProductDetailClient from '@/components/ProductDetailClient'

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <ProductDetailClient id={id} />
}
