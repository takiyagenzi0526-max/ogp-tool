import { redis } from '@/lib/redis';
import { recordClick } from '@/lib/clicks';

// /l/[id] のJSリダイレクトはここを経由する。クリック数を+1してからリンク先へ302。
// キャッシュさせない（CDNに返されると数えられないため）。
export const dynamic = 'force-dynamic';

type LinkData = { targetUrl: string };

const BOT_UA =
  /bot|crawler|spider|preview|scraper|facebookexternalhit|meta-externalagent|slackbot|linkedinbot|discordbot|whatsapp|telegram|embedly|skypeuripreview/i;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const link = await redis.get<LinkData>(`link:${params.id}`);
  if (!link) {
    return new Response('Not Found', { status: 404 });
  }

  const ua = request.headers.get('user-agent') || '';
  const isPrefetch =
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('sec-purpose')?.includes('prefetch');
  if (!BOT_UA.test(ua) && !isPrefetch) {
    try {
      await recordClick(params.id);
    } catch (e) {
      // カウント失敗でもリダイレクトは止めない
      console.error(e);
    }
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: link.targetUrl,
      'Cache-Control': 'no-store',
    },
  });
}
