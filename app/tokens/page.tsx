'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient, FuelToken } from '@/lib/supabase'
import { formatCurrency, formatQuantity, formatDateTime } from '@/lib/utils'
import { ArrowLeft, Fuel, QrCode, CheckCircle, Clock, XCircle, Search } from 'lucide-react'

export default function TokensPage() {
  const [tokens, setTokens] = useState<FuelToken[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const user = localStorage.getItem('admin_user')
    if (!user) { router.push('/login'); return }
    fetchTokens()
  }, [])

  async function fetchTokens() {
    const { data } = await supabase
      .from('fuel_tokens')
      .select('*, fuel_types (*), token_orders (*)')
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (data) setTokens(data)
    setLoading(false)
  }

  const filtered = tokens.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false
    if (search && !t.token_code.includes(search.toUpperCase()) && 
        !t.token_orders?.customer_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-800">All Tokens</h1>
            <p className="text-xs text-gray-500">{filtered.length} tokens</p>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by token or name..."
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'paid', 'used', 'expired'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                    filter === f ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Token List */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner"></div></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(token => (
              <div key={token.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      token.fuel_types?.code === 'PET' ? 'bg-orange-100' : 'bg-green-100'
                    }`}>
                      <Fuel className={`w-6 h-6 ${
                        token.fuel_types?.code === 'PET' ? 'text-orange-500' : 'text-green-500'
                      }`} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{token.token_orders?.customer_name}</p>
                      <p className="text-sm text-gray-500 font-mono">{token.token_code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${
                      token.status === 'paid' ? 'bg-green-100 text-green-700' :
                      token.status === 'used' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {token.status === 'paid' && <Clock className="w-4 h-4" />}
                      {token.status === 'used' && <CheckCircle className="w-4 h-4" />}
                      {token.status === 'expired' && <XCircle className="w-4 h-4" />}
                      {token.status}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t flex justify-between text-sm">
                  <span className="text-gray-500">
                    {formatQuantity(token.quantity)} • {formatCurrency(token.amount)}
                  </span>
                  <span className="text-gray-500">{formatDateTime(token.created_at)}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center">
                <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No tokens found</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
