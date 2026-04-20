import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPPORTED_LOCALES = ['vi', 'en'];
const DEFAULT_LOCALE = 'vi';

function parseLocaleCookie(request: NextRequest): string | undefined {
  const cookies = request.cookies.getAll();
  const langCookie = cookies.find(
    (c) => c.name === 'tourista-language' || c.name === 'i18next'
  );
  return langCookie?.value;
}

function detectLocale(request: NextRequest): string {
  const cookieLocale = parseLocaleCookie(request);
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    return cookieLocale;
  }

  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const tags = acceptLanguage.split(',').map((s) => {
      const [tag, qValue] = s.trim().split(';q=');
      return {
        tag: tag.trim().substring(0, 2).toLowerCase(),
        q: qValue ? parseFloat(qValue) : 1,
      };
    });

    tags.sort((a, b) => b.q - a.q);
    for (const { tag } of tags) {
      if (SUPPORTED_LOCALES.includes(tag)) {
        return tag;
      }
    }
  }

  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const locale = detectLocale(request);
  const response = NextResponse.next();
  response.cookies.set('tourista-language', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
