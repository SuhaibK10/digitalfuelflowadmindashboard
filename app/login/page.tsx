'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Fuel, User, Lock, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handleDemoLogin(role: 'supervisor' | 'admin') {
    localStorage.setItem('admin_user', JSON.stringify({
      id: role, name: role === 'supervisor' ? 'Supervisor' : 'Administrator', role
    }))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Fuel className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Portal</h1>
          <p className="text-gray-500">Stock Management System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                  placeholder="admin@amu.ac.in"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl">
              Sign In
            </button>
          </div>

          <div className="border-t pt-6">
            <p className="text-center text-sm text-gray-500 mb-3">Demo Access</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDemoLogin('supervisor')}
                className="py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium rounded-xl"
              >
                Supervisor
              </button>
              <button
                onClick={() => handleDemoLogin('admin')}
                className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
