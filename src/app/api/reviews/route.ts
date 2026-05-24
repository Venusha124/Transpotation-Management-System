export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const bookingsWithReviews = await db.booking.findMany({
      where: {
        rating: { gte: 4 },
        feedback: { not: null },
        status: 'COMPLETED'
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      include: {
        customer: { select: { name: true } },
        trip: { select: { pickup: true, destination: true } }
      }
    });

    // Format data for public display
    const reviews = bookingsWithReviews.map(booking => {
      const nameParts = booking.customer.name.split(' ');
      const displayName = nameParts.length > 1 
        ? `${nameParts[0]} ${nameParts[nameParts.length - 1].charAt(0)}.` 
        : nameParts[0];

      return {
        id: booking.id,
        rating: booking.rating,
        feedback: booking.feedback,
        customerName: displayName,
        route: booking.trip ? `${booking.trip.pickup.split(',')[0]} ➜ ${booking.trip.destination.split(',')[0]}` : 'General Transport'
      };
    });

    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
