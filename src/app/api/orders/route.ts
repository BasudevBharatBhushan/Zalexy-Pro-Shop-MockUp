import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const dateParam = searchParams.get('date') // format: YYYY-MM-DD

    const where: Record<string, unknown> = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (dateParam) {
      const start = new Date(dateParam + 'T00:00:00.000Z')
      const end = new Date(dateParam + 'T23:59:59.999Z')
      where.createdAt = { gte: start, lte: end }
    }
    if (search) {
      const searchNum = parseFloat(search)
      const orConditions: any[] = [
        { customerName: { contains: search } },
        { location: { contains: search } },
        { customer: { phone: { contains: search } } },
        { customer: { name: { contains: search } } },
      ]
      if (!isNaN(searchNum)) {
        orConditions.push({ orderNumber: { equals: searchNum } })
        orConditions.push({ total: { equals: searchNum } })
      }
      where.OR = orConditions
    }

    type OrderByType = Record<string, string>
    let orderBy: OrderByType = { createdAt: 'desc' }
    if (sortBy === 'oldest') orderBy = { createdAt: 'asc' }
    if (sortBy === 'highest') orderBy = { total: 'desc' }
    if (sortBy === 'lowest') orderBy = { total: 'asc' }
    if (sortBy === 'number') orderBy = { orderNumber: 'desc' }

    const orders = await db.order.findMany({
      where,
      orderBy,
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, customerId, location, tabType, items, notes, discount = 0, discountType, tip = 0, customerEmail } = body

    // Get the next order number
    const lastOrder = await db.order.findFirst({
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    })
    const nextNumber = (lastOrder?.orderNumber || 1000) + 1

    const itemTotal = items?.reduce((sum: number, item: { price: number; quantity: number }) => {
      return sum + item.price * item.quantity
    }, 0) || 0
    const tax = Math.max(0, itemTotal - (discountType === 'percentage' ? (itemTotal * discount) / 100 : discount)) * 0.08
    const total = Math.max(0, itemTotal - (discountType === 'percentage' ? (itemTotal * discount) / 100 : discount)) + tax + tip

    const order = await db.order.create({
      data: {
        orderNumber: nextNumber,
        status: tabType === 'open-tab' ? 'open' : 'closed',
        tabType: tabType || 'walk-in',
        customerName: customerName || null,
        customerId: customerId || null,
        location: location || null,
        total,
        discount,
        discountType: discountType || null,
        tip,
        balance: tabType === 'open-tab' ? total : 0,
        paid: tabType === 'open-tab' ? 0 : total,
        notes: notes || null,
        orderItems: items
          ? {
              create: items.map((item: { productId: string; quantity: number; price: number; subtotal: number }) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal,
              })),
            }
          : undefined,
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, customerName, customerId, location, notes, items, tabType, discount = 0, discountType, tip = 0 } = body

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const existingOrder = await db.order.findUnique({
      where: { id },
      include: { orderItems: true },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (customerName !== undefined) updateData.customerName = customerName || null
    if (customerId !== undefined) updateData.customerId = customerId || null
    if (location !== undefined) updateData.location = location || null
    if (notes !== undefined) updateData.notes = notes || null
    if (tabType !== undefined) updateData.tabType = tabType

    // If items are provided, recalculate totals and replace items
    if (items && Array.isArray(items)) {
      const itemTotal = items.reduce((sum: number, item: { price: number; quantity: number }) => {
        return sum + item.price * item.quantity
      }, 0)
      const tax = Math.max(0, itemTotal - (discountType === 'percentage' ? (itemTotal * discount) / 100 : discount)) * 0.08
      const total = Math.max(0, itemTotal - (discountType === 'percentage' ? (itemTotal * discount) / 100 : discount)) + tax + tip

      updateData.total = total
      updateData.discount = discount
      updateData.discountType = discountType || null
      updateData.tip = tip
      
      const newTabType = updateData.tabType || existingOrder.tabType
      if (newTabType === 'open-tab' && (!status || status === 'open')) {
        updateData.paid = 0
        updateData.balance = total
        updateData.status = 'open'
      } else {
        updateData.paid = total
        updateData.balance = 0
        updateData.status = status || 'closed'
      }

      // Delete existing items and create new ones
      await db.orderItem.deleteMany({ where: { orderId: id } })
      updateData.orderItems = {
        create: items.map((item: { productId: string; quantity: number; price: number; subtotal: number }) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
      }
    }

    // If status is being changed to closed, calculate paid
    if (status === 'closed' && !items) {
      updateData.paid = existingOrder.total
      updateData.balance = 0
    }

    // If status is being changed to open from hold
    if (status === 'open') {
      updateData.status = 'open'
    }

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    await db.order.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}
