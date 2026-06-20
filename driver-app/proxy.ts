import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/conductores/(.*)/reputacion'
])

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  if (isAdminRoute(req)) {
    const { sessionClaims, userId } = await auth();
    
    let userRole = (sessionClaims?.publicMetadata as any)?.role || 
                   (sessionClaims?.metadata as any)?.role;

    // Si el JWT dice que no es admin (o falta), verificamos con la API por si fue promovido recientemente
    if (String(userRole || "").toLowerCase() !== "admin" && userId) {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      userRole = user.publicMetadata?.role;
    }

    const normalizedRole = String(userRole || "").toLowerCase();
    if (normalizedRole !== "admin") {
      const homeUrl = new URL('/', req.url);
      return NextResponse.redirect(homeUrl);
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}