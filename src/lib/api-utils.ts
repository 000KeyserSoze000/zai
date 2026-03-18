import { z, ZodError } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// JWT Secret - must match login and session API
const SECRET = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'ai-command-center-secret-key-2024'
)

// ============================================
// API Response Helpers
// ============================================

export function apiSuccess<T>(data: T, status = 200) {
    return NextResponse.json({ success: true, data }, { status })
}

export function apiError(message: string, status = 400) {
    return NextResponse.json({ success: false, error: message }, { status })
}

// ============================================
// Auth Helpers
// ============================================

export interface AuthUser {
    id: string
    email: string
    name?: string
    role: 'ADMIN' | 'CLIENT'
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
    try {
        const token = request.cookies.get('auth-token')?.value
        
        if (!token) {
            return null
        }
        
        const { payload } = await jwtVerify(token, SECRET)
        
        return {
            id: payload.id as string,
            email: payload.email as string,
            name: payload.name as string | undefined,
            role: payload.role as 'ADMIN' | 'CLIENT',
        }
    } catch (error) {
        console.error('[getAuthUser] Token verification failed:', error)
        return null
    }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
    const user = await getAuthUser(request)
    
    if (!user) {
        throw new ApiError('Non autorisé', 401)
    }
    
    return user
}

export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
    const user = await requireAuth(request)
    if (user.role !== 'ADMIN') {
        throw new ApiError('Accès administrateur requis', 403)
    }
    return user
}

// ============================================
// API Error Class
// ============================================

export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode: number = 400
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

// ============================================
// Request Handler Wrapper
// ============================================

type HandlerFn = (
    req: NextRequest,
    context?: { params: Record<string, string> }
) => Promise<NextResponse>

/**
 * Wraps an API route handler with error handling and optional auth check.
 */
export function withApiHandler(
    handler: HandlerFn,
    options?: { requireAuth?: boolean; requireAdmin?: boolean }
): HandlerFn {
    return async (req, context) => {
        try {
            // Auth checks
            if (options?.requireAdmin) {
                await requireAdmin(req)
            } else if (options?.requireAuth) {
                await requireAuth(req)
            }

            return await handler(req, context)
        } catch (error) {
            if (error instanceof ApiError) {
                return apiError(error.message, error.statusCode)
            }
            if (error instanceof ZodError) {
                const messages = error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
                return apiError(`Validation: ${messages.join(', ')}`, 422)
            }
            console.error('[API Error]', error)
            return apiError('Erreur interne du serveur', 500)
        }
    }
}

// ============================================
// Validation Schemas
// ============================================

export const generateSchema = z.object({
    type: z.enum(['metadata', 'artistic', 'social']),
    context: z.string().min(10, 'Le contexte doit faire au moins 10 caractères').max(5000),
    metadata: z.object({
        title: z.string().optional(),
        tags: z.array(z.string()).optional(),
        description: z.string().optional(),
    }).optional(),
})

export const generateThumbnailSchema = z.object({
    prompt: z.string().min(5, 'Le prompt doit faire au moins 5 caractères').max(2000),
    size: z.string().default('1344x768'),
})

export const analyzeVideoSchema = z.object({
    videoUrl: z.string().url('URL de vidéo invalide'),
    context: z.string().optional(),
})

export const registerSchema = z.object({
    name: z.string().min(2, 'Le nom doit faire au moins 2 caractères').max(100),
    email: z.string().email('Email invalide'),
    password: z.string()
        .min(8, 'Le mot de passe doit faire au moins 8 caractères')
        .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
        .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
})

export const settingsSchema = z.object({
    siteName: z.string().max(200).optional(),
    siteUrl: z.string().url().optional(),
    siteEmail: z.string().email().optional(),
    timezone: z.string().optional(),
    defaultUserGroup: z.enum(['CLIENT', 'ADMIN']).optional(),
    enableRecaptcha: z.boolean().optional(),
    enableAnalytics: z.boolean().optional(),
    oauthEnabled: z.boolean().optional(),
    maintenanceMode: z.boolean().optional(),
}).passthrough()

// ============================================
// Rate Limiting (In-Memory - Simple)
// ============================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
    identifier: string,
    maxRequests = 30,
    windowMs = 60_000
): boolean {
    const now = Date.now()
    const entry = rateLimitMap.get(identifier)

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs })
        return true
    }

    if (entry.count >= maxRequests) {
        return false
    }

    entry.count++
    return true
}

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of rateLimitMap.entries()) {
            if (now > entry.resetAt) {
                rateLimitMap.delete(key)
            }
        }
    }, 300_000)
}
