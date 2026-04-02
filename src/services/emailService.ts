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
    "Intervu – Verify your email",
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email – Intervu</title>
</head>
<body style="margin:0;padding:0;background:#111;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#0A0A0A;border:1px solid #222;border-radius:4px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 28px;border-bottom:1px solid #1a1a1a;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#C8FF00;width:28px;height:28px;border-radius:3px;text-align:center;vertical-align:middle;">
                    <span style="font-size:14px;font-weight:900;color:#0A0A0A;line-height:28px;">I</span>
                  </td>
                  <td style="padding-left:10px;color:#fff;font-size:15px;font-weight:600;letter-spacing:-0.3px;">Intervu</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="color:#666;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">Verify your email</p>
              <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 12px;letter-spacing:-0.5px;line-height:1.3;">Here's your verification code</h1>
              <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 32px;">Enter this code to verify your email address and get started with Intervu.</p>

              <!-- Code block -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#111;border:1px solid #222;border-left:3px solid #C8FF00;border-radius:4px;padding:28px 24px;text-align:center;">
                    <p style="color:#444;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 12px;">One-time code</p>
                    <p style="color:#C8FF00;font-size:38px;font-weight:800;letter-spacing:12px;margin:0;font-family:'Courier New',monospace;">${code}</p>
                  </td>
                </tr>
              </table>

              <p style="color:#444;font-size:13px;margin:0 0 32px;">⏱ This code expires in <strong style="color:#666;">5 minutes</strong></p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1a1a1a;padding-top:24px;">
                <tr>
                  <td>
                    <p style="color:#333;font-size:12px;line-height:1.6;margin:0;">If you didn't request this, you can safely ignore this email. Someone may have entered your address by mistake.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#080808;border-top:1px solid #151515;">
              <p style="color:#2a2a2a;font-size:11px;margin:0;line-height:1.6;">© 2025 Intervu · <a href="#" style="color:#2a2a2a;">Unsubscribe</a> · <a href="#" style="color:#2a2a2a;">Privacy</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  );
}

export async function sendPasswordResetEmail(
  email: string,
  code: string,
): Promise<void> {
  await sendMail(
    email,
"Intervu – Reset your password",
`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password – Intervu</title>
</head>
<body style="margin:0;padding:0;background:#111;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#0A0A0A;border:1px solid #222;border-radius:4px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 28px;border-bottom:1px solid #1a1a1a;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#C8FF00;width:28px;height:28px;border-radius:3px;text-align:center;vertical-align:middle;">
                    <span style="font-size:14px;font-weight:900;color:#0A0A0A;line-height:28px;">I</span>
                  </td>
                  <td style="padding-left:10px;color:#fff;font-size:15px;font-weight:600;letter-spacing:-0.3px;">Intervu</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="color:#666;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">Password reset</p>
              <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 12px;letter-spacing:-0.5px;line-height:1.3;">Reset your password</h1>
              <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 32px;">Use the code below to reset your password. If you didn't request this, your account is still safe.</p>

              <!-- Code block -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#111;border:1px solid #222;border-left:3px solid #C8FF00;border-radius:4px;padding:28px 24px;text-align:center;">
                    <p style="color:#444;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 12px;">Reset code</p>
                    <p style="color:#C8FF00;font-size:38px;font-weight:800;letter-spacing:12px;margin:0;font-family:'Courier New',monospace;">${code}</p>
                  </td>
                </tr>
              </table>

              <p style="color:#444;font-size:13px;margin:0 0 32px;">⏱ This code expires in <strong style="color:#666;">5 minutes</strong></p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1a1a1a;padding-top:24px;">
                <tr>
                  <td>
                    <p style="color:#333;font-size:12px;line-height:1.6;margin:0;">If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#080808;border-top:1px solid #151515;">
              <p style="color:#2a2a2a;font-size:11px;margin:0;line-height:1.6;">© 2025 Intervu · <a href="#" style="color:#2a2a2a;">Unsubscribe</a> · <a href="#" style="color:#2a2a2a;">Privacy</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  );
}
