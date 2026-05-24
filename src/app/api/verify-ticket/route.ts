export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { qrData } = body;

    if (!qrData) {
      return NextResponse.json({ error: 'No QR data provided' }, { status: 400 });
    }

    // Expected format: "TICKET:id|SEATS:A1,B1"
    const parts = qrData.split('|');
    const ticketPart = parts.find((p: string) => p.startsWith('TICKET:'));
    
    if (!ticketPart) {
      return NextResponse.json({ error: 'Invalid QR code format. TICKET ID missing.' }, { status: 400 });
    }

    const ticketId = ticketPart.replace('TICKET:', '').trim();

    const booking = await db.booking.findUnique({ where: { id: ticketId } });

    if (!booking) {
      return NextResponse.json({ error: 'Ticket not found in the database.' }, { status: 404 });
    }

    if (booking.status !== 'APPROVED') {
      return NextResponse.json({ error: `Ticket status is ${booking.status}. It must be APPROVED.` }, { status: 400 });
    }

    if (booking.paymentStatus !== 'PAID') {
      return NextResponse.json({ 
        error: `Ticket payment status is ${booking.paymentStatus}. Passengers must pay before boarding.`,
        requiresPayment: true,
        ticket: {
          id: booking.id,
          pickup: booking.pickup,
          destination: booking.destination,
          weight: booking.weight // pax count
        }
      }, { status: 400 });
    }

    if (booking.qrScanned) {
      return NextResponse.json({ error: 'This ticket has already been scanned and used.' }, { status: 409 });
    }

    // Mark as scanned
    await db.booking.update({
      where: { id: ticketId },
      data: { qrScanned: true }
    });

    await db.auditLog.create({
      data: {
        action: "Verify Ticket",
        details: `Conductor verified and scanned boarding pass for Ticket ID: ${ticketId}`
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Ticket successfully verified!',
      ticket: {
        id: booking.id,
        seats: booking.seatNumber || 'Unassigned',
        pickup: booking.pickup,
        destination: booking.destination,
        price: (booking.weight || 1) * 500
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
