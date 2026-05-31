import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, paymentStatus } = body;

    const booking = await db.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    
    if (paymentStatus === 'PAID' && booking.paymentStatus !== 'PAID') {
      const payment = await db.payment.findFirst({ where: { bookingId: id } });
      if (payment) {
        const user = await db.user.findUnique({ where: { id: booking.customerId } });
        if (!user) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        
        if (user.walletBalance < payment.amount) {
          return NextResponse.json({ error: `Insufficient wallet balance. You need LKR ${payment.amount.toFixed(2)}.` }, { status: 400 });
        }
        
        await db.user.update({
          where: { id: user.id },
          data: { walletBalance: user.walletBalance - payment.amount }
        });
        
        await db.payment.update({
          where: { id: payment.id },
          data: { status: 'PAID' }
        });
        
        updateData.paymentStatus = 'PAID';
      } else {
        updateData.paymentStatus = paymentStatus;
      }
    } else if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      const paymentsList = await db.payment.findMany({ where: { bookingId: id } });
      if (paymentsList.length > 0) {
        await db.payment.update({
          where: { id: paymentsList[0].id },
          data: { status: paymentStatus }
        });
      }
    }

    const updated = await db.booking.update({
      where: { id },
      data: updateData
    });

    // Notify Customer
    await db.notification.create({
      data: {
        userId: booking.customerId,
        title: `Booking Request ${status || 'Updated'}`,
        message: `Your shipment request from ${booking.pickup} to ${booking.destination} is now ${status || 'updated'} (Payment: ${paymentStatus || 'Pending'}).`,
        type: "Alert"
      }
    });

    await db.auditLog.create({
      data: {
        action: "Update Booking",
        details: `Updated Booking ID: ${id} - Status: ${status || 'unchanged'}, Payment: ${paymentStatus || 'unchanged'}`
      }
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
