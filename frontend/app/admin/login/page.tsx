
'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { API_URL } from '@/lib/productApi'

type LoginResponse = {
  success: boolean
  message: string
  data?: {
    id: number
    name: string
    email: string
    role: 'ADMIN' | 'USER'
  }
}

export default function AdminLoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      })

      const result: LoginResponse = await response.json()

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || 'Login gagal.')
      }

      if (result.data.role !== 'ADMIN') {
        // Jangan biarkan sesi pengguna biasa tetap aktif.
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        })

        throw new Error(
          'Akun ini bukan admin. Silakan gunakan akun admin.'
        )
      }

      router.replace('/admin/products')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat login.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f0e8] px-5 py-12 text-neutral-900">
      <section className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm sm:p-10">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.35em] text-neutral-500 transition hover:text-black"
        >
          NEXORA
        </Link>

        <p className="mt-10 text-xs uppercase tracking-[0.25em] text-neutral-400">
          Administration
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Admin Login
        </h1>

        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Masuk menggunakan akun admin untuk mengelola produk toko.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              Email admin
            </label>

            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-black px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Memeriksa akun...' : 'Masuk sebagai Admin'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs leading-5 text-neutral-400">
          Halaman khusus pengelola NEXORA.
          <br />
          <Link href="/" className="underline underline-offset-4 hover:text-black">
            Kembali ke toko
          </Link>
        </p>
      </section>
    </main>
  )
}
