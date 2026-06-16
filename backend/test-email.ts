import nodemailer from 'nodemailer';

async function testMail() {
  console.log("Connecting to MailDev on localhost:1025...");
  
  const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    ignoreTLS: true
  });

  try {
    await transporter.sendMail({
      from: '"OpsGuardian Test" <test@opsguardian.local>',
      to: 'engineer@opsguardian.com',
      subject: 'MailDev Connection Test',
      html: '<h1>Success!</h1><p>If you see this in MailDev, your Node.js backend can successfully communicate with the Docker container!</p>'
    });
    console.log("✅ Email successfully sent to MailDev!");
  } catch (err) {
    console.error("❌ Failed to send email to MailDev. Error details:");
    console.error(err);
  }
}

testMail();
