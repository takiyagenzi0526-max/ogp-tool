import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

function generateId(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '対応形式は JPEG / PNG / GIF / WebP です' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'ファイルサイズは 5MB 以内にしてください' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const id = generateId();

    await redis.set(`image:${id}`, { contentType: file.type, data: base64 });

    return NextResponse.json({ id, url: `/api/images/${id}` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 });
  }
}
