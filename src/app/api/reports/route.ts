import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Daily sales, register session summaries
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'daily-sales'
    const date = searchParams.get('date') // YYYY-MM-DD

    if (type === 'daily-sales') {
      const targetDate = date ? new Date(date) : new Date()
      const start = new Date(targetDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(targetDate)
      end.setHours(23, 59, 59, 999)

      const orders = await db.order.findMany({
        where: { createdAt: { gte: start, lte: end }, status: { not: 'void' } },
        include: { orderItems: true }
      })

      const byPaymentMethod: Record<string, number> = {}
      let totalSales = 0, totalTips = 0, totalDiscounts = 0

      orders.forEach(o => {
        totalSales += o.total
        totalTips += o.tip || 0
        totalDiscounts += o.discount || 0
      })

      return NextResponse.json({
        date: targetDate.toISOString().split('T')[0],
        totalOrders: orders.length,
        totalSales,
        totalTips,
        totalDiscounts,
        byPaymentMethod,
        orders: orders.map(o => ({ id: o.id, orderNumber: o.orderNumber, total: o.total, tip: o.tip, discount: o.discount, status: o.status }))
      })
    }

    if (type === 'session-summary') {
      const sessions = await db.registerSession.findMany({
        orderBy: { openedAt: 'desc' },
        include: { movements: true, override: true, device: true },
        take: 30
      })
      return NextResponse.json(sessions)
    }

    if (type === 'movements') {
      const sessionId = searchParams.get('sessionId')
      const where: Record<string, unknown> = {}
      if (sessionId) where.sessionId = sessionId
      const movements = await db.cashMovement.findMany({ where, orderBy: { createdAt: 'desc' } })
      return NextResponse.json(movements)
    }

    return NextResponse.json({ error: 'Unknown report type' }, { status: 400 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
