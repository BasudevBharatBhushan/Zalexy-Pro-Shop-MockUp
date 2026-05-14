import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (category && category !== 'All') {
      where.category = category
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ]
    }

    const products = await db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { variants: true },
    })

    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, category, image, inStock, stockCount, reorderPoint, sku, barcode, unitType, costPrice, memberPrice } = body

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
    }

    const product = await db.product.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        category: category || 'General',
        image: image || null,
        inStock: inStock !== false,
        stockCount: stockCount || 0,
        reorderPoint: reorderPoint !== undefined ? parseInt(reorderPoint) : 10,
        sku: sku || null,
        barcode: barcode || null,
        unitType: unitType || 'pcs',
        costPrice: costPrice !== undefined ? parseFloat(costPrice) : 0,
        memberPrice: memberPrice !== undefined ? parseFloat(memberPrice) : null,
      },
    })

    // Log initial stock
    await db.inventoryLog.create({
      data: {
        productId: product.id,
        type: 'initial',
        quantity: product.stockCount,
        note: `New product created: ${product.name}`,
        staffName: 'System',
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const product = await db.product.update({
      where: { id },
      data: {
        ...data,
        price: data.price !== undefined ? parseFloat(data.price) : undefined,
        stockCount: data.stockCount !== undefined ? parseInt(data.stockCount) : undefined,
        reorderPoint: data.reorderPoint !== undefined ? parseInt(data.reorderPoint) : undefined,
        costPrice: data.costPrice !== undefined ? parseFloat(data.costPrice) : undefined,
        memberPrice: data.memberPrice !== undefined ? parseFloat(data.memberPrice) : undefined,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    await db.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
