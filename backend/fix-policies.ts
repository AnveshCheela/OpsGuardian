import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePolicies() {
  const policies = await prisma.escalationPolicy.findMany();
  
  const anveshId = '1158625c-c385-438b-b53a-589404487d49'; // Anvesh Cheela
  const akhilId = '5d5b581f-fdf5-4b7c-af03-cdf29dc36f92';  // Cheela Akhil

  for (const policy of policies) {
    const rules = policy.rules as any[];
    for (const rule of rules) {
      // Override the userIds array with both users
      rule.userIds = [anveshId, akhilId];
    }

    await prisma.escalationPolicy.update({
      where: { id: policy.id },
      data: { rules: rules }
    });
  }

  console.log("Escalation policies updated successfully to email BOTH Anvesh and Akhil!");
  process.exit(0);
}

updatePolicies();
