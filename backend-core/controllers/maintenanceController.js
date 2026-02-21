const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/asyncHandler');

// GET /api/maintenance
const getAll = asyncHandler(async (_req, res) => {
  const logs = await prisma.maintenanceLog.findMany({
    include: { vehicle: true },
    orderBy: { date: 'desc' },
  });
  res.json(logs);
});

// GET /api/maintenance/:id
const getOne = asyncHandler(async (req, res) => {
  const log = await prisma.maintenanceLog.findUnique({
    where: { id: Number(req.params.id) },
    include: { vehicle: true },
  });
  if (!log) return res.status(404).json({ error: 'Maintenance log not found' });
  res.json(log);
});

// POST /api/maintenance
// ─── AUTO updates vehicle status to IN_SHOP ──────────────────────────
const create = asyncHandler(async (req, res) => {
  const { vehicleId, description, cost, date } = req.body;
  if (!vehicleId || !description || cost === undefined)
    return res.status(400).json({ error: 'vehicleId, description, and cost are required' });

  const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(vehicleId) } });
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

  // Guard: cannot send a vehicle that is currently ON_TRIP to the shop
  if (vehicle.status === 'ON_TRIP') {
    return res.status(400).json({
      error: `Vehicle "${vehicle.nameModel}" is currently ON_TRIP. Complete or cancel the active trip before logging maintenance.`,
      code: 'VEHICLE_ON_TRIP',
    });
  }

  const [log] = await prisma.$transaction([
    prisma.maintenanceLog.create({
      data: {
        vehicleId:   Number(vehicleId),
        description,
        cost:        Number(cost),
        date:        date ? new Date(date) : new Date(),
      },
      include: { vehicle: true },
    }),
    prisma.vehicle.update({
      where: { id: Number(vehicleId) },
      data:  { status: 'IN_SHOP' },
    }),
  ]);

  res.status(201).json({ message: 'Maintenance log created, vehicle status set to IN_SHOP', log });
});

// DELETE /api/maintenance/:id
const remove = asyncHandler(async (req, res) => {
  await prisma.maintenanceLog.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: 'Maintenance log deleted' });
});

module.exports = { getAll, getOne, create, remove };
