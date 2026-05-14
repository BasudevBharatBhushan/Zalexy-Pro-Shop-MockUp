import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/devices — list all devices
// POST /api/devices — register new device
export async function GET() {
  try {
    const devices = await db.device.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(devices)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, location, registeredBy } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    // Generate a unique device key
    const deviceKey = `DEV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    const device = await db.device.create({
      data: { name, location: location || 'Main', registeredBy: registeredBy || 'Executive', deviceKey }
    })
    return NextResponse.json(device, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json()
    const device = await db.device.update({ where: { id }, data })
    return NextResponse.json(device)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
