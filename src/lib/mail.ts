import 'server-only';
import nodemailer from 'nodemailer';

/**
 * Transactional email (NOT-01, NOT-02).
 *
 * With no SMTP credentials configured the message is logged instead of sent,
 * so development and demos work without a mail account. Production requires
 * the SMTP_* variables — see PRD §11, item 5.
 */
const host = process.env.SMTP_HOST;
const configured = Boolean(host);

const transporter = configured
  ? nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
  : null;

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendMail(message: MailMessage): Promise<{ sent: boolean }> {
  const from = process.env.MAIL_FROM ?? 'Adenium <no-reply@adenium.local>';

  if (!transporter) {
    console.info(
      `\n[mail:not-configured] → ${message.to}\n  Subject: ${message.subject}\n  ${
        message.text ?? stripTags(message.html)
      }\n`,
    );
    return { sent: false };
  }

  await transporter.sendMail({
    from,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text ?? stripTags(message.html),
  });
  return { sent: true };
}

function stripTags(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Shared shell so every transactional email looks like the same shop (NOT-05). */
export function emailLayout(title: string, bodyHtml: string): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#faf8f4;font-family:Helvetica,Arial,sans-serif;color:#1a1f1b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e0dccf">
        <tr><td style="padding:24px 28px;border-bottom:1px solid #e0dccf">
          <a href="${site}" style="font-size:22px;color:#1a1f1b;text-decoration:none">Adenium</a>
        </td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#1a1f1b">${title}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 28px;border-top:1px solid #e0dccf;font-size:12px;color:#6b7770">
          Adenium · Desert roses, caudex plants and rare cacti<br/>
          <a href="${site}/pages/contact" style="color:#1f5c40">Contact us</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:#1f5c40;color:#ffffff;padding:12px 22px;text-decoration:none;font-size:14px">${label}</a></p>`;
}
