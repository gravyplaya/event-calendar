import { NextResponse } from 'next/server';
import { unsubscribeByToken } from '@/app/subscriber-actions';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Missing unsubscribe token' },
      { status: 400 },
    );
  }

  const result = await unsubscribeByToken(token);

  // Return a styled HTML page so it works in email client previews
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Nest — Unsubscribed</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0a0a0a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #fafafa;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .container {
      max-width: 500px;
      padding: 40px 20px;
      text-align: center;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px;
    }
    p {
      color: #a1a1aa;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 24px;
    }
    .card {
      background: #18181b;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 32px;
    }
    a {
      color: #71717a;
      text-decoration: none;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>${result.success ? '✓' : '⚠'}</h1>
      <h1>${result.success ? 'Unsubscribed' : 'Something went wrong'}</h1>
      <p>${
        result.success
          ? result.message ||
            'You have been successfully unsubscribed from The Nest mailing list. We are sorry to see you go!'
          : result.error || 'We could not process your unsubscribe request.'
      }</p>
      <a href="https://spaces.tavonni.com">Return to The Nest</a>
    </div>
  </div>
</body>
</html>
`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
