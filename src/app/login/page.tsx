'use client'

import { Suspense, useEffect } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, LogIn, MousePointerClick } from 'lucide-react'
import { OAuthButtons } from '@/components/oauth-buttons'

// Demo credentials - ContentPro
const DEMO_CREDENTIALS = {
  admin: { email: 'admin@contentpro.fr', password: 'Admin123!', role: 'ADMIN' },
  client: { email: 'client@contentpro.fr', password: 'Client123!', role: 'CLIENT' },
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingRole, setLoadingRole] = useState<string | null>(null)

  const performLogin = async (loginEmail: string, loginPassword: string, role?: string) => {
    setError('')
    setIsLoading(true)
    if (role) setLoadingRole(role)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Email ou mot de passe incorrect')
        setIsLoading(false)
        setLoadingRole(null)
        return
      }

      console.log('[Login] Success:', data.user)

      // Redirect based on role
      if (data.user?.role === 'ADMIN') {
        router.push('/admin')
      } else if (callbackUrl) {
        router.push(callbackUrl)
      } else {
        router.push('/')
      }
      router.refresh()
    } catch (err) {
      console.error('[Login] Error:', err)
      setError('Une erreur est survenue')
      setIsLoading(false)
      setLoadingRole(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await performLogin(email, password)
  }

  const handleQuickLogin = async (type: 'admin' | 'client') => {
    const creds = DEMO_CREDENTIALS[type]
    setEmail(creds.email)
    setPassword(creds.password)
    await performLogin(creds.email, creds.password, creds.role)
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <CardTitle className="text-white">Connexion</CardTitle>
        <CardDescription>
          Entrez vos identifiants pour accéder à votre compte
        </CardDescription>
      </CardHeader>

      {/* Demo Credentials */}
      <div className="px-6 pb-4">
        <div className="p-4 bg-neutral-800/50 border border-neutral-700 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-neutral-400" />
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Cliquez pour vous connecter</p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              disabled={isLoading}
              className="w-full flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg hover:bg-orange-500/20 hover:border-orange-500 transition-all cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                {loadingRole === 'ADMIN' ? (
                  <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                ) : (
                  <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded">ADMIN</span>
                )}
                <span className="text-sm text-white font-mono">admin@contentpro.fr</span>
              </div>
              <span className="text-sm text-neutral-300 font-mono">Admin123!</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('client')}
              disabled={isLoading}
              className="w-full flex items-center justify-between p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 hover:border-cyan-500 transition-all cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                {loadingRole === 'CLIENT' ? (
                  <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                ) : (
                  <span className="px-2 py-0.5 bg-cyan-500 text-white text-xs font-medium rounded">CLIENT</span>
                )}
                <span className="text-sm text-white font-mono">client@contentpro.fr</span>
              </div>
              <span className="text-sm text-neutral-300 font-mono">Client123!</span>
            </button>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connexion...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Se connecter
              </>
            )}
          </Button>
          
          {/* OAuth Buttons */}
          <OAuthButtons />
          
          <p className="text-sm text-neutral-400 text-center">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-orange-500 hover:text-orange-400 font-medium">
              Créer un compte
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

function LoginLoading() {
  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <CardTitle className="text-white">Connexion</CardTitle>
        <CardDescription>Chargement...</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/20 rounded-2xl mb-4">
            <span className="text-3xl font-bold text-orange-500">CP</span>
          </div>
          <h1 className="text-2xl font-bold text-white">ContentPro</h1>
          <p className="text-neutral-400 mt-2">Connectez-vous à votre espace</p>
        </div>

        <Suspense fallback={<LoginLoading />}>
          <LoginContent />
        </Suspense>

        {/* Trial info */}
        <div className="mt-6 p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg text-center">
          <p className="text-sm text-neutral-400">
            🎁 <span className="text-white font-medium">Essai gratuit 7 jours</span> - 1 session incluse sans carte bancaire
          </p>
        </div>
      </div>
    </div>
  )
}
