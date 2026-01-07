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

        // Restrict API access to prevent direct browser access while allowing frontend
        if (req.nextUrl.pathname.startsWith('/api')) {
            const origin = req.headers.get('origin');
            const host = req.headers.get('host');
            const referer = req.headers.get('referer');
            const userAgent = req.headers.get('user-agent');

            // Block direct browser navigation (no origin/referer but has browser user-agent)
            const isDirectBrowserAccess = !origin && !referer && userAgent && userAgent.includes('Mozilla');

            // Allow server-side requests (no origin/referer and no browser user-agent)
            const isServerSideRequest = !origin && !referer && (!userAgent || !userAgent.includes('Mozilla'));

            // Allow same-origin requests from frontend (with origin or referer)
            const isSameOrigin = origin && host && origin === `${req.nextUrl.protocol}//${host}`;
            const isRefererSameOrigin = referer && host && referer.startsWith(`${req.nextUrl.protocol}//${host}`);

            if (isDirectBrowserAccess) {
                return new NextResponse(
                    JSON.stringify({ error: 'Forbidden: Direct API access not allowed' }),
                    {
                        status: 403,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );
            }

            // Block external/cross-origin requests
            if (!isServerSideRequest && !isSameOrigin && !isRefererSameOrigin) {
                return new NextResponse(
                    JSON.stringify({ error: 'Forbidden: Cross-origin API access not allowed' }),
                    {
                        status: 403,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );
            }
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
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
        '/api/:path*'
    ]
};
