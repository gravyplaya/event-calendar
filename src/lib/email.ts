import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const fromEmail =
  process.env.FROM_EMAIL || 'The Nest <noreply@send.tavonni.com>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spaces.tavonni.com';

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY is not set. Add it to your environment variables.',
      );
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  unsubscribeToken?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  unsubscribeToken,
}: SendEmailParams) {
  try {
    const headers: Record<string, string> = {};

    if (unsubscribeToken) {
      const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${unsubscribeToken}`;
      headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`;
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
    }

    const result = await getResend().emails.send({
      from: fromEmail,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
      headers,
    });

    if (result.error) {
      console.error('[sendEmail] Resend error:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('[sendEmail] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

export function getWelcomeEmailHtml(firstName: string, points: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to The Nest Loyalty Program</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fafafa;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;font-weight:700;margin:0;color:#fafafa;">The Nest</h1>
      <p style="color:#a1a1aa;font-size:14px;margin:4px 0 0;">Restaurant and Nightclub</p>
    </div>
    <div style="background:#18181b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;">
      <h2 style="font-size:22px;margin:0 0 16px;color:#fafafa;">Welcome, ${firstName}! 🎉</h2>
      <p style="font-size:16px;line-height:1.6;color:#a1a1aa;margin:0 0 24px;">
        You're officially part of The Nest Loyalty Program. You've earned
        <strong style="color:#fafafa;">${points} points</strong> just for signing up!
      </p>
      <div style="background:#09090b;border-radius:12px;padding:20px;margin:24px 0;">
        <p style="font-size:14px;color:#71717a;margin:0 0 8px;">Your points balance</p>
        <p style="font-size:32px;font-weight:700;color:#fafafa;margin:0;">${points} pts</p>
      </div>
      <p style="font-size:15px;line-height:1.6;color:#a1a1aa;margin:0 0 16px;">
        Earn more points by attending events — just scan the QR code at the door.
        Redeem points for food and drink discounts at The Nest.
      </p>
      <a href="${appUrl}/calendar" style="display:inline-block;background:#fafafa;color:#0a0a0a;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;margin-top:8px;">
        View Upcoming Events
      </a>
    </div>
    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:13px;color:#52525b;margin:0;">
        The Nest Restaurant and Nightclub — Muskegon, MI<br>
        <a href="${appUrl}" style="color:#52525b;">spaces.tavonni.com</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
}

export function getWelcomeEmailText(firstName: string, points: number): string {
  return `Welcome to The Nest Loyalty Program, ${firstName}!

You're officially part of The Nest Loyalty Program. You've earned ${points} points just for signing up!

Earn more points by attending events — just scan the QR code at the door.
Redeem points for food and drink discounts at The Nest.

View upcoming events: ${appUrl}/calendar

The Nest Restaurant and Nightclub — Muskegon, MI
${appUrl}`;
}

export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  points: number,
  unsubscribeToken: string,
) {
  return sendEmail({
    to: email,
    subject: `Welcome to The Nest Loyalty Program — ${points} points earned!`,
    html: getWelcomeEmailHtml(firstName, points),
    text: getWelcomeEmailText(firstName, points),
    unsubscribeToken,
  });
}
