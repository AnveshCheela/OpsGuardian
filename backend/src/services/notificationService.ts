import nodemailer from 'nodemailer';
import { Incident } from '@prisma/client';

// Configure to use the local Maildev Docker container running on port 1025
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025,
  ignoreTLS: true
});

export const sendEscalationEmail = async (engineerEmail: string, incident: Incident, step: number) => {
  const mailOptions = {
    from: '"OpsGuardian Alerts" <alerts@opsguardian.local>',
    to: engineerEmail,
    subject: `🚨 ESCALATION (Step ${step}): ${incident.title}`,
    html: `
      <h2>Critical Incident Escalation</h2>
      <p>This incident has not been acknowledged and has been escalated to you.</p>
      <ul>
        <li><strong>Severity:</strong> ${incident.severity}</li>
        <li><strong>Title:</strong> ${incident.title}</li>
        <li><strong>Status:</strong> ${incident.status}</li>
      </ul>
      <p>Please log into the OpsGuardian dashboard immediately to acknowledge this alert.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Notification] Escalation email sent to ${engineerEmail} for incident ${incident.id}`);
  } catch (error) {
    console.error('[Notification] Failed to send email:', error);
  }
};
