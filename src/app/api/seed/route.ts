import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const existingProducts = await db.product.count()
    if (existingProducts > 0) {
      return NextResponse.json({ message: 'Data already seeded' })
    }

    // ── Customers ──
    await db.customer.createMany({
      data: [
        { name: 'Smith Family', email: 'smith@email.com', phone: '(555) 123-4567' },
        { name: 'Johnson Party', email: 'johnson@email.com', phone: '(555) 234-5678' },
        { name: 'Corporate Event - Acme Inc', email: 'events@acme.com', phone: '(555) 345-6789' },
        { name: 'Mike T.', email: 'mike.t@email.com', phone: '(555) 456-7890' },
        { name: 'Davis Group', email: null, phone: '(555) 567-8901' },
        { name: 'Walker, K.', email: 'walker.k@email.com', phone: '(555) 678-9012' },
        { name: 'Chen, L.', email: null, phone: '(555) 789-0123' },
        { name: 'Rodriguez Party', email: 'rodriguez@email.com', phone: '(555) 890-1234' },
        { name: 'Birthday - Emma (age 8)', email: null, phone: '(555) 901-2345' },
        { name: 'Lee League Night', email: 'league@lee.com', phone: '(555) 012-3456' },
        { name: 'Brown, J.', email: null, phone: null },
        { name: 'Jake R.', email: 'jake.r@email.com', phone: '(555) 111-2222' },
        { name: 'Sarah M.', email: 'sarah.m@strikepos.com', phone: '(555) 333-4444' },
      ],
    })

    const allCustomers = await db.customer.findMany()
    const cust = (name: string) => allCustomers.find(c => c.name === name)!

    // ── Products ──
    await db.product.createMany({
      data: [
        { name: 'Lane Rental (1hr)', description: 'Standard lane rental', price: 28.25, costPrice: 5.00, category: 'Bowling', inStock: true, stockCount: 20, reorderPoint: 5, sku: 'LR-001' },
        { name: 'Lane Rental (2hr)', description: 'Extended lane rental', price: 49.99, costPrice: 9.00, category: 'Bowling', inStock: true, stockCount: 15, reorderPoint: 5, sku: 'LR-002' },
        { name: 'Shoe Rental', description: 'Bowling shoe rental', price: 4.50, costPrice: 0.50, category: 'Bowling', inStock: true, stockCount: 50, reorderPoint: 15, sku: 'SR-001' },
        { name: 'Energy Drink', description: '16oz energy drink', price: 4.52, costPrice: 1.25, category: 'Beverages', inStock: true, stockCount: 48, reorderPoint: 12, sku: 'BE-001' },
        { name: 'Bottled Water', description: '16oz bottled water', price: 2.83, costPrice: 0.40, category: 'Beverages', inStock: true, stockCount: 72, reorderPoint: 20, sku: 'BW-001' },
        { name: 'Craft Beer', description: 'Local craft beer draft', price: 7.99, costPrice: 2.50, category: 'Beverages', inStock: true, stockCount: 8, reorderPoint: 10, sku: 'CB-001' },
        { name: 'Soda', description: 'Fountain soda 20oz', price: 3.25, costPrice: 0.60, category: 'Beverages', inStock: true, stockCount: 60, reorderPoint: 15, sku: 'SD-001' },
        { name: 'Nachos', description: 'Loaded nachos with cheese', price: 8.99, costPrice: 2.00, category: 'Food', inStock: true, stockCount: 25, reorderPoint: 8, sku: 'FN-001' },
        { name: 'Pizza Slice', description: 'Large pepperoni slice', price: 5.49, costPrice: 1.50, category: 'Food', inStock: true, stockCount: 20, reorderPoint: 10, sku: 'FN-002' },
        { name: 'Chicken Wings (6)', description: 'Buffalo wings', price: 11.99, costPrice: 3.50, category: 'Food', inStock: true, stockCount: 6, reorderPoint: 10, sku: 'FN-003' },
        { name: 'Pretzel Bites', description: 'Warm pretzel bites', price: 6.49, costPrice: 1.20, category: 'Food', inStock: true, stockCount: 22, reorderPoint: 8, sku: 'FN-004' },
        { name: 'French Fries', description: 'Seasoned fries', price: 4.99, costPrice: 0.80, category: 'Food', inStock: true, stockCount: 30, reorderPoint: 10, sku: 'FN-005' },
        { name: 'Arcade Token (10)', description: '10 tokens', price: 5.00, costPrice: 0.10, category: 'Arcade', inStock: true, stockCount: 100, reorderPoint: 25, sku: 'AT-001' },
        { name: 'Arcade Token (25)', description: '25 tokens - Best Value', price: 10.00, costPrice: 0.25, category: 'Arcade', inStock: true, stockCount: 80, reorderPoint: 20, sku: 'AT-002' },
        { name: 'Birthday Party Package', description: 'Package for 10 kids', price: 199.99, costPrice: 60.00, category: 'Packages', inStock: true, stockCount: 5, reorderPoint: 2, sku: 'PK-001' },
        { name: 'Group Package (4+)', description: '4+ bowlers group discount', price: 89.99, costPrice: 25.00, category: 'Packages', inStock: true, stockCount: 10, reorderPoint: 3, sku: 'PK-002' },
        { name: 'Kids Meal', description: 'Kids meal with drink', price: 6.99, costPrice: 2.00, category: 'Food', inStock: true, stockCount: 15, reorderPoint: 8, sku: 'FN-006' },
        { name: 'Milkshake', description: 'Thick milkshake', price: 6.49, costPrice: 1.80, category: 'Beverages', inStock: true, stockCount: 4, reorderPoint: 10, sku: 'BE-002' },
      ]
    })

    await db.apparel.createMany({
      data: [
        { name: 'StrikePOS Logo Tee', description: 'Official t-shirt', price: 24.99, size: 'M', color: 'Black', stockCount: 15, sku: 'AP-001', category: 'Shirts' },
        { name: 'StrikePOS Logo Tee', description: 'Official t-shirt', price: 24.99, size: 'L', color: 'Black', stockCount: 12, sku: 'AP-002', category: 'Shirts' },
        { name: 'StrikePOS Logo Hoodie', description: 'Cozy hoodie', price: 44.99, size: 'M', color: 'Navy', stockCount: 8, sku: 'AP-003', category: 'Hoodies' },
        { name: 'Retro Bowling Hat', description: 'Vintage cap', price: 19.99, size: 'One Size', color: 'Red', stockCount: 10, sku: 'AP-004', category: 'Hats' },
        { name: 'Bowling Socks', description: 'Fun themed socks', price: 9.99, size: 'One Size', color: 'Multi', stockCount: 20, sku: 'AP-005', category: 'Accessories' },
      ],
    })

    const productData = await db.product.findMany()
    const p = (name: string) => productData.find(x => x.name === name)!
    const lane1 = p('Lane Rental (1hr)')
    const lane2 = p('Lane Rental (2hr)')
    const shoe = p('Shoe Rental')
    const beer = p('Craft Beer')
    const water = p('Bottled Water')
    const energy = p('Energy Drink')
    const soda = p('Soda')
    const nachos = p('Nachos')
    const pizza = p('Pizza Slice')
    const wings = p('Chicken Wings (6)')
    const pretzel = p('Pretzel Bites')
    const fries = p('French Fries')
    const token10 = p('Arcade Token (10)')
    const token25 = p('Arcade Token (25)')
    const bday = p('Birthday Party Package')

    const now = Date.now()
    const today = (hoursAgo: number) => new Date(now - hoursAgo * 60 * 60 * 1000)
    const yesterday = (hoursAgo: number) => new Date(now - (24 + hoursAgo) * 60 * 60 * 1000)

    // ── Staff ──
    const staffExists = await db.staff.count()
    if (staffExists === 0) {
      await db.staff.createMany({
        data: [
          { name: 'Sarah M.', pin: '1234', role: 'cashier', isActive: true },
          { name: 'Jake R.', pin: '5678', role: 'cashier', isActive: true },
          { name: 'Manager Mike', pin: '9999', role: 'manager', isActive: true },
          { name: 'Owner Pam', pin: '0000', role: 'executive', isActive: true },
        ]
      })
    }

    // ── Device ──
    const deviceKey = 'DEV-SEED-MAIN-001'
    let device = await db.device.findUnique({ where: { deviceKey } })
    if (!device) {
      device = await db.device.create({
        data: { name: 'Main Counter iPad', location: 'Main', deviceKey, registeredBy: 'Owner Pam', isActive: true }
      })
    }

    // ── Register Session (open) — Sarah M. opened it 3hrs ago ──
    const openSessionExists = await db.registerSession.findFirst({ where: { deviceId: device.id, status: 'open' } })
    let openSession = openSessionExists
    if (!openSession) {
      openSession = await db.registerSession.create({
        data: {
          deviceId: device.id,
          staffName: 'Sarah M.',
          status: 'open',
          openingExpected: 200.00,
          openingActual: 200.00,
          openingVariance: 0,
          openingFlagged: false,
          openedAt: today(3),
        }
      })
      // Add a mid-session deposit
      await db.cashMovement.create({
        data: {
          sessionId: openSession.id,
          type: 'deposit',
          amount: 50.00,
          reason: 'Safe drop',
          approvedBy: 'Manager Mike',
          createdAt: today(1.5),
        }
      })
    }

    // ── Yesterday closed session ──
    const closedSessionExists = await db.registerSession.findFirst({ where: { status: 'closed' } })
    if (!closedSessionExists) {
      await db.registerSession.create({
        data: {
          deviceId: device.id,
          staffName: 'Jake R.',
          status: 'closed',
          openingExpected: 150.00,
          openingActual: 148.00,
          openingVariance: -2.00,
          openingFlagged: true,
          openedAt: yesterday(8),
          closedAt: yesterday(0),
          closingActual: 340.00,
          closingExpected: 338.50,
          closingVariance: 1.50,
          carryForward: 340.00,
        }
      })
    }

    // ── Orders (today + yesterday) ──
    const orders = [
      // TODAY — OPEN
      { orderNumber: 1001, status: 'open', tabType: 'reserved', customerName: 'Johnson Party', customerId: cust('Johnson Party').id, location: 'Lane 5', total: 89.46, balance: 39.46, paid: 50.00, createdAt: today(2) },
      { orderNumber: 1002, status: 'open', tabType: 'walk-in', customerName: 'Smith Family', customerId: cust('Smith Family').id, location: 'Lane 12', total: 56.50, balance: 56.50, paid: 0, createdAt: today(0.5) },
      { orderNumber: 1003, status: 'open', tabType: 'open-tab', customerName: 'Corporate Event - Acme Inc', customerId: cust('Corporate Event - Acme Inc').id, location: 'Lanes 1-4', total: 245.80, balance: 145.80, paid: 100.00, createdAt: today(4) },
      { orderNumber: 1004, status: 'open', tabType: 'walk-in', customerName: 'Mike T.', customerId: cust('Mike T.').id, location: 'Lane 8', total: 33.25, balance: 33.25, paid: 0, createdAt: today(0.25) },
      { orderNumber: 1005, status: 'open', tabType: 'walk-in', customerName: 'Birthday - Emma (age 8)', customerId: cust('Birthday - Emma (age 8)').id, location: 'Lane 10', total: 247.93, balance: 200.00, paid: 47.93, createdAt: today(0.75) },
      { orderNumber: 1006, status: 'hold', tabType: 'walk-in', customerName: 'Davis Group', customerId: cust('Davis Group').id, location: 'Lane 3', total: 78.72, balance: 78.72, paid: 0, createdAt: today(3) },

      // TODAY — CLOSED (completed payments)
      { orderNumber: 1007, status: 'closed', tabType: 'walk-in', customerName: 'Walker, K.', customerId: cust('Walker, K.').id, location: 'Lane 6', total: 42.08, balance: 0, paid: 42.08, discount: 0, tip: 5.00, createdAt: today(1.5) },
      { orderNumber: 1008, status: 'closed', tabType: 'walk-in', customerName: 'Chen, L.', customerId: cust('Chen, L.').id, location: 'Lane 9', total: 35.50, balance: 0, paid: 35.50, discount: 5.00, tip: 3.00, createdAt: today(2.5) },
      { orderNumber: 1009, status: 'closed', tabType: 'reserved', customerName: 'Rodriguez Party', customerId: cust('Rodriguez Party').id, location: 'Lanes 7-8', total: 156.00, balance: 0, paid: 156.00, discount: 0, tip: 20.00, createdAt: today(0.8) },

      // TODAY — VOIDED
      { orderNumber: 1010, status: 'void', tabType: 'walk-in', customerName: 'Test Order', location: 'Lane 1', total: 28.25, balance: 0, paid: 0, createdAt: today(1) },
      { orderNumber: 1011, status: 'void', tabType: 'walk-in', customerName: 'Duplicate Entry', location: 'Lane 4', total: 33.07, balance: 0, paid: 0, createdAt: today(2) },

      // TODAY — CANCELLED
      { orderNumber: 1012, status: 'cancelled', tabType: 'reserved', customerName: 'Wilson Party (No Show)', location: 'Lane 11', total: 0, balance: 0, paid: 0, createdAt: today(3) },
      { orderNumber: 1013, status: 'cancelled', tabType: 'walk-in', customerName: 'Garcia, M.', location: 'Lane 7', total: 0, balance: 0, paid: 0, createdAt: today(1.8) },

      // YESTERDAY — CLOSED
      { orderNumber: 996, status: 'closed', tabType: 'walk-in', customerName: 'Brown, J.', customerId: cust('Brown, J.').id, location: 'Lane 2', total: 64.50, balance: 0, paid: 64.50, tip: 8.00, createdAt: yesterday(4) },
      { orderNumber: 997, status: 'closed', tabType: 'staff', customerName: 'Jake R.', customerId: cust('Jake R.').id, location: 'Lane 14', total: 12.99, balance: 0, paid: 12.99, createdAt: yesterday(2) },
      { orderNumber: 998, status: 'closed', tabType: 'reserved', customerName: 'Lee League Night', customerId: cust('Lee League Night').id, location: 'Lanes 11-14', total: 312.00, balance: 0, paid: 312.00, tip: 45.00, createdAt: yesterday(6) },
      { orderNumber: 999, status: 'void', tabType: 'walk-in', customerName: 'Error Entry', location: 'Lane 5', total: 0, balance: 0, paid: 0, createdAt: yesterday(3) },
      { orderNumber: 995, status: 'cancelled', tabType: 'reserved', customerName: 'Thompson (Rescheduled)', location: 'Lane 9', total: 0, balance: 0, paid: 0, createdAt: yesterday(5) },
    ]

    for (const od of orders) {
      const order = await db.order.create({ data: od as any })
      const oid = order.id
      const items: any[] = []

      if ([1001, 1002, 1007].includes(order.orderNumber)) {
        items.push({ orderId: oid, productId: lane1.id, quantity: 2, price: lane1.price, subtotal: 2 * lane1.price })
        items.push({ orderId: oid, productId: shoe.id, quantity: 4, price: shoe.price, subtotal: 4 * shoe.price })
      }
      if ([1003, 998].includes(order.orderNumber)) {
        items.push({ orderId: oid, productId: lane1.id, quantity: 4, price: lane1.price, subtotal: 4 * lane1.price })
        items.push({ orderId: oid, productId: shoe.id, quantity: 8, price: shoe.price, subtotal: 8 * shoe.price })
        items.push({ orderId: oid, productId: beer.id, quantity: 12, price: beer.price, subtotal: 12 * beer.price })
      }
      if (order.orderNumber === 1004) {
        items.push({ orderId: oid, productId: lane1.id, quantity: 1, price: lane1.price, subtotal: lane1.price })
        items.push({ orderId: oid, productId: shoe.id, quantity: 2, price: shoe.price, subtotal: 2 * shoe.price })
      }
      if (order.orderNumber === 1005) {
        items.push({ orderId: oid, productId: bday.id, quantity: 1, price: bday.price, subtotal: bday.price })
        items.push({ orderId: oid, productId: soda.id, quantity: 8, price: soda.price, subtotal: 8 * soda.price })
        items.push({ orderId: oid, productId: nachos.id, quantity: 2, price: nachos.price, subtotal: 2 * nachos.price })
      }
      if (order.orderNumber === 1008) {
        items.push({ orderId: oid, productId: lane2.id, quantity: 1, price: lane2.price, subtotal: lane2.price })
        items.push({ orderId: oid, productId: beer.id, quantity: 3, price: beer.price, subtotal: 3 * beer.price })
        items.push({ orderId: oid, productId: fries.id, quantity: 2, price: fries.price, subtotal: 2 * fries.price })
      }
      if (order.orderNumber === 1009) {
        items.push({ orderId: oid, productId: lane2.id, quantity: 2, price: lane2.price, subtotal: 2 * lane2.price })
        items.push({ orderId: oid, productId: shoe.id, quantity: 6, price: shoe.price, subtotal: 6 * shoe.price })
        items.push({ orderId: oid, productId: wings.id, quantity: 2, price: wings.price, subtotal: 2 * wings.price })
        items.push({ orderId: oid, productId: pizza.id, quantity: 4, price: pizza.price, subtotal: 4 * pizza.price })
      }
      if (order.orderNumber === 996) {
        items.push({ orderId: oid, productId: lane1.id, quantity: 2, price: lane1.price, subtotal: 2 * lane1.price })
        items.push({ orderId: oid, productId: shoe.id, quantity: 4, price: shoe.price, subtotal: 4 * shoe.price })
        items.push({ orderId: oid, productId: beer.id, quantity: 2, price: beer.price, subtotal: 2 * beer.price })
      }
      if (items.length) await db.orderItem.createMany({ data: items })
    }

    // ── Inventory Logs ──
    await db.inventoryLog.createMany({
      data: [
        { productId: lane1.id, type: 'initial', quantity: 20, note: 'Initial stock', staffName: 'System', createdAt: yesterday(72) },
        { productId: shoe.id, type: 'initial', quantity: 50, note: 'Initial stock', staffName: 'System', createdAt: yesterday(72) },
        { productId: energy.id, type: 'restock', quantity: 48, note: 'Weekly restock', staffName: 'Sarah M.', createdAt: today(2) },
        { productId: beer.id, type: 'restock', quantity: 24, note: 'Keg delivery', staffName: 'Jake R.', createdAt: today(3) },
        { productId: nachos.id, type: 'restock', quantity: 30, note: 'Food delivery', staffName: 'Sarah M.', createdAt: today(2) },
        { productId: beer.id, type: 'adjustment', quantity: -4, note: 'Damaged keg line', staffName: 'Jake R.', createdAt: today(1.5) },
        { productId: energy.id, type: 'sale', quantity: -12, note: 'Sold via orders', staffName: 'Sarah M.', createdAt: today(1) },
        { productId: beer.id, type: 'sale', quantity: -16, note: 'League night', staffName: 'Jake R.', createdAt: yesterday(2) },
        { productId: shoe.id, type: 'sale', quantity: -8, note: 'Rentals', staffName: 'Sarah M.', createdAt: today(0.5) },
        { productId: token10.id, type: 'return', quantity: 10, note: 'Unused tokens returned', staffName: 'Jake R.', createdAt: today(1) },
      ]
    })

    return NextResponse.json({ message: 'Database seeded successfully' })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
