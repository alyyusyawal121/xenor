
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { API_URL } from '@/lib/productApi'

type User = {
  id: number
  name: string
  email: string
  role: 'ADMIN' | 'USER'
}

type SessionResponse = {
  success: boolean
  data?: User
  message?: string
}

export default function ProfilePage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  // Memastikan halaman profil hanya dapat dibuka oleh pengguna yang login.
  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })

        if (response.status === 401) {
          router.replace('/login?next=%2Fprofile')
          return
        }

        const result: SessionResponse = await response.json()

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || 'Gagal mengambil data profil.'
          )
        }

        if (isMounted) {
          setUser(result.data)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Terjadi kesalahan saat mengambil profil.'
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [router])

  // Menampilkan inisial nama sebagai avatar sementara.
  const avatarInitial = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : 'U'

  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f6] text-neutral-900">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 md:py-16">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
            My Account
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Profile Settings
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
            Lihat informasi akun yang digunakan untuk berbelanja di NEXORA.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8">
            <p className="animate-pulse text-sm text-neutral-500">
              Memuat informasi profil...
            </p>
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-white p-6">
            <p role="alert" className="text-sm text-red-600">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Coba Lagi
            </button>
          </div>
        ) : user ? (
          <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <div className="flex flex-col gap-5 border-b border-neutral-100 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-[#eee7dc] text-2xl font-semibold">
                {avatarInitial}
              </div>

              <div className="min-w-0">
                <h2 className="break-words text-xl font-semibold">
                  {user.name}
                </h2>

                <p className="mt-1 break-all text-sm text-neutral-500">
                  {user.email}
                </p>

                <span className="mt-3 inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                  {user.role === 'ADMIN'
                    ? 'Administrator'
                    : 'Customer'}
                </span>
              </div>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <div>
                <h3 className="text-sm font-semibold">
                  Informasi Akun
                </h3>

                <p className="mt-1 text-sm leading-6 text-neutral-500">
                  Berikut informasi akun yang terdaftar pada sistem.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-neutral-500">Nama lengkap</p>
                  <p className="mt-2 break-words text-sm font-medium">
                    {user.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-neutral-500">Email</p>
                  <p className="mt-2 break-all text-sm font-medium">
                    {user.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-neutral-500">ID Pengguna</p>
                  <p className="mt-2 text-sm font-medium">{user.id}</p>
                </div>

                <div>
                  <p className="text-xs text-neutral-500">Jenis Akun</p>
                  <p className="mt-2 text-sm font-medium">
                    {user.role === 'ADMIN'
                      ? 'Administrator'
                      : 'Customer'}
                  </p>
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-6">
                <p className="text-xs leading-5 text-neutral-500">
                  Saat ini informasi profil masih bersifat baca-saja.
                  Fitur mengubah nama, email, password, dan mengunggah foto
                  profil dapat ditambahkan setelah endpoint pengaturan akun
                  tersedia di backend.
                </p>

                <Link
                  href="/products"
                  className="mt-5 inline-flex rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  Kembali Belanja
                </Link>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  )
}
