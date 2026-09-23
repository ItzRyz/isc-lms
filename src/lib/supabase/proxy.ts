import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!anonKey) throw new Error("Missing Supabase anon key");
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // If Supabase not configured (dev fallback), allow all
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return supabaseResponse;

  const { data } = await supabase.auth.getClaims()
  const user = data?.claims as { sub?: string } | null
  const userId = user?.sub

  const pathname = request.nextUrl.pathname
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/learning") ||
    pathname.startsWith("/assignments") ||
    pathname.startsWith("/quizzes") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/grades") ||
    pathname.startsWith("/ranking") ||
    pathname.startsWith("/achievements") ||
    pathname.startsWith("/certificates") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/discussions") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/organization") ||
    pathname.startsWith("/mentor") ||
    pathname.startsWith("/coordinator") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/finance");

  const isPublicRoute = pathname.startsWith("/verify/certificate") || pathname === "/" || pathname.startsWith("/_next") || pathname === "/favicon.ico";

  if (!userId && isProtectedRoute && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (userId && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Role guard (server-authoritative, RLS is final boundary)
  if (userId && isProtectedRoute) {
    const { data: roles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", userId);
    const roleNames = (roles as Array<{ roles: { name: string } }> | null)?.map((r) => r.roles.name) || [];

    const isAdminRoute = pathname.startsWith("/admin");
    const isFinanceRoute = pathname.startsWith("/finance");
    const isCoordinatorRoute = pathname.startsWith("/coordinator");
    const isMentorRoute = pathname.startsWith("/mentor");

    if (isAdminRoute && !roleNames.includes("SUPER_ADMIN")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    if (isFinanceRoute && !roleNames.includes("TREASURER") && !roleNames.includes("SUPER_ADMIN")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    if (isCoordinatorRoute) {
      const isCoord = roleNames.some((n) => n.endsWith("_COORDINATOR")) || roleNames.includes("LEADER") || roleNames.includes("SUPER_ADMIN");
      if (!isCoord) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
    if (isMentorRoute) {
      const isMentor = roleNames.includes("MENTOR") || roleNames.some((n) => n.endsWith("_COORDINATOR")) || roleNames.includes("SUPER_ADMIN");
      if (!isMentor) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse
}
