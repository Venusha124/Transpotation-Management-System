const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const stops = [
    { name: 'Colombo Fort Bus Stand', code: 'CMB-FT', address: 'Olcott Mawatha, Colombo 01100', status: 'ACTIVE', latitude: 6.9338, longitude: 79.8500 },
    { name: 'Kandy Central Bus Station', code: 'KDY-CN', address: 'S.W.R.D. Bandaranaike Mawatha, Kandy', status: 'ACTIVE', latitude: 7.2906, longitude: 80.6337 },
    { name: 'Galle Bus Station', code: 'GAL-CN', address: 'Colombo Road, Galle', status: 'ACTIVE', latitude: 6.0328, longitude: 80.2149 },
    { name: 'Jaffna Central Bus Stand', code: 'JAF-CN', address: 'Hospital St, Jaffna', status: 'ACTIVE', latitude: 9.6615, longitude: 80.0255 },
    { name: 'Kurunegala Bus Stand', code: 'KUR-CN', address: 'Colombo Rd, Kurunegala', status: 'ACTIVE', latitude: 7.4818, longitude: 80.3609 }
  ];

  for (const s of stops) {
    await prisma.stop.upsert({
      where: { code: s.code },
      update: {},
      create: s
    });
  }
  console.log('Successfully seeded 5 core bus stops!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
