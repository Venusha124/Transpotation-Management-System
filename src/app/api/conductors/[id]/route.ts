import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updateData: any = {
      name: body.name,
      email: body.email
    };

    if (body.password) {
      updateData.passwordHash = hashPassword(body.password);
    }

    const updated = await db.user.update({
      where: { id, role: 'CONDUCTOR' },
      data: updateData,
      select: { id: true, name: true, email: true }
    });

    await db.auditLog.create({
      data: {
        action: "Update Conductor",
        details: `Updated conductor details: ${updated.name}`
      }
    });

    return NextResponse.json({ success: true, conductor: updated });
  } catch (error) {
    console.error('Failed to update conductor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const deleted = await db.user.delete({
      where: { id, role: 'CONDUCTOR' }
    });

    await db.auditLog.create({
      data: {
        action: "Delete Conductor",
        details: `Deleted conductor record: ${deleted.name}`
      }
    });

    return NextResponse.json({ success: true, message: 'Conductor deleted' });
  } catch (error) {
    console.error('Failed to delete conductor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
