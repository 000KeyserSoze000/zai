import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Same secret priority as login and session - CRITICAL for JWT verification
const SECRET = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'ai-command-center-secret-key-2024'
)

// Routes that require authentication
const PROTECTED_ROUTES = [
    '/admin',
    '/command-center',
    '/orchestrator',
    '/library',
    '/analytics',
    '/settings',
    '/users',
    '/subscriptions',
]

// Routes that require ADMIN role
const ADMIN_ROUTES = [
    '/admin',
    '/users',
    '/subscriptions',
    '/api/admin',
]

// Routes that are always accessible (even during maintenance for admins)
const AUTH_ROUTES = [
    '/login',
    '/register',
    '/api/auth',
]

// API routes that are always public (no auth needed)
const PUBLIC_API_ROUTES = [
    '/api/oauth-settings',
    '/api/test-auth',
    '/api/auth/clear-cookies',
    '/api/maintenance-status',
]

async function getUserFromToken(request: NextRequest): Promise<{ id: string; email: string; role: string } | null> {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
        return null
    }
    
    try {
        const { payload } = await jwtVerify(token, SECRET)
        return {
            id: payload.id as string,
            email: payload.email as string,
            role: payload.role as string,
        }
    } catch {
        return null
    }
}

// In-memory cache for maintenance mode (with TTL)
let maintenanceCache = {
    enabled: false,
    message: null as string | null,
    lastCheck: 0,
    ttl: 5000 // 5 seconds for faster response
}

async function checkMaintenanceMode(request: NextRequest): Promise<{ enabled: boolean; message: string | null }> {
    const now = Date.now()
    
    // Return cached value if still valid
    if (now - maintenanceCache.lastCheck < maintenanceCache.ttl) {
        return { enabled: maintenanceCache.enabled, message: maintenanceCache.message }
    }
    
    try {
        // Fetch maintenance status from internal API
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
            (request.headers.get('host') ? `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}` : 'http://localhost:3000')
        
        const response = await fetch(`${baseUrl}/api/maintenance-status`, {
            cache: 'no-store',
        })
        
        if (response.ok) {
            const data = await response.json()
            maintenanceCache = {
                enabled: data.maintenanceMode || false,
                message: data.maintenanceMessage,
                lastCheck: now,
                ttl: 5000
            }
        }
    } catch (error) {
        console.error('Error checking maintenance mode:', error)
    }
    
    return { enabled: maintenanceCache.enabled, message: maintenanceCache.message }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 200 })
        response.headers.set('Access-Control-Allow-Origin', '*')
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return response
    }

    // Allow maintenance page itself
    if (pathname === '/maintenance') {
        return NextResponse.next()
    }

    // IMPORTANT: Allow public API routes FIRST to prevent infinite loop
    // These routes must be accessible without checking maintenance mode
    if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
        return NextResponse.next()
    }

    // Allow static files and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next()
    }

    // Get user from token
    const user = await getUserFromToken(request)

    // Check maintenance mode (now safe because public routes are already handled)
    const maintenance = await checkMaintenanceMode(request)
    
    // If maintenance mode is enabled, only allow admins
    if (maintenance.enabled) {
        // If user is admin, allow access to everything
        if (user?.role === 'ADMIN') {
            const response = NextResponse.next()
            addSecurityHeaders(response)
            return response
        }
        
        // IMPORTANT: Allow login page so admins can connect and disable maintenance
        // But block /api/auth/register to prevent new registrations during maintenance
        if (pathname === '/login' || pathname.startsWith('/api/auth/login')) {
            return NextResponse.next()
        }
        
        // Block register page during maintenance
        if (pathname === '/register' || pathname.startsWith('/api/auth/register')) {
            const maintenanceUrl = new URL('/maintenance', request.url)
            return NextResponse.redirect(maintenanceUrl)
        }
        
        // For all other routes, redirect non-admins to maintenance page
        const maintenanceUrl = new URL('/maintenance', request.url)
        return NextResponse.redirect(maintenanceUrl)
    }

    // Allow auth routes when not in maintenance mode
    if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
        return NextResponse.next()
    }

    // Check if user is authenticated for protected routes
    const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
    const isApiRoute = pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')

    if ((isProtected || isApiRoute) && !user) {
        // API routes return 401 JSON
        if (isApiRoute) {
            return NextResponse.json(
                { error: 'Non autorisé. Veuillez vous connecter.' },
                { status: 401 }
            )
        }
        // Page routes redirect to login
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Check admin access
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))
    if (isAdminRoute && user?.role !== 'ADMIN') {
        if (isApiRoute) {
            return NextResponse.json(
                { error: 'Accès refusé. Droits administrateur requis.' },
                { status: 403 }
            )
        }
        return NextResponse.redirect(new URL('/', request.url))
    }

    // Add security headers
    const response = NextResponse.next()
    addSecurityHeaders(response)
    return response
}

function addSecurityHeaders(response: NextResponse) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'ALLOWALL')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
