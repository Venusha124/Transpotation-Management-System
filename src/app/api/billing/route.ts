export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const list = await db.payment.findMany();
    return NextResponse.json({ success: true, payments: list });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, status, method, transactionId } = body;

    if (!id || !status || !method) {
      return NextResponse.json({ error: 'Missing required billing fields' }, { status: 400 });
    }

    const updated = await db.payment.update({
      where: { id },
      data: {
        status,
        method,
        transactionId: transactionId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`
      }
    });

    // Sync booking payment status if it matches
    const payment = await db.payment.findUnique({ where: { id } });
    if (payment) {
      await db.booking.update({
        where: { id: payment.bookingId },
        data: { paymentStatus: status }
      });
    }

    await db.auditLog.create({
      data: {
        action: "Update Invoice",
        details: `Updated invoice ID: ${id} status to ${status} via ${method}`
      }
    });

    return NextResponse.json({ success: true, payment: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
