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

// GET all stops
export async function GET() {
  try {
    const stops = await db.stop.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, stops });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create stop
export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, code, address, latitude, longitude } = await request.json();

    if (!name || !code || !address) {
      return NextResponse.json({ error: 'Name, code, and address are required' }, { status: 400 });
    }

    const existing = await db.stop.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: 'A stop with this code already exists' }, { status: 409 });
    }

    const stop = await db.stop.create({
      data: {
        name,
        code: code.toUpperCase(),
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, stop }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
