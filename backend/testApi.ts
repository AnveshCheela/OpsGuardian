import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const userId = '82a15db1-3425-4d67-9e02-2836d014a12e'; // Anvesh

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true,
      status: true, contactNumber: true, companyName: true, createdAt: true
    }
  });

  let userData = { ...user };

  const teams = await prisma.team.findMany({
    where: { leaderId: user.id },
    include: {
      leader: {
        select: { id: true, name: true, email: true, role: true, status: true, contactNumber: true, createdAt: true }
      },
      users: {
        select: { id: true, name: true, email: true, role: true, status: true, contactNumber: true, createdAt: true }
      },
    },
  });
  userData.teams = teams;

  console.dir(userData, { depth: null });
  process.exit(0);
}
run();
