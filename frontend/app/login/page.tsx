
'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { API_URL } from '@/lib/productApi'

type LoginResponse = {
  success: boolean
  message?: string
  data?: {
    id: number
    name: string
    email: string
    role: 'ADMIN' | 'USER'
  }
}

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get('registered') === '1') {
      setMessage('Registrasi berhasil. Silakan login.')
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!email.trim() || !password) {
      setError('Email dan password wajib diisi.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      })

      const result = (await response.json()) as LoginResponse

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || 'Login gagal.')
      }

      const params = new URLSearchParams(window.location.search)
      const next = params.get('next')

      const safeNext =
        next?.startsWith('/') && !next.startsWith('//')
          ? next
          : null

      if (safeNext) {
        router.replace(safeNext)
      } else if (result.data.role === 'ADMIN') {
        router.replace('/admin/products')
      } else {
        router.replace('/')
      }

      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat login.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f0e8] px-5 py-12 text-neutral-900">
      <section className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-bold tracking-[0.3em]">
          NEXORA
        </Link>

        <p className="mt-10 text-xs uppercase tracking-[0.25em] text-neutral-400">
          Welcome Back
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Login
        </h1>

        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Masuk ke akun kamu untuk melanjutkan pengalaman berbelanja.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
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
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          {message && (
            <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {message}
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-black px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {loading ? 'Memeriksa akun...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="font-medium text-black underline underline-offset-4"
          >
            Register
          </Link>
        </p>

        <Link
          href="/"
          className="mt-5 block text-center text-xs text-neutral-500 hover:text-black"
        >
          ← Kembali ke halaman utama
        </Link>
      </section>
    </main>
  )
}
