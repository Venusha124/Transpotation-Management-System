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

// PUT update full stop details
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { name, code, address, latitude, longitude, status } = await request.json();

    if (!name || !code || !address) {
      return NextResponse.json({ error: 'Name, code, and address are required' }, { status: 400 });
    }

    if (status && !['ACTIVE', 'INACTIVE'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check uniqueness of code excluding self
    const existing = await db.stop.findUnique({ where: { code: code.toUpperCase() } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: 'A stop with this code already exists' }, { status: 409 });
    }

    const stop = await db.stop.update({
      where: { id },
      data: {
        name,
        code: code.toUpperCase(),
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        ...(status && { status }),
      },
    });

    return NextResponse.json({ success: true, stop }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE a stop
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Check if stop is used by any published route
    const usedInPublishedRoute = await db.routeStop.findFirst({
      where: { stopId: id, route: { status: 'PUBLISHED' } },
    });
    if (usedInPublishedRoute) {
      return NextResponse.json({ error: 'Cannot delete a stop that belongs to a published route' }, { status: 409 });
    }

    await db.stop.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
