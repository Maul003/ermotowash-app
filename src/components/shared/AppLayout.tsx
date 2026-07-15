'use client'

import React, { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUserStore } from '@/store/useUserStore'
import { 
  Home, 
  MapPin, 
  Store, 
  MessageSquare, 
  LogOut, 
  Bike,
  Sparkles,
  Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { userName, setUserName, logout } = useUserStore()
  const [mounted, setMounted] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const logoClickCount = useRef(0)
  const logoTimer = useRef<NodeJS.Timeout | null>(null)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-er-dark text-white">
        <div className="flex flex-col items-center gap-3">
          <Bike className="h-12 w-12 animate-bounce text-er-yellow" />
          <span className="text-sm font-bold tracking-widest text-gray-400 uppercase">Memuat...</span>
        </div>
      </div>
    )
  }

  // If it is an admin page, we do not wrap it with customer layouts or login checks
  const isAdminPage = pathname.startsWith('/admin')
  if (isAdminPage) {
    return <div className="min-h-screen bg-gray-100">{children}</div>
  }

  // Customer Login Check
  if (!userName) {
    const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (nameInput.trim().length >= 3) {
        setUserName(nameInput.trim())
      } else {
        alert('Nama minimal 3 huruf!')
      }
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-er-dark to-gray-900 px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-gray-800 bg-black/40 p-8 shadow-2xl backdrop-blur-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-er-yellow/10 text-er-yellow shadow-inner">
            <Sparkles className="h-10 w-10 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white mb-2">ER <span className="text-er-yellow">Motowash</span></h2>
          <p className="text-sm text-gray-400 mb-8 font-medium">Layanan cuci motor antar-jemput premium on-demand</p>
          
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <input 
              type="text" 
              placeholder="Nama Panggilan Anda" 
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full h-14 border-2 border-gray-800 bg-gray-950 text-center font-bold text-lg text-white rounded-2xl focus:border-er-yellow focus:ring-0 focus:outline-none transition-all placeholder:text-gray-600 px-4"
            />
            <Button 
              type="submit"
              className="w-full h-14 bg-er-yellow hover:bg-yellow-500 text-er-dark font-black text-lg rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              Masuk Aplikasi
            </Button>
          </form>

          {/* Hidden Admin Shortcut */}
          <button 
            type="button"
            onClick={() => {
              logoClickCount.current++
              if (logoTimer.current) clearTimeout(logoTimer.current)
              logoTimer.current = setTimeout(() => {
                logoClickCount.current = 0
              }, 2000)

              if (logoClickCount.current >= 5) {
                router.push('/admin/login')
                logoClickCount.current = 0
              }
            }}
            className="mt-8 text-xs text-gray-700 hover:text-gray-600 transition flex items-center justify-center gap-1 mx-auto"
          >
            <Lock className="h-3 w-3" /> Area Khusus
          </button>
        </div>
      </div>
    )
  }

  // Handle Logo Clicks for Admin Panel Access
  const handleLogoClick = () => {
    logoClickCount.current++
    if (logoTimer.current) clearTimeout(logoTimer.current)
    logoTimer.current = setTimeout(() => {
      logoClickCount.current = 0
    }, 2000)

    if (logoClickCount.current >= 5) {
      router.push('/admin/login')
      logoClickCount.current = 0
    }
  }

  // Customer Layout
  return (
    <div className="flex min-h-screen flex-col bg-gray-100 font-sans text-gray-900 antialiased">
      {/* HEADER */}
      <header className="sticky top-0 z-50 flex-shrink-0 border-b border-gray-800 bg-er-dark text-white shadow-md">
        <div className="mx-auto flex max-w-md justify-between items-center px-6 py-4">
          <div 
            onClick={handleLogoClick}
            className="flex items-center gap-2 cursor-pointer active:opacity-80 select-none"
          >
            <Bike className="h-6 w-6 text-er-yellow" />
            <h1 className="text-xl font-bold tracking-wide">ER <span className="text-er-yellow">Motowash</span></h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-300">
            <span>Halo, <b className="text-er-yellow font-black">{userName}</b></span>
            <button 
              onClick={() => logout()}
              title="Logout"
              className="text-gray-500 hover:text-red-400 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 overflow-y-auto max-w-md mx-auto w-full bg-white pb-24 shadow-xl min-h-[calc(100vh-120px)] relative">
        {children}
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/90 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] backdrop-blur-md pb-safe">
        <div className="mx-auto flex max-w-md justify-around">
          <button 
            onClick={() => router.push('/')}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-center transition ${pathname === '/' ? 'text-er-dark font-black' : 'text-gray-400 hover:text-er-dark'}`}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] tracking-wide">Beranda</span>
          </button>
          <button 
            onClick={() => router.push('/pesanan')}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-center transition ${pathname === '/pesanan' ? 'text-er-dark font-black' : 'text-gray-400 hover:text-er-dark'}`}
          >
            <MapPin className="h-5 w-5" />
            <span className="text-[10px] tracking-wide">Pesan</span>
          </button>
          <button 
            onClick={() => router.push('/toko')}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-center transition ${pathname === '/toko' ? 'text-er-dark font-black' : 'text-gray-400 hover:text-er-dark'}`}
          >
            <Store className="h-5 w-5" />
            <span className="text-[10px] tracking-wide">Toko</span>
          </button>
          <button 
            onClick={() => router.push('/chat')}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-center transition ${pathname === '/chat' ? 'text-er-dark font-black' : 'text-gray-400 hover:text-er-dark'}`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[10px] tracking-wide">Chat</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
