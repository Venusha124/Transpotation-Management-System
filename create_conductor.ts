import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const DEFAULT_PASS_HASH = "$2b$10$nSAK6GuCqvDQX8.GDVkM8OOzqZPxJQZYOUecq8oOnpctmZ8C9.xs."; // password123

  const user = await prisma.user.upsert({
    where: { email: 'conductor@tms.com' },
    update: {
      passwordHash: DEFAULT_PASS_HASH,
      name: 'Default Conductor',
      role: 'CONDUCTOR',
    },
    create: {
      email: 'conductor@tms.com',
      passwordHash: DEFAULT_PASS_HASH,
      name: 'Default Conductor',
      role: 'CONDUCTOR',
    },
  });

  console.log('Conductor account created:', user.email, 'Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
