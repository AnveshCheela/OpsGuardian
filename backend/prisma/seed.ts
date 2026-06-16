import { PrismaClient, Role, ServiceStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing data
  await prisma.escalationPolicy.deleteMany();
  await prisma.incidentLog.deleteMany();
  await prisma.incidentAction.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.service.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const alice = await prisma.user.create({
    data: {
      name: 'Alice Manager',
      email: 'alice@opsguardian.com',
      passwordHash: 'hashed_password_placeholder', // Simple placeholder for local dev
      role: Role.Manager,
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: 'Bob Responder',
      email: 'bob@opsguardian.com',
      passwordHash: 'hashed_password_placeholder',
      role: Role.Responder,
    },
  });

  const charlie = await prisma.user.create({
    data: {
      name: 'Charlie Responder',
      email: 'charlie@opsguardian.com',
      passwordHash: 'hashed_password_placeholder',
      role: Role.Responder,
    },
  });

  console.log(`Created users: ${alice.name}, ${bob.name}, ${charlie.name}`);

  // 3. Create Team
  const sreTeam = await prisma.team.create({
    data: {
      name: 'Core SRE Team',
      users: {
        connect: [{ id: alice.id }, { id: bob.id }, { id: charlie.id }],
      },
    },
  });

  console.log(`Created team: ${sreTeam.name}`);

  // 4. Create Service
  const dbService = await prisma.service.create({
    data: {
      name: 'Database Cluster Primary',
      teamId: sreTeam.id,
      webhookKey: 'db-service-webhook-key-12345', // Fixed key for easy webhook triggering
      status: ServiceStatus.Active,
    },
  });

  const webService = await prisma.service.create({
    data: {
      name: 'Payment Gateway API',
      teamId: sreTeam.id,
      webhookKey: 'web-service-webhook-key-54321',
      status: ServiceStatus.Active,
    },
  });

  console.log(`Created services: ${dbService.name}, ${webService.name}`);

  // 5. Create Escalation Policies
  const dbPolicy = await prisma.escalationPolicy.create({
    data: {
      name: 'DB Cluster Priority Escalation',
      serviceId: dbService.id,
      rules: [
        {
          step: 1,
          delayMins: 5,
          userIds: [bob.id],
        },
        {
          step: 2,
          delayMins: 10,
          userIds: [charlie.id],
        },
        {
          step: 3,
          delayMins: 15,
          userIds: [alice.id],
        },
      ],
    },
  });

  const webPolicy = await prisma.escalationPolicy.create({
    data: {
      name: 'Payment API Escalation',
      serviceId: webService.id,
      rules: [
        {
          step: 1,
          delayMins: 5,
          userIds: [bob.id, charlie.id],
        },
        {
          step: 2,
          delayMins: 10,
          userIds: [alice.id],
        },
      ],
    },
  });

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
