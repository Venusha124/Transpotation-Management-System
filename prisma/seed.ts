import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting and seeding database...');
  
  // Clear the database tables to prevent foreign key constraint issues
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.fuelLog.deleteMany({});
  await prisma.maintenance.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.user.deleteMany({});

  const DEFAULT_PASS_HASH = "$2b$10$nSAK6GuCqvDQX8.GDVkM8OOzqZPxJQZYOUecq8oOnpctmZ8C9.xs."; // password123

  // Create Super Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@tms.com',
      passwordHash: DEFAULT_PASS_HASH,
      name: 'Super Administrator',
      role: 'ADMIN',
    },
  });
  console.log('Super Admin account created:', admin.email);

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
