export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyTokenNode } from '@/lib/auth';

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  const payload = verifyTokenNode(token);
  if (!payload || !['ADMIN', 'SUPER_ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER'].includes(payload.role)) return null;
  return payload;
}

// GET all routes (public for website/customer portal)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get('published') === 'true';

    const routes = await db.route.findMany({
      where: publishedOnly ? { status: 'PUBLISHED' } : undefined,
      include: {
        routeStops: {
          orderBy: { orderIndex: 'asc' },
          include: { stop: true },
        },
        trips: {
          where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
          select: { id: true, trackingNumber: true, status: true, eta: true, vehicle: { select: { brand: true, model: true, number: true } } },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, routes });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a route (admin only)
export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });



    const body = await request.json();
    const { name, code, startLocation, endLocation, distance, duration, basePrice, stops, publish, type } = body;

    // ─── Validation Rules ───────────────────────────────────────

    // Required fields
    if (!name || !code || !startLocation || !endLocation) {
      return NextResponse.json({ error: 'Route name, code, start and end location are required' }, { status: 400 });
    }

    // Distance must be positive
    if (!distance || parseFloat(distance) <= 0) {
      return NextResponse.json({ error: 'Distance must be a positive number (km)' }, { status: 400 });
    }

    // Duration must be > 0
    if (!duration || parseInt(duration) <= 0) {
      return NextResponse.json({ error: 'Estimated duration must be greater than 0 minutes' }, { status: 400 });
    }

    // At least 2 stops
    if (!stops || stops.length < 2) {
      return NextResponse.json({ error: 'Route must have at least 2 bus stops' }, { status: 400 });
    }

    // Cannot publish without stops (double-check)
    if (publish && stops.length < 2) {
      return NextResponse.json({ error: 'Route cannot be published without at least 2 stops' }, { status: 400 });
    }

    // Unique route code
    const existingCode = await db.route.findUnique({ where: { code: code.toUpperCase() } });
    if (existingCode) {
      return NextResponse.json({ error: `Route code "${code.toUpperCase()}" already exists` }, { status: 409 });
    }

    // Duplicate start+end location check
    const duplicateRoute = await db.route.findFirst({ where: { startLocation, endLocation } });
    if (duplicateRoute) {
      return NextResponse.json({ error: `A route from "${startLocation}" to "${endLocation}" already exists` }, { status: 409 });
    }

    // Validate all stops exist and are ACTIVE
    const stopIds: string[] = stops.map((s: any) => s.stopId);
    const dbStops = await db.stop.findMany({ where: { id: { in: stopIds } } });

    if (dbStops.length !== stopIds.length) {
      return NextResponse.json({ error: 'One or more stops could not be found' }, { status: 400 });
    }

    const inactiveStop = dbStops.find(s => s.status !== 'ACTIVE');
    if (inactiveStop) {
      return NextResponse.json({ error: `Stop "${inactiveStop.name}" is inactive and cannot be assigned to a route` }, { status: 400 });
    }

    // ─── Create Route + Stops ───────────────────────────────────

    const route = await db.route.create({
      data: {
        name,
        code: code.toUpperCase(),
        startLocation,
        endLocation,
        distance: parseFloat(distance),
        duration: parseInt(duration),
        basePrice: basePrice ? parseFloat(basePrice) : 0,
        status: publish ? 'PUBLISHED' : 'DRAFT',
        type: type || 'EXPRESS',
        routeStops: {
          create: stops.map((s: any, idx: number) => ({
            stopId: s.stopId,
            orderIndex: idx,
            arrivalOffset: s.arrivalOffset ? parseInt(s.arrivalOffset) : 0,
          })),
        },
      },
      include: {
        routeStops: { orderBy: { orderIndex: 'asc' }, include: { stop: true } },
      },
    });

    return NextResponse.json({ success: true, route }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A route between these locations already exists' }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
