import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyTokenNode } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyTokenNode(token);
    if (!payload || !['ADMIN', 'TRANSPORT_MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all bookings to analyze routes
    const bookings = await db.booking.findMany({
      include: { trip: true }
    });

    const routesDemand: Record<string, number> = {};
    bookings.forEach(b => {
      const routeKey = `${b.pickup} to ${b.destination}`;
      if (!routesDemand[routeKey]) routesDemand[routeKey] = 0;
      routesDemand[routeKey] += 1;
    });

    const insights = [];
    for (const [route, count] of Object.entries(routesDemand)) {
      if (count > 5) {
        insights.push({
          route,
          demandLevel: 'High',
          message: `High demand detected on ${route}. Recommend deploying additional fleet or increasing surge pricing multiplier.`
        });
      } else if (count > 2) {
        insights.push({
          route,
          demandLevel: 'Medium',
          message: `Steady demand on ${route}. Current fleet allocation is sufficient.`
        });
      }
    }

    if (insights.length === 0) {
      insights.push({
        route: 'General',
        demandLevel: 'Low',
        message: 'Demand is currently low across all routes. Consider promotional campaigns.'
      });
    }

    return NextResponse.json({ success: true, insights, rawDemand: routesDemand });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
