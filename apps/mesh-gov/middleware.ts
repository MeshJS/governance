import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_METHODS = 'GET,OPTIONS,HEAD,POST,PUT,PATCH,DELETE';
const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Requested-With, Accept, Origin';

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  const isPreflight = req.method === 'OPTIONS';

  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  });

  if (isPreflight) {
    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();
  headers.forEach((value, key) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
