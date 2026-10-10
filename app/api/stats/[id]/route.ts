import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';
import { toCounts } from '@/lib/clicks';

export const dynamic = 'force-dynamic';

// 1リンクの日別クリック数 { 'YYYY-MM-DD': n, ... }
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const daily = await redis.hgetall(`clicks:${params.id}`);
    return NextResponse.json(toCounts(daily));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
