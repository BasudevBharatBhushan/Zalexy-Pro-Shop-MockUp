import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/register/sessions?deviceId=&status=
// POST /api/register/sessions — open a session
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const deviceId = searchParams.get('deviceId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (deviceId) where.deviceId = deviceId
    if (status) where.status = status

    const sessions = await db.registerSession.findMany({
      where,
      orderBy: { openedAt: 'desc' },
      include: { movements: true, override: true, device: true },
      take: 50,
    })
    return NextResponse.json(sessions)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { deviceId, staffName, openingActual } = await req.json()

    if (!deviceId || !staffName) {
      return NextResponse.json({ error: 'deviceId and staffName required' }, { status: 400 })
    }

    // Check if device is registered and active
    const device = await db.device.findUnique({ where: { id: deviceId } })
    if (!device || !device.isActive) {
      return NextResponse.json({ error: 'Device not registered or inactive' }, { status: 403 })
    }

    // Check for an already-open session on this device
    const existingOpen = await db.registerSession.findFirst({
      where: { deviceId, status: 'open' }
    })
    if (existingOpen) {
      return NextResponse.json({
        error: 'A session is already open on this device. Force-close it first.',
        existingSession: existingOpen
      }, { status: 409 })
    }

    // Get carry-forward from last closed session
    const lastSession = await db.registerSession.findFirst({
      where: { deviceId, status: 'closed' },
      orderBy: { closedAt: 'desc' }
    })
    const openingExpected = lastSession?.carryForward ?? 0
    const actualAmount = parseFloat(openingActual) || 0
    const variance = actualAmount - openingExpected
    const flagged = variance !== 0

    const session = await db.registerSession.create({
      data: {
        deviceId,
        staffName,
        status: 'open',
        openingExpected,
        openingActual: actualAmount,
        openingVariance: variance,
        openingFlagged: flagged,
      },
      include: { device: true }
    })

    return NextResponse.json(session, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to open session' }, { status: 500 })
  }
}

// PATCH — close session or force-close with override
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, action, closingActual, override, forceClose } = body

    if (!id) return NextResponse.json({ error: 'Session ID required' }, { status: 400 })

    const session = await db.registerSession.findUnique({
      where: { id },
      include: { movements: true }
    })
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    if (action === 'close') {
      // Calculate expected closing: opening cash + cash sales - deposits
      const cashMovementsNet = session.movements.reduce((sum, m) => {
        if (m.type === 'deposit') return sum - m.amount
        if (m.type === 'adjustment') return sum + m.amount
        if (m.type === 'payout' || m.type === 'tip-payout') return sum - m.amount
        return sum
      }, 0)

      // Note: cash sales would come from orders — simplified here
      const closingExpected = session.openingActual + cashMovementsNet
      const actual = parseFloat(closingActual) || 0
      const closingVariance = actual - closingExpected
      const TOLERANCE = 0.01

      // If variance and no override — block
      if (Math.abs(closingVariance) > TOLERANCE && !override && !forceClose) {
        return NextResponse.json({
          requiresOverride: true,
          closingExpected,
          closingVariance,
          message: `Variance of $${Math.abs(closingVariance).toFixed(2)} requires manager override`
        }, { status: 422 })
      }

      // If override provided — save it
      if (override) {
        await db.managerOverride.create({
          data: {
            sessionId: id,
            varianceAmount: closingVariance,
            reasonCode: override.reasonCode,
            notes: override.notes || null,
            approvedBy: override.approvedBy,
          }
        })
      }

      const updated = await db.registerSession.update({
        where: { id },
        data: {
          status: 'closed',
          closingExpected,
          closingActual: actual,
          closingVariance,
          carryForward: actual,
          closedAt: new Date(),
        },
        include: { movements: true, override: true, device: true }
      })

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
