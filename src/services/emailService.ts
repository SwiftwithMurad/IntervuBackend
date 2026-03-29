import { env } from "../config/env";

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

async function sendMail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  try {
    const res = await fetch(BREVO_API, {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Polyvia", email: env.EMAIL_FROM },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[EMAIL] Brevo API error:", res.status, text);
    }
  } catch (err) {
    console.error("[EMAIL] Brevo error:", err);
  }
}

export async function sendVerificationEmail(
  email: string,
  code: string,
): Promise<void> {
  await sendMail(
    email,
    "Polyvia – Email verification code",
    `
      <p>Your verification code: <strong>${code}</strong></p>
      <p>This code is valid for 5 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  );
}

export async function sendPasswordResetEmail(
  email: string,
  code: string,
): Promise<void> {
  await sendMail(
    email,
    "Polyvia – Password reset code",
    `
      <p>Your password reset code: <strong>${code}</strong></p>
      <p>This code is valid for 5 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  );
}
