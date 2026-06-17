const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = bcrypt.hashSync('password123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@tms.com' },
    update: { passwordHash: hash, role: 'ADMIN' },
    create: {
      email: 'admin@tms.com',
      passwordHash: hash,
      name: 'Admin User',
      role: 'ADMIN'
    }
  });
  
  console.log('Admin user ensured');
}

main().catch(console.error).finally(() => prisma.$disconnect());
