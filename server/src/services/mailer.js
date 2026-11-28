import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) {
    throw new Error("SMTP_HOST must be configured to send email.");
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    requireTLS: process.env.NODE_ENV === "production" && Number(process.env.SMTP_PORT) !== 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
  return transporter;
}

export async function sendMail({ to, subject, text }) {
  return getTransporter().sendMail({
    from: process.env.MAIL_FROM || "SOS Link <no-reply@soslink.fr>",
    to,
    subject,
    text
  });
}
