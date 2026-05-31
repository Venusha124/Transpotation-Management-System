import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyTokenNode } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyTokenNode(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let disputes;
    if (payload.role === 'CUSTOMER') {
      disputes = await db.dispute.findMany({ 
        where: { customerId: payload.id },
        include: { booking: true, customer: true }
      });
    } else {
      disputes = await db.dispute.findMany({
        include: { booking: true, customer: true }
      });
    }

    return NextResponse.json({ success: true, disputes });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyTokenNode(token);
    if (!payload || payload.role !== 'CUSTOMER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { bookingId, reason } = body;

    if (!bookingId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const booking = await db.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.customerId !== payload.id) {
      return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 });
    }

    const dispute = await db.dispute.create({
      data: {
        bookingId,
        customerId: payload.id,
        reason,
        status: 'OPEN'
      }
    });

    return NextResponse.json({ success: true, dispute });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
