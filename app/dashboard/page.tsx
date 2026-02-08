'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient, Tank, FuelToken } from '@/lib/supabase'
import { formatCurrency, formatQuantity, formatDateTime } from '@/lib/utils'
import { Fuel, TrendingUp, QrCode, AlertTriangle, LogOut, RefreshCw, CheckCircle, Clock, XCircle, FileText, ClipboardList } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [tanks, setTanks] = useState<Tank[]>([])
  const [tokens, setTokens] = useState<FuelToken[]>([])
  const [stats, setStats] = useState({ revenue: 0, active: 0, used: 0, expired: 0 })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const userData = localStorage.getItem('admin_user')
    if (!userData) { router.push('/login'); return }
    setUser(JSON.parse(userData))
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    
    // Fetch tanks
    const { data: tanksData } = await supabase
      .from('tanks').select('*, fuel_types (*)').eq('is_active', true)
    if (tanksData) setTanks(tanksData)

    // Fetch today's tokens
    const today = new Date().toISOString().split('T')[0]
    const { data: tokensData } = await supabase
      .from('fuel_tokens')
      .select('*, fuel_types (*), token_orders (*)')
      .gte('created_at', today)
      .order('created_at', { ascending: false })

    if (tokensData) {
      setTokens(tokensData)
      setStats({
        revenue: tokensData.filter(t => t.status === 'used').reduce((sum, t) => sum + t.amount, 0),
        active: tokensData.filter(t => t.status === 'paid').length,
        used: tokensData.filter(t => t.status === 'used').length,
        expired: tokensData.filter(t => t.status === 'expired').length,
      })
    }
    setLoading(false)
  }

  function logout() {
    localStorage.removeItem('admin_user')
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg p-4 hidden md:block">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <Fuel className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-800">AMU CAW Pump</p>
            <p className="text-xs text-gray-500">Admin Portal</p>
          </div>
        </div>

        <nav className="space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-primary-50 text-primary-700 rounded-xl font-medium">
            <TrendingUp className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/readings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl">
            <ClipboardList className="w-5 h-5" /> Daily Readings
          </Link>
          <Link href="/tokens" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl">
            <QrCode className="w-5 h-5" /> Tokens
          </Link>
          <Link href="/reports" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl">
            <FileText className="w-5 h-5" /> Reports
          </Link>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-3 bg-gray-50 rounded-xl mb-3">
            <p className="text-sm font-medium text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-red-600">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-6">
     {/* Mobile Header */}
<div className="md:hidden flex items-center justify-between mb-6">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
      <Fuel className="w-5 h-5 text-white" />
    </div>

    <div>
      <p className="font-bold text-gray-800 leading-tight">
        AMU CAW Petrol Pump
      </p>
      <p className="text-xs text-gray-500">
        Admin Portal
      </p>
    </div>
  </div>

  <button onClick={logout}>
    <LogOut className="w-5 h-5 text-gray-600" />
  </button>
</div>


        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500">Real-time overview</p>
          </div>
          <button onClick={fetchData} className="p-2 hover:bg-gray-200 rounded-lg">
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.revenue)}</p>
            <p className="text-sm text-gray-500">Today's Revenue</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.active}</p>
            <p className="text-sm text-gray-500">Active Tokens</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.used}</p>
            <p className="text-sm text-gray-500">Tokens Used</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            <p className="text-sm text-gray-500">Expired</p>
          </div>
        </div>

        {/* Tank Levels */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Fuel className="w-5 h-5 text-gray-500" /> Tank Stock Levels
            </h2>
            <div className="space-y-4">
              {tanks.map((tank) => {
                const pct = Math.round((tank.current_stock / tank.capacity) * 100)
                const isLow = pct < 30
                return (
                  <div key={tank.id}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-gray-700">
                        {tank.tank_number} ({tank.fuel_types?.name})
                      </span>
                      <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-gray-600'}`}>{pct}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isLow ? 'bg-red-500' : tank.fuel_types?.code === 'PET' ? 'bg-orange-500' : 'bg-green-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {tank.current_stock.toLocaleString()} / {tank.capacity.toLocaleString()} L
                    </p>
                    {isLow && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" /> Low stock alert
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent Tokens */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-gray-500" /> Recent Tokens
            </h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {tokens.slice(0, 10).map((token) => (
                <div key={token.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      token.fuel_types?.code === 'PET' ? 'bg-orange-100' : 'bg-green-100'
                    }`}>
                      <Fuel className={`w-4 h-4 ${token.fuel_types?.code === 'PET' ? 'text-orange-500' : 'text-green-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{token.token_orders?.customer_name}</p>
                      <p className="text-xs text-gray-500">{formatQuantity(token.quantity)} • {formatCurrency(token.amount)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    token.status === 'paid' ? 'bg-green-100 text-green-700' :
                    token.status === 'used' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {token.status}
                  </span>
                </div>
              ))}
              {tokens.length === 0 && <p className="text-center text-gray-500 py-8">No tokens today</p>}
            </div>
          </div>
        </div>

        {/* Quick Links - Mobile */}
        <div className="md:hidden grid grid-cols-2 gap-4">
          <Link href="/readings" className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <ClipboardList className="w-8 h-8 text-primary-500 mx-auto mb-2" />
            <p className="font-medium text-gray-800">Daily Readings</p>
          </Link>
          <Link href="/tokens" className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <QrCode className="w-8 h-8 text-primary-500 mx-auto mb-2" />
            <p className="font-medium text-gray-800">All Tokens</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
