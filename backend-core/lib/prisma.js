const { PrismaClient } = require('@prisma/client');

// Shared singleton – prevents multiple connection pools
const prisma = new PrismaClient();

module.exports = prisma;
