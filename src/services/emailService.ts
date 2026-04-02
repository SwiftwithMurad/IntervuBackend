import { env } from "../config/env";

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

/** 56×56 PNG of app icon, embedded for email clients (regenerate from `src/assets/email-logo.png` if logo changes). */
const EMAIL_LOGO_DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAIAAAAn5KxJAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAOKADAAQAAAABAAAAOAAAAAANV2hTAAAC+ElEQVRoBe1Zu24TQRS91+tn7MRxbGObBCFFVDRU/AWipUMiHS1fwA9QgkRLQ0V+AImSCj4CkBw7iR0H4/d6hzM7fqCxtIM821ia0Wg1d9Zz7rnnrrzSWc7n87QLI7ELJCVHRzTuTjlFnaJxKxA33s48o0lj5UIQCWImwox7KHAgS/zIYSAKoExWooyHNJtQEEjSwE0k5GQ1o9MIeUIE8uziGlYOEM+jZJqyebk/GRu4GohOR/Tkxez5K799yd1L7lxwp8nXF9xt8c0V/+7y4JZGQ0YNc59kVblFPoSz6YIKNvcKolAUB2UqVcVRTRzVg3JDlGoCYbVCH94kz9+lMntRkhqIIjcqvn8a1E/lS0z1B4rMiaZzGg8k0dsu91BGi1s/+dPb9J8ezef08HHw9GxWrInDquQHluCazlLqn5ehak+aQlEBGjkMRHEWXH2i2QYKGlc4EPsH1LgnUINHNCL6/DEFmf0ZPXgUPDvzx0Rgowiphk83ccIUG9v6hpmofmIZq8TLSIqN5xhVqYHWg+Vkddt6sTN/T46oda81AKeoJoh16BS1llADcIpqgliHTlFrCTUAp6gmiHXoFLWWUANwimqCWIdOUWsJNQCnqCaIdegUtZZQA3CKaoJYh05Rawk1gC29JzhNmGjH6orFPHRSVYKER5ml+7fyyZRbpjH4z9BMFIYtnEGYX6CCgWQw9yYTGva5f8O9K2k4XsM0bXL7F3fbDIrpDH3/4r1+makci+pJULkLQ1QcVkS+KHL5tfMITKCBgdFuRl4DUXjKoPLtq9cMqShCnZbkB5aDPk+GBJNROdH4MRxQZGWPWj/4/H1SeepeUu7nCmK/JI3ccl1UjoM7J6hBVBqiXhejgZkrGz/aIjGMWX9KAdxbVL80xRfWuNyS+9EDdqScoUEOHOlO4rtAglKhNY71FCZlJI6ZqGSwanw0na3uKkvV2H1D6xepI2vdit76kJGi+qn7H11LFs/KKRqPjmsUp+hai3hWTtF4dFyj/AUumPwI8RkFxgAAAABJRU5ErkJggg==";

function emailBrandHeader(): string {
  return `<table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:28px;height:28px;vertical-align:middle;padding:0;">
                    <img src="${EMAIL_LOGO_DATA_URI}" width="28" height="28" alt="Intervu" style="display:block;border:0;border-radius:6px;" />
                  </td>
                  <td style="padding-left:10px;color:#fff;font-size:15px;font-weight:600;letter-spacing:-0.3px;vertical-align:middle;">Intervu</td>
                </tr>
              </table>`;
}

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
        sender: { name: env.EMAIL_SENDER_NAME, email: env.EMAIL_FROM },
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
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#0A0A0A;border:1px solid #222;border-radius:4px;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 28px;border-bottom:1px solid #1a1a1a;">
              ${emailBrandHeader()}
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="color:#666;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">Verify your email</p>
              <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 12px;letter-spacing:-0.5px;line-height:1.3;">Here's your verification code</h1>
              <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 32px;">Enter this code to verify your email address and get started with Intervu.</p>
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
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#0A0A0A;border:1px solid #222;border-radius:4px;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 28px;border-bottom:1px solid #1a1a1a;">
              ${emailBrandHeader()}
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="color:#666;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">Password reset</p>
              <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 12px;letter-spacing:-0.5px;line-height:1.3;">Reset your password</h1>
              <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 32px;">Use the code below to reset your password. If you didn't request this, your account is still safe.</p>
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
