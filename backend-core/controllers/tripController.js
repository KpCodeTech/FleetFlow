const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/asyncHandler');

// POST /api/trips  ─── create a DRAFT trip (no lock on vehicle/driver yet)
const createDraft = asyncHandler(async (req, res) => {
  const { vehicleId, driverId, cargoWeight, revenue } = req.body;
  if (!vehicleId || !driverId || cargoWeight === undefined)
    return res.status(400).json({ error: 'vehicleId, driverId, and cargoWeight are required' });

  const [vehicle, driver] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: Number(vehicleId) } }),
    prisma.driver.findUnique({ where: { id: Number(driverId) } }),
  ]);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  if (!driver)  return res.status(404).json({ error: 'Driver not found' });

  if (Number(cargoWeight) > vehicle.maxCapacityKg)
    return res.status(400).json({ error: `Cargo (${cargoWeight} kg) exceeds capacity (${vehicle.maxCapacityKg} kg)`, code: 'CARGO_OVERLOAD' });

  const trip = await prisma.trip.create({
    data: { vehicleId: Number(vehicleId), driverId: Number(driverId), cargoWeight: Number(cargoWeight), revenue: Number(revenue || 0), status: 'DRAFT' },
    include: { vehicle: true, driver: true },
  });
  res.status(201).json({ message: 'Draft trip created', trip });
});

// GET /api/trips
const getAll = asyncHandler(async (_req, res) => {
  const trips = await prisma.trip.findMany({
    include: { vehicle: true, driver: true },
    orderBy: { startDate: 'desc' },
  });
  res.json(trips);
});

// GET /api/trips/:id
const getOne = asyncHandler(async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { id: Number(req.params.id) },
    include: { vehicle: true, driver: true, expenses: true },
  });
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});

// POST /api/trips/dispatch
// ─── STRICT VALIDATION: cargo capacity + license expiry ───────────────
const dispatch = asyncHandler(async (req, res) => {
  const { vehicleId, driverId, cargoWeight, revenue } = req.body;

  if (!vehicleId || !driverId || cargoWeight === undefined)
    return res.status(400).json({ error: 'vehicleId, driverId, and cargoWeight are required' });

  // Fetch vehicle and driver concurrently
  const [vehicle, driver] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: Number(vehicleId) } }),
    prisma.driver.findUnique({ where: { id: Number(driverId) } }),
  ]);

  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  if (!driver)  return res.status(404).json({ error: 'Driver not found' });

  // ── Validation 1: Cargo weight exceeds vehicle capacity ──────────────
  if (Number(cargoWeight) > vehicle.maxCapacityKg) {
    return res.status(400).json({
      error: `Cargo weight (${cargoWeight} kg) exceeds vehicle max capacity (${vehicle.maxCapacityKg} kg)`,
      code: 'CARGO_OVERLOAD',
    });
  }

  // ── Validation 2: Driver license expired ─────────────────────────────
  if (new Date(driver.licenseExpiryDate) < new Date()) {
    return res.status(400).json({
      error: `Driver ${driver.name}'s license expired on ${driver.licenseExpiryDate.toDateString()}`,
      code: 'LICENSE_EXPIRED',
    });
  }

  // ── Validation 3: Ensure vehicle & driver are AVAILABLE ──────────────
  if (vehicle.status !== 'AVAILABLE') {
    return res.status(400).json({ error: `Vehicle is currently ${vehicle.status}, not available for dispatch`, code: 'VEHICLE_UNAVAILABLE' });
  }
  if (driver.status !== 'AVAILABLE') {
    return res.status(400).json({ error: `Driver is currently ${driver.status}, not available for dispatch`, code: 'DRIVER_UNAVAILABLE' });
  }

  // ── Atomic transaction: create trip + update statuses ─────────────────
  const [trip] = await prisma.$transaction([
    prisma.trip.create({
      data: {
        vehicleId: Number(vehicleId),
        driverId:  Number(driverId),
        cargoWeight: Number(cargoWeight),
        revenue: Number(revenue || 0),
        status: 'DISPATCHED',
      },
      include: { vehicle: true, driver: true },
    }),
    prisma.vehicle.update({ where: { id: Number(vehicleId) }, data: { status: 'ON_TRIP' } }),
    prisma.driver.update({  where: { id: Number(driverId)  }, data: { status: 'ON_DUTY' } }),
  ]);

  res.status(201).json({ message: 'Trip dispatched successfully', trip });
});

// PATCH /api/trips/:id/complete
const complete = asyncHandler(async (req, res) => {
  const { finalOdometer } = req.body;
  const tripId = Number(req.params.id);

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { vehicle: true, driver: true },
  });
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.status === 'COMPLETED') return res.status(400).json({ error: 'Trip is already completed' });
  if (trip.status === 'CANCELLED') return res.status(400).json({ error: 'Cannot complete a cancelled trip' });

  if (finalOdometer !== undefined && Number(finalOdometer) < trip.vehicle.odometer) {
    return res.status(400).json({ error: 'Final odometer cannot be less than current odometer' });
  }

  const [updatedTrip] = await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: { status: 'COMPLETED', endDate: new Date() },
      include: { vehicle: true, driver: true },
    }),
    prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: {
        status: 'AVAILABLE',
        ...(finalOdometer !== undefined && { odometer: Number(finalOdometer) }),
      },
    }),
    prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } }),
  ]);

  res.json({ message: 'Trip completed successfully', trip: updatedTrip });
});

// PATCH /api/trips/:id/cancel
const cancel = asyncHandler(async (req, res) => {
  const tripId = Number(req.params.id);
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.status === 'COMPLETED') return res.status(400).json({ error: 'Cannot cancel a completed trip' });

  await prisma.$transaction([
    prisma.trip.update({ where: { id: tripId }, data: { status: 'CANCELLED' } }),
    prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE' } }),
    prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } }),
  ]);

  res.json({ message: 'Trip cancelled successfully' });
});

module.exports = { getAll, getOne, createDraft, dispatch, complete, cancel };
