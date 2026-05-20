import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const updated = await db.notification.update({
      where: { id },
      data: { read: true }
    });

    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    console.error('Failed to update notification status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
