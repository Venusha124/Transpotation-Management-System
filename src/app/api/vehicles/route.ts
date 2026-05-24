export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const list = await db.vehicle.findMany();
    return NextResponse.json({ success: true, vehicles: list });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      number, type, capacity, model, brand, fuelType, insuranceExpiry, licenseExpiry, status = "Available"
    } = body;

    if (!number || !type || !capacity || !model || !brand || !fuelType || !insuranceExpiry || !licenseExpiry) {
      return NextResponse.json({ error: 'Missing required vehicle fields' }, { status: 400 });
    }

    const existing = await db.vehicle.findUnique({ where: { number } });
    if (existing) {
      return NextResponse.json({ error: 'Vehicle number already exists' }, { status: 400 });
    }

    const vehicle = await db.vehicle.create({
      data: {
        number,
        type,
        capacity: Number(capacity),
        model,
        brand,
        fuelType,
        insuranceExpiry: new Date(insuranceExpiry).toISOString(),
        licenseExpiry: new Date(licenseExpiry).toISOString(),
        status
      }
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        action: "Create Vehicle",
        details: `Registered new vehicle: ${number} (${brand} ${model})`
      }
    });

    return NextResponse.json({ success: true, vehicle });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
