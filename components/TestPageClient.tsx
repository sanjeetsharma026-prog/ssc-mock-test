'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, CheckCircle2, Circle, Flag, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import type { Test, Question, TestAttempt, TestResponse } from '@/types/database'

interface TestPageClientProps {
  test: Test
  questions: Question[]
  attempt: TestAttempt
  initialResponses: TestResponse[]
}

export default function TestPageClient({
  test,
  questions,
  attempt,
  initialResponses,
}: TestPageClientProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Map<string, TestResponse>>(
    new Map(initialResponses.map((r) => [r.question_id, r]))
  )
  
  // Calculate initial time remaining based on attempt start time
  const calculateInitialTimeRemaining = () => {
    const startTime = new Date(attempt.started_at).getTime()
    const now = Date.now()
    const elapsedSeconds = Math.floor((now - startTime) / 1000)
    const totalSeconds = test.duration_minutes * 60
    const remaining = Math.max(0, totalSeconds - elapsedSeconds)
    return remaining
  }
  
  const [timeRemaining, setTimeRemaining] = useState(calculateInitialTimeRemaining())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const currentQuestion = questions[currentQuestionIndex]
  const currentResponse = responses.get(currentQuestion.id)

  const handleSubmit = async (isTimeout = false) => {
    if (isSubmitting) return

    // Show confirmation dialog
    if (!isTimeout) {
      const confirmed = window.confirm(
        'Are you sure you want to submit the test? You will not be able to change your answers after submission.'
      )
      if (!confirmed) return
    }

    setIsSubmitting(true)

    try {
      // Calculate results
      let correctCount = 0
      let wrongCount = 0
      let marksObtained = 0
      let totalMarks = 0

      questions.forEach((question) => {
        totalMarks += question.marks
        const response = responses.get(question.id)
        if (response?.selected_answer) {
          if (response.is_correct) {
            correctCount++
            marksObtained += question.marks
          } else {
            wrongCount++
            marksObtained -= question.negative_marks
          }
        }
      })

      const accuracy = questions.length > 0 ? (correctCount / questions.length) * 100 : 0
      const timeTaken = test.duration_minutes * 60 - timeRemaining

      // Update attempt
      await supabase
        .from('test_attempts')
        .update({
          status: isTimeout ? 'timeout' : 'completed',
          submitted_at: new Date().toISOString(),
          time_taken_seconds: timeTaken,
          answered_count: Array.from(responses.values()).filter(
            (r) => r.selected_answer !== null
          ).length,
          correct_count: correctCount,
          wrong_count: wrongCount,
          marks_obtained: marksObtained,
          total_marks: totalMarks,
          accuracy: accuracy,
        })
        .eq('id', attempt.id)

      router.push(`/results/${attempt.id}`)
    } catch (error) {
      console.error('Error submitting test:', error)
      alert('Error submitting test. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmit(true)
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining])

  // Save time remaining periodically
  useEffect(() => {
    const saveTimer = setInterval(async () => {
      await supabase
        .from('test_attempts')
        .update({ time_taken_seconds: test.duration_minutes * 60 - timeRemaining })
        .eq('id', attempt.id)
    }, 30000) // Save every 30 seconds

    return () => clearInterval(saveTimer)
  }, [timeRemaining, attempt.id, test.duration_minutes, supabase])

  const handleAnswerSelect = useCallback(
    async (answer: 'A' | 'B' | 'C' | 'D') => {
      const response = responses.get(currentQuestion.id)
      const isCorrect = answer === currentQuestion.correct_answer

      const updatedResponse: TestResponse = {
        id: response?.id || '',
        attempt_id: attempt.id,
        question_id: currentQuestion.id,
        selected_answer: answer,
        is_correct: isCorrect,
        is_marked_for_review: response?.is_marked_for_review || false,
        created_at: response?.created_at || new Date().toISOString(),
      }

      setResponses((prev) => {
        const newMap = new Map(prev)
        newMap.set(currentQuestion.id, updatedResponse)
        return newMap
      })

      // Update in database
      if (response?.id) {
        await supabase
          .from('test_responses')
          .update({
            selected_answer: answer,
            is_correct: isCorrect,
          })
          .eq('id', response.id)
      } else {
        const { data } = await supabase
          .from('test_responses')
          .insert(updatedResponse)
          .select()
          .single()

        if (data) {
          setResponses((prev) => {
            const newMap = new Map(prev)
            newMap.set(currentQuestion.id, data as TestResponse)
            return newMap
          })
        }
      }

      // Update attempt answered count
      const answeredCount = Array.from(responses.values()).filter(
        (r) => r.selected_answer !== null
      ).length + (response?.selected_answer === null ? 1 : 0)

      await supabase
        .from('test_attempts')
        .update({ answered_count: answeredCount })
        .eq('id', attempt.id)
    },
    [currentQuestion, responses, attempt.id, supabase]
  )

  const handleClearResponse = useCallback(async () => {
    const response = responses.get(currentQuestion.id)
    if (!response?.selected_answer) return

    const updatedResponse: TestResponse = {
      id: response.id,
      attempt_id: attempt.id,
      question_id: currentQuestion.id,
      selected_answer: null,
      is_correct: null,
      is_marked_for_review: response.is_marked_for_review,
      created_at: response.created_at,
    }

    setResponses((prev) => {
      const newMap = new Map(prev)
      newMap.set(currentQuestion.id, updatedResponse)
      return newMap
    })

    await supabase
      .from('test_responses')
      .update({
        selected_answer: null,
        is_correct: null,
      })
      .eq('id', response.id)
  }, [currentQuestion, responses, attempt.id, supabase])

  const handleMarkForReview = useCallback(async () => {
    const response = responses.get(currentQuestion.id)
    const newMarkedState = !(response?.is_marked_for_review || false)

    const updatedResponse: TestResponse = {
      id: response?.id || '',
      attempt_id: attempt.id,
      question_id: currentQuestion.id,
      selected_answer: response?.selected_answer || null,
      is_correct: response?.is_correct || null,
      is_marked_for_review: newMarkedState,
      created_at: response?.created_at || new Date().toISOString(),
    }

    setResponses((prev) => {
      const newMap = new Map(prev)
      newMap.set(currentQuestion.id, updatedResponse)
      return newMap
    })

    if (response?.id) {
      await supabase
        .from('test_responses')
        .update({ is_marked_for_review: newMarkedState })
        .eq('id', response.id)
    } else {
      const { data } = await supabase
        .from('test_responses')
        .insert(updatedResponse)
        .select()
        .single()

      if (data) {
        setResponses((prev) => {
          const newMap = new Map(prev)
          newMap.set(currentQuestion.id, data as TestResponse)
          return newMap
        })
      }
    }
  }, [currentQuestion, responses, attempt.id, supabase])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getQuestionStatus = (questionId: string) => {
    const response = responses.get(questionId)
    if (response?.is_marked_for_review && response?.selected_answer) return 'review-answered'
    if (response?.is_marked_for_review) return 'review'
    if (response?.selected_answer) return 'answered'
    return 'unanswered'
  }

  const answeredCount = Array.from(responses.values()).filter(
    (r) => r.selected_answer !== null
  ).length
  const markedCount = Array.from(responses.values()).filter(
    (r) => r.is_marked_for_review
  ).length
  const notAnsweredCount = questions.length - answeredCount

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Bar - CBT Exam Style */}
      <div className="bg-white border-b-2 border-gray-300 shadow-sm">
        <div className="max-w-full px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-lg font-bold text-gray-900">{test.title}</h1>
                <p className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Timer */}
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                timeRemaining < 300 
                  ? 'bg-red-100 border-2 border-red-500' 
                  : timeRemaining < 600
                  ? 'bg-yellow-100 border-2 border-yellow-500'
                  : 'bg-blue-50 border-2 border-blue-500'
              }`}>
                <Clock className={`w-5 h-5 ${
                  timeRemaining < 300 ? 'text-red-600' : timeRemaining < 600 ? 'text-yellow-600' : 'text-blue-600'
                }`} />
                <span className={`text-xl font-bold ${
                  timeRemaining < 300 ? 'text-red-600' : timeRemaining < 600 ? 'text-yellow-600' : 'text-blue-600'
                }`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Submit Button */}
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Question Palette */}
        <div className="w-80 bg-white border-r-2 border-gray-300 flex flex-col">
          <div className="p-4 border-b-2 border-gray-300">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Question Palette</h2>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, index) => {
                const status = getQuestionStatus(q.id)
                const isCurrent = index === currentQuestionIndex
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`
                      w-12 h-12 rounded border-2 font-semibold text-sm transition-all
                      ${
                        isCurrent
                          ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300 scale-110'
                          : status === 'review-answered'
                          ? 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600'
                          : status === 'answered'
                          ? 'bg-green-500 text-white border-green-600 hover:bg-green-600'
                          : status === 'review'
                          ? 'bg-yellow-400 text-gray-900 border-yellow-500 hover:bg-yellow-500'
                          : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-100'
                      }
                    `}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 border-b-2 border-gray-300">
            <h3 className="font-bold text-gray-900 mb-3">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-500 border-2 border-green-600 rounded mr-2"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-yellow-400 border-2 border-yellow-500 rounded mr-2"></div>
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-orange-500 border-2 border-orange-600 rounded mr-2"></div>
                <span>Answered & Marked</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-white border-2 border-gray-400 rounded mr-2"></div>
                <span>Not Answered</span>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="p-4 flex-1">
            <h3 className="font-bold text-gray-900 mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-semibold">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Answered:</span>
                <span className="font-semibold text-green-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">Marked for Review:</span>
                <span className="font-semibold text-yellow-600">{markedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Not Answered:</span>
                <span className="font-semibold text-gray-600">{notAnsweredCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Question Area */}
        <div className="flex-1 flex flex-col overflow-auto bg-gray-50">
          <div className="max-w-4xl mx-auto w-full p-6">
            {/* Question Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <span className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
                    Q{currentQuestionIndex + 1}
                  </span>
                  <span className="text-gray-600">of {questions.length}</span>
                </div>
                <button
                  onClick={handleMarkForReview}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition ${
                    currentResponse?.is_marked_for_review
                      ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Flag className="w-4 h-4" />
                  <span>{currentResponse?.is_marked_for_review ? 'Unmark Review' : 'Mark for Review'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.question_text}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option as 'A' | 'B' | 'C' | 'D')}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      currentResponse?.selected_answer === option
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                        currentResponse?.selected_answer === option
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-400'
                      }`}>
                        {currentResponse?.selected_answer === option && (
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-gray-900 text-lg mr-2">{option}.</span>
                        <span className="text-gray-800 text-lg">
                          {currentQuestion[`option_${option.toLowerCase()}` as keyof Question]}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleClearResponse}
                    disabled={!currentResponse?.selected_answer}
                    className="flex items-center space-x-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Clear Response</span>
                  </button>
                </div>

                <button
                  onClick={() =>
                    setCurrentQuestionIndex((prev) =>
                      Math.min(questions.length - 1, prev + 1)
                    )
                  }
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  <span>Next</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
