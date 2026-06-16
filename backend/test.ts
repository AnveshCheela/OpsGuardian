import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany();
  console.log("USERS:", users.map(u => ({ id: u.id, name: u.name, role: u.role, leaderId: u.leaderId })));

  const teams = await prisma.team.findMany({
    include: {
      leader: { select: { name: true } },
      users: { select: { name: true, role: true } }
    }
  });
  console.dir(teams, { depth: null });
  process.exit(0);
}
run();
