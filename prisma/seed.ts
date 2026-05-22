import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding fresh database...');
  
  const DEFAULT_PASS_HASH = "$2a$10$954tHw6K/ZkG.a9bLwZ45O0lH.4r1f2w.b3F0o.t1Lw/1O1Gg/a6W"; // password123

  // Upsert Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tms.com' },
    update: {},
    create: {
      email: 'admin@tms.com',
      passwordHash: DEFAULT_PASS_HASH,
      name: 'Super Administrator',
      role: 'ADMIN',
    },
  });
  console.log('Admin account created:', admin.email);

  // Upsert Customer
  const customer = await prisma.user.upsert({
    where: { email: 'customer@tms.com' },
    update: {},
    create: {
      email: 'customer@tms.com',
      passwordHash: DEFAULT_PASS_HASH,
      name: 'Acme Logistics Customer',
      role: 'CUSTOMER',
    },
  });
  console.log('Customer account created:', customer.email);

  // Upsert Conductor/Driver
  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@tms.com' },
    update: {},
    create: {
      email: 'driver@tms.com',
      passwordHash: DEFAULT_PASS_HASH,
      name: 'Marcus Driver',
      role: 'DRIVER',
    },
  });
  
  const driver = await prisma.driver.upsert({
    where: { nic: '991234567V' },
    update: {},
    create: {
      name: 'Marcus Driver',
      nic: '991234567V',
      contact: '+1-555-0199',
      address: '456 Route Ave',
      licenseNumber: 'DL-99887766',
      experience: 8,
      emergencyContact: '+1-555-0100',
      salary: 3200.0,
      availability: true,
      userId: driverUser.id
    }
  });
  console.log('Driver account created:', driver.name);

  // Upsert Vehicle
  const vehicle = await prisma.vehicle.upsert({
    where: { number: 'WP-NB-4321' },
    update: {},
    create: {
      number: 'WP-NB-4321',
      type: 'Passenger Bus',
      capacity: 40,
      model: 'Ashok Leyland',
      brand: 'Ashok',
      fuelType: 'Diesel',
      insuranceExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      licenseExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      availability: true,
      status: 'Available'
    }
  });
  console.log('Vehicle created:', vehicle.number);

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
