import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold tracking-tight">
              NEXORA
            </h2>

            <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-500">
              Everyday essentials designed with intention,
              simplicity, and timelessness.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium">Explore</h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-neutral-500">
              <Link href="/products">Shop</Link>
              <Link href="/collections">Collections</Link>
              <Link href="/about">About</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium">Support</h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-neutral-500">
              <Link href="/contact">Contact</Link>
              <Link href="/shipping">Shipping</Link>
              <Link href="/faq">FAQ</Link>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-neutral-200 pt-6 text-xs text-neutral-400">
          © 2026 NEXORA. All rights reserved.
        </div>
      </div>
    </footer>
  );
}   