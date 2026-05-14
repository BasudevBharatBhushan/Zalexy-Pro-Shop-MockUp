import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const variant = await db.productVariant.create({
      data: {
        productId: data.productId,
        name: data.name,
        sku: data.sku || null,
        size: data.size || null,
        color: data.color || null,
        price: data.price || null,
        costPrice: data.costPrice || null,
        stockCount: data.stockCount || 0
      }
    })
    
    // Also update product hasVariants
    await db.product.update({
      where: { id: data.productId },
      data: { hasVariants: true }
    })

    if (data.stockCount > 0) {
      await db.inventoryLog.create({
        data: {
          productId: data.productId,
          variantId: variant.id,
          type: 'initial',
          quantity: data.stockCount,
          note: `New variant created: ${variant.name}`,
          staffName: 'System',
          unitCost: data.costPrice || null,
          totalCost: data.costPrice ? data.costPrice * data.stockCount : null,
        }
      })
    }
    
    return NextResponse.json(variant)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
