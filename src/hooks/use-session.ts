'use client'

import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name?: string
  role: string
}

interface Session {
  user: User | null
  loading: boolean
}

export function useSession(): Session {
  const [session, setSession] = useState<Session>({ user: null, loading: true })

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        setSession({ user: data.user || null, loading: false })
      } catch (error) {
        console.error('[useSession] Error:', error)
        setSession({ user: null, loading: false })
      }
    }

    fetchSession()
  }, [])

  return session
}
