const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = bcrypt.hashSync('password123', 10);
  
  await prisma.user.updateMany({
    data: { passwordHash: hash }
  });
  
  console.log('All passwords have been reset to password123. The correct hash is:', hash);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
