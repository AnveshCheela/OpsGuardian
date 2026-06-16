import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const policy = await prisma.escalationPolicy.findFirst({
    where: { name: 'Payment API Escalation' }
  });

  console.log("Policy Rules type:", typeof policy?.rules);
  console.log("Policy Rules isArray:", Array.isArray(policy?.rules));
  console.log("Policy Rules value:", policy?.rules);
  process.exit(0);
}

main();
