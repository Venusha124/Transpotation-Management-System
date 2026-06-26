export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const logs = await db.auditLog.findMany({
      where: {
        action: 'Driver Attendance'
      },
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('Failed to fetch driver attendance logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
