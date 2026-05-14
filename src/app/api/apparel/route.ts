import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apparel = await db.apparel.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(apparel)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch apparel' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, price, size, color, stockCount, sku, image, category } = body

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
    }

    const apparel = await db.apparel.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        size: size || 'M',
        color: color || 'Black',
        stockCount: stockCount || 0,
        sku: sku || null,
        image: image || null,
        category: category || 'Shirts',
      },
    })

    return NextResponse.json(apparel, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create apparel' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Apparel ID is required' }, { status: 400 })
    }

    await db.apparel.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete apparel' }, { status: 500 })
  }
}
