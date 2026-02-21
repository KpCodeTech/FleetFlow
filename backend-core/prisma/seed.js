const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FleetFlow database seed...');

  // ── Users ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.createMany({
    data: [
      { name: 'Parth', email: 'parth@fleetflow.com', passwordHash, role: 'MANAGER' },
      { name: 'Pal',   email: 'pal@fleetflow.com',   passwordHash, role: 'DISPATCHER' },
      { name: 'Yashvi',email: 'yashvi@fleetflow.com',passwordHash, role: 'SAFETY_OFFICER' },
      { name: 'Jay',   email: 'jay@fleetflow.com',   passwordHash, role: 'FINANCE' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Users seeded');

  // ── Vehicles ────────────────────────────────────────────────────────
  await prisma.vehicle.createMany({
    data: [
      { nameModel: 'Toyota HiAce',          licensePlate: 'TN01AB1234', maxCapacityKg: 1500, odometer: 25000, status: 'AVAILABLE', acquisitionCost: 800000 },
      { nameModel: 'Tata Ace Gold',          licensePlate: 'MH02CD5678', maxCapacityKg: 800,  odometer: 45200, status: 'ON_TRIP',   acquisitionCost: 450000 },
      { nameModel: 'Mahindra Bolero Pickup', licensePlate: 'KA03EF9012', maxCapacityKg: 1200, odometer: 12300, status: 'AVAILABLE', acquisitionCost: 600000 },
      { nameModel: 'Ashok Leyland Dost+',   licensePlate: 'GJ04GH3456', maxCapacityKg: 1300, odometer: 67500, status: 'IN_SHOP',   acquisitionCost: 750000 },
      { nameModel: 'Eicher Pro 1049',        licensePlate: 'DL05IJ7890', maxCapacityKg: 3000, odometer: 35800, status: 'AVAILABLE', acquisitionCost: 1200000 },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Vehicles seeded');

  // ── Drivers ─────────────────────────────────────────────────────────
  await prisma.driver.createMany({
    data: [
      { name: 'Ramesh Kumar',  licenseExpiryDate: new Date('2027-01-15'), status: 'AVAILABLE', safetyScore: 92 },
      { name: 'Suresh Patel',  licenseExpiryDate: new Date('2025-12-31'), status: 'ON_DUTY',   safetyScore: 88 },
      { name: 'Mahesh Singh',  licenseExpiryDate: new Date('2026-06-30'), status: 'AVAILABLE', safetyScore: 95 },
      { name: 'Dinesh Verma',  licenseExpiryDate: new Date('2026-03-20'), status: 'AVAILABLE', safetyScore: 78 },
      { name: 'Rajesh Sharma', licenseExpiryDate: new Date('2024-11-15'), status: 'SUSPENDED', safetyScore: 65 },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Drivers seeded');

  // ── Sample Trips ─────────────────────────────────────────────────────
  const vehicles  = await prisma.vehicle.findMany();
  const drivers   = await prisma.driver.findMany();

  await prisma.trip.createMany({
    data: [
      {
        vehicleId: vehicles[1].id, driverId: drivers[1].id,
        cargoWeight: 650, status: 'DISPATCHED', revenue: 12500,
        startDate: new Date('2026-02-18T08:00:00'),
      },
      {
        vehicleId: vehicles[0].id, driverId: drivers[0].id,
        cargoWeight: 1100, status: 'COMPLETED', revenue: 22000,
        startDate: new Date('2026-02-15T09:00:00'), endDate: new Date('2026-02-16T17:00:00'),
      },
      {
        vehicleId: vehicles[2].id, driverId: drivers[2].id,
        cargoWeight: 900, status: 'COMPLETED', revenue: 18000,
        startDate: new Date('2026-02-10T07:30:00'), endDate: new Date('2026-02-10T19:00:00'),
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Sample trips seeded');

  // ── Sample Maintenance Logs ─────────────────────────────────────────
  await prisma.maintenanceLog.createMany({
    data: [
      { vehicleId: vehicles[3].id, description: 'Engine overhaul - worn pistons replaced', cost: 35000, date: new Date('2026-02-17') },
      { vehicleId: vehicles[0].id, description: 'Tyre rotation and brake pad replacement',  cost: 8500,  date: new Date('2026-02-10') },
      { vehicleId: vehicles[2].id, description: 'Oil change and filter service',             cost: 2800,  date: new Date('2026-02-05') },
    ],
  });
  console.log('✅ Maintenance logs seeded');

  // ── Sample Expenses ──────────────────────────────────────────────────
  const trips = await prisma.trip.findMany();
  await prisma.expense.createMany({
    data: [
      { vehicleId: vehicles[0].id, tripId: trips[1].id, fuelLiters: 85,  fuelCost: 7905,  date: new Date('2026-02-15') },
      { vehicleId: vehicles[2].id, tripId: trips[2].id, fuelLiters: 62,  fuelCost: 5766,  date: new Date('2026-02-10') },
      { vehicleId: vehicles[1].id, tripId: trips[0].id, fuelLiters: 40,  fuelCost: 3720,  date: new Date('2026-02-18') },
    ],
  });
  console.log('✅ Expenses seeded');

  console.log('\n🎉 Database seeded successfully!');
  console.log('📧 Login with: parth@fleetflow.com / password123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
