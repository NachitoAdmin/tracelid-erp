import { NextRequest, NextResponse } from 'next/server'
import { prisma, generateDocumentNumber } from '@/lib/prisma'

const VALID_TRANSACTION_TYPES = ['SALE', 'RETURN', 'REBATE', 'DISCOUNT', 'COST'] as const
type TransactionType = typeof VALID_TRANSACTION_TYPES[number]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const type = searchParams.get('type')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      )
    }

    const where: any = { tenantId }
    if (type) {
      where.transactionType = type.toUpperCase()
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { tenant: { select: { name: true, country: true } } },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, transactionType, amount, description } = body

    if (!tenantId || !transactionType || amount === undefined) {
      return NextResponse.json(
        { error: 'tenantId, transactionType, and amount are required' },
        { status: 400 }
      )
    }

    const upperType = transactionType.toUpperCase()
    if (!VALID_TRANSACTION_TYPES.includes(upperType as TransactionType)) {
      return NextResponse.json(
        { error: `Invalid transaction type. Must be one of: ${VALID_TRANSACTION_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const documentNumber = await generateDocumentNumber(tenantId)

    const transaction = await prisma.transaction.create({
      data: {
        documentNumber,
        transactionType: upperType,
        amount: parseFloat(amount),
        description,
        tenantId,
      },
      include: { tenant: { select: { name: true, country: true } } },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}