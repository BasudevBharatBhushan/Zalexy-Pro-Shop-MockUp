import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/inventory-log?productId=xxx&limit=50
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (productId) {
      where.productId = productId
    }

    const logs = await db.inventoryLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        product: {
          select: { id: true, name: true, sku: true },
        },
      },
    })

    return NextResponse.json(logs)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory logs' }, { status: 500 })
  }
}

// POST /api/inventory-log — create an adjustment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, type, quantity, note, staffName, poNumber, unitCost, totalCost } = body

    if (!productId || !type || quantity === undefined) {
      return NextResponse.json(
        { error: 'productId, type, and quantity are required' },
        { status: 400 }
      )
    }
    
    // Support receiving type as well
    const validTypes = ['restock', 'adjustment', 'sale', 'void', 'return', 'receiving', 'initial']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const { variantId } = body
    
    let previousStock = 0
    let newStock = 0
    let updatedEntity: any = null

    if (variantId) {
      const variant = await db.productVariant.findUnique({ where: { id: variantId } })
      if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
      
      previousStock = variant.stockCount
      newStock = Math.max(0, variant.stockCount + quantity)
      
      updatedEntity = await db.productVariant.update({
        where: { id: variantId },
        data: { stockCount: newStock, inStock: newStock > 0 }
      })
    } else {
      // Get current product
      const product = await db.product.findUnique({ where: { id: productId } })
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      // Calculate new stock count
      previousStock = product.stockCount
      newStock = Math.max(0, product.stockCount + quantity)

      // Update product stock
      updatedEntity = await db.product.update({
        where: { id: productId },
        data: {
          stockCount: newStock,
          inStock: newStock > 0,
        },
      })
    }

    // Create log entry
    const log = await db.inventoryLog.create({
      data: {
        productId,
        variantId: variantId || null,
        type,
        quantity,
        note: note || null,
        staffName: staffName || null,
        poNumber: poNumber || null,
        unitCost: unitCost !== undefined ? parseFloat(unitCost) : null,
        totalCost: totalCost !== undefined ? parseFloat(totalCost) : null,
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true },
        },
      },
    })

    return NextResponse.json({
      log,
      product: updatedEntity,
      previousStock,
      newStock,
    })
  } catch (error) {
    console.error('Inventory adjustment error:', error)
    return NextResponse.json({ error: 'Failed to create adjustment' }, { status: 500 })
  }
}
