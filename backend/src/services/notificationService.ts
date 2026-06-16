import { Incident } from '@prisma/client';
import { sendEmail, type SendEmailResult } from './emailService';

type SimulatedEmailResult = {
  success: false;
  method: 'simulation';
  error: string;
};

export const sendEscalationEmail = async (
  engineerEmail: string,
  incident: Incident,
  step: number
): Promise<SendEmailResult | SimulatedEmailResult> => {
  const subject = `[OpsGuardian] ESCALATION (Step ${step}): ${incident.title}`;
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
    const result = await sendEmail({
      to: engineerEmail,
      subject,
      html
    });

    console.log(
      `[Notification] Escalation email delivered to ${engineerEmail} via ${result.method} for incident ${incident.id}`
    );
    return result;
  } catch (error: any) {
    const message = error.message || String(error);
    console.warn(
      `[Notification] Escalation email was not delivered to ${engineerEmail}; simulation was logged. Reason: ${message}`
    );
    return { success: false, method: 'simulation', error: message };
  }
};
