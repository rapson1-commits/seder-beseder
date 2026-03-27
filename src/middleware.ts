import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** Routes that require an authenticated session */
const PROTECTED_PREFIXES = [
  '/home',
  '/members',
  '/events',
  '/history',
  '/insights',
  '/settings',
]

/** Routes that authenticated users should not visit (e.g. login screen) */
const AUTH_ONLY_PATHS = ['/setup']

export async function middleware(req: NextRequest) {
  // Build a mutable response so Supabase can refresh the session cookie
  let res = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // Propagate set-cookie headers into both the request and response
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: { headers: req.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session (important: always call getUser, not getSession, for security)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = req.nextUrl

  // Unauthenticated user tries to access a protected route → redirect to root
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  if (isProtected && !user) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Authenticated user visits /setup — let them through (they may need to pick family)
  // If you want to auto-redirect them to /home when already set up,
  // add that logic here after checking their profile.family_id.

  return res
}

export const config = {
  // Run on all routes EXCEPT Next.js internals and static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|index.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
