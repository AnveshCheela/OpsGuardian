import { Incident } from '@prisma/client';
import { sendEmail } from './emailService';

export const sendEscalationEmail = async (engineerEmail: string, incident: Incident, step: number) => {
  const subject = `🚨 ESCALATION (Step ${step}): ${incident.title}`;
  const html = `
    <h2>Critical Incident Escalation</h2>
    <p>This incident has not been acknowledged and has been escalated to you.</p>
    <ul>
      <li><strong>Severity:</strong> ${incident.severity}</li>
      <li><strong>Title:</strong> ${incident.title}</li>
      <li><strong>Status:</strong> ${incident.status}</li>
    </ul>
    <p>Please log into the OpsGuardian dashboard immediately to acknowledge this alert.</p>
  `;

  try {
    await sendEmail({
      to: engineerEmail,
      subject,
      html
    });
    console.log(`[Notification] Escalation email process completed for ${engineerEmail} for incident ${incident.id}`);
  } catch (error) {
    // Already logged inside sendEmail, but we want to catch it to avoid breaking worker execution
    console.warn(`[Notification] Escalation email failed to send to ${engineerEmail}, but fallback simulation completed.`);
  }
};
