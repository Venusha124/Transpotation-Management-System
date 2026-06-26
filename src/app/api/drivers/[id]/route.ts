import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (body.experience) body.experience = Number(body.experience);
    if (body.salary) body.salary = Number(body.salary);
    if (body.rating) body.rating = Number(body.rating);

    const updated = await db.driver.update({
      where: { id },
      data: body
    });

    await db.auditLog.create({
      data: {
        action: "Update Driver",
        details: `Updated driver parameters for ID: ${id} (${updated.name})`
      }
    });

    if (body.attendanceStatus) {
      await db.auditLog.create({
        data: {
          action: "Driver Attendance",
          details: `Driver ${updated.name} clocked ${body.attendanceStatus === 'Present' ? 'IN' : 'OUT'}`
        }
      });
    }

    return NextResponse.json({ success: true, driver: updated });
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
    const deleted = await db.driver.delete({
      where: { id }
    });

    await db.auditLog.create({
      data: {
        action: "Delete Driver",
        details: `Deleted driver record: ${deleted.name}`
      }
    });

    return NextResponse.json({ success: true, message: 'Driver deleted successfully', driver: deleted });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
