import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyTokenNode } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyTokenNode(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch notifications matching active user
    const notifications = await db.notification.findMany({
      where: { userId: payload.id }
    });

    // Sort descending by date
    const sorted = [...notifications].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ notifications: sorted });
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyTokenNode(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const notificationIds = body?.notificationIds;

    if (notificationIds && Array.isArray(notificationIds)) {
      await db.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: payload.id
        },
        data: { read: true }
      });
    } else {
      // Mark all as read
      await db.notification.updateMany({
        where: { userId: payload.id, read: false },
        data: { read: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notifications API Error (PUT):', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
