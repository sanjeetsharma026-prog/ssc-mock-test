import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import QuestionsManager from '@/components/QuestionsManager'
import type { Test, Question, Subject } from '@/types/database'

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

async function getTest(testId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tests')
    .select('*')
    .eq('id', testId)
    .single()

  return data as Test | null
}

async function getQuestions(testId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('questions')
    .select('*')
    .eq('test_id', testId)
    .order('created_at', { ascending: true })

  return (data || []) as Question[]
}

async function getSubjects() {
  const supabase = await createClient()
  const { data } = await supabase.from('subjects').select('*').order('name')

  return (data || []) as Subject[]
}

export default async function QuestionsPage({ params }: { params: { testId: string } }) {
  const isAdmin = await checkAdmin()

  if (!isAdmin) {
    redirect('/dashboard')
  }

  const test = await getTest(params.testId)
  if (!test) {
    redirect('/admin')
  }

  const questions = await getQuestions(params.testId)
  const subjects = await getSubjects()

  return (
    <QuestionsManager test={test} initialQuestions={questions} subjects={subjects} />
  )
}









