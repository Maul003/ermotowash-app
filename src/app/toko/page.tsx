'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Store, 
  Sparkles, 
  MessageCircle, 
  Loader2,
  PackageCheck
} from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  description: string
  image_url?: string
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
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

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) {
        setProducts(data)
      }
      setLoading(false)
    }

    fetchProducts()

    // Realtime product updates
    const channel = supabase.channel('products_shop')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProducts(prev => [payload.new as Product, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new as Product : p))
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const getWaLink = (product: Product) => {
    const message = `Halo ER Motowash, saya ingin membeli produk ini:\n\n*${product.name}*\nHarga: ${formatRp(product.price)}\n\nApakah stoknya masih ada?`
    return `https://wa.me/6283877724593?text=${encodeURIComponent(message)}`
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-gray-800 flex items-center gap-2 mb-1">
          <Store className="h-6 w-6 text-er-yellow" /> Toko Perawatan
        </h2>
        <p className="text-xs text-gray-500 font-medium leading-relaxed">
          Koleksi produk perawatan motor berkualitas tinggi untuk menjaga kilau motor kesayangan Anda.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-er-yellow" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Memuat Katalog...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl text-center p-6 gap-3">
          <div className="p-4 bg-gray-100 rounded-full text-gray-400 shadow-inner">
            <PackageCheck className="h-10 w-10" />
          </div>
          <div>
            <p className="text-gray-700 font-bold text-sm">Toko sedang kosong</p>
            <p className="text-gray-400 text-xs mt-1">Kami akan segera menambahkan produk perawatan premium baru.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="bg-white border border-gray-150 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-gray-200 transition duration-300"
            >
              <div>
                {/* Product image placeholder with premium gradient */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-150 h-32 rounded-xl flex items-center justify-center mb-3 border border-gray-100 shadow-inner">
                  <Sparkles className="h-10 w-10 text-gray-300 drop-shadow-sm" />
                </div>
                <h3 className="font-black text-gray-800 text-sm leading-snug mb-1 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed line-clamp-2 h-7 mb-2">
                  {product.description || 'Tidak ada deskripsi produk.'}
                </p>
                <p className="font-black text-er-yellow text-base tracking-tight mb-3">
                  {formatRp(product.price)}
                </p>
              </div>

              <a 
                href={getWaLink(product)}
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full h-11 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[11px] font-black shadow-sm flex items-center justify-center gap-1.5 transition active:scale-[0.97]"
              >
                <MessageCircle className="h-4 w-4" /> Beli via WA
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
