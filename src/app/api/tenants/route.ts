import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    })

    return NextResponse.json(tenants)
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, country } = body

    if (!name || !country) {
      return NextResponse.json(
        { error: 'name and country are required' },
        { status: 400 }
      )
    }

    const tenant = await prisma.tenant.create({
      data: { name, country },
    })

    return NextResponse.json(tenant, { status: 201 })
  } catch (error) {
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    )
  }
}