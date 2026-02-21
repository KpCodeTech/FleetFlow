const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/asyncHandler');

// GET /api/expenses
const getAll = asyncHandler(async (_req, res) => {
  const expenses = await prisma.expense.findMany({
    include: { vehicle: true, trip: true },
    orderBy: { date: 'desc' },
  });
  res.json(expenses);
});

// POST /api/expenses
const create = asyncHandler(async (req, res) => {
  const { vehicleId, tripId, fuelLiters, fuelCost, date } = req.body;
  if (!vehicleId || fuelLiters === undefined || fuelCost === undefined)
    return res.status(400).json({ error: 'vehicleId, fuelLiters, and fuelCost are required' });

  const expense = await prisma.expense.create({
    data: {
      vehicleId:  Number(vehicleId),
      tripId:     tripId ? Number(tripId) : null,
      fuelLiters: Number(fuelLiters),
      fuelCost:   Number(fuelCost),
      date:       date ? new Date(date) : new Date(),
    },
    include: { vehicle: true, trip: true },
  });
  res.status(201).json(expense);
});

// DELETE /api/expenses/:id
const remove = asyncHandler(async (req, res) => {
  await prisma.expense.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: 'Expense deleted' });
});

module.exports = { getAll, create, remove };
