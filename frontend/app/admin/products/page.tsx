
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/productApi";
import type { Product } from "@/types/product";

type ProductForm = {
  name: string;
  price: string;
  category: string;
  image: string;
  description: string;
  stock: string;
  colors: string;
};

const EMPTY_FORM: ProductForm = {
  name: "",
  price: "",
  category: "",
  image: "",
  description: "",
  stock: "",
  colors: "Black, Cream",
};

function formatRupiah(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/products`, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !Array.isArray(result.data)) {
        throw new Error(
          result.message || "Gagal mengambil daftar produk."
        );
      }

      setProducts(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil produk."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setError("");
    setNotice("");
  }

  function startEditing(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: String(product.price),
      category: product.category,
      image: product.image,
      description: product.description,
      stock: String(product.stock),
      colors: product.colors.join(", "),
    });

    setError("");
    setNotice("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateField(field: keyof ProductForm, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setNotice("");

    const price = Number(form.price);
    const stock = Number(form.stock);

    const colors = form.colors
      .split(",")
      .map((color) => color.trim())
      .filter(Boolean);

    if (
      !Number.isSafeInteger(price) ||
      price < 0 ||
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      setError("Harga dan stok harus berupa bilangan bulat nol atau lebih.");
      return;
    }

    if (new Set(colors.map((color) => color.toLowerCase())).size !== colors.length) {
      setError("Warna tidak boleh duplikat.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      price,
      category: form.category.trim(),
      image: form.image.trim(),
      description: form.description.trim(),
      stock,
      colors,
    };

    setSaving(true);

    try {
      const isEditing = editingId !== null;
      const url = isEditing
        ? `${API_URL}/api/products/${editingId}`
        : `${API_URL}/api/products`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "Akses ditolak. Pastikan kamu sudah login menggunakan akun admin."
          );
        }

        throw new Error(result.message || "Gagal menyimpan produk.");
      }

      setNotice(
        isEditing
          ? "Produk berhasil diperbarui."
          : "Produk berhasil ditambahkan."
      );

      setForm({ ...EMPTY_FORM });
      setEditingId(null);

      await fetchProducts();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan produk."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Hapus produk "${product.name}"? Tindakan ini tidak dapat dibatalkan.`
    );

    if (!confirmed) return;

    setDeletingId(product.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/api/products/${product.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "Akses ditolak. Pastikan kamu sudah login sebagai admin."
          );
        }

        throw new Error(
          result.message || "Gagal menghapus produk."
        );
      }

      if (editingId === product.id) {
        resetForm();
      }

      setNotice(`Produk "${product.name}" berhasil dihapus.`);
      await fetchProducts();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menghapus produk."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#171717]">
      <header className="bg-[#111111] text-[#f7f5f0]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <Link
              href="/"
              className="text-xs uppercase tracking-[0.3em] text-[#d9cbb5]"
            >
              NEXORA
            </Link>

            <h1 className="mt-2 text-xl font-semibold sm:text-2xl">
              Admin Dashboard
            </h1>
          </div>

          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/admin/products"
              className="rounded-full bg-[#e5d7c1] px-4 py-2 font-medium text-black"
            >
              Produk
            </Link>

            <Link
              href="/admin/orders"
              className="rounded-full border border-white/20 px-4 py-2 transition hover:bg-white/10"
            >
              Pesanan
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
              Product Management
            </p>

            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
              Manajemen Produk
            </h2>

            <p className="mt-2 text-sm text-neutral-600">
              Kelola katalog produk NEXORA melalui dashboard admin.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchProducts()}
            disabled={loading}
            className="rounded-full border border-black/15 bg-white px-4 py-2.5 text-sm transition hover:bg-neutral-100 disabled:opacity-50"
          >
            {loading ? "Memuat..." : "Muat Ulang"}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {notice}
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Total Produk</p>
            <p className="mt-3 text-3xl font-semibold">
              {products.length}
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Total Stok</p>
            <p className="mt-3 text-3xl font-semibold">
              {products.reduce((sum, product) => sum + product.stock, 0)}
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Stok Habis</p>
            <p className="mt-3 text-3xl font-semibold">
              {products.filter((product) => product.stock === 0).length}
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">
                {editingId !== null ? "Edit Produk" : "Tambah Produk"}
              </h3>

              <p className="mt-1 text-sm text-neutral-500">
                {editingId !== null
                  ? `Mengubah produk ID ${editingId}`
                  : "Lengkapi informasi produk baru."}
              </p>
            </div>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-neutral-600 underline underline-offset-4 hover:text-black"
              >
                Batal edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="product-name" className="mb-2 block text-sm font-medium">
                  Nama produk
                </label>

                <input
                  id="product-name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Essential Oversized Tee"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label htmlFor="product-category" className="mb-2 block text-sm font-medium">
                  Kategori
                </label>

                <input
                  id="product-category"
                  required
                  minLength={2}
                  maxLength={50}
                  value={form.category}
                  onChange={(event) => updateField("category", event.target.value)}
                  placeholder="T-Shirts"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label htmlFor="product-price" className="mb-2 block text-sm font-medium">
                  Harga (Rupiah)
                </label>

                <input
                  id="product-price"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={form.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  placeholder="189000"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label htmlFor="product-stock" className="mb-2 block text-sm font-medium">
                  Stok
                </label>

                <input
                  id="product-stock"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={form.stock}
                  onChange={(event) => updateField("stock", event.target.value)}
                  placeholder="20"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>
            </div>

            <div>
              <label htmlFor="product-image" className="mb-2 block text-sm font-medium">
                URL gambar
              </label>

              <input
                id="product-image"
                type="url"
                required
                value={form.image}
                onChange={(event) => updateField("image", event.target.value)}
                placeholder="https://example.com/product.jpg"
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-black"
              />

              <p className="mt-2 text-xs text-neutral-500">
                Gunakan URL gambar yang dapat diakses melalui HTTP atau HTTPS.
              </p>
            </div>

            <div>
              <label htmlFor="product-description" className="mb-2 block text-sm font-medium">
                Deskripsi
              </label>

              <textarea
                id="product-description"
                required
                minLength={5}
                maxLength={1000}
                rows={4}
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="Deskripsi produk..."
                className="w-full resize-y rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label htmlFor="product-colors" className="mb-2 block text-sm font-medium">
                Pilihan warna
              </label>

              <input
                id="product-colors"
                required
                value={form.colors}
                onChange={(event) => updateField("colors", event.target.value)}
                placeholder="Black, Cream, White"
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-black"
              />

              <p className="mt-2 text-xs text-neutral-500">
                Pisahkan setiap warna dengan koma, misalnya Black, Cream.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-black px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving
                ? "Menyimpan..."
                : editingId !== null
                  ? "Simpan Perubahan"
                  : "Tambah Produk"}
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="border-b border-black/5 p-5 sm:p-6">
            <h3 className="text-lg font-semibold">Katalog Produk</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Daftar produk yang tersimpan di database.
            </p>
          </div>

          {loading ? (
            <p className="p-10 text-center text-sm text-neutral-500">
              Memuat katalog produk...
            </p>
          ) : products.length === 0 ? (
            <p className="p-10 text-center text-sm text-neutral-500">
              Belum ada produk yang tersedia.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#f7f5f0] text-xs uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">Produk</th>
                    <th className="px-5 py-4 font-medium">Kategori</th>
                    <th className="px-5 py-4 font-medium">Harga</th>
                    <th className="px-5 py-4 font-medium">Stok</th>
                    <th className="px-5 py-4 font-medium">Warna</th>
                    <th className="px-5 py-4 font-medium">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-black/5">
                  {products.map((product) => (
                    <tr key={product.id} className="transition hover:bg-neutral-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            className="h-14 w-12 rounded-lg bg-neutral-100 object-cover"
                          />

                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="mt-1 text-xs text-neutral-500">
                              ID: {product.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">{product.category}</td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {formatRupiah(product.price)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            product.stock === 0
                              ? "font-medium text-red-600"
                              : "text-neutral-700"
                          }
                        >
                          {product.stock}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {product.colors.join(", ")}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => startEditing(product)}
                            className="font-medium underline underline-offset-4 hover:text-neutral-500"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(product)}
                            disabled={deletingId === product.id}
                            className="font-medium text-red-600 underline underline-offset-4 hover:text-red-800 disabled:opacity-50"
                          >
                            {deletingId === product.id ? "Menghapus..." : "Hapus"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link
            href="/admin/orders"
            className="text-neutral-600 underline underline-offset-4 hover:text-black"
          >
            Kelola pesanan
          </Link>

          <Link
            href="/"
            className="text-neutral-600 underline underline-offset-4 hover:text-black"
          >
            Kembali ke toko
          </Link>
        </footer>
      </div>
    </main>
  );
}
