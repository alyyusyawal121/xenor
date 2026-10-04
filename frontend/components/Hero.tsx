import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-6">
      <div className="relative min-h-[620px] overflow-hidden rounded-[2rem] bg-neutral-100">
        {/* Background Image */}
        <Image
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8"
          alt="Nexora collection"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/25" />

        {/* Content */}
        <div className="relative z-10 flex min-h-[620px] items-end p-8 md:p-14">
          <div className="max-w-2xl text-white">
            <p className="mb-5 text-xs font-medium uppercase tracking-[0.35em] text-white/70">
              New Collection — 2026
            </p>

            <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.05em] md:text-7xl lg:text-8xl">
              Less,
              <br />
              but better.
            </h1>

            <p className="mt-7 max-w-md text-sm leading-6 text-white/75 md:text-base">
              Thoughtfully designed essentials for everyday
              living. Simple forms, timeless details, made to
              last.
            </p>

            <Link
              href="/products"
              className="mt-8 inline-flex rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition hover:scale-[1.03]"
            >
              Explore collection
              <span className="ml-3">↗</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}