const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Restoring all CANCELLED route runs to ASSIGNED...');

  const result = await prisma.trip.updateMany({
    where: {
      status: 'CANCELLED'
    },
    data: {
      status: 'ASSIGNED'
    }
  });

  console.log(`Successfully restored ${result.count} route runs to ASSIGNED status!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
