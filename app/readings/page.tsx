'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient, Tank, DipReading } from '@/lib/supabase'
import { formatCurrency, getTodayDate } from '@/lib/utils'
import { ArrowLeft, Fuel, Save, CheckCircle, AlertCircle, Calculator } from 'lucide-react'

export default function ReadingsPage() {
  const [user, setUser] = useState<any>(null)
  const [tanks, setTanks] = useState<Tank[]>([])
  const [date, setDate] = useState(getTodayDate())
  const [readings, setReadings] = useState<Record<number, any>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const userData = localStorage.getItem('admin_user')
    if (!userData) { router.push('/login'); return }
    setUser(JSON.parse(userData))
    fetchTanks()
  }, [])

  useEffect(() => {
    if (tanks.length > 0) fetchReadings()
  }, [tanks, date])

  async function fetchTanks() {
    const { data } = await supabase.from('tanks').select('*, fuel_types (*)').eq('is_active', true)
    if (data) {
      setTanks(data)
      const initial: Record<number, any> = {}
      data.forEach(t => {
        initial[t.id] = { opening_dip: '', closing_dip: '', opening_totalizer: '', closing_totalizer: '', purchase_qty: '' }
      })
      setReadings(initial)
    }
  }

  async function fetchReadings() {
    const { data } = await supabase.from('dip_readings').select('*').eq('reading_date', date)
    if (data) {
      const map: Record<number, any> = { ...readings }
      data.forEach(r => {
        map[r.tank_id] = {
          id: r.id,
          opening_dip: r.opening_dip ?? '',
          closing_dip: r.closing_dip ?? '',
          opening_totalizer: r.opening_totalizer ?? '',
          closing_totalizer: r.closing_totalizer ?? '',
          purchase_qty: r.purchase_qty ?? '',
        }
      })
      setReadings(map)
    }
  }

  function updateReading(tankId: number, field: string, value: string) {
    setReadings(prev => ({ ...prev, [tankId]: { ...prev[tankId], [field]: value } }))
  }

  function calculate(tankId: number) {
    const r = readings[tankId]
    if (!r || !r.opening_dip || !r.closing_dip) return null
    const dipSales = Number(r.opening_dip) + Number(r.purchase_qty || 0) - Number(r.closing_dip)
    const totSales = r.opening_totalizer && r.closing_totalizer
      ? Number(r.closing_totalizer) - Number(r.opening_totalizer) : null
    const tank = tanks.find(t => t.id === tankId)
    return {
      dipSales: dipSales.toFixed(2),
      totSales: totSales?.toFixed(2) ?? '-',
      diff: totSales ? (dipSales - totSales).toFixed(2) : '-',
      revenue: tank?.fuel_types ? formatCurrency((totSales || dipSales) * tank.fuel_types.price) : '-'
    }
  }

  async function saveReadings() {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      for (const tankId of Object.keys(readings)) {
        const r = readings[Number(tankId)]
        if (!r.opening_dip && !r.closing_dip) continue

        const payload = {
          tank_id: Number(tankId),
          reading_date: date,
          opening_dip: r.opening_dip ? Number(r.opening_dip) : null,
          closing_dip: r.closing_dip ? Number(r.closing_dip) : null,
          opening_totalizer: r.opening_totalizer ? Number(r.opening_totalizer) : null,
          closing_totalizer: r.closing_totalizer ? Number(r.closing_totalizer) : null,
          purchase_qty: r.purchase_qty ? Number(r.purchase_qty) : 0,
          status: 'submitted',
        }

        if (r.id) {
          await supabase.from('dip_readings').update(payload).eq('id', r.id)
        } else {
          await supabase.from('dip_readings').insert(payload)
        }

        // Update tank stock
        if (r.closing_dip) {
          await supabase.from('tanks').update({ current_stock: Number(r.closing_dip) }).eq('id', Number(tankId))
        }
      }
      setMessage({ type: 'success', text: 'Readings saved successfully!' })
      fetchReadings()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
    setSaving(false)
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
              <h1 className="font-bold text-gray-800">Daily Readings</h1>
              <p className="text-xs text-gray-500">Dip & Totalizer Entry</p>
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
        {message.text && (
          <div className={`mb-4 p-4 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {tanks.map(tank => {
            const calc = calculate(tank.id)
            return (
              <div key={tank.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className={`px-6 py-4 ${tank.fuel_types?.code === 'PET' ? 'bg-orange-500' : 'bg-green-500'}`}>
                  <div className="flex items-center gap-3 text-white">
                    <Fuel className="w-6 h-6" />
                    <div>
                      <h3 className="font-bold">{tank.tank_number}</h3>
                      <p className="text-sm opacity-90">{tank.fuel_types?.name} • {tank.capacity.toLocaleString()} L capacity</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Opening Dip (L)</label>
                      <input
                        type="number"
                        value={readings[tank.id]?.opening_dip}
                        onChange={(e) => updateReading(tank.id, 'opening_dip', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Closing Dip (L)</label>
                      <input
                        type="number"
                        value={readings[tank.id]?.closing_dip}
                        onChange={(e) => updateReading(tank.id, 'closing_dip', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Opening Totalizer</label>
                      <input
                        type="number"
                        value={readings[tank.id]?.opening_totalizer}
                        onChange={(e) => updateReading(tank.id, 'opening_totalizer', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Closing Totalizer</label>
                      <input
                        type="number"
                        value={readings[tank.id]?.closing_totalizer}
                        onChange={(e) => updateReading(tank.id, 'closing_totalizer', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Purchase/Refill (L)</label>
                    <input
                      type="number"
                      value={readings[tank.id]?.purchase_qty}
                      onChange={(e) => updateReading(tank.id, 'purchase_qty', e.target.value)}
                      className="w-full md:w-1/2 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>

                  {calc && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1">
                        <Calculator className="w-4 h-4" /> Auto Calculated
                      </p>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-xs text-gray-500">Dip Sales</p>
                          <p className="font-bold">{calc.dipSales} L</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Totalizer Sales</p>
                          <p className="font-bold">{calc.totSales} L</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Difference</p>
                          <p className={`font-bold ${calc.diff !== '-' && Number(calc.diff) > 10 ? 'text-red-600' : ''}`}>{calc.diff} L</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Revenue</p>
                          <p className="font-bold text-green-600">{calc.revenue}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 sticky bottom-4">
          <button
            onClick={saveReadings}
            disabled={saving}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            {saving ? <div className="spinner"></div> : <><Save className="w-5 h-5" /> Save Readings</>}
          </button>
        </div>
      </main>
    </div>
  )
}
