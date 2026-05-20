import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const list = await db.maintenance.findMany();
    return NextResponse.json({ success: true, maintenance: list });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vehicleId, type, description, cost, status, scheduledDate, completedDate, partsUsed } = body;

    if (!vehicleId || !type || !description || !cost || !status || !scheduledDate) {
      return NextResponse.json({ error: 'Missing required maintenance fields' }, { status: 400 });
    }

    const log = await db.maintenance.create({
      data: {
        vehicleId,
        type,
        description,
        cost: Number(cost),
        status,
        scheduledDate: new Date(scheduledDate).toISOString(),
        completedDate: completedDate ? new Date(completedDate).toISOString() : null,
        partsUsed
      }
    });

    // Link vehicle status based on maintenance status
    if (status === 'IN_PROGRESS' || status === 'SCHEDULED' || status === 'OVERDUE') {
      await db.vehicle.update({
        where: { id: vehicleId },
        data: { status: "Maintenance", availability: false }
      });
    } else if (status === 'COMPLETED') {
      await db.vehicle.update({
        where: { id: vehicleId },
        data: { status: "Available", availability: true }
      });
    }

    await db.auditLog.create({
      data: {
        action: "Log Maintenance",
        details: `Recorded maintenance service (${type}) for Vehicle ID: ${vehicleId}. Cost: $${cost}`
      }
    });

    return NextResponse.json({ success: true, maintenance: log });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
