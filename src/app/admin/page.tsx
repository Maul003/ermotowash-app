'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ShieldAlert, 
  Settings, 
  Bell, 
  Package, 
  MessageSquare, 
  TrendingUp, 
  LogOut, 
  MapPin, 
  Phone, 
  DollarSign, 
  Plus, 
  Trash2, 
  Send,
  Loader2,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Headset
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts'

interface Order {
  id: string
  customer_name: string
  phone: string
  address_detail: string
  latitude: number
  longitude: number
  distance_km: number
  ongkir_fee: number
  wash_cost: number
  total_cost: number
  status: 'pending' | 'diambil' | 'dicuci' | 'diantar' | 'selesai' | 'dibatalkan'
  created_at: string
}

interface Product {
  id: string
  name: string
  price: number
  description: string
}

interface ChatMessage {
  id: string
  room: string
  sender: 'customer' | 'Admin'
  text: string
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'chat' | 'settings'>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [chats, setChats] = useState<ChatMessage[]>([])
  
  // Settings Form States
  const [pricePer100m, setPricePer100m] = useState(500)
  const [promoType, setPromoType] = useState<'text' | 'image'>('image')
  const [promoTitle, setPromoTitle] = useState('')
  const [promoDesc, setPromoDesc] = useState('')
  
  // Product Form States
  const [prodName, setProdName] = useState('')
  const [prodPrice, setProdPrice] = useState('')
  const [prodDesc, setProdDesc] = useState('')
  
