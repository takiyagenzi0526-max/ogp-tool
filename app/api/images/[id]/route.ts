import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

type ImageData = {
  contentType: string;
  data: string; // base64
};

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const record = await redis.get<ImageData>(`image:${params.id}`);

    if (!record) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const buffer = Buffer.from(record.data, 'base64');

    return new Response(buffer, {
      headers: {
        'Content-Type': record.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}
