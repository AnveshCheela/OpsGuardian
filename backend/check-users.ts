import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users in DB:");
  for (const u of users) {
    console.log(`- ${u.name}: ${u.id} (${u.email})`);
  }
  process.exit(0);
}

main();
