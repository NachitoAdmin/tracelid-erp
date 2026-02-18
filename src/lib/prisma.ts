import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function generateDocumentNumber(
  tenantId: string,
  prefix: string = 'INV'
): Promise<string> {
  const year = new Date().getFullYear()

  const result = await prisma.$transaction(async (tx) => {
    let counter = await tx.documentCounter.findUnique({
      where: {
        tenantId_prefix_year: {
          tenantId,
          prefix,
          year,
        },
      },
    })

    if (!counter) {
      counter = await tx.documentCounter.create({
        data: {
          tenantId,
          prefix,
          year,
          lastNumber: 0,
        },
      })
    }

    const newNumber = counter.lastNumber + 1

    await tx.documentCounter.update({
      where: { id: counter.id },
      data: { lastNumber: newNumber },
    })

    return `${prefix}-${year}-${String(newNumber).padStart(5, '0')}`
  })

  return result
}
