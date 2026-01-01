export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: 'student' | 'admin'
  created_at: string
}

export interface Test {
  id: string
  title: string
  description: string | null
  duration_minutes: number
  total_questions: number
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  name: string
  created_at: string
}

export interface Question {
  id: string
  test_id: string
  subject_id: string | null
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  marks: number
  negative_marks: number
  created_at: string
  updated_at: string
}

export interface TestAttempt {
  id: string
  user_id: string
  test_id: string
  started_at: string
  submitted_at: string | null
  time_taken_seconds: number | null
  total_questions: number
  answered_count: number
  correct_count: number
  wrong_count: number
  marks_obtained: number
  total_marks: number
  accuracy: number
  status: 'in_progress' | 'completed' | 'timeout'
}

export interface TestResponse {
  id: string
  attempt_id: string
  question_id: string
  selected_answer: 'A' | 'B' | 'C' | 'D' | null
  is_correct: boolean | null
  is_marked_for_review: boolean
  created_at: string
}

export interface QuestionWithResponse extends Question {
  response?: TestResponse
}









