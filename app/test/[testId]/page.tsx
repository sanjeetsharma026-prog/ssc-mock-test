import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TestPageClient from '@/components/TestPageClient'
import type { Question, Test, TestAttempt } from '@/types/database'

async function getTest(testId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('id', testId)
    .single()

  if (error || !data) {
    return null
  }

  return data as Test
}

async function getQuestions(testId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('test_id', testId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching questions:', error)
    return []
  }

  return data as Question[]
}

async function getOrCreateAttempt(testId: string, userId: string) {
  const supabase = await createClient()

  // Check for existing in-progress attempt
  const { data: existingAttempt } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('test_id', testId)
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .single()

  if (existingAttempt) {
    return existingAttempt as TestAttempt
  }

  // Get questions count
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('test_id', testId)

  // Create new attempt
  const { data: newAttempt, error } = await supabase
    .from('test_attempts')
    .insert({
      test_id: testId,
      user_id: userId,
      total_questions: count || 0,
    })
    .select()
    .single()

  if (error || !newAttempt) {
    throw new Error('Failed to create test attempt')
  }

  // Create response entries for all questions
  const questions = await getQuestions(testId)
  const responses = questions.map((q) => ({
    attempt_id: newAttempt.id,
    question_id: q.id,
  }))

  if (responses.length > 0) {
    await supabase.from('test_responses').insert(responses)
  }

  return newAttempt as TestAttempt
}

async function getResponses(attemptId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('test_responses')
    .select('*')
    .eq('attempt_id', attemptId)

  if (error) {
    console.error('Error fetching responses:', error)
    return []
  }

  return data
}

export default async function TestPage({ params }: { params: { testId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const test = await getTest(params.testId)
  if (!test) {
    redirect('/dashboard')
  }

  const questions = await getQuestions(params.testId)
  if (questions.length === 0) {
    redirect('/dashboard')
  }

  const attempt = await getOrCreateAttempt(params.testId, user.id)
  const responses = await getResponses(attempt.id)

  // Create a map of question_id to response
  const responseMap = new Map(responses.map((r) => [r.question_id, r]))

  return (
    <TestPageClient
      test={test}
      questions={questions}
      attempt={attempt}
      initialResponses={responses}
    />
  )
}








