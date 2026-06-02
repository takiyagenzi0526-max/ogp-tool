import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

type LinkData = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  createdAt: string;
};

function generateId(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export async function GET() {
  try {
    const ids = (await redis.lrange<string>('link:ids', 0, -1)) || [];
    if (ids.length === 0) return NextResponse.json([]);

    const links = await Promise.all(
      ids.map((id) => redis.get<LinkData>(`link:${id}`))
    );
    const filtered = links
      .filter((l): l is LinkData => l !== null)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return NextResponse.json(filtered);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to list' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, imageUrl, targetUrl, customId } = body;

    if (!title || !imageUrl || !targetUrl) {
      return NextResponse.json(
        { error: 'title, imageUrl, targetUrl are required' },
        { status: 400 }
      );
    }

    // カスタムID（/l/●●● の文字）指定があればそれを使い、空ならランダム生成
    let id: string;
    if (customId && String(customId).trim() !== '') {
      id = String(customId).trim().toLowerCase();
      if (!/^[a-z0-9-]{1,50}$/.test(id)) {
        return NextResponse.json(
          { error: 'カスタムURLは半角英小文字・数字・ハイフンのみ（1〜50文字）で入力してください' },
          { status: 400 }
        );
      }
      const existing = await redis.get(`link:${id}`);
      if (existing) {
        return NextResponse.json(
          { error: `「${id}」はすでに使われています。別の文字を指定してください` },
          { status: 409 }
        );
      }
    } else {
      id = generateId();
    }

    const link: LinkData = {
      id,
      title,
      description: description || '',
      imageUrl,
      targetUrl,
      createdAt: new Date().toISOString(),
    };

    await redis.set(`link:${id}`, link);
    await redis.lpush('link:ids', id);

    return NextResponse.json(link);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
