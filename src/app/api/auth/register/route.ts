import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { checkRateLimit, apiError } from '@/lib/api-utils'
import { z } from 'zod'

// Validation
const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit faire au moins 2 caractères').max(100),
  email: z.string().email('Email invalide'),
  password: z.string()
    .min(8, 'Le mot de passe doit faire au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 registrations per minute per IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(`register:${ip}`, 5, 60_000)) {
      return apiError('Trop de tentatives. Réessayez dans une minute.', 429)
    }

    // Validate input with Zod
    const body = registerSchema.parse(await request.json())
    const { email, password, name } = body

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        role: 'CLIENT',
      },
    })

    // Get Starter plan for trial
    const starterPlan = await db.plan.findUnique({
      where: { type: 'STARTER' },
    })

    if (starterPlan) {
      // Create trial subscription
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
    }

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    )
  }
}
