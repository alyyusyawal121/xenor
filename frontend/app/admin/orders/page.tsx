"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/productApi";

type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  selectedColor: string;
};

type Customer = {
  id: number;
  name: string;
  email: string;
};

type Order = {
  id: number;
  userId: number;
  total: number;
  status: OrderStatus;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
  user: Customer;
  items: OrderItem[];
};

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Menunggu",
  PAID: "Dibayar",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function statusClass(status: OrderStatus) {
  const classes: Record<OrderStatus, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    PAID: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-violet-100 text-violet-800",
    SHIPPED: "bg-indigo-100 text-indigo-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return classes[status];
}

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(
    null
  );
  const [notice, setNotice] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/orders/admin`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (response.status === 403) {
        setError("Akses ditolak. Halaman ini hanya untuk admin.");
        return;
      }

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message || "Gagal mengambil daftar pesanan."
        );
      }

      setOrders(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil pesanan."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    if (filter === "ALL") {
      return orders;
    }

    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  const totalRevenue = useMemo(
    () =>
      orders.reduce((sum, order) => {
        if (order.status === "CANCELLED") {
          return sum;
        }

        return sum + order.total;
      }, 0),
    [orders]
  );

  async function updateStatus(orderId: number, status: OrderStatus) {
    const currentOrder = orders.find((order) => order.id === orderId);

    if (!currentOrder || currentOrder.status === status) {
      return;
    }

    setUpdatingOrderId(orderId);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/api/orders/admin/${orderId}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message || "Gagal memperbarui status pesanan."
        );
      }

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.id === orderId ? result.data : order
        )
      );

      setNotice(`Status pesanan #${orderId} berhasil diperbarui.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memperbarui status."
      );

      await fetchOrders();
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#171717]">
      <header className="border-b border-black/10 bg-[#111111] text-[#f7f5f0]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <Link
              href="/"
              className="text-xs font-medium uppercase tracking-[0.3em] text-[#d9cbb5]"
            >
              NEXORA
            </Link>
            <h1 className="mt-2 text-xl font-semibold sm:text-2xl">
              Admin Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/20 px-3 py-1.5 text-xs">
              Manajemen Pesanan
            </span>
            <button
              type="button"
              onClick={() => void fetchOrders()}
              disabled={loading}
              className="rounded-full bg-[#e5d7c1] px-4 py-2 text-sm font-medium text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Memuat..." : "Muat Ulang"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
            Overview
          </p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Daftar Pesanan
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Pantau transaksi, periksa detail pelanggan, dan perbarui
            status pesanan dari satu tempat.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {notice}
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Total Pesanan</p>
            <p className="mt-3 text-3xl font-semibold">
              {orders.length}
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              Semua status pesanan
            </p>
          </article>

          <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Menunggu Diproses</p>
            <p className="mt-3 text-3xl font-semibold">
              {orders.filter((order) => order.status === "PENDING").length}
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              Pesanan berstatus PENDING
            </p>
          </article>

          <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
            <p className="text-sm text-neutral-500">
              Nilai Pesanan Aktif
            </p>
            <p className="mt-3 break-words text-2xl font-semibold">
              {formatRupiah(totalRevenue)}
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              Tidak termasuk pesanan dibatalkan; bukan pendapatan terverifikasi
            </p>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-black/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h3 className="text-lg font-semibold">Semua Transaksi</h3>
              <p className="mt-1 text-sm text-neutral-500">
                {filteredOrders.length} pesanan ditampilkan
              </p>
            </div>

            <label className="flex items-center gap-3 text-sm">
              <span className="text-neutral-600">Filter status</span>
              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as "ALL" | OrderStatus)
                }
                className="max-w-full rounded-xl border border-black/10 bg-[#faf9f6] px-3 py-2.5 outline-none focus:border-black"
              >
                <option value="ALL">Semua Status</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-neutral-500">
              Memuat daftar pesanan...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium">Belum ada pesanan</p>
              <p className="mt-2 text-sm text-neutral-500">
                Coba pilih filter status lainnya.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {filteredOrders.map((order) => (
                <article key={order.id} className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-base font-semibold">
                          Pesanan #{order.id}
                        </h4>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(order.status)}`}
                        >
                          {STATUS_LABELS[order.status]}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-neutral-500">
                        Dibuat {formatDate(order.createdAt)}
                      </p>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-neutral-500">
                            Pelanggan
                          </p>
                          <p className="mt-1 font-medium">
                            {order.user?.name || "Nama tidak tersedia"}
                          </p>
                          <p className="break-all text-sm text-neutral-600">
                            {order.user?.email || "Email tidak tersedia"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wider text-neutral-500">
                            Alamat Pengiriman
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                            {order.shippingAddress}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-black/5 pt-4">
                        <p className="mb-3 text-xs uppercase tracking-wider text-neutral-500">
                          Item Pesanan
                        </p>

                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {item.productName}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  Warna: {item.selectedColor} · Jumlah:{" "}
                                  {item.quantity}
                                </p>
                              </div>

                              <p className="text-sm text-neutral-700">
                                {formatRupiah(item.price * item.quantity)}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-4">
                          <span className="text-sm text-neutral-500">
                            Total pesanan
                          </span>
                          <span className="text-lg font-semibold">
                            {formatRupiah(order.total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full rounded-xl bg-[#f7f5f0] p-4 lg:w-64 lg:shrink-0">
                      <label
                        htmlFor={`status-${order.id}`}
                        className="text-xs font-medium uppercase tracking-wider text-neutral-600"
                      >
                        Ubah Status
                      </label>

                      <select
                        id={`status-${order.id}`}
                        value={order.status}
                        disabled={updatingOrderId === order.id}
                        onChange={(event) =>
                          void updateStatus(
                            order.id,
                            event.target.value as OrderStatus
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none transition focus:border-black disabled:cursor-wait disabled:opacity-60"
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>

                      {updatingOrderId === order.id && (
                        <p className="mt-2 text-xs text-neutral-500">
                          Menyimpan perubahan...
                        </p>
                      )}

                      <p className="mt-3 text-xs leading-5 text-neutral-500">
                        Pastikan status sesuai dengan kondisi pesanan
                        sebenarnya.
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link
            href="/admin/login"
            className="text-neutral-600 underline underline-offset-4 transition hover:text-black"
          >
            Halaman login admin
          </Link>
          <Link
            href="/"
            className="text-neutral-600 underline underline-offset-4 transition hover:text-black"
          >
            Kembali ke toko
          </Link>
        </div>
      </div>
    </main>
  );
}
