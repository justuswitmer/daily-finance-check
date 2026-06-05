import nodemailer from "nodemailer";
import { config } from "./config.js";

let transporter;

function validateEmailConfig() {
  const missing = [];

  if (!config.email.host) missing.push("EMAIL_SMTP_HOST");
  if (!config.email.user) missing.push("EMAIL_SMTP_USER");
  if (!config.email.pass) missing.push("EMAIL_SMTP_PASS");
  if (!config.email.from) missing.push("EMAIL_FROM");
  if (!config.email.to.length) missing.push("EMAIL_TO");

  if (missing.length) {
    throw new Error(`Missing email config: ${missing.join(", ")}`);
  }
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  validateEmailConfig();

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  return transporter;
}

export async function sendSummaryEmail(body, now) {
  const subject = `Finance Alerts - ${now.toISOString().slice(0, 10)}`;
  const info = await getTransporter().sendMail({
    from: config.email.from,
    to: config.email.to,
    subject,
    text: body,
  });

  return info.messageId;
}
