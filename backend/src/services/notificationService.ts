import nodemailer from 'nodemailer';
import { Incident } from '@prisma/client';

const defaultPort = process.env.SMTP_HOST?.includes('gmail.com') ? '465' : '1025';
const port = parseInt(process.env.SMTP_PORT || defaultPort, 10);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: port,
  secure: port === 465, // true for 465, false for other ports
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
  connectionTimeout: 5000, // Fail fast after 5 seconds instead of hanging
  greetingTimeout: 5000,
  socketTimeout: 5000,
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
    console.error(`[MAIL ERROR] SMTP not configured. Could not send alert to ${engineerEmail}.`);
    console.log(`
==================================================
📧 [SIMULATED EMAIL ALERT]
To: ${engineerEmail}
Subject: 🚨 ESCALATION (Step ${step}): ${incident.title}
Body: This incident has not been acknowledged and has been escalated to you.
Severity: ${incident.severity}
Status: ${incident.status}
==================================================
    `);
  }
};
