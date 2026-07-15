'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'
import { 
  Bike, 
  MessageCircle, 
  ClipboardList, 
  Compass, 
  ChevronRight, 
  Calendar,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  customer_name: string
  phone: string
  address_detail: string
  total_cost: number
  ongkir_fee: number
  status: string
  created_at: string
}

interface PromoSettings {
  promoType: 'text' | 'image'
  promoTitle?: string
  promoDesc?: string
}

export default function HomePage() {
  const { userName } = useUserStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [promo, setPromo] = useState<PromoSettings>({ promoType: 'image' })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Format currency
  const formatRp = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka)
  }

  // Get status color helper
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'Menunggu Penjemputan' }
      case 'diambil':
        return { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'OTW Penjemputan' }
      case 'dicuci':
        return { color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', label: 'Sedang Dicuci' }
      case 'diantar':
        return { color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', label: 'OTW Pengantaran' }
      case 'selesai':
        return { color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Selesai' }
      case 'dibatalkan':
        return { color: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Dibatalkan' }
      default:
        return { color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', label: status }
    }
  }

  useEffect(() => {
    if (!userName) return

    const fetchData = async () => {
      setLoading(true)
      
      // 1. Fetch settings (Promo Banner)
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'global')
        .single()

      if (settingsData && settingsData.value) {
        setPromo({
          promoType: settingsData.value.promoType || 'image',
          promoTitle: settingsData.value.promoTitle || '',
          promoDesc: settingsData.value.promoDesc || ''
        })
      }

      // 2. Fetch customer's orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_name', userName)
        .order('created_at', { ascending: false })

      if (ordersData) {
        setOrders(ordersData)
      }
      setLoading(false)
    }

    fetchData()

    // 3. Realtime subscriptions
    const settingsChannel = supabase.channel('settings_pub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'key=eq.global' }, (payload) => {
        if (payload.new) {
          const val = (payload.new as any).value
          setPromo({
            promoType: val.promoType || 'image',
            promoTitle: val.promoTitle || '',
            promoDesc: val.promoDesc || ''
          })
        }
      })
      .subscribe()

    const ordersChannel = supabase.channel('orders_pub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `customer_name=eq.${userName}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as Order, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o))
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(settingsChannel)
      supabase.removeChannel(ordersChannel)
    }
  }, [userName, supabase])

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* Promo Banner Container */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl transition-all duration-300">
        {promo.promoType === 'image' ? (
          <div 
            className="relative h-44 flex flex-col justify-end p-6 bg-cover bg-center text-white"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1552930294-6b595f4c2974?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')`
            }}
          >
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-er-yellow bg-er-yellow/10 border border-er-yellow/20 px-3 py-1 rounded-full w-max backdrop-blur-sm">
              <Compass className="h-3 w-3" /> Basecamp Kalibunder
            </div>
            <h2 className="text-2xl font-black leading-tight drop-shadow-md">Motor Bersih,<br /><span className="text-er-yellow">Hati Senang.</span></h2>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-er-dark to-gray-900 border border-gray-800 text-white p-6 relative overflow-hidden h-44 flex flex-col justify-between">
            <div>
              <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full tracking-wider uppercase mb-3 inline-block">
                PROMO HARI INI
              </span>
              <h2 className="text-2xl font-black text-er-yellow tracking-tight leading-tight">
                {promo.promoTitle || 'Diskon Kilat!'}
              </h2>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              {promo.promoDesc || 'Layanan antar-jemput cuci motor premium sekarang lebih murah.'}
            </p>
            <div className="absolute -bottom-6 -right-6 text-white opacity-5 rotate-12">
              <Bike className="h-28 w-28" />
            </div>
          </div>
        )}
      </div>

      {/* Social Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <a 
          href="https://wa.me/6283877724593" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 font-bold text-sm shadow-sm hover:bg-green-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <MessageCircle className="h-7 w-7" /> WhatsApp
        </a>
        <a 
          href="https://www.instagram.com/er_motowash?igsh=NTg4MTMxMnlpcTk1" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-500 font-bold text-sm shadow-sm hover:bg-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg> Instagram
        </a>
      </div>

      {/* Orders List Section */}
      <div className="flex flex-col gap-4">
        <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-er-yellow" /> Pesanan Saya
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-er-yellow border-t-transparent"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Memuat Pesanan...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl text-center p-6 gap-3">
            <div className="p-4 bg-gray-100 rounded-full text-gray-400 shadow-inner">
              <Bike className="h-10 w-10" />
            </div>
            <div>
              <p className="text-gray-700 font-bold text-sm">Belum ada riwayat pesanan</p>
              <p className="text-gray-400 text-xs mt-1">Tekan tab Pesan di bawah untuk membuat pesanan cuci motor pertama Anda!</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => {
              const statusInfo = getStatusDetails(order.status)
              const dateStr = new Date(order.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
              const timeStr = new Date(order.created_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
              })

              return (
                <div 
                  key={order.id} 
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-4 hover:border-gray-200 hover:shadow-md transition duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mb-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" /> {dateStr} • {timeStr}
                      </span>
                      <h4 className="font-black text-gray-900 text-xl tracking-tight">
                        {formatRp(order.total_cost)}
                      </h4>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 bg-gray-50/50 p-4 rounded-xl border border-gray-100/50 font-medium leading-relaxed">
                    <div className="flex items-start gap-1.5 mb-2">
                      <AlertCircle className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-gray-700">Rincian Lokasi:</span>
                        <p className="text-[11px] text-gray-500 italic mt-0.5 font-normal">&ldquo;{order.address_detail}&rdquo;</p>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold text-[11px]">
                      <span className="text-gray-400">Cuci + Ongkir</span>
                      <span className="text-gray-700">
                        {formatRp(15000)} + {order.ongkir_fee === 0 ? 'Gratis' : formatRp(order.ongkir_fee)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
