import { useEffect, useState } from 'react'

// Runs an async loader when deps change. Returns { data, error, loading, setData }.
export function useAsync(loader, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true, error: null }))
    loader()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState({ data: null, error, loading: false }))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return { ...state, setData: (data) => setState((s) => ({ ...s, data })) }
}

// Unwraps a supabase-js response.
export async function q(promise) {
  const { data, error } = await promise
  if (error) throw error
  return data
}
