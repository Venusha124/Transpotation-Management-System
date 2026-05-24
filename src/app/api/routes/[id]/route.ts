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

// GET single route
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const route = await db.route.findUnique({
      where: { id },
      include: {
        routeStops: { orderBy: { orderIndex: 'asc' }, include: { stop: true } },
        trips: {
          where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
          include: { vehicle: true, driver: true },
        },
      },
    });
    if (!route) return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    return NextResponse.json({ success: true, route });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH update route (publish/unpublish or update fields)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    // If publishing, confirm at least 2 stops exist
    if (body.status === 'PUBLISHED') {
      const stopCount = await db.routeStop.count({ where: { routeId: id } });
      if (stopCount < 2) {
        return NextResponse.json({ error: 'Route cannot be published without at least 2 stops' }, { status: 400 });
      }
    }

    const route = await db.route.update({ where: { id }, data: body });
    return NextResponse.json({ success: true, route });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update full route
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { name, code, startLocation, endLocation, distance, duration, basePrice, publish, stops } = await request.json();

    if (!name || !code || !startLocation || !endLocation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!distance || parseFloat(distance) <= 0) {
      return NextResponse.json({ error: 'Distance must be a positive number (km)' }, { status: 400 });
    }

    if (!duration || parseInt(duration) <= 0) {
      return NextResponse.json({ error: 'Estimated duration must be greater than 0 minutes' }, { status: 400 });
    }

    if (!stops || stops.length < 2) {
      return NextResponse.json({ error: 'Route must have at least 2 bus stops' }, { status: 400 });
    }

    if (publish && stops.length < 2) {
      return NextResponse.json({ error: 'Route cannot be published without at least 2 stops' }, { status: 400 });
    }

    // Check for unique code (excluding self)
    const existingCode = await db.route.findUnique({ where: { code: code.toUpperCase() } });
    if (existingCode && existingCode.id !== id) {
      return NextResponse.json({ error: `Route code "${code.toUpperCase()}" already exists` }, { status: 409 });
    }

    // Check for duplicate start+end (excluding self)
    const duplicateRoute = await db.route.findFirst({ where: { startLocation, endLocation } });
    if (duplicateRoute && duplicateRoute.id !== id) {
      return NextResponse.json({ error: `A route from "${startLocation}" to "${endLocation}" already exists` }, { status: 409 });
    }

    // Validate stops
    const stopIds: string[] = stops.map((s: any) => s.stopId);
    const dbStops = await db.stop.findMany({ where: { id: { in: stopIds } } });

    if (dbStops.length !== stopIds.length) {
      return NextResponse.json({ error: 'One or more stops could not be found' }, { status: 400 });
    }

    const inactiveStop = dbStops.find(s => s.status !== 'ACTIVE');
    if (inactiveStop) {
      return NextResponse.json({ error: `Stop "${inactiveStop.name}" is inactive and cannot be assigned to a route` }, { status: 400 });
    }

    const route = await db.route.update({
      where: { id },
      data: {
        name,
        code: code.toUpperCase(),
        startLocation,
        endLocation,
        distance: parseFloat(distance),
        duration: parseInt(duration),
        basePrice: basePrice ? parseFloat(basePrice) : 0,
        status: publish ? 'PUBLISHED' : 'DRAFT',
        routeStops: {
          deleteMany: {}, // Clear existing stops
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

    return NextResponse.json({ success: true, route }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE a route
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Cannot delete if active trips exist
    const activeTrips = await db.trip.count({ where: { routeId: id, status: { in: ['ASSIGNED', 'IN_PROGRESS'] } } });
    if (activeTrips > 0) {
      return NextResponse.json({ error: 'Cannot delete a route with active trips' }, { status: 409 });
    }

    await db.route.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
