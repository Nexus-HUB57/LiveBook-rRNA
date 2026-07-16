import { PrismaClient } from '@prisma/client'

// Ensure DATABASE_URL is always available (required for Space-Z deploy where .env is absent)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./chimera.db'
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db