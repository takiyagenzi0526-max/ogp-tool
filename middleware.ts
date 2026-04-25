import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
    });
  }

  const base64 = authHeader.replace('Basic ', '');
  const credentials = atob(base64);
  const [user, password] = credentials.split(':');

  if (
    user !== process.env.ADMIN_USER ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
    });
  }

  return NextResponse.next();
}

// /admin と /api/links 以下だけにBasic認証をかける
// /l/[id] (公開URL) と / (ランディング) は誰でもアクセスできる
export const config = {
  matcher: ['/admin/:path*', '/api/links/:path*'],
};
