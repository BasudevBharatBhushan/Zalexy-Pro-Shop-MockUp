import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    let settings = await db.settings.findUnique({ where: { id: "default" } })
    if (!settings) {
      settings = await db.settings.create({ data: { id: "default", tipPresets: "[15, 18, 20]" } })
    }
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { tipPresets } = await request.json()
    const settings = await db.settings.upsert({
      where: { id: "default" },
      update: { tipPresets: JSON.stringify(tipPresets) },
      create: { id: "default", tipPresets: JSON.stringify(tipPresets) }
    })
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
