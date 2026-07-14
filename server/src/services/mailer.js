import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) {
    transporter = { sendMail: async (mail) => console.log("Email mock:", mail) };
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
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
