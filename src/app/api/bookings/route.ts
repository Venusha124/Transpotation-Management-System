import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyTokenNode } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyTokenNode(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let list;
    if (payload.role === 'CUSTOMER') {
      list = await db.booking.findMany({ where: { customerId: payload.id } });
    } else {
      list = await db.booking.findMany();
    }

    return NextResponse.json({ success: true, bookings: list });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyTokenNode(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { pickup, destination, weight, cargoDetails, deliveryType, scheduledTime } = body;

    if (!pickup || !destination || !weight || !cargoDetails || !deliveryType || !scheduledTime) {
      return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 });
    }

    const booking = await db.booking.create({
      data: {
        customerId: payload.id,
        pickup,
        destination,
        weight: Number(weight),
        cargoDetails,
        deliveryType,
        status: "PENDING",
        paymentStatus: "PENDING",
        scheduledTime: new Date(scheduledTime).toISOString()
      }
    });

    // Create Payment record representing the pending invoice
    const amount = Number(weight) * (deliveryType === 'Express' ? 1.5 : 1.0) * 1.25 + 250; // simple mock fee calculation
    await db.payment.create({
      data: {
        bookingId: booking.id,
        amount,
        method: "Cash",
        status: "PENDING"
      }
    });

    // Notify admins/dispatchers of new request
    const adminUsers = await db.user.findMany({ where: { role: 'ADMIN' } });
    if (adminUsers.length > 0) {
      await db.notification.create({
        data: {
          userId: adminUsers[0].id,
          title: "New Cargo Booking",
          message: `A new shipment booking request has been submitted by ${payload.name} (${pickup} -> ${destination}).`,
          type: "Alert"
        }
      });
    }

    await db.auditLog.create({
      data: {
        userId: payload.id,
        action: "Create Booking",
        details: `Customer booked cargo shipment ID: ${booking.id} (${pickup} to ${destination})`
      }
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
