import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Log the host being used by the environment (Redacted for security)
const fullUrl = process.env.PRODUCTION_DB_URL || '';
const host = fullUrl.split('@')[1]?.split(':')[0] || 'NOT_SET';
console.log(`[Database] Initializing Prisma with PRODUCTION_DB_URL host: ${host}`);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db