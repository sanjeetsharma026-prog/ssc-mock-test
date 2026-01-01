import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { FileText, Plus, Settings } from 'lucide-react'
import type { Test } from '@/types/database'

async function getTests() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tests:', error)
    return []
  }

  return data as Test[]
}

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}

export default async function AdminPage() {
  const isAdmin = await checkAdmin()

  if (!isAdmin) {
    redirect('/dashboard')
  }

  const tests = await getTests()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600 mt-2">Manage tests and questions</p>
          </div>
          <Link
            href="/admin/tests/new"
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Test</span>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Tests</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {tests.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tests created yet.</p>
                <Link
                  href="/admin/tests/new"
                  className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-semibold"
                >
                  Create your first test
                </Link>
              </div>
            ) : (
              tests.map((test) => (
                <div key={test.id} className="px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
                      {test.description && (
                        <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{test.duration_minutes} minutes</span>
                        <span>•</span>
                        <span>{test.total_questions} questions</span>
                        <span>•</span>
                        <span>
                          Created: {new Date(test.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/admin/tests/${test.id}/questions`}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition"
                      >
                        Manage Questions
                      </Link>
                      <Link
                        href={`/admin/tests/${test.id}/edit`}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}








