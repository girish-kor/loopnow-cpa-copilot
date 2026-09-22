import { PrismaClient } from "@prisma/client";

/**
 * Lazy pool so importing this module during `next build` / typecheck
 * does not require DATABASE_URL to be present at module load time.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export type DB = typeof db;
