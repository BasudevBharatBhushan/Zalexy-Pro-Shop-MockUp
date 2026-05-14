import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/staff
// POST /api/staff
export async function GET() {
  try {
    const staff = await db.staff.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(staff)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, pin, role } = await req.json()
    if (!name || !pin) return NextResponse.json({ error: 'Name and PIN required' }, { status: 400 })
    const member = await db.staff.create({ data: { name, pin, role: role || 'cashier' } })
    return NextResponse.json(member, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// PATCH /api/staff — validate PIN
export async function PATCH(req: NextRequest) {
  try {
    const { pin, requiredRole } = await req.json()
    if (!pin) return NextResponse.json({ valid: false, error: 'PIN required' }, { status: 400 })

    const staff = await db.staff.findFirst({ where: { pin, isActive: true } })
    if (!staff) return NextResponse.json({ valid: false, error: 'Invalid PIN' }, { status: 401 })

    const roles = ['cashier', 'manager', 'executive']
    const staffRoleIndex = roles.indexOf(staff.role)
    const requiredRoleIndex = roles.indexOf(requiredRole || 'cashier')

    if (staffRoleIndex < requiredRoleIndex) {
      return NextResponse.json({ valid: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    return NextResponse.json({ valid: true, staff: { id: staff.id, name: staff.name, role: staff.role } })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
