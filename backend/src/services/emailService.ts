import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const defaultPort = process.env.SMTP_HOST?.includes('gmail.com') ? '465' : '1025';
const port = parseInt(process.env.SMTP_PORT || defaultPort, 10);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port,
  secure: port === 465,
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

export interface SendEmailOptions {
  from?: string;
  to: string;
  subject: string;
  html: string;
}

export type SendEmailResult = {
  success: true;
  method: 'resend' | 'smtp';
  id?: string;
};

const isProductionRuntime = () => (
  process.env.NODE_ENV === 'production' ||
  Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID)
);

const hasExplicitSmtpConfig = () => Boolean(process.env.SMTP_HOST || process.env.SMTP_USER);

const logSimulatedEmail = (options: SendEmailOptions) => {
  console.log(`
==================================================
[SIMULATED EMAIL ALERT]
To: ${options.to}
Subject: ${options.subject}
Body (HTML Preview):
${options.html.replace(/<[^>]*>/g, ' ').trim().slice(0, 150)}...
==================================================
  `);
};

export const sendEmail = async (options: SendEmailOptions): Promise<SendEmailResult> => {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  if (resendApiKey) {
    // Free Tier Hack: Resend strict-matches the verified email. Strip out any +aliases for testing.
    const sanitizedToEmail = options.to.replace(/\+[^@]+/, '');
    
    console.log(`[Email Service] RESEND_API_KEY detected. Sending email to ${sanitizedToEmail} via Resend HTTP API...`);
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: options.from || process.env.SMTP_FROM || 'onboarding@resend.dev',
          to: sanitizedToEmail,
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
      console.error('[Email Service] Resend API failed. Falling back to SMTP. Error:', error.message || error);

      if (isProductionRuntime() && !hasExplicitSmtpConfig()) {
        logSimulatedEmail(options);
        throw new Error(`Resend API failed and SMTP fallback is not configured: ${error.message || error}`);
      }
    }
  }

  if (!resendApiKey && isProductionRuntime() && !hasExplicitSmtpConfig()) {
    const message = 'No RESEND_API_KEY or explicit SMTP configuration is set. Real production email delivery is disabled.';
    console.error(`[Email Service] ${message}`);
    logSimulatedEmail(options);
    throw new Error(message);
  }

  console.log(`[Email Service] Sending email to ${options.to} via SMTP...`);
  const defaultFrom = process.env.SMTP_USER
    ? `"OpsGuardian Alerts" <${process.env.SMTP_USER}>`
    : '"OpsGuardian Alerts" <alerts@opsguardian.local>';

  try {
    await transporter.sendMail({
      from: options.from || defaultFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`[Email Service] Email sent successfully via SMTP to ${options.to}`);
    return { success: true, method: 'smtp' };
  } catch (error: any) {
    console.error(`[Email Service] SMTP failed. Could not send alert to ${options.to}. Reason:`, error.message || error);
    logSimulatedEmail(options);
    throw error;
  }
};
