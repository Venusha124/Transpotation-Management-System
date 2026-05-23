const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = bcrypt.hashSync('password123', 10);
  console.log('New hash for password123:', hash);
  
  await prisma.user.update({
    where: { email: 'admin@tms.com' },
    data: { passwordHash: hash }
  });
  console.log('Updated successfully');
}

main().catch(console.error).finally(() => prisma.$disconnect());
