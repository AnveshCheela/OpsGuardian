import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const leader = await prisma.user.findFirst({
      where: {
        name: 'Cheela Sunitha',
        companyName: 'APPLE'
      }
    });

    if (!leader) {
      console.log("Could not find Leader Cheela Sunitha with company APPLE");
      return;
    }

    const team = await prisma.team.findUnique({
      where: { companyName: 'APPLE' }
    });

    if (team) {
      await prisma.team.delete({
        where: { id: team.id }
      });
      console.log("Deleted team APPLE");
    }

    await prisma.user.delete({
      where: { id: leader.id }
    });
    console.log("Deleted leader Cheela Sunitha");

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
