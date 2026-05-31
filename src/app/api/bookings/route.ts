export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyTokenNode } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tripId = url.searchParams.get('tripId');

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyTokenNode(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let list;
    if (tripId) {
      list = await db.booking.findMany({ where: { tripId } });
    } else if (payload.role === 'CUSTOMER') {
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
    const { pickup, destination, weight, cargoDetails, deliveryType, scheduledTime, seatNumber, tripId } = body;

    if (!pickup || !destination || !weight || !cargoDetails || !deliveryType || !scheduledTime) {
      return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 });
    }

    // Duplicate seat check if seatNumber and tripId are provided
    if (seatNumber && tripId) {
      const existingBookings = await db.booking.findMany({ where: { tripId } });
      const requestedSeats = seatNumber.split(',').map((s: string) => s.trim());
      
      let currentBookedWeight = 0;
      for (const booking of existingBookings) {
        currentBookedWeight += (booking.weight || 0);
        if (booking.seatNumber) {
          const bookedSeats = booking.seatNumber.split(',').map((s: string) => s.trim());
          const conflict = requestedSeats.find((rs: string) => bookedSeats.includes(rs));
          if (conflict) {
            return NextResponse.json({ error: `Seat ${conflict} is already booked for this route run.` }, { status: 409 });
          }
        }
      }

      // Hard Capacity Validation for new feature
      const trip = await db.trip.findUnique({ where: { id: tripId }, include: { vehicle: true } });
      if (trip && trip.vehicle) {
        if ((currentBookedWeight + Number(weight)) > trip.vehicle.capacity) {
          return NextResponse.json({ error: `Booking exceeds vehicle capacity. Only ${trip.vehicle.capacity - currentBookedWeight} units/seats available.` }, { status: 400 });
        }
      }
    }

    const booking = await db.booking.create({
      data: {
        customerId: payload.id,
        pickup,
        destination,
        weight: Number(weight),
        seatNumber: seatNumber || null,
        qrScanned: false,
        tripId: tripId || null,
        cargoDetails,
        deliveryType,
        status: "PENDING",
        paymentStatus: "PENDING",
        scheduledTime: new Date(scheduledTime).toISOString()
      }
    });

    // Calculate Dynamic Surge Pricing based on seat availability
    let surgeMultiplier = 1.0;
    let surgeReason = '';
    
    if (tripId) {
      const trip = await db.trip.findUnique({ where: { id: tripId } });
      if (trip && trip.vehicleId) {
        const vehicle = await db.vehicle.findUnique({ where: { id: trip.vehicleId } });
        if (vehicle && vehicle.capacity) {
          const allBookings = await db.booking.findMany({ where: { tripId } });
          const totalBookedSeats = allBookings.reduce((sum: number, b: any) => sum + (b.weight || 0), 0) + Number(weight);
          
          const capacityUsed = totalBookedSeats / vehicle.capacity;
          if (capacityUsed >= 0.8) {
            surgeMultiplier = 1.5; // High demand: >80% full
            surgeReason = ' (High Demand Surge)';
          } else if (capacityUsed >= 0.5) {
            surgeMultiplier = 1.2; // Medium demand: >50% full
            surgeReason = ' (Standard Demand)';
          }
        }
      }
    }

    // Create Payment record representing the pending invoice
    const baseFare = Number(weight) * (deliveryType === 'Express' ? 1500 : 800); 
    const finalAmount = baseFare * surgeMultiplier;
    
    await db.payment.create({
      data: {
        bookingId: booking.id,
        amount: finalAmount,
        method: "Credit Card",
        status: "PENDING"
      }
    });

    // Notify admins/dispatchers of new request
    const adminUsers = await db.user.findMany({ where: { role: 'ADMIN' } });
    if (adminUsers.length > 0) {
      await db.notification.create({
        data: {
          userId: adminUsers[0].id,
          title: "New Passenger Booking",
          message: `A new ticket booking request has been submitted by ${payload.name} (${pickup} -> ${destination})${surgeReason}.`,
          type: "Alert"
        }
      });
    }

    await db.auditLog.create({
      data: {
        userId: payload.id,
        action: "Create Ticket",
        details: `Customer booked passenger ticket ID: ${booking.id} (${pickup} to ${destination})`
      }
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
