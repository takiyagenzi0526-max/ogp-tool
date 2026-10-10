import { redis } from '@/lib/redis';

// クリック数の保存先（すべてRedisのhash）
//   clicks:total        … field=リンクid, value=累計
//   clicks:day:<日付>    … field=リンクid, value=その日のクリック数（一覧の「今日」用）
//   clicks:<リンクid>    … field=日付,     value=その日のクリック数（日別の履歴用）
// 日付は日本時間の YYYY-MM-DD

export function jstDate(d = new Date()): string {
  return new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function recordClick(id: string) {
  const day = jstDate();
  const p = redis.pipeline();
  p.hincrby('clicks:total', id, 1);
  p.hincrby(`clicks:day:${day}`, id, 1);
  p.hincrby(`clicks:${id}`, day, 1);
  await p.exec();
}

export async function deleteClicks(id: string) {
  const p = redis.pipeline();
  p.hdel('clicks:total', id);
  p.del(`clicks:${id}`);
  await p.exec();
}

export function toCounts(raw: Record<string, unknown> | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw || {})) out[k] = Number(v) || 0;
  return out;
}
