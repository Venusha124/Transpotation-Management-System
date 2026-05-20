import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Convert date strings if present
    if (body.insuranceExpiry) body.insuranceExpiry = new Date(body.insuranceExpiry).toISOString();
    if (body.licenseExpiry) body.licenseExpiry = new Date(body.licenseExpiry).toISOString();
    if (body.capacity) body.capacity = Number(body.capacity);

    const updated = await db.vehicle.update({
      where: { id },
      data: body
    });

    await db.auditLog.create({
      data: {
        action: "Update Vehicle",
        details: `Updated vehicle properties for ID: ${id} (${updated.number})`
      }
    });

    return NextResponse.json({ success: true, vehicle: updated });
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
    const deleted = await db.vehicle.delete({
      where: { id }
    });

    await db.auditLog.create({
      data: {
        action: "Delete Vehicle",
        details: `Removed vehicle from fleet: ${deleted.number}`
      }
    });

    return NextResponse.json({ success: true, message: 'Vehicle deleted successfully', vehicle: deleted });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
