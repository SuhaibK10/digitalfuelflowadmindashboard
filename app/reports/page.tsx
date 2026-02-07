'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { formatCurrency, formatQuantity, formatDate, getTodayDate } from '@/lib/utils'
import { ArrowLeft, FileText, TrendingUp, Fuel, QrCode, Download } from 'lucide-react'

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null)
  const [date, setDate] = useState(getTodayDate())
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const user = localStorage.getItem('admin_user')
    if (!user) { router.push('/login'); return }
    fetchSummary()
  }, [date])

  async function fetchSummary() {
    setLoading(true)
    
    // Get tanks
    const { data: tanks } = await supabase.from('tanks').select('*, fuel_types (*)')
    
    // Get readings for date
    const { data: readings } = await supabase
      .from('dip_readings')
      .select('*')
      .eq('reading_date', date)
    
    // Get tokens for date
    const { data: tokens } = await supabase
      .from('fuel_tokens')
      .select('*')
      .gte('created_at', date)
      .lt('created_at', new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0])
    
    if (tanks) {
      const tankSummary = tanks.map(tank => {
        const reading = readings?.find(r => r.tank_id === tank.id)
        const dipSales = reading 
          ? (reading.opening_dip || 0) + (reading.purchase_qty || 0) - (reading.closing_dip || 0)
          : 0
        const totSales = reading && reading.opening_totalizer && reading.closing_totalizer
          ? reading.closing_totalizer - reading.opening_totalizer
          : 0
        return {
          tank,
          reading,
          dipSales,
          totSales,
          revenue: totSales * (tank.fuel_types?.price || 0)
        }
      })

      const tokenStats = tokens ? {
        total: tokens.length,
        used: tokens.filter(t => t.status === 'used').length,
        revenue: tokens.filter(t => t.status === 'used').reduce((s, t) => s + t.amount, 0)
      } : { total: 0, used: 0, revenue: 0 }

      setSummary({
        date,
        tanks: tankSummary,
        tokenStats,
        totalRevenue: tankSummary.reduce((s, t) => s + t.revenue, 0)
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="font-bold text-gray-800">Daily Report</h1>
              <p className="text-xs text-gray-500">Sales Summary</p>
            </div>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getTodayDate()}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner"></div></div>
        ) : summary && (
          <>
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-4 text-center">
              <FileText className="w-12 h-12 text-primary-500 mx-auto mb-2" />
              <h2 className="text-xl font-bold text-gray-800">Daily Sales Report</h2>
              <p className="text-gray-500">{formatDate(summary.date)}</p>
            </div>

            {/* Total Revenue */}
            <div className="bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl p-6 mb-4 text-white">
              <p className="text-purple-100">Total Revenue</p>
              <p className="text-4xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
            </div>

            {/* Tank Wise Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Fuel className="w-5 h-5 text-gray-500" /> Tank-wise Sales
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-medium text-gray-500">Tank</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-500">Dip Sales</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-500">Totalizer</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-500">Diff</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-500">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.tanks.map((t: any) => (
                      <tr key={t.tank.id} className="border-b last:border-0">
                        <td className="py-3">
                          <span className="font-medium">{t.tank.tank_number}</span>
                          <span className="text-sm text-gray-500 ml-2">({t.tank.fuel_types?.name})</span>
                        </td>
                        <td className="text-right py-3">{formatQuantity(t.dipSales)}</td>
                        <td className="text-right py-3">{formatQuantity(t.totSales)}</td>
                        <td className={`text-right py-3 ${t.dipSales - t.totSales > 10 ? 'text-red-600' : ''}`}>
                          {formatQuantity(t.dipSales - t.totSales)}
                        </td>
                        <td className="text-right py-3 font-semibold text-green-600">{formatCurrency(t.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Token Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-gray-500" /> Token Sales
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-800">{summary.tokenStats.total}</p>
                  <p className="text-sm text-gray-500">Total Tokens</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{summary.tokenStats.used}</p>
                  <p className="text-sm text-gray-500">Used</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary-600">{formatCurrency(summary.tokenStats.revenue)}</p>
                  <p className="text-sm text-gray-500">Revenue</p>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl flex items-center justify-center gap-2">
              <Download className="w-5 h-5" /> Export as PDF
            </button>
          </>
        )}
      </main>
    </div>
  )
}
