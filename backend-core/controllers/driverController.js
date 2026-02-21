const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/asyncHandler');

// GET /api/drivers
const getAll = asyncHandler(async (_req, res) => {
  const drivers = await prisma.driver.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(drivers);
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
      ...(name              && { name }),
      ...(licenseExpiryDate && { licenseExpiryDate: new Date(licenseExpiryDate) }),
      ...(status            && { status }),
      ...(safetyScore !== undefined && { safetyScore: Number(safetyScore) }),
    },
  });
  res.json(driver);
});

// DELETE /api/drivers/:id
const remove = asyncHandler(async (req, res) => {
  await prisma.driver.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: 'Driver deleted successfully' });
});

module.exports = { getAll, getOne, create, update, remove };
