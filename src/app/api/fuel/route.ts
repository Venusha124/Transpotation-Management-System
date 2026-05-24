export const dynamic = 'force-dynamic';
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

    const newMileage = Number(mileage);
    const log = await db.fuelLog.create({
      data: {
        vehicleId,
        driverId,
        liters: Number(liters),
        cost: Number(cost),
        mileage: newMileage,
        date: date ? new Date(date).toISOString() : new Date().toISOString()
      }
    });

    // Automated Preventive Maintenance Tracking
    const vehicle = await db.vehicle.findUnique({ where: { id: vehicleId } });
    if (vehicle) {
      const oldMileage = vehicle.totalMileage || 0;
      if (newMileage > oldMileage) {
        await db.vehicle.update({
          where: { id: vehicleId },
          data: { totalMileage: newMileage }
        });

        // Trigger maintenance every 10,000 km
        if (Math.floor(oldMileage / 10000) < Math.floor(newMileage / 10000)) {
          const nextInterval = Math.floor(newMileage / 10000) * 10000;
          
          await db.maintenance.create({
            data: {
              vehicleId,
              type: "Automated Routine Service",
              description: `System generated ${nextInterval}km scheduled maintenance for ${vehicle.number}`,
              cost: 0,
              status: "SCHEDULED",
              scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Schedule 7 days out
              completedDate: null,
              partsUsed: ""
            }
          });

          // Notify Transport Managers
          const managers = await db.user.findMany({ where: { role: 'TRANSPORT_MANAGER' } });
          if (managers.length > 0) {
            await db.notification.create({
              data: {
                userId: managers[0].id,
                title: "Maintenance Alert",
                message: `Bus ${vehicle.number} has crossed ${nextInterval}km. Automated routine service scheduled.`,
                type: "Alert"
              }
            });
          }
        }
      }
    }

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
