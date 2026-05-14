import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    const where: Record<string, unknown> = {}
    if (sessionId) where.sessionId = sessionId

    const movements = await db.cashMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(movements)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, type, amount, reason, notes, approvedBy } = await req.json()

    if (!sessionId || !type || !amount || !reason || !approvedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify session is open
    const session = await db.registerSession.findUnique({ where: { id: sessionId } })
    if (!session || session.status !== 'open') {
      return NextResponse.json({ error: 'No open session found' }, { status: 403 })
    }

    const movement = await db.cashMovement.create({
      data: {
        sessionId,
        type,
        amount: parseFloat(amount),
        reason,
        notes: notes || null,
        approvedBy
      }
    })
    return NextResponse.json(movement, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
