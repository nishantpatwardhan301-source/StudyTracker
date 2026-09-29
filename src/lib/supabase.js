import { createClient } from '@supabase/supabase-js'

// Public (publishable) credentials for the Nishant Patwardhan Supabase project.
// Safe to ship in the browser: data access is controlled by Row Level Security.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://cugmfkuiqayuqlqkjham.supabase.co'
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_du3L56AyBi_FzaSuFzB2sg_Z3Tnnh9A'

export const supabase = createClient(url, key)

export const SUBJECTS = [
  { key: 'physics', label: 'Physics' },
  { key: 'chemistry', label: 'Chemistry' },
  { key: 'maths', label: 'Mathematics' },
]
export const subjectLabel = Object.fromEntries(SUBJECTS.map((s) => [s.key, s.label]))

// Public columns of the questions table (answers are only revealed via RPCs).
export const QUESTION_COLUMNS =
  'id, paper_id, question_number, subject, chapter_id, topic, question_text, image_url, option_a, option_b, option_c, option_d, marks'

export const optionsOf = (q) => [q.option_a, q.option_b, q.option_c, q.option_d]
export const LETTERS = ['A', 'B', 'C', 'D']

export function paperLabel(p) {
  if (!p) return ''
  const d = p.shift_date ? new Date(p.shift_date + 'T00:00:00') : null
  const date = d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : p.year
  const shift = (p.shift_code?.match(/S(\d)$/) || [])[1]
  return `${date}${shift ? ` · Shift ${shift}` : ''}`
}
