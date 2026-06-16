import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

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

export interface SendEmailOptions {
  from?: string;
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: SendEmailOptions) => {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    console.log(`[Email Service] RESEND_API_KEY detected. Sending email to ${options.to} via Resend HTTP API...`);
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: options.from || process.env.SMTP_FROM || 'onboarding@resend.dev',
          to: options.to,
          subject: options.subject,
          html: options.html,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Resend HTTP API returned status ${response.status}: ${errText}`);
      }

      const resData = await response.json() as any;
      console.log(`[Email Service] Email sent successfully via Resend. ID: ${resData.id}`);
      return { success: true, method: 'resend', id: resData.id };
    } catch (error: any) {
      console.error(`[Email Service] Resend API failed. Falling back to SMTP. Error:`, error.message || error);
    }
  }

  // SMTP Fallback
  console.log(`[Email Service] Sending email to ${options.to} via SMTP...`);
  const defaultFrom = process.env.SMTP_USER 
    ? `"OpsGuardian Alerts" <${process.env.SMTP_USER}>` 
    : '"OpsGuardian Alerts" <alerts@opsguardian.local>';

  const mailOptions = {
    from: options.from || defaultFrom,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Email sent successfully via SMTP to ${options.to}`);
    return { success: true, method: 'smtp' };
  } catch (error: any) {
    console.error(`[Email Service] SMTP failed. Could not send alert to ${options.to}. Reason:`, error.message || error);
    // Log a simulation box for easy debugging when SMTP fails or is not configured
    console.log(`
==================================================
📧 [SIMULATED EMAIL ALERT]
To: ${options.to}
Subject: ${options.subject}
Body (HTML Preview):
${options.html.replace(/<[^>]*>/g, ' ').trim().slice(0, 150)}...
==================================================
    `);
    throw error;
  }
};
