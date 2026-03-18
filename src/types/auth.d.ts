import { UserRole, Subscription, Plan } from '@prisma/client'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      subscription: (Subscription & { plan: Plan }) | null
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: UserRole
    subscription: (Subscription & { plan: Plan }) | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    subscription: (Subscription & { plan: Plan }) | null
  }
}
