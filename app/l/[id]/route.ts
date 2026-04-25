import { redis } from '@/lib/redis';

type LinkData = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  createdAt: string;
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const link = await redis.get<LinkData>(`link:${params.id}`);

  if (!link) {
    return new Response(notFoundHtml(), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const t = escapeHtml(link.title);
  const d = escapeHtml(link.description);
  const img = escapeHtml(link.imageUrl);
  const url = escapeHtml(link.targetUrl);

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${t}</title>
  <meta name="description" content="${d}">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${t}">
  <meta property="og:description" content="${d}">
  <meta property="og:image" content="${img}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${url}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${t}">
  <meta name="twitter:description" content="${d}">
  <meta name="twitter:image" content="${img}">

  <!-- 人間向けのリダイレクト。クローラーはここに到達する前にOGPを読み取る -->
  <meta http-equiv="refresh" content="1; url=${url}">
  <script>
    (function() {
      var ua = navigator.userAgent || '';
      var isBot = /bot|crawler|spider|twitterbot|facebookexternalhit|slackbot|linkedinbot|discordbot|whatsapp|line|telegram/i.test(ua);
      if (!isBot) {
        window.location.replace(${JSON.stringify(link.targetUrl)});
      }
    })();
  </script>

  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 480px;
      margin: 0 auto;
      padding: 60px 24px;
      text-align: center;
      color: #333;
    }
    img { max-width: 100%; border-radius: 8px; margin-bottom: 24px; }
    h1 { font-size: 20px; margin-bottom: 12px; }
    p { color: #666; margin-bottom: 24px; }
    a { color: #0070f3; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <img src="${img}" alt="">
  <h1>${t}</h1>
  <p>${d}</p>
  <p>移動中... <a href="${url}">こちらをクリック</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

function notFoundHtml(): string {
  return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><title>Not Found</title></head>
<body style="font-family:sans-serif;padding:40px;text-align:center;">
<h1>404</h1><p>このリンクは存在しません。</p>
</body></html>`;
}
