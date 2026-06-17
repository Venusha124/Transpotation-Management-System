const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { role: 'DRIVER' }
  });

  if (!user) {
    console.log('No user with DRIVER role found');
    return;
  }

  const driver = await prisma.driver.findFirst();

  if (!driver) {
    console.log('No driver records exist in the database');
    return;
  }

  await prisma.driver.update({
    where: { id: driver.id },
    data: { userId: user.id }
  });

  console.log(`Successfully linked Driver ${driver.name} (ID: ${driver.id}) to User ${user.name} (ID: ${user.id})`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
