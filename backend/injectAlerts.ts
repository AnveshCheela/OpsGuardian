import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const leader = await prisma.user.findFirst({
      where: { role: 'Leader' } // Just find any Leader
    });

    if (!leader) {
      console.log('No Leader found');
      return;
    }

    const team = await prisma.team.findFirst({
      where: { leaderId: leader.id }
    });

    if (!team) {
      console.log('Leader team not found');
      return;
    }

    const service = await prisma.service.findFirst({
      where: { teamId: team.id }
    });

    if (!service) {
      console.log('Leader service not found');
      return;
    }

    const dedupBase = Date.now().toString();
    await prisma.incident.createMany({
      data: [
        {
          serviceId: service.id,
          title: 'High CPU Usage Detected',
          description: 'CPU usage exceeded 95% for more than 5 minutes on app-server-01.',
          severity: 'High',
          status: 'Triggered',
          deduplicationKey: `def-1-${dedupBase}`,
          aiSummary: 'CPU spike detected on application server.',
          aiSuggestedAction: 'Check running processes and consider scaling up if sustained.',
        },
        {
          serviceId: service.id,
          title: 'Database Connection Latency',
          description: 'Average query response time is over 500ms.',
          severity: 'Medium',
          status: 'Triggered',
          deduplicationKey: `def-2-${dedupBase}`,
          aiSummary: 'Database latency is higher than normal.',
          aiSuggestedAction: 'Check active queries and database load.',
        },
        {
          serviceId: service.id,
          title: 'API Gateway 502 Errors',
          description: 'Increased rate of 502 Bad Gateway errors on /api/v1/auth endpoints.',
          severity: 'Critical',
          status: 'Triggered',
          deduplicationKey: `def-3-${dedupBase}`,
          aiSummary: 'API Gateway is returning 502 errors.',
          aiSuggestedAction: 'Investigate upstream auth services for crashes.',
        }
      ]
    });

    console.log(`Successfully injected 3 default alerts for ${leader.name}.`);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
