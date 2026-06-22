import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Protege /admin — exige role ADMIN
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // /conta e /checkout exigem qualquer usuário autenticado
        if (pathname.startsWith("/conta") || pathname.startsWith("/checkout")) {
          return !!token;
        }
        // /admin exige token (o role é verificado no middleware)
        if (pathname.startsWith("/admin")) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/conta/:path*", "/checkout/:path*", "/admin/:path*"],
};
