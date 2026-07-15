'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'
import { 
  MapPin, 
  Phone, 
  FileText, 
  Info, 
  Send,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// Load MapComponent dynamically to prevent SSR window errors
const MapComponent = dynamic(
  () => import('@/components/shared/MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-gray-100 flex items-center justify-center rounded-2xl border border-gray-200">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-semibold">Memuat Peta...</span>
        </div>
      </div>
    )
  }
)

export default function OrderPage() {
  const router = useRouter()
  const { userName } = useUserStore()
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 })
  const [distance, setDistance] = useState(0)
  const [pricePer100m, setPricePer100m] = useState(500) // Default
  const [phone, setPhone] = useState('')
  const [addressDetail, setAddressDetail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const BASE_BIAYA_CUCI = 15000

  // Calculate Shipping Cost
  const ongkir = distance <= 0.5 
    ? 0 
    : Math.ceil(((distance - 0.5) * 1000) / 100) * pricePer100m

  const totalCost = BASE_BIAYA_CUCI + ongkir

  // Fetch settings from database
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'global')
        .single()
      
      if (data && data.value) {
        setPricePer100m(data.value.pricePer100m || 500)
      }
    }
    fetchSettings()
  }, [supabase])

  const handleLocationChange = (lat: number, lng: number, distanceKm: number) => {
    setCoords({ lat, lng })
    setDistance(distanceKm)
  }

  const formatRp = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka)
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userName) return
    if (!phone.trim()) {
      alert('Nomor WhatsApp wajib diisi!')
      return
    }
    if (!addressDetail.trim()) {
      alert('Detail alamat penjemputan wajib diisi!')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          customer_name: userName,
          phone: phone.trim(),
          address_detail: addressDetail.trim(),
          latitude: coords.lat,
          longitude: coords.lng,
          distance_km: distance,
          ongkir_fee: ongkir,
          wash_cost: BASE_BIAYA_CUCI,
          total_cost: totalCost,
          status: 'pending'
        })

      if (error) throw error

      alert('Mantap! Pesanan cuci motor Anda berhasil dikirim ke Admin.')
      router.push('/')
    } catch (err: any) {
      alert('Gagal mengirim pesanan: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-gray-800 flex items-center gap-2 mb-1">
          <MapPin className="h-6 w-6 text-er-yellow" /> Lokasi Jemput
        </h2>
        <p className="text-xs text-gray-500 font-medium leading-relaxed">
          Posisikan pin lokasi secara akurat untuk memudahkan kurir menjemput motor Anda.
        </p>
      </div>

      {/* Map Container */}
      <div className="h-56 min-h-[14rem] w-full rounded-2xl overflow-hidden shadow-inner border border-gray-200">
        <MapComponent onLocationChange={handleLocationChange} />
      </div>

      {/* Notification banner */}
      <div className="flex gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-[11px] font-medium leading-relaxed">
        <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p>
          Geser pin atau <b>sentuh area peta</b> untuk memindahkan titik jemput. Jarak di bawah 500m tidak dikenakan biaya pengiriman.
        </p>
      </div>

      {/* Stats details */}
      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-150 shadow-sm">
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Jarak dari Steam</span>
          <span className="text-lg font-black text-gray-800">{distance.toFixed(2)} km</span>
        </div>
        <div className="border-l border-gray-200 pl-4 text-right">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Ongkir Jemput</span>
          <span className={`text-lg font-black ${ongkir === 0 ? 'text-green-600' : 'text-gray-800'}`}>
            {ongkir === 0 ? 'Gratis' : formatRp(ongkir)}
          </span>
        </div>
      </div>

      {/* Form Details */}
      <form onSubmit={handleOrderSubmit} className="space-y-4">
        <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-150">
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
            <Input 
              type="tel" 
              placeholder="Nomor WhatsApp Aktif" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-11 h-12 bg-white border-gray-200 rounded-xl font-bold text-sm"
              required
            />
          </div>
          <div className="relative">
            <FileText className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
            <Textarea 
              rows={3}
              placeholder="Detail Alamat (Contoh: Patokan depan masjid baiturrahman, motor NMAX hitam plat F 1234 XY)" 
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
              className="pl-11 bg-white border-gray-200 rounded-xl font-medium text-sm pt-3"
              required
            />
          </div>
        </div>

        {/* Invoice breakdown */}
        <div className="border-2 border-dashed border-gray-200 p-5 rounded-2xl bg-white space-y-3 shadow-inner">
          <div className="flex justify-between text-xs font-semibold text-gray-500">
            <span>Biaya Cuci Motor</span>
            <span>{formatRp(BASE_BIAYA_CUCI)}</span>
          </div>
          <div className="flex justify-between text-xs font-semibold text-gray-500">
            <span>Ongkos Antar-Jemput</span>
            <span>{ongkir === 0 ? 'Gratis' : formatRp(ongkir)}</span>
          </div>
          <div className="border-t border-gray-150 pt-3 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-800">Total Pembayaran</span>
            <span className="text-xl font-black text-green-600">{formatRp(totalCost)}</span>
          </div>
        </div>

        {/* Submit button */}
        <Button 
          type="submit"
          disabled={submitting}
          className="w-full h-14 bg-er-dark hover:bg-black text-er-yellow font-black text-lg rounded-2xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Memproses Pesanan...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Konfirmasi Pesanan
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
