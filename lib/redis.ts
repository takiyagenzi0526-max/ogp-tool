import { Redis } from '@upstash/redis';

// Upstash for Redis (Vercel Marketplace) の環境変数を読む
// Custom Prefixの設定によって名前が変わるので、複数のパターンに対応する
export const redis = new Redis({
  url:
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.UPSTASH_REDIS_REST_KV_REST_API_URL ||
    process.env.KV_REST_API_URL ||
    '',
  token:
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    '',
});