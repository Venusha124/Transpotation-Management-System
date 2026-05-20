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
