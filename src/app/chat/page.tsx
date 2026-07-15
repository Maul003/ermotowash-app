'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'
import { 
  Headset, 
  Send, 
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message {
  id: string
  room: string
  sender: 'customer' | 'Admin'
  text: string
  created_at: string
}

export default function ChatPage() {
  const { userName } = useUserStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const supabase = createClient()

  // Scroll to bottom helper
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!userName) return

    const fetchMessages = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('room', userName)
        .order('created_at', { ascending: true })

      if (data) {
        setMessages(data)
      }
      setLoading(false)
      setTimeout(scrollToBottom, 100)
    }

    fetchMessages()

    // Subscribe to new messages for this customer room
    const channel = supabase.channel(`room_${userName}`)
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chats',
          filter: `room=eq.${userName}`
        }, 
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
          setTimeout(scrollToBottom, 50)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userName, supabase])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !userName) return

    const textToSend = inputText.trim()
    setInputText('')

    try {
      const { error } = await supabase
        .from('chats')
        .insert({
          room: userName,
          sender: 'customer',
          text: textToSend
        })

      if (error) throw error
    } catch (err: any) {
      alert('Gagal mengirim pesan: ' + err.message)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-gray-50 relative">
      {/* Chat header */}
      <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
          <Headset className="h-5 w-5 text-er-yellow animate-pulse" />
          <h2 className="font-black text-gray-800 text-base">Live Chat Customer Service</h2>
        </div>
        <span className="text-[10px] bg-green-500/10 text-green-600 px-3 py-1 rounded-full font-black border border-green-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
          CS Online
        </span>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover bg-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center m-auto text-gray-400 gap-2 bg-white/80 p-6 rounded-2xl border border-gray-100 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-er-yellow" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Memuat Obrolan...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center my-auto mx-auto text-center gap-3 bg-white/95 p-6 rounded-3xl border border-gray-150 shadow-md max-w-xs">
            <div className="p-3.5 bg-er-yellow/10 rounded-full text-er-yellow">
              <Headset className="h-8 w-8" />
            </div>
            <div>
              <p className="text-gray-800 font-black text-sm">Ada yang bisa dibantu?</p>
              <p className="text-gray-400 text-[11px] mt-1 font-medium leading-relaxed">
                Tanyakan seputar penjemputan, tarif cuci, atau produk toko. Admin kami akan segera membalas.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === 'customer'
            const timeStr = new Date(msg.created_at).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit'
            })

            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`px-4 py-3 max-w-[260px] text-sm shadow-sm ${
                    isMe 
                      ? 'bg-er-dark text-white rounded-t-2xl rounded-bl-2xl rounded-br-sm' 
                      : 'bg-white text-gray-800 border border-gray-150 rounded-t-2xl rounded-br-2xl rounded-bl-sm font-medium'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
                <span className="text-[9px] text-gray-500 mt-1 mx-1 font-bold">
                  {timeStr}
                </span>
              </div>
            )
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Message input */}
      <form 
        onSubmit={handleSendMessage}
        className="p-3.5 bg-white border-t border-gray-200 flex gap-2 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] z-10 pb-6"
      >
        <Input 
          type="text" 
          placeholder="Tulis pesan Anda disini..." 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 h-12 bg-gray-50 border-gray-200 rounded-xl text-sm focus:border-er-yellow focus:ring-0 focus:outline-none"
        />
        <Button 
          type="submit"
          className="bg-er-dark hover:bg-black text-er-yellow h-12 w-12 rounded-xl shadow-md flex items-center justify-center flex-shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  )
}
