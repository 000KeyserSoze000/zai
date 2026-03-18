'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

interface SessionUser {
  id: string
  email: string
  name?: string
  role: 'ADMIN' | 'CLIENT'
}

interface Subscription {
  id: string
  status: string
  sessionsUsed: number
  sessionsLimit: number
  trialEndsAt?: string
  plan?: {
    name: string
    type: string
  }
}

interface Session {
  user: SessionUser | null
}

interface AuthState {
  session: Session
  status: 'loading' | 'authenticated' | 'unauthenticated'
  isLoading: boolean
  isAuthenticated: boolean
  isUnauthenticated: boolean
  isAdmin: boolean
  isClient: boolean
  subscription: Subscription | null
  hasActiveSubscription: boolean
  isTrial: boolean
  isTrialExpired: boolean
  sessionsUsed: number
  sessionsLimit: number
  sessionsRemaining: number
  plan: { name: string; type: string } | null
  refresh: () => Promise<void>
}

async function fetchSessionData(): Promise<{ session: Session; subscription: Subscription | null }> {
  console.log('[useAuth] Fetching session...')
  
  const response = await fetch('/api/auth/session', {
    cache: 'no-store',
    credentials: 'include',
  })
  const data = await response.json()
  console.log('[useAuth] Session data:', data)

  if (data.user) {
    let subscription: Subscription | null = null
    try {
      const subResponse = await fetch('/api/subscription', {
        cache: 'no-store',
        credentials: 'include',
      })
      if (subResponse.ok) {
        subscription = await subResponse.json()
      }
    } catch (e) {
      console.error('Failed to fetch subscription:', e)
    }
    return { session: { user: data.user }, subscription }
  }
  
  return { session: { user: null }, subscription: null }
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session>({ user: null })
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const pathname = usePathname()

  const refresh = useCallback(async () => {
    try {
      const { session: newSession, subscription: newSubscription } = await fetchSessionData()
      setSession(newSession)
      setSubscription(newSubscription)
      setStatus(newSession.user ? 'authenticated' : 'unauthenticated')
    } catch (error) {
      console.error('Failed to fetch session:', error)
      setSession({ user: null })
      setStatus('unauthenticated')
    }
  }, [])

  // Fetch session on mount and on pathname change
  useEffect(() => {
    let mounted = true
    
    async function loadSession() {
      try {
        const { session: newSession, subscription: newSubscription } = await fetchSessionData()
        
        if (!mounted) return
        
        setSession(newSession)
        setSubscription(newSubscription)
        setStatus(newSession.user ? 'authenticated' : 'unauthenticated')
      } catch (error) {
        console.error('Failed to fetch session:', error)
        if (mounted) {
          setSession({ user: null })
          setStatus('unauthenticated')
        }
      }
    }
    
    loadSession()
    
    return () => {
      mounted = false
    }
  }, [pathname])

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  const isUnauthenticated = status === 'unauthenticated'
  const isAdmin = session?.user?.role === 'ADMIN'
  const isClient = session?.user?.role === 'CLIENT'

  const hasActiveSubscription = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIAL'
  const isTrial = subscription?.status === 'TRIAL'
  const isTrialExpired = isTrial && subscription?.trialEndsAt
    ? new Date() > new Date(subscription.trialEndsAt)
    : false

  const sessionsUsed = subscription?.sessionsUsed ?? 0
  const sessionsLimit = subscription?.sessionsLimit ?? 0
  const sessionsRemaining = sessionsLimit - sessionsUsed

  const plan = subscription?.plan ?? null

  return {
    session,
    status,
    isLoading,
    isAuthenticated,
    isUnauthenticated,
    isAdmin,
    isClient,
    subscription,
    hasActiveSubscription,
    isTrial,
    isTrialExpired,
    sessionsUsed,
    sessionsLimit,
    sessionsRemaining,
    plan,
    refresh,
  }
}
