import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { Clock, FileText, TrendingUp, Target, Award, Play } from 'lucide-react'
import type { Test, TestAttempt } from '@/types/database'

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

async function getUserStats(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['completed', 'timeout'])

  if (error) {
    console.error('Error fetching user stats:', error)
    return {
      totalAttempts: 0,
      averageScore: 0,
      averageAccuracy: 0,
    }
  }

  const attempts = data as TestAttempt[]
  const totalAttempts = attempts.length

  if (totalAttempts === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      averageAccuracy: 0,
    }
  }

  const totalMarks = attempts.reduce((sum, attempt) => sum + Number(attempt.marks_obtained), 0)
  const totalAccuracy = attempts.reduce((sum, attempt) => sum + Number(attempt.accuracy), 0)

  const averageScore = totalMarks / totalAttempts
  const averageAccuracy = totalAccuracy / totalAttempts

  return {
    totalAttempts,
    averageScore,
    averageAccuracy,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const tests = await getTests()
  const stats = await getUserStats(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name || 'Student'}!
          </h1>
          <p className="text-gray-600 mt-2">Track your progress and continue practicing</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tests Attempted</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalAttempts}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalAttempts > 0 ? stats.averageScore.toFixed(1) : '0.0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Accuracy</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalAttempts > 0 ? stats.averageAccuracy.toFixed(1) : '0.0'}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Start New Test Section */}
        {tests.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Ready to Practice?</h2>
                  <p className="text-primary-100">
                    Start a new mock test and improve your skills
                  </p>
                </div>
                <Link
                  href="#tests"
                  className="flex items-center space-x-2 bg-white text-primary-600 hover:bg-primary-50 font-semibold px-6 py-3 rounded-lg transition shadow-md"
                >
                  <Play className="w-5 h-5" />
                  <span>Start New Mock Test</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tests Section */}
        <div id="tests">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Mock Tests</h2>

          {tests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tests Available</h3>
              <p className="text-gray-600">Check back later for new mock tests.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{test.title}</h3>
                  </div>

                  {test.description && (
                    <p className="text-gray-600 text-sm mb-4">{test.description}</p>
                  )}

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{test.duration_minutes} minutes</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="w-4 h-4 mr-2" />
                      <span>{test.total_questions} questions</span>
                    </div>
                  </div>

                  <Link
                    href={`/test/${test.id}`}
                    className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Start Test
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}





