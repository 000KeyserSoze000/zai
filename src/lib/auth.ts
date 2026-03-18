import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import LinkedInProvider from 'next-auth/providers/linkedin'
import TwitterProvider from 'next-auth/providers/twitter'
import { db } from './db'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

// NextAuth secret - should be set in environment for production
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'ai-command-center-secret-key-2024'

export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[Auth] ========== AUTHORIZE CALLED ==========')
        console.log('[Auth] Email:', credentials?.email)
        console.log('[Auth] Password length:', credentials?.password?.length)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[Auth] FAILED: Missing credentials')
          return null
        }

        try {
          console.log('[Auth] Querying database for user...')
          const user = await db.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          })

          console.log('[Auth] User found:', user ? { id: user.id, email: user.email, role: user.role } : 'NOT FOUND')

          if (!user) {
            console.log('[Auth] FAILED: User not found in database')
            return null
          }

          if (!user.password) {
            console.log('[Auth] FAILED: User has no password in database')
            return null
          }

          console.log('[Auth] Comparing passwords...')
          const passwordMatch = await bcrypt.compare(credentials.password, user.password)
          console.log('[Auth] Password match result:', passwordMatch)

          if (!passwordMatch) {
            console.log('[Auth] FAILED: Password does not match')
            return null
          }

          console.log('[Auth] ========== SUCCESS ==========')
          console.log('[Auth] User ID:', user.id)
          console.log('[Auth] User Email:', user.email)
          console.log('[Auth] User Role:', user.role)

          return {
            id: user.id,
            email: user.email,
            name: user.name || undefined,
            role: user.role,
          }
        } catch (error) {
          console.error('[Auth] ERROR in authorize:', error)
          return null
        }
      },
    }),
    // OAuth Providers - configured via environment variables
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET ? [
      FacebookProvider({
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      })
    ] : []),
    ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET ? [
      LinkedInProvider({
        clientId: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      })
    ] : []),
    ...(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET ? [
      TwitterProvider({
        clientId: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
      })
    ] : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[Auth] ========== SIGNIN CALLBACK ==========')
      console.log('[Auth] User:', user ? { id: user.id, email: user.email, role: user.role } : 'undefined')
      console.log('[Auth] Account provider:', account?.provider)
      
      // For OAuth providers, create or update user
      if (account?.provider && account.provider !== 'credentials') {
        const email = user.email
        
        if (!email) {
          return false
        }

        // Check if user exists
        const existingUser = await db.user.findUnique({
          where: { email },
        })

        if (!existingUser) {
          // Create new user for OAuth
          const newUser = await db.user.create({
            data: {
              email,
              name: user.name || email.split('@')[0],
              role: 'CLIENT',
              password: '', // No password for OAuth users
            },
          })
          
          user.id = newUser.id
          user.role = newUser.role
        } else {
          user.id = existingUser.id
          user.role = existingUser.role
        }
      }
      
      return true
    },
    async jwt({ token, user, trigger, session }) {
      console.log('[Auth] jwt callback - user exists:', !!user, 'trigger:', trigger)
      
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role
        
        // Fetch subscription data
        try {
          const subscription = await db.subscription.findUnique({
            where: { userId: user.id },
            include: { plan: true },
          })
          
          token.subscription = subscription
          console.log('[Auth] JWT - subscription found:', !!subscription)
        } catch (error) {
          console.error('[Auth] Error fetching subscription:', error)
          token.subscription = null
        }
      }
      
      // Update session if triggered
      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }
      
      return token
    },
    async session({ session, token }) {
      console.log('[Auth] session callback - token id:', token?.id)
      
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.subscription = token.subscription as any
      }
      
      return session
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log('[Auth] Event - signIn success:', user.email, 'provider:', account?.provider)
      
      // Create subscription if it doesn't exist (for new users)
      const existingSubscription = await db.subscription.findUnique({
        where: { userId: user.id },
      })

      if (!existingSubscription) {
        // Get the Starter plan for trial
        const starterPlan = await db.plan.findUnique({
          where: { type: 'STARTER' },
        })

        if (starterPlan) {
          const trialEndsAt = new Date()
          trialEndsAt.setDate(trialEndsAt.getDate() + 7) // 7-day trial

          await db.subscription.create({
            data: {
              userId: user.id,
              planId: starterPlan.id,
              status: 'TRIAL',
              trialStartsAt: new Date(),
              trialEndsAt,
              sessionsLimit: starterPlan.sessionsIncluded,
              sessionsUsed: 0,
            },
          })
          
          console.log('[Auth] Created trial subscription for:', user.email)
        }
      }
    },
  },
  debug: true,
}

// Helper function to check if user is admin
export function isAdmin(user: { role: UserRole } | null | undefined): boolean {
  return user?.role === 'ADMIN'
}

// Helper function to check if user has active subscription
export function hasActiveSubscription(user: { subscription: { status: string } | null } | null): boolean {
  const status = user?.subscription?.status
  return status === 'ACTIVE' || status === 'TRIAL'
}

// Helper function to check if trial is expired
export function isTrialExpired(user: { subscription: { trialEndsAt: Date | null, status: string } | null } | null): boolean {
  if (!user?.subscription) return true
  if (user.subscription.status !== 'TRIAL') return false
  if (!user.subscription.trialEndsAt) return true
  return new Date() > new Date(user.subscription.trialEndsAt)
}
