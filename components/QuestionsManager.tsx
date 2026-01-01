'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from './Navbar'
import { Plus, Edit2, Trash2, ArrowLeft } from 'lucide-react'
import type { Test, Question, Subject } from '@/types/database'

interface QuestionsManagerProps {
  test: Test
  initialQuestions: Question[]
  subjects: Subject[]
}

export default function QuestionsManager({
  test,
  initialQuestions,
  subjects,
}: QuestionsManagerProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Create subject map for easy lookup
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]))

  const [formData, setFormData] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A' as 'A' | 'B' | 'C' | 'D',
    marks: 1,
    negative_marks: 0.25,
    subject_id: '',
  })

  const resetForm = () => {
    setFormData({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      marks: 1,
      negative_marks: 0.25,
      subject_id: '',
    })
    setEditingQuestion(null)
    setShowForm(false)
    setError('')
    setSuccess('')
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    setFormData({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer,
      marks: question.marks,
      negative_marks: question.negative_marks,
      subject_id: question.subject_id || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (editingQuestion) {
        // Update existing question
        const { data, error } = await supabase
          .from('questions')
          .update({
            question_text: formData.question_text,
            option_a: formData.option_a,
            option_b: formData.option_b,
            option_c: formData.option_c,
            option_d: formData.option_d,
            correct_answer: formData.correct_answer,
            marks: formData.marks,
            negative_marks: formData.negative_marks,
            subject_id: formData.subject_id || null,
          })
          .eq('id', editingQuestion.id)
          .select()
          .single()

        if (error) throw error

        setQuestions((prev) =>
          prev.map((q) => (q.id === editingQuestion.id ? (data as Question) : q))
        )
      } else {
        // Create new question
        const { data, error } = await supabase
          .from('questions')
          .insert({
            test_id: test.id,
            question_text: formData.question_text,
            option_a: formData.option_a,
            option_b: formData.option_b,
            option_c: formData.option_c,
            option_d: formData.option_d,
            correct_answer: formData.correct_answer,
            marks: formData.marks,
            negative_marks: formData.negative_marks,
            subject_id: formData.subject_id || null,
          })
          .select()
          .single()

        if (error) throw error

        setQuestions((prev) => [...prev, data as Question])
      }

      // Update test total_questions count
      const newCount = editingQuestion ? questions.length : questions.length + 1
      await supabase
        .from('tests')
        .update({ total_questions: newCount })
        .eq('id', test.id)

      setSuccess(editingQuestion ? 'Question updated successfully!' : 'Question added successfully!')
      setTimeout(() => {
        resetForm()
      }, 1500)
    } catch (error: any) {
      setError(error.message || 'Failed to save question')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) return

    try {
      const { error } = await supabase.from('questions').delete().eq('id', questionId)

      if (error) throw error

      setQuestions((prev) => prev.filter((q) => q.id !== questionId))

      // Update test total_questions count
      await supabase
        .from('tests')
        .update({ total_questions: questions.length - 1 })
        .eq('id', test.id)

      setSuccess('Question deleted successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError('Failed to delete question: ' + error.message)
      setTimeout(() => setError(''), 5000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/admin')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </button>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{test.title}</h1>
            <p className="text-gray-600 mt-1">Manage Questions ({questions.length} total)</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            <span>Add Question</span>
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text *
                </label>
                <textarea
                  value={formData.question_text}
                  onChange={(e) =>
                    setFormData({ ...formData, question_text: e.target.value })
                  }
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Enter the question..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Option A *
                  </label>
                  <input
                    type="text"
                    value={formData.option_a}
                    onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Option B *
                  </label>
                  <input
                    type="text"
                    value={formData.option_b}
                    onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Option C *
                  </label>
                  <input
                    type="text"
                    value={formData.option_c}
                    onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Option D *
                  </label>
                  <input
                    type="text"
                    value={formData.option_d}
                    onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer *
                  </label>
                  <select
                    value={formData.correct_answer}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D',
                      })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marks *
                  </label>
                  <input
                    type="number"
                    value={formData.marks}
                    onChange={(e) =>
                      setFormData({ ...formData, marks: parseInt(e.target.value) || 1 })
                    }
                    required
                    min={1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Negative Marks
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.negative_marks}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        negative_marks: parseFloat(e.target.value) || 0,
                      })
                    }
                    min={0}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add Question'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Questions List</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {questions.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-600">
                No questions added yet. Click "Add Question" to get started.
              </div>
            ) : (
              questions.map((question, index) => (
                <div key={question.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-900">Q{index + 1}</span>
                        {question.subject_id && subjectMap.get(question.subject_id) && (
                          <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded">
                            {subjectMap.get(question.subject_id)}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          Marks: {question.marks} | Negative: {question.negative_marks}
                        </span>
                      </div>
                      <p className="text-gray-800 mb-3">{question.question_text}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">A:</span> {question.option_a}
                        </div>
                        <div>
                          <span className="font-medium">B:</span> {question.option_b}
                        </div>
                        <div>
                          <span className="font-medium">C:</span> {question.option_c}
                        </div>
                        <div>
                          <span className="font-medium">D:</span> {question.option_d}
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-sm font-semibold text-green-600">
                          Correct Answer: {question.correct_answer}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(question)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded transition"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(question.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
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





