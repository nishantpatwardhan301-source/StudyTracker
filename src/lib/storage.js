import { useEffect, useState } from 'react'

// Progress is saved in the student's own browser (localStorage).
// Later this can be swapped for a real backend (e.g. Supabase) with login.

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable (private mode, etc.) */
  }
}

export function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => load(key, fallback))
  useEffect(() => { save(key, value) }, [key, value])
  return [value, setValue]
}
