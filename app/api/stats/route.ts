import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';
import { jstDate, toCounts } from '@/lib/clicks';

export const dynamic = 'force-dynamic';

// 管理画面のリアルタイム表示用。全リンクの累計と今日のクリック数（2コマンド）。
export async function GET() {
  try {
    const [total, today] = await Promise.all([
      redis.hgetall('clicks:total'),
      redis.hgetall(`clicks:day:${jstDate()}`),
    ]);
    return NextResponse.json({ total: toCounts(total), today: toCounts(today) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
