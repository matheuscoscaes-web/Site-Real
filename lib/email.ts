import nodemailer from "nodemailer";
import * as Sentry from "@sentry/nextjs";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

const transporter = GMAIL_USER && GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    })
  : null;

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!transporter) {
    console.warn("GMAIL_USER/GMAIL_APP_PASSWORD não configurados — e-mail não enviado:", subject, "para", to);
    Sentry.captureMessage(`E-mail não enviado (Gmail não configurado): ${subject}`, "error");
    return;
  }
  try {
    await transporter.sendMail({ from: `Hearts Couro <${GMAIL_USER}>`, to, subject, html });
  } catch (err) {
    console.error("Erro ao enviar e-mail via Gmail:", err);
    Sentry.captureException(err, { extra: { subject, to } });
  }
}
