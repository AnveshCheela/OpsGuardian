import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const incidents = await prisma.incident.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      service: true
    }
  });

  console.log("Recent Incidents:");
  for (const inc of incidents) {
    console.log(`- ${inc.title} (ID: ${inc.id}), Status: ${inc.status}, Service: ${inc.service.name}`);
  }
  process.exit(0);
}

main();
