'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Lock, 
  Mail, 
  Key, 
  Loader2, 
  ArrowLeft,
  ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (error) throw error

      // Force a routing refresh so the middleware sees the updated session
      router.refresh()
      router.push('/admin')
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal. Periksa kembali email dan password Anda.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-er-dark to-gray-950 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-gray-800 bg-black/40 p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        
        {/* Back Button */}
        <button 
          onClick={() => router.push('/')}
          className="absolute top-6 left-6 text-gray-500 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div className="text-center mt-6 mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 shadow-inner">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mb-1">Akses Admin</h2>
          <p className="text-xs text-gray-500 font-medium">Masuk untuk mengelola pesanan, toko, dan obrolan CS.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-600" />
              <Input 
                type="email" 
                placeholder="Email Admin" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-12 border-gray-800 bg-gray-950 text-white rounded-xl text-sm placeholder:text-gray-600 focus:border-red-500 focus:ring-0 focus:outline-none transition-all"
                required
              />
            </div>
            <div className="relative">
              <Key className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-600" />
              <Input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 h-12 border-gray-800 bg-gray-950 text-white rounded-xl text-sm placeholder:text-gray-600 focus:border-red-500 focus:ring-0 focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          <Button 
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengautentikasi...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Masuk Sistem
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">
            ER Motowash Production System
          </span>
        </div>
      </div>
    </div>
  )
}
