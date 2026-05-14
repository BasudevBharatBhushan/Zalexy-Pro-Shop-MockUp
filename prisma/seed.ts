import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Settings
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      tipPresets: JSON.stringify([15, 18, 20]),
      updatedAt: new Date(),
    },
  });

  // Customers
  const customer1 = await prisma.customer.upsert({
    where: { id: "cmp5qbn5a006e8z5ncx4hdy7x" },
    update: {},
    create: {
      id: "cmp5qbn5a006e8z5ncx4hdy7x",
      name: "Smith Family",
      email: "smith@email.com",
      phone: "(555) 123-4567",
      isMember: false,
      updatedAt: new Date(),
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: "cmp5qbn5a006f8z5nsuvzhbwc" },
    update: {},
    create: {
      id: "cmp5qbn5a006f8z5nsuvzhbwc",
      name: "Johnson Party",
      email: "johnson@email.com",
      phone: "(555) 987-6543",
      isMember: true,
      updatedAt: new Date(),
    },
  });

  // Products
  const laneRental = await prisma.product.upsert({
    where: { id: "cmp5qbn5d006r8z5nkxm9hka1" },
    update: {},
    create: {
      id: "cmp5qbn5d006r8z5nkxm9hka1",
      name: "Lane Rental (1hr)",
      description: "Standard lane rental",
      price: 28.25,
      category: "Bowling",
      inStock: true,
      stockCount: 20,
      reorderPoint: 5,
      sku: "LR-001",
      unitType: "pcs",
      costPrice: 5,
      hasVariants: false,
      updatedAt: new Date(),
    },
  });

  const shoeRental = await prisma.product.create({
    data: {
      id: "shoe-rental-001",
      name: "Shoe Rental",
      description: "Bowling shoe rental",
      price: 6.99,
      category: "Bowling",
      inStock: true,
      stockCount: 100,
      reorderPoint: 20,
      sku: "SHOE-001",
      unitType: "pcs",
      costPrice: 2,
      hasVariants: false,
      updatedAt: new Date(),
    },
  }).catch(() => null);

  // Apparel
  await prisma.apparel.upsert({
    where: { id: "cmp5qbn5e00798z5n5v5x7220" },
    update: {},
    create: {
      id: "cmp5qbn5e00798z5n5v5x7220",
      name: "StrikePOS Logo Tee",
      description: "Official t-shirt",
      price: 24.99,
      size: "M",
      color: "Black",
      stockCount: 15,
      sku: "AP-001",
      category: "Shirts",
      updatedAt: new Date(),
    },
  });

  // Staff
  await prisma.staff.upsert({
    where: { id: "cmp5qbn5g007e8z5nzekmawgc" },
    update: {},
    create: {
      id: "cmp5qbn5g007e8z5nzekmawgc",
      name: "Sarah M.",
      pin: "1234",
      role: "cashier",
      isActive: true,
      updatedAt: new Date(),
    },
  });

  // Device
  const device = await prisma.device.upsert({
    where: { id: "cmp5qbn5i007i8z5noflexlbq" },
    update: {},
    create: {
      id: "cmp5qbn5i007i8z5noflexlbq",
      name: "Main Counter iPad",
      deviceKey: "DEV-SEED-MAIN-001",
      location: "Main",
      isActive: true,
      registeredBy: "Owner Pam",
      updatedAt: new Date(),
    },
  });

  // Register Session
  const session = await prisma.registerSession.upsert({
    where: { id: "cmp5qbn5j007k8z5njepz5or6" },
    update: {},
    create: {
      id: "cmp5qbn5j007k8z5njepz5or6",
      deviceId: device.id,
      staffName: "Sarah M.",
      status: "open",
      openingExpected: 200,
      openingActual: 200,
      openingVariance: 0,
      openingFlagged: false,
      openedAt: new Date(),
    },
  });

  // Cash Movement
  await prisma.cashMovement.upsert({
    where: { id: "cmp5qbn5k007m8z5n3mjwvvtr" },
    update: {},
    create: {
      id: "cmp5qbn5k007m8z5n3mjwvvtr",
      sessionId: session.id,
      type: "deposit",
      amount: 50,
      reason: "Safe drop",
      approvedBy: "Manager Mike",
      createdAt: new Date(),
    },
  });

  // Order
  const order = await prisma.order.upsert({
    where: { id: "cmp5qbn5n007q8z5n5jpwasvx" },
    update: {},
    create: {
      id: "cmp5qbn5n007q8z5n5jpwasvx",
      orderNumber: 1001,
      status: "open",
      tabType: "reserved",
      customerName: customer2.name,
      customerId: customer2.id,
      location: "Lane 5",
      subtotal: 56.5,
      discount: 0,
      tip: 0,
      total: 89.46,
      balance: 39.46,
      paid: 50,
      updatedAt: new Date(),
    },
  });

  // Order Item
  await prisma.orderItem.upsert({
    where: { id: "cmp5qbn5o007r8z5nxgm6kpue" },
    update: {},
    create: {
      id: "cmp5qbn5o007r8z5nxgm6kpue",
      orderId: order.id,
      productId: laneRental.id,
      quantity: 2,
      price: 28.25,
      subtotal: 56.5,
    },
  });

  // Inventory Log
  await prisma.inventoryLog.upsert({
    where: { id: "cmp5qbn65009a8z5nymssx159" },
    update: {},
    create: {
      id: "cmp5qbn65009a8z5nymssx159",
      productId: laneRental.id,
      type: "initial",
      quantity: 20,
      note: "Initial stock",
      staffName: "System",
      createdAt: new Date(),
    },
  });

  console.log("✅ Database seeded successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });