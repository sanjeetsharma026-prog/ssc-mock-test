'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User, Settings } from 'lucide-react'
import type { Profile } from '@/types/database'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUser()
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-primary-600">
              SSC Mock Test
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {profile && (
              <span className="text-sm text-gray-700">
                {profile.full_name || profile.email}
              </span>
            )}
            {profile?.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center space-x-1 text-sm text-gray-700 hover:text-primary-600 transition"
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-sm text-gray-700 hover:text-red-600 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}









