import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

type Mail = {
  subject: string;
  text: string;
  // The visitor who filled in the form: the team replies straight to them
  replyTo: { name: string; address: string };
};

// Created lazily and reused, so a warm serverless instance keeps its connection
// settings. `secure: true` is implicit TLS on port 465.
let transporter: Transporter | undefined;

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be set");
  }
  transporter ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    // `pass` is a Google App Password (needs 2-step verification), not the
    // account password
    auth: { user, pass },
  });
  return transporter;
}

/**
 * Sends a form submission to the team's mailbox through Gmail SMTP.
 *
 * Gmail always sends as the authenticated account, so `From` is the association
 * account itself and the visitor goes in `Reply-To`. Only the team ever
 * receives these emails, so a custom sender domain isn't needed.
 *
 * This is the only place that knows about the mail provider: swapping Gmail
 * for another service later only changes this file.
 */
export async function sendMail({ subject, text, replyTo }: Mail) {
  const user = process.env.GMAIL_USER;
  await getTransporter().sendMail({
    from: { name: "Hope 4 Rosiorii website", address: user! },
    // Defaults to the sending account, because the team reads that mailbox
    to: process.env.MAIL_TO || user,
    replyTo,
    subject,
    text,
  });
}
