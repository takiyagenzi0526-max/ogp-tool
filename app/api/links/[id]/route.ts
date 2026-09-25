import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

type LinkData = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  createdAt: string;
  updatedAt?: string;
};

// 既存リンクの中身（タイトル・説明・画像・リンク先）を差し替える。
// id（短縮URL）と作成日時はそのまま。
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const existing = await redis.get<LinkData>(`link:${id}`);
    if (!existing) {
      return NextResponse.json({ error: 'リンクが見つかりません' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, imageUrl, targetUrl } = body;

    if (!title || !imageUrl || !targetUrl) {
      return NextResponse.json(
        { error: 'title, imageUrl, targetUrl are required' },
        { status: 400 }
      );
    }

    const link: LinkData = {
      ...existing,
      title,
      description: description || '',
      imageUrl,
      targetUrl,
      updatedAt: new Date().toISOString(),
    };

    await redis.set(`link:${id}`, link);

    return NextResponse.json(link);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await redis.del(`link:${id}`);
    await redis.lrem('link:ids', 0, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
