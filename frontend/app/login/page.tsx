
'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { API_URL } from '@/lib/productApi'

type RegisterResponse = {
  success: boolean
  message: string
}

function getSafeNextPath() {
  const params = new URLSearchParams(window.location.search)
  const next = params.get('next')

  if (next?.startsWith('/') && !next.startsWith('//')) {
    return next
  }

  return '/'
}

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak sama.')
      return
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      })

      const result: RegisterResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Registrasi gagal.')
      }

      const next = getSafeNextPath()
      const query = new URLSearchParams({
        next,
        registered: '1',
      })

      window.location.assign(`/login?${query.toString()}`)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Terjadi kesalahan.'
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
          Join NEXORA
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Buat akun pelanggan
        </h1>

        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Daftar untuk mulai memilih produk favoritmu.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Nama lengkap
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
              placeholder="Nama lengkap"
            />
          </div>

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
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
              placeholder="Minimal 8 karakter"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">
              Konfirmasi password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
              placeholder="Ulangi password"
            />
          </div>

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
            {loading ? 'Membuat akun...' : 'Daftar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Sudah punya akun?{' '}
          <Link
            href={`/login${typeof window !== 'undefined' && window.location.search ? window.location.search : ''}`}
            className="font-medium text-black underline underline-offset-4"
          >
            Login
          </Link>
        </p>
      </section>
    </main>
  )
}
