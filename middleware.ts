import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect chat routes
        if (req.nextUrl.pathname.startsWith('/chat')) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/chat/:path*']
};