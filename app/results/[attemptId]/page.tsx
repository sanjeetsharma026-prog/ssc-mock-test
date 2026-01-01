import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import { CheckCircle2, XCircle, Clock, TrendingUp, BookOpen, BarChart3 } from 'lucide-react'
import { PieChart, SubjectBarChart } from '@/components/ResultCharts'
import type { TestAttempt, TestResponse, Question, Test, Subject } from '@/types/database'

async function getAttempt(attemptId: string, userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data as TestAttempt
}

async function getTest(testId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tests')
    .select('*')
    .eq('id', testId)
    .single()

  return data as Test
}

async function getResponses(attemptId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('test_responses')
    .select('*')
    .eq('attempt_id', attemptId)

  return (data || []) as TestResponse[]
}

async function getQuestions(testId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('questions')
    .select('*, subject_id')
    .eq('test_id', testId)

  return (data || []) as Question[]
}

async function getSubjects() {
  const supabase = await createClient()
  const { data } = await supabase.from('subjects').select('*')

  return (data || []) as Subject[]
}

export default async function ResultsPage({ params }: { params: { attemptId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const attempt = await getAttempt(params.attemptId, user.id)
  if (!attempt) {
    redirect('/dashboard')
  }

  const test = await getTest(attempt.test_id)
  const responses = await getResponses(attempt.id)
  const questions = await getQuestions(attempt.test_id)
  const subjects = await getSubjects()

  // Create maps for easy lookup
  const responseMap = new Map(responses.map((r) => [r.question_id, r]))
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]))

  // Calculate subject-wise analysis
  const subjectAnalysis = new Map<string, { total: number; correct: number; wrong: number }>()

  questions.forEach((question) => {
    const subjectName = question.subject_id
      ? subjectMap.get(question.subject_id) || 'Other'
      : 'Other'
    const response = responseMap.get(question.id)

    if (!subjectAnalysis.has(subjectName)) {
      subjectAnalysis.set(subjectName, { total: 0, correct: 0, wrong: 0 })
    }

    const analysis = subjectAnalysis.get(subjectName)!
    analysis.total++

    if (response?.is_correct) {
      analysis.correct++
    } else if (response?.selected_answer && !response.is_correct) {
      analysis.wrong++
    }
  })

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
          <p className="text-gray-600 mt-2">{test?.title}</p>
        </div>

        {/* Score Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {attempt.marks_obtained.toFixed(2)} / {attempt.total_marks.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-primary-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Accuracy</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {attempt.accuracy.toFixed(1)}%
                </p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Correct Answers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{attempt.correct_count}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Time Taken</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {attempt.time_taken_seconds
                    ? formatTime(attempt.time_taken_seconds)
                    : 'N/A'}
                </p>
              </div>
              <Clock className="w-12 h-12 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Charts and Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Correct vs Incorrect Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Answer Distribution</h2>
            </div>
            <PieChart
              correct={attempt.correct_count}
              wrong={attempt.wrong_count}
              unanswered={attempt.total_questions - attempt.answered_count}
            />
            <div className="mt-6 pt-6 border-t space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-gray-700">Correct Answers</span>
                </div>
                <span className="font-semibold text-gray-900">{attempt.correct_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-gray-700">Wrong Answers</span>
                </div>
                <span className="font-semibold text-gray-900">{attempt.wrong_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Circle className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-gray-700">Unanswered</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {attempt.total_questions - attempt.answered_count}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-gray-700 font-medium">Total Questions</span>
                <span className="font-semibold text-gray-900">{attempt.total_questions}</span>
              </div>
            </div>
          </div>

          {/* Subject-wise Breakdown with Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-6">
              <BookOpen className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Subject-wise Breakdown</h2>
            </div>
            {subjectAnalysis.size > 0 ? (
              <SubjectBarChart
                data={Array.from(subjectAnalysis.entries()).map(([subject, analysis]) => ({
                  label: subject,
                  correct: analysis.correct,
                  wrong: analysis.wrong,
                  total: analysis.total,
                }))}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No subject data available</p>
              </div>
            )}
            <div className="mt-6 pt-6 border-t space-y-3">
              {Array.from(subjectAnalysis.entries()).map(([subject, analysis]) => {
                const accuracy =
                  analysis.total > 0 ? ((analysis.correct / analysis.total) * 100).toFixed(1) : 0
                return (
                  <div key={subject} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{subject}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-green-600">✓ {analysis.correct}</span>
                      <span className="text-red-600">✗ {analysis.wrong}</span>
                      <span className="text-gray-600">{accuracy}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Question Review</h2>
          <div className="space-y-6">
            {questions.map((question, index) => {
              const response = responseMap.get(question.id)
              const isCorrect = response?.is_correct
              const subjectName = question.subject_id
                ? subjectMap.get(question.subject_id) || 'Other'
                : 'Other'

              return (
                <div
                  key={question.id}
                  className={`p-4 rounded-lg border-2 ${
                    isCorrect
                      ? 'border-green-200 bg-green-50'
                      : response?.selected_answer
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">Q{index + 1}</span>
                      <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded">
                        {subjectName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : response?.selected_answer ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <p className="text-gray-800 mb-3">{question.question_text}</p>

                  <div className="space-y-2">
                    {['A', 'B', 'C', 'D'].map((option) => {
                      const isSelected = response?.selected_answer === option
                      const isCorrectAnswer = question.correct_answer === option
                      return (
                        <div
                          key={option}
                          className={`p-2 rounded ${
                            isCorrectAnswer
                              ? 'bg-green-100 border-2 border-green-500'
                              : isSelected
                              ? 'bg-red-100 border-2 border-red-500'
                              : 'bg-gray-50'
                          }`}
                        >
                          <span className="font-semibold">{option}.</span>{' '}
                          {question[`option_${option.toLowerCase()}` as keyof Question]}
                          {isCorrectAnswer && (
                            <span className="ml-2 text-green-700 font-semibold">(Correct)</span>
                          )}
                          {isSelected && !isCorrectAnswer && (
                            <span className="ml-2 text-red-700 font-semibold">(Your Answer)</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}

function Circle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}