  // Centralized CS Chat States
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [adminChatInput, setAdminChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Format currency helper
  const formatRp = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka)
  }

  // Scroll to bottom helper
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/admin/login')
      }
    }
    checkUser()
  }, [router, supabase])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Fetch settings
      const { data: setSnap } = await supabase.from('settings').select('*').eq('key', 'global').single()
      if (setSnap && setSnap.value) {
        setPricePer100m(setSnap.value.pricePer100m || 500)
        setPromoType(setSnap.value.promoType || 'image')
        setPromoTitle(setSnap.value.promoTitle || '')
        setPromoDesc(setSnap.value.promoDesc || '')
      }

      // Fetch orders
      const { data: ordSnap } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      if (ordSnap) setOrders(ordSnap as Order[])

      // Fetch products
      const { data: prodSnap } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (prodSnap) setProducts(prodSnap as Product[])

      // Fetch chats
      const { data: chatSnap } = await supabase.from('chats').select('*').order('created_at', { ascending: true })
      if (chatSnap) setChats(chatSnap as ChatMessage[])

      setLoading(false)
    }

    fetchData()

    // Subscriptions for updates
    const ordersSub = supabase.channel('admin_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as Order, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o))
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id))
        }
      }).subscribe()

    const productsSub = supabase.channel('admin_products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProducts(prev => [payload.new as Product, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new as Product : p))
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id))
        }
      }).subscribe()

    const chatsSub = supabase.channel('admin_chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setChats(prev => [...prev, payload.new as ChatMessage])
          setTimeout(scrollToBottom, 50)
        }
      }).subscribe()

    return () => {
      supabase.removeChannel(ordersSub)
      supabase.removeChannel(productsSub)
      supabase.removeChannel(chatsSub)
    }
  }, [supabase])

  useEffect(() => {
    if (activeRoom) {
      setTimeout(scrollToBottom, 100)
    }
  }, [activeRoom, chats])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/admin/login')
  }

  // Update Settings
  const handleSaveSettings = async () => {
    const payload = {
      pricePer100m,
      promoType,
      promoTitle,
      promoDesc
    }
    const { error } = await supabase.from('settings').upsert({ key: 'global', value: payload })
    if (error) {
      alert('Gagal menyimpan pengaturan: ' + error.message)
    } else {
      alert('Pengaturan berhasil disimpan!')
    }
  }

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    if (status === 'selesai' && !confirm('Selesaikan pesanan ini? Status pesanan akan diubah menjadi Selesai.')) {
      return
    }

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) {
      alert('Gagal mengupdate status: ' + error.message)
    }
  }

  // Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('Hapus pesanan ini secara permanen dari sistem?')) {
      const { error } = await supabase.from('orders').delete().eq('id', orderId)
      if (error) alert('Gagal menghapus pesanan: ' + error.message)
    }
  }

  // Add Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prodName.trim() || !prodPrice.trim()) {
      alert('Nama dan Harga produk wajib diisi!')
      return
    }

    const price = parseInt(prodPrice)
    if (isNaN(price)) {
      alert('Harga harus berupa angka!')
      return
    }

    const { error } = await supabase.from('products').insert({
      name: prodName.trim(),
      price,
      description: prodDesc.trim()
    })

    if (error) {
      alert('Gagal menambahkan produk: ' + error.message)
    } else {
      setProdName('')
      setProdPrice('')
      setProdDesc('')
      alert('Produk berhasil ditambahkan ke etalase!')
    }
  }

  // Delete Product
  const handleDeleteProduct = async (prodId: string) => {
    if (confirm('Hapus produk ini dari etalase toko?')) {
      const { error } = await supabase.from('products').delete().eq('id', prodId)
      if (error) alert('Gagal menghapus produk: ' + error.message)
    }
  }

  // Send CS message
  const handleSendCSMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminChatInput.trim() || !activeRoom) return

    const messageText = adminChatInput.trim()
    setAdminChatInput('')

    const { error } = await supabase.from('chats').insert({
      room: activeRoom,
      sender: 'Admin',
      text: messageText
    })

    if (error) {
      alert('Gagal mengirim pesan: ' + error.message)
    }
  }

  // Group chats by room name
  const chatRooms = Array.from(new Set(chats.map(c => c.room)))
  const roomMessages = chats.filter(c => c.room === activeRoom)

  // Math stats for dashboard
  const activeOrdersCount = orders.filter(o => o.status !== 'selesai' && o.status !== 'dibatalkan').length
  const completedOrdersCount = orders.filter(o => o.status === 'selesai').length
  const totalRevenue = orders
    .filter(o => o.status === 'selesai')
    .reduce((sum, o) => sum + o.total_cost, 0)

  // Chart Mock Data based on active orders + some default data for visual look
  const chartData = [
    { name: 'Sen', Pesanan: 4, Omset: 60000 },
    { name: 'Sel', Pesanan: completedOrdersCount > 0 ? completedOrdersCount + 1 : 2, Omset: completedOrdersCount > 0 ? totalRevenue + 30000 : 30000 },
    { name: 'Rab', Pesanan: 5, Omset: 80000 },
    { name: 'Kam', Pesanan: 3, Omset: 45000 },
    { name: 'Jum', Pesanan: 7, Omset: 105000 },
    { name: 'Sab', Pesanan: 12, Omset: 210000 },
    { name: 'Min', Pesanan: 15, Omset: 285000 }
  ]

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-150">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Memuat Dashboard Admin...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans text-gray-900">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-er-dark text-white flex flex-col justify-between flex-shrink-0 shadow-lg">
        <div className="flex flex-col">
          {/* Brand */}
          <div className="p-6 border-b border-gray-800 flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            <h1 className="text-lg font-black tracking-wide">ER <span className="text-er-yellow">Console</span></h1>
          </div>
          
          {/* Nav List */}
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'orders' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}
            >
              <Bell className="h-4 w-4" /> Pesanan Masuk
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'products' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}
            >
              <Package className="h-4 w-4" /> Kelola Toko
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'chat' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}
            >
              <MessageSquare className="h-4 w-4" /> Chat CS
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'settings' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}
            >
              <Settings className="h-4 w-4" /> Pengaturan
            </button>
          </nav>
        </div>

        {/* User Info & Signout */}
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-red-950 text-gray-400 hover:text-white px-4 py-3 rounded-xl text-xs font-bold transition"
          >
            <LogOut className="h-4 w-4" /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* TOP BAR */}
        <header className="bg-white border-b border-gray-200 py-4 px-8 flex justify-between items-center shadow-sm">
          <h2 className="text-xl font-black uppercase tracking-tight text-gray-800">
            {activeTab === 'orders' && 'Manajemen Pesanan'}
            {activeTab === 'products' && 'Katalog Toko E-Commerce'}
            {activeTab === 'chat' && 'Live Chat CS Room'}
            {activeTab === 'settings' && 'Konfigurasi Layanan'}
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Koneksi Supabase Realtime</span>
          </div>
        </header>

        {/* CONTAINER */}
        <div className="p-8 max-w-6xl w-full mx-auto space-y-8">
          
          {/* STATS OVERVIEW CARDS (Visible everywhere) */}
          <div className="grid grid-cols-3 gap-6">
            <Card className="shadow-sm border-gray-150">
              <CardContent className="pt-6 flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pesanan Aktif</span>
                  <p className="text-3xl font-black text-gray-800">{activeOrdersCount}</p>
                </div>
                <div className="p-3 bg-yellow-500/10 text-yellow-600 rounded-xl">
                  <Bell className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-150">
              <CardContent className="pt-6 flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cuci Selesai</span>
                  <p className="text-3xl font-black text-gray-800">{completedOrdersCount}</p>
                </div>
                <div className="p-3 bg-green-500/10 text-green-600 rounded-xl">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-150">
              <CardContent className="pt-6 flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Omset Selesai</span>
                  <p className="text-3xl font-black text-green-600">{formatRp(totalRevenue)}</p>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                  <DollarSign className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TAB CONTENT: ORDERS */}
          {activeTab === 'orders' && (
            <div className="grid grid-cols-3 gap-8">
              {/* Orders List */}
              <div className="col-span-2 space-y-4">
                <h3 className="text-lg font-black text-gray-800 mb-2">Daftar Pesanan Cuci</h3>
                
                {orders.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400 font-medium">
                    Belum ada pesanan masuk.
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-800 text-base">{order.customer_name}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <a href={`https://wa.me/${order.phone}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-green-600 hover:underline flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" /> {order.phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-3">
                          <select 
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded-xl px-3 py-1.5 font-bold text-gray-700 bg-white cursor-pointer focus:border-red-500 focus:outline-none"
                          >
                            <option value="pending">Menunggu Penjemputan</option>
                            <option value="diambil">OTW Penjemputan</option>
                            <option value="dicuci">Sedang Dicuci</option>
                            <option value="diantar">OTW Pengantaran</option>
                            <option value="selesai">Selesai</option>
                            <option value="dibatalkan">Dibatalkan</option>
                          </select>
                          <button onClick={() => handleDeleteOrder(order.id)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-medium text-gray-600">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col gap-1">
                          <span className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">Detail Alamat</span>
                          <span className="line-clamp-2 italic text-gray-700">&ldquo;{order.address_detail}&rdquo;</span>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="mt-2 text-blue-600 hover:underline flex items-center gap-1 font-bold text-[10px]"
                          >
                            <ExternalLink className="h-3 w-3" /> Buka Peta Google Maps
                          </a>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col justify-between">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Jarak</span>
                            <span className="font-bold text-gray-800">{order.distance_km.toFixed(2)} km</span>
                          </div>
                          <div className="flex justify-between mt-1.5 border-t border-gray-200/50 pt-1.5">
                            <span className="text-gray-400">Cuci + Ongkir</span>
                            <span className="font-bold text-gray-800">{formatRp(order.wash_cost)} + {order.ongkir_fee === 0 ? 'Gratis' : formatRp(order.ongkir_fee)}</span>
                          </div>
                          <div className="flex justify-between mt-1.5 border-t border-gray-200/80 pt-1.5">
                            <span className="font-black text-gray-700">Total Tagihan</span>
                            <span className="font-black text-green-600 text-sm">{formatRp(order.total_cost)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Graphic Analytics Panel */}
              <div className="space-y-6">
                <h3 className="text-lg font-black text-gray-800">Grafik Laporan</h3>
                
                <Card className="shadow-sm border-gray-150">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-red-500" /> Omset Mingguan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-60 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="Omset" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOmset)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-150">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Bell className="h-4 w-4 text-yellow-500" /> Jumlah Orderan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-52 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="Pesanan" fill="#FBBF24" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB CONTENT: PRODUCTS (Shop Catalog Editor) */}
          {activeTab === 'products' && (
            <div className="grid grid-cols-3 gap-8">
              {/* Product list */}
              <div className="col-span-2 space-y-4">
                <h3 className="text-lg font-black text-gray-800">Daftar Produk Aktif</h3>
                
                {products.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400 font-medium">
                    Etalase toko masih kosong.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {products.map(prod => (
                      <div key={prod.id} className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition">
                        <div>
                          <div className="h-28 bg-gray-50 rounded-xl mb-3 flex items-center justify-center border border-gray-100 shadow-inner">
                            <Package className="h-8 w-8 text-gray-300" />
                          </div>
                          <h4 className="font-black text-gray-800 text-sm line-clamp-1">{prod.name}</h4>
                          <p className="text-[10px] text-gray-400 font-medium leading-relaxed mt-1 line-clamp-2 h-7">{prod.description || 'Tidak ada deskripsi.'}</p>
                          <p className="font-black text-er-yellow text-sm mt-2">{formatRp(prod.price)}</p>
                        </div>
                        <Button 
                          onClick={() => handleDeleteProduct(prod.id)}
                          variant="destructive"
                          className="mt-4 h-9 rounded-xl text-xs font-bold gap-1 w-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 shadow-none border border-red-200/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Hapus Produk
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Product Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-gray-800">Tambah Produk Baru</h3>
                <Card className="shadow-sm border-gray-150">
                  <CardContent className="pt-6">
                    <form onSubmit={handleAddProduct} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nama Produk</label>
                        <Input 
                          placeholder="Contoh: Wax Pengkilap Premium"
                          value={prodName}
                          onChange={(e) => setProdName(e.target.value)}
                          className="h-11 rounded-xl text-sm border-gray-250 font-bold"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Harga Jual (Rp)</label>
                        <Input 
                          type="number"
                          placeholder="Contoh: 25000"
                          value={prodPrice}
                          onChange={(e) => setProdPrice(e.target.value)}
                          className="h-11 rounded-xl text-sm border-gray-250 font-bold"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Deskripsi Singkat</label>
                        <Textarea 
                          placeholder="Deskripsikan fitur produk..."
                          value={prodDesc}
                          onChange={(e) => setProdDesc(e.target.value)}
                          className="rounded-xl text-sm border-gray-250 font-medium"
                          rows={3}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black gap-1"
                      >
                        <Plus className="h-4 w-4" /> Tambah Ke Toko
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB CONTENT: CHAT CS (Centralized Chat Room) */}
          {activeTab === 'chat' && (
            <div className="grid grid-cols-3 bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm h-[32rem]">
              
              {/* Chat Contact List sidebar */}
              <div className="border-r border-gray-200 overflow-y-auto flex flex-col bg-gray-50/50">
                <div className="p-4 border-b border-gray-200 bg-white">
                  <h3 className="font-black text-gray-800 text-sm flex items-center gap-1.5">
                    <Headset className="h-4 w-4 text-er-yellow" /> Daftar Kontak Chat
                  </h3>
                </div>
                
                {chatRooms.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs font-medium italic my-auto">
                    Belum ada obrolan masuk.
                  </div>
                ) : (
                  <div className="flex-1 divide-y divide-gray-100">
                    {chatRooms.map(roomName => {
                      const roomChats = chats.filter(c => c.room === roomName)
                      const lastMessage = roomChats[roomChats.length - 1]
                      const isUnread = lastMessage && lastMessage.sender !== 'Admin'
                      const isSelected = activeRoom === roomName

                      return (
                        <div 
                          key={roomName}
                          onClick={() => setActiveRoom(roomName)}
                          className={`flex items-center gap-3 p-4 cursor-pointer transition select-none ${isSelected ? 'bg-red-500/5 border-l-4 border-l-red-500 bg-red-50/20' : 'bg-white hover:bg-gray-50'}`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-er-dark text-er-yellow font-black flex items-center justify-center text-base flex-shrink-0">
                            {roomName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-center mb-0.5">
                              <h4 className="font-black text-gray-800 text-xs truncate">{roomName}</h4>
                              {isUnread && <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>}
                            </div>
                            <p className="text-[10px] text-gray-400 truncate font-semibold">
                              {lastMessage.sender === 'Admin' ? 'Anda: ' : ''}{lastMessage.text}
                            </p>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Chat messages room */}
              <div className="col-span-2 flex flex-col bg-gray-50 relative justify-between h-full">
                {activeRoom ? (
                  <>
                    {/* Header CS Room */}
                    <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center z-10 shadow-sm flex-shrink-0">
                      <h4 className="font-black text-gray-800 text-sm flex items-center gap-2">
                        Customer: <span className="text-red-500">{activeRoom}</span>
                      </h4>
                      <span className="text-[9px] font-bold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Online CS View
                      </span>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover bg-center">
                      {roomMessages.map(msg => {
                        const isMe = msg.sender === 'Admin'
                        const timeStr = new Date(msg.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })

                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-2.5 max-w-[280px] text-xs shadow-sm ${isMe ? 'bg-red-600 text-white rounded-t-2xl rounded-bl-2xl rounded-br-sm font-semibold' : 'bg-white text-gray-800 border border-gray-150 rounded-t-2xl rounded-br-2xl rounded-bl-sm font-medium'}`}>
                              {msg.text}
                            </div>
                            <span className="text-[8px] text-gray-400 mt-1 mx-1 font-bold">{timeStr}</span>
                          </div>
                        )
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSendCSMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2 flex-shrink-0">
                      <Input 
                        placeholder="Ketik balasan Anda disini..."
                        value={adminChatInput}
                        onChange={(e) => setAdminChatInput(e.target.value)}
                        className="flex-1 h-11 bg-gray-50 border-gray-200 rounded-xl text-xs"
                      />
                      <Button type="submit" className="h-11 px-5 rounded-xl text-xs bg-red-600 hover:bg-red-750 text-white font-bold gap-1 flex items-center justify-center">
                        <Send className="h-3.5 w-3.5" /> Balas
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center m-auto text-center gap-3 bg-white/50 p-8 rounded-3xl border border-gray-250/20 backdrop-blur-sm max-w-xs shadow-md">
                    <div className="p-4 bg-gray-150 text-gray-400 rounded-full">
                      <MessageSquare className="h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-800 text-sm">Pilih Obrolan</h4>
                      <p className="text-gray-400 text-[10px] mt-1 font-medium leading-relaxed">
                        Silakan pilih salah satu kontak pelanggan di bilah samping untuk melihat obrolan dan membalas pesan.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: SETTINGS & CONFIGURATION */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-3 gap-8">
              
              {/* Settings Form */}
              <div className="col-span-2">
                <Card className="shadow-sm border-gray-150">
                  <CardHeader className="border-b border-gray-100 pb-4">
                    <CardTitle className="text-base font-black text-gray-800 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-gray-400" /> Konfigurasi Sistem Utama
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Price Config */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Tarif Ongkos Kirim Tambahan (Per 100 Meter setelah 500m pertama)
                      </label>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-gray-400">Rp</span>
                        <Input 
                          type="number"
                          value={pricePer100m}
                          onChange={(e) => setPricePer100m(parseInt(e.target.value) || 0)}
                          className="h-11 rounded-xl text-sm font-black text-blue-600 bg-blue-50/30 border-blue-200/50 w-44"
                        />
                        <span className="text-xs font-semibold text-gray-400">/ 100 meter</span>
                      </div>
                    </div>

                    <hr className="border-gray-200/60" />

                    {/* Promo Banner Config */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Tampilan Banner Promo Beranda Customer
                        </label>
                        <select 
                          value={promoType}
                          onChange={(e) => setPromoType(e.target.value as 'text' | 'image')}
                          className="h-11 w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 bg-white cursor-pointer focus:border-red-500 focus:outline-none"
                        >
                          <option value="image">Tampilkan Gambar Aesthetic Default (Unsplash)</option>
                          <option value="text">Tampilkan Banner Teks Kustom (Khusus)</option>
                        </select>
                      </div>

                      {promoType === 'text' && (
                        <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl animate-fade-in">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                              Judul Promo
                            </label>
                            <Input 
                              placeholder="Contoh: Promo Weekend! Diskon 10%"
                              value={promoTitle}
                              onChange={(e) => setPromoTitle(e.target.value)}
                              className="h-10 rounded-xl text-xs border-gray-200 bg-white font-bold"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                              Deskripsi Promo
                            </label>
                            <Input 
                              placeholder="Contoh: Dapatkan diskon cuci motor spesial sabtu-minggu."
                              value={promoDesc}
                              onChange={(e) => setPromoDesc(e.target.value)}
                              className="h-10 rounded-xl text-xs border-gray-200 bg-white font-medium"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={handleSaveSettings}
                      className="h-12 w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition"
                    >
                      Simpan Seluruh Pengaturan
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Tips panel */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-gray-800">Petunjuk Admin</h3>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 text-xs text-gray-500 font-medium leading-relaxed space-y-3 shadow-sm">
                  <p>
                    <b className="text-gray-700 font-bold block mb-1">1. Update Status Pesanan:</b>
                    Setiap perubahan status (OTW Jemput, Sedang Dicuci, OTW Antar) akan terupdate secara realtime di layar aplikasi handphone customer.
                  </p>
                  <p>
                    <b className="text-gray-700 font-bold block mb-1">2. Chat CS:</b>
                    Apabila ada customer baru yang mengirim pesan obrolan, kontak mereka akan otomatis muncul di bilah kiri menu Chat CS secara realtime.
                  </p>
                  <p>
                    <b className="text-gray-700 font-bold block mb-1">3. Tarif Ongkir:</b>
                    Jarak di bawah 500m dihitung Rp0 (Gratis). Kelebihan jarak di atas 500m akan dihitung berdasarkan kelipatan tarif per 100m tambahan yang dikonfigurasikan di menu ini.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  )
}
