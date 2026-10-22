import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const pathname = req.nextUrl.pathname;

      if (pathname.startsWith("/admin")) {
        return token?.role === "ADMIN";
      }

      // Checkout fica aberto: dá pra comprar sem login
      if (pathname.startsWith("/conta")) {
        return !!token;
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/conta/:path*", "/admin/:path*"],
};
