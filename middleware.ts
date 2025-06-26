import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Check for maintenance mode
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
    
    // Allow access to maintenance page itself to avoid redirect loop
    if (req.nextUrl.pathname === '/maintenance') {
      return NextResponse.next();
    }
    
    // If in maintenance mode, redirect to maintenance page
    if (isMaintenanceMode) {
      return NextResponse.redirect(new URL('/maintenance', req.url));
    }
    
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Skip auth check if in maintenance mode
        if (process.env.MAINTENANCE_MODE === 'true') {
          return true;
        }
        
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};