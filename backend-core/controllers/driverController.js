const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/asyncHandler');

// GET /api/drivers
const getAll = asyncHandler(async (_req, res) => {
  const drivers = await prisma.driver.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      trips: {
        select: { status: true }
      }
    }
  });

  // Enrich with trip statistics
  const data = drivers.map(d => {
    const total      = d.trips.length;
    const completed  = d.trips.filter(t => t.status === 'COMPLETED').length;
    return {
      ...d,
      trips: undefined, // remove raw trips array
      totalTrips: total,
      completedTrips: completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  });

  res.json(data);
});

// GET /api/drivers/:id
const getOne = asyncHandler(async (req, res) => {
  const driver = await prisma.driver.findUnique({
    where: { id: Number(req.params.id) },
    include: { trips: { orderBy: { startDate: 'desc' }, take: 10, include: { vehicle: true } } },
  });
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  res.json(driver);
});

// POST /api/drivers
const create = asyncHandler(async (req, res) => {
  const { name, licenseExpiryDate, safetyScore } = req.body;
  if (!name || !licenseExpiryDate)
    return res.status(400).json({ error: 'name and licenseExpiryDate are required' });

  const driver = await prisma.driver.create({
    data: {
      name,
      licenseExpiryDate: new Date(licenseExpiryDate),
      safetyScore: Number(safetyScore || 100),
    },
  });
  res.status(201).json(driver);
});

// PATCH /api/drivers/:id
const update = asyncHandler(async (req, res) => {
  const { name, licenseExpiryDate, status, safetyScore } = req.body;
  const driver = await prisma.driver.update({
    where: { id: Number(req.params.id) },
    data: {
      ...(name              !== undefined && { name }),
      ...(licenseExpiryDate !== undefined && { licenseExpiryDate: new Date(licenseExpiryDate) }),
      ...(status            !== undefined && { status }),
      ...(safetyScore       !== undefined && { safetyScore: Number(safetyScore) }),
    },
  });
  res.json(driver);
});

// DELETE /api/drivers/:id
const remove = asyncHandler(async (req, res) => {
  try {
    await prisma.driver.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Driver deleted successfully' });
  } catch (err) {
    if (err.code === 'P2003' || err.code === 'P2014') {
      return res.status(409).json({
        error: 'Cannot delete this driver — they have existing trip records. Remove those trips first.',
      });
    }
    throw err;
  }
});

module.exports = { getAll, getOne, create, update, remove };
