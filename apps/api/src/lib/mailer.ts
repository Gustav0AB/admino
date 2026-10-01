import nodemailer from "nodemailer";
import { env } from "@config/env";

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
});

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: "Restablecer tu contraseña",
    html: `
      <p>Solicitaste restablecer tu contraseña.</p>
      <p><a href="${resetUrl}">Haz clic aquí para crear una nueva contraseña</a>. Este enlace expira en 1 hora.</p>
      <p>Si no fuiste tú, puedes ignorar este correo.</p>
    `,
  });
}
