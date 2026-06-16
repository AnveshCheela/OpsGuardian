import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const deleted = await prisma.incident.deleteMany({
      where: {
        title: {
          in: ['High CPU Usage Detected', 'Database Connection Latency', 'API Gateway 502 Errors']
        }
      }
    });

    console.log(`Deleted ${deleted.count} injected alerts.`);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
