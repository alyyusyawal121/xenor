import Image from "next/image";
import Link from "next/link";

export default function EditorialSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="relative min-h-[500px] overflow-hidden rounded-[2rem]">
        <Image
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d"
          alt="Nexora lifestyle"
          fill
          className="object-cover"
          sizes="100vw"
        />

        <div className="absolute inset-0 bg-black/35" />

        <div className="relative z-10 flex min-h-[500px] items-center justify-center px-6 text-center text-white">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">
              The Nexora Journal
            </p>

            <h2 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
              Designed for everyday life.
            </h2>

            <p className="mx-auto mt-6 max-w-md text-sm leading-6 text-white/70">
              We believe good design doesn't need to be
              complicated. It simply needs to work beautifully.
            </p>

            <Link
              href="/about"
              className="mt-8 inline-flex rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm backdrop-blur transition hover:bg-white hover:text-black"
            >
              Our philosophy →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}