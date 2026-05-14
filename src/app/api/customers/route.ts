import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(customers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, isMember } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
    }

    const customer = await db.customer.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        isMember: Boolean(isMember),
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Create customer error:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
