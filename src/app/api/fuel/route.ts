import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const list = await db.fuelLog.findMany();
    return NextResponse.json({ success: true, fuelLogs: list });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vehicleId, driverId, liters, cost, mileage, date } = body;

    if (!vehicleId || !driverId || !liters || !cost || !mileage) {
      return NextResponse.json({ error: 'Missing required fuel fields' }, { status: 400 });
    }

    const log = await db.fuelLog.create({
      data: {
        vehicleId,
        driverId,
        liters: Number(liters),
        cost: Number(cost),
        mileage: Number(mileage),
        date: date ? new Date(date).toISOString() : new Date().toISOString()
      }
    });

    await db.auditLog.create({
      data: {
        action: "Log Fuel",
        details: `Recorded fuel consumption log of ${liters}L for Vehicle ID: ${vehicleId}. Cost: $${cost}`
      }
    });

    return NextResponse.json({ success: true, fuelLog: log });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
