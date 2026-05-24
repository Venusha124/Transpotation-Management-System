export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const list = await db.trip.findMany();
    return NextResponse.json({ success: true, trips: list });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      driverId, vehicleId, pickup, destination, weight, cargoType, routePoints, waypoints, eta
    } = body;

    if (!driverId || !vehicleId || !pickup || !destination || !weight || !cargoType || !routePoints || !eta) {
      return NextResponse.json({ error: 'Missing required trip parameters' }, { status: 400 });
    }

    const weightNum = Number(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      return NextResponse.json({ error: 'Cargo weight must be a positive number greater than zero' }, { status: 400 });
    }

    const vehicle = await db.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return NextResponse.json({ error: 'Selected vehicle not found in database registers' }, { status: 404 });
    }

    if (weightNum > vehicle.capacity) {
      return NextResponse.json({ error: `Cargo weight (${weightNum} kg) exceeds vehicle capacity (${vehicle.capacity} kg)` }, { status: 400 });
    }

    const trackingNumber = `TRIP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create the trip
    const trip = await db.trip.create({
      data: {
        trackingNumber,
        driverId,
        vehicleId,
        pickup,
        destination,
        weight: Number(weight),
        cargoType,
        routePoints,
        waypoints: waypoints || '[]',
        eta,
        status: "ASSIGNED",
        currentLat: null,
        currentLng: null
      }
    });

    // Update vehicle availability & status
    await db.vehicle.update({
      where: { id: vehicleId },
      data: { availability: false, status: "Active" }
    });

    // Update driver availability
    await db.driver.update({
      where: { id: driverId },
      data: { availability: false }
    });

    // Notify Driver
    const driverRecord = await db.driver.findUnique({ where: { id: driverId } });
    if (driverRecord && driverRecord.userId) {
      await db.notification.create({
        data: {
          userId: driverRecord.userId,
          title: "New Trip Assigned",
          message: `You have been assigned to trip ${trackingNumber} from ${pickup} to ${destination}.`,
          type: "Alert"
        }
      });
    }

    await db.auditLog.create({
      data: {
        action: "Assign Trip",
        details: `Trip ${trackingNumber} scheduled. Assigned Vehicle ID: ${vehicleId}, Driver ID: ${driverId}`
      }
    });

    return NextResponse.json({ success: true, trip });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
