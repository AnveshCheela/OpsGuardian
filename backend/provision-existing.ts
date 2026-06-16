import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Provision] Fetching users with no teams...');

  const users = await prisma.user.findMany({
    where: {
      teams: {
        none: {}
      }
    }
  });

  console.log(`[Provision] Found ${users.length} user(s) with no teams.`);

  for (const user of users) {
    console.log(`[Provision] Provisioning user: ${user.name} (${user.email})`);

    const defaultTeam = await prisma.team.create({
      data: {
        name: `${user.name}'s Team`,
        users: { connect: [{ id: user.id }] }
      }
    });
    console.log(`[Provision]   Created team: ${defaultTeam.name} (${defaultTeam.id})`);

    const defaultService = await prisma.service.create({
      data: {
        name: 'My First Service',
        teamId: defaultTeam.id,
        status: 'Active'
      }
    });
    console.log(`[Provision]   Created service: ${defaultService.name} (${defaultService.id})`);

    const policy = await prisma.escalationPolicy.create({
      data: {
        name: 'Default Escalation',
        serviceId: defaultService.id,
        rules: [
          { step: 1, delayMins: 5, userIds: [user.id] }
        ]
      }
    });
    console.log(`[Provision]   Created escalation policy: ${policy.name} (${policy.id})`);
  }

  console.log('[Provision] Done.');
}

main()
  .catch((error) => {
    console.error('[Provision] Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
