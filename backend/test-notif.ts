import { sendEscalationEmail } from './src/services/notificationService';
import { IncidentStatus } from '@prisma/client';

async function test() {
  const dummyIncident = {
    id: 'test-id',
    serviceId: 'test-svc',
    status: IncidentStatus.Triggered,
    severity: 'CRITICAL',
    deduplicationKey: 'test-key',
    title: 'Test Notification Service',
    description: null,
    aiSummary: null,
    aiSuggestedAction: null,
    acknowledgedById: null,
    resolvedById: null,
    acknowledgedAt: null,
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    await sendEscalationEmail('engineer@opsguardian.com', dummyIncident, 1);
    console.log("Called sendEscalationEmail. Check MailDev.");
  } catch(e) {
    console.error("Error calling sendEscalationEmail:", e);
  }
  process.exit(0);
}

test();
