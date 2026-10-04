import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-[-0.04em]"
        >
          NEXORA
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 text-sm text-neutral-500 md:flex">
          <Link
            href="/"
            className="transition hover:text-black"
          >
            Home
          </Link>

          <Link
            href="/products"
            className="transition hover:text-black"
          >
            Shop
          </Link>

          <Link
            href="/collections"
            className="transition hover:text-black"
          >
            Collections
          </Link>

          <Link
            href="/about"
            className="transition hover:text-black"
          >
            About
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            aria-label="Search"
            className="hidden h-10 w-10 items-center justify-center rounded-full transition hover:bg-neutral-100 sm:flex"
          >
            ⌕
          </button>

          <Link
            href="/cart"
            className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Cart <span className="ml-1 text-neutral-400">0</span>
          </Link>
        </div>
      </div>
    </header>
  );
}