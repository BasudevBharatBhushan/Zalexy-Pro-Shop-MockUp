import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/devices/auto — find or create device by deviceKey
// Used by the client for automatic silent registration on first launch
export async function POST(req: NextRequest) {
  try {
    const { deviceKey, name, location } = await req.json()
    if (!deviceKey) return NextResponse.json({ error: 'deviceKey required' }, { status: 400 })

    // Upsert by deviceKey
    const existing = await db.device.findUnique({ where: { deviceKey } })
    if (existing) return NextResponse.json(existing)

    const device = await db.device.create({
      data: {
        name: name || 'POS Terminal',
        location: location || 'Main',
        deviceKey,
        registeredBy: 'Auto',
        isActive: true,
      }
    })
    return NextResponse.json(device, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
