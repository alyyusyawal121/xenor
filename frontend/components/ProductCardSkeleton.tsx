
export default function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="aspect-[4/5] rounded-2xl bg-neutral-200" />

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="h-4 w-3/4 rounded bg-neutral-200" />
          <div className="mt-3 h-3 w-1/2 rounded bg-neutral-100" />
        </div>

        <div className="h-4 w-20 rounded bg-neutral-200" />
      </div>
    </div>
  )
}
