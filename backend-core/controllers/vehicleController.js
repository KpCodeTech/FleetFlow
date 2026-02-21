const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/asyncHandler');

// GET /api/vehicles
const getAll = asyncHandler(async (_req, res) => {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(vehicles);
});

// GET /api/vehicles/:id
const getOne = asyncHandler(async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: Number(req.params.id) },
    include: { maintenanceLogs: { orderBy: { date: 'desc' }, take: 5 }, expenses: { orderBy: { date: 'desc' }, take: 10 } },
  });
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(vehicle);
});

// POST /api/vehicles
const create = asyncHandler(async (req, res) => {
  const { nameModel, licensePlate, maxCapacityKg, acquisitionCost, odometer } = req.body;
  if (!nameModel || !licensePlate || !maxCapacityKg || !acquisitionCost)
    return res.status(400).json({ error: 'nameModel, licensePlate, maxCapacityKg, acquisitionCost are required' });

  const existing = await prisma.vehicle.findUnique({ where: { licensePlate } });
  if (existing) return res.status(409).json({ error: `License plate ${licensePlate} already registered` });

  const vehicle = await prisma.vehicle.create({
    data: { nameModel, licensePlate, maxCapacityKg: Number(maxCapacityKg), acquisitionCost: Number(acquisitionCost), odometer: Number(odometer || 0) },
  });
  res.status(201).json(vehicle);
});

// PATCH /api/vehicles/:id
const update = asyncHandler(async (req, res) => {
  const { nameModel, maxCapacityKg, acquisitionCost, status, odometer } = req.body;
  const vehicle = await prisma.vehicle.update({
    where: { id: Number(req.params.id) },
    data: {
      ...(nameModel                !== undefined && { nameModel }),
      ...(maxCapacityKg           !== undefined && { maxCapacityKg: Number(maxCapacityKg) }),
      ...(acquisitionCost         !== undefined && { acquisitionCost: Number(acquisitionCost) }),
      ...(status                  !== undefined && { status }),
      ...(odometer                !== undefined && { odometer: Number(odometer) }),
    },
  });
  res.json(vehicle);
});

// DELETE /api/vehicles/:id
const remove = asyncHandler(async (req, res) => {
  try {
    await prisma.vehicle.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    if (err.code === 'P2003' || err.code === 'P2014') {
      return res.status(409).json({
        error: 'Cannot delete this vehicle — it has linked trips, maintenance logs, or expenses. Remove those records first.',
      });
    }
    throw err; // re-throw unexpected errors to global handler
  }
});

module.exports = { getAll, getOne, create, update, remove };
