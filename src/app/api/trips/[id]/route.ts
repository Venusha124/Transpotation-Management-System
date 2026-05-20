import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Find active trip record first
    const trip = await db.trip.findUnique({ where: { id } });
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const { status, currentLat, currentLng, eta } = body;
    const updateData: any = {};

    if (currentLat !== undefined) updateData.currentLat = Number(currentLat);
    if (currentLng !== undefined) updateData.currentLng = Number(currentLng);
    if (eta !== undefined) updateData.eta = eta;

    if (status) {
      updateData.status = status;
      
      if (status === "IN_PROGRESS") {
        updateData.startAt = new Date().toISOString();
      }

      if (status === "COMPLETED") {
        updateData.endAt = new Date().toISOString();

        // Release vehicle
        await db.vehicle.update({
          where: { id: trip.vehicleId },
          data: { availability: true, status: "Available" }
        });

        // Release driver
        await db.driver.update({
          where: { id: trip.driverId },
          data: { availability: true }
        });

        // Notify Driver if linked
        const driver = await db.driver.findUnique({ where: { id: trip.driverId } });
        if (driver && driver.userId) {
          await db.notification.create({
            data: {
              userId: driver.userId,
              title: "Trip Completed",
              message: `Trip ${trip.trackingNumber} has been successfully completed.`,
              type: "Alert"
            }
          });
        }
      }

      if (status === "CANCELLED") {
        // Release vehicle & driver
        await db.vehicle.update({
          where: { id: trip.vehicleId },
          data: { availability: true, status: "Available" }
        });
        await db.driver.update({
          where: { id: trip.driverId },
          data: { availability: true }
        });
      }
    }

    const updated = await db.trip.update({
      where: { id },
      data: updateData
    });

    await db.auditLog.create({
      data: {
        action: "Update Trip",
        details: `Updated status/telemetry of Trip ${trip.trackingNumber} to ${status || 'GPS tick'}`
      }
    });

    return NextResponse.json({ success: true, trip: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await db.trip.delete({ where: { id } });

    // Release vehicle & driver if deleted prematurely
    await db.vehicle.update({
      where: { id: deleted.vehicleId },
      data: { availability: true, status: "Available" }
    });
    await db.driver.update({
      where: { id: deleted.driverId },
      data: { availability: true }
    });

    await db.auditLog.create({
      data: {
        action: "Delete Trip",
        details: `Removed scheduled trip: ${deleted.trackingNumber}`
      }
    });

    return NextResponse.json({ success: true, trip: deleted });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
