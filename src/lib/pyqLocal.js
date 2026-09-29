import { load, save } from './storage'

// Guest PYQ attempts, kept in the browser: { [questionId]: { p: 'A', ok: true, c: chapterId } }
const KEY = 'np.pyq.v2'

export const loadLocalAttempts = () => load(KEY, {})

export function saveLocalAttempt(questionId, chapterId, picked, ok) {
  const all = loadLocalAttempts()
  if (all[questionId]) return all
  const next = { ...all, [questionId]: { p: picked, ok, c: chapterId } }
  save(KEY, next)
  return next
}

// { [chapterId]: { attempted, correct } }
export function localChapterProgress() {
  const out = {}
  for (const a of Object.values(loadLocalAttempts())) {
    const x = (out[a.c] ??= { attempted: 0, correct: 0 })
    x.attempted++
    if (a.ok) x.correct++
  }
  return out
}
