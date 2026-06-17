import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge } from './lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect routes starting with /dashboard
  if (pathname.startsWith('/dashboard')) {
    const tokenCookie = request.cookies.get('token');
    
    if (!tokenCookie) {
      // Redirect to login if no token is found
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyTokenEdge(tokenCookie.value);

    if (!payload) {
      // Token is invalid or expired
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token'); // Clear invalid token
      return response;
    }

    // Role-Based Access Control (RBAC) rules
    const role = payload.role;

    // 1. Customer Access Gating
    if (role === 'CUSTOMER') {
      // Customers are restricted ONLY to the customer portal and live tracking page
      if (
        !pathname.startsWith('/dashboard/customer-portal') && 
        !pathname.startsWith('/dashboard/tracking') && 
        pathname !== '/dashboard'
      ) {
        return NextResponse.redirect(new URL('/dashboard/customer-portal', request.url));
      }
    }

    // 2. Driver Access Gating
    if (role === 'DRIVER') {
      // Drivers can only view route runs, driver portal, live tracking, and notifications
      const allowedPaths = ['/dashboard/route-runs', '/dashboard/driver-portal', '/dashboard/tracking', '/dashboard/notifications'];
      const isAllowed = allowedPaths.some(path => pathname.startsWith(path)) || pathname === '/dashboard';
      if (!isAllowed) {
        return NextResponse.redirect(new URL('/dashboard/driver-portal', request.url));
      }
    }

    // 3. Accountant Access Gating
    if (role === 'ACCOUNTANT') {
      // Accountants cannot access admin panel, vehicles, or driver forms directly, but can see billing, reports, fuel
      const disallowedPaths = ['/dashboard/admin', '/dashboard/vehicles', '/dashboard/drivers'];
      const isDisallowed = disallowedPaths.some(path => pathname.startsWith(path));
      if (isDisallowed) {
        return NextResponse.redirect(new URL('/dashboard/billing', request.url));
      }
    }

    // 4. Dispatcher Access Gating
    if (role === 'DISPATCHER') {
      // Dispatchers cannot access admin or billing
      const disallowedPaths = ['/dashboard/admin', '/dashboard/billing'];
      const isDisallowed = disallowedPaths.some(path => pathname.startsWith(path));
      if (isDisallowed) {
        return NextResponse.redirect(new URL('/dashboard/route-runs', request.url));
      }
    }

    // 5. Admin has full access, Transport Manager has everything except /dashboard/admin
    if (role === 'TRANSPORT_MANAGER' && pathname.startsWith('/dashboard/admin')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Apply middleware config
export const config = {
  matcher: ['/dashboard/:path*', '/dashboard'],
};
