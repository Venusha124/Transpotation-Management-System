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
    if (!payload || !['ADMIN', 'TRANSPORT_MANAGER', 'ACCOUNTANT'].includes(payload.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch vehicles and their trips, bookings, and routes
    const vehicles = await db.vehicle.findMany({
      include: {
        trips: {
          include: {
            bookings: { include: { payments: true } },
            route: true
          }
        }
      }
    });

    const routeAggregator: Record<string, { name: string, trips: number, revenue: number }> = {};

    const fleetData = vehicles.map(vehicle => {
      let totalRevenue = 0;
      let totalTrips = vehicle.trips.length;
      let totalBookedWeight = 0;

      vehicle.trips.forEach(trip => {
        if (trip.bookings && trip.bookings.length > 0) {
          let tripRevenue = 0;

          trip.bookings.forEach(booking => {
            totalBookedWeight += booking.weight;
            
            booking.payments.forEach(p => {
              if (p.status === 'PAID') {
                tripRevenue += p.amount;
                totalRevenue += p.amount;
              }
            });
          });

          // Aggregate by Route
          if (trip.route) {
            if (!routeAggregator[trip.route.id]) {
              routeAggregator[trip.route.id] = { name: trip.route.name, trips: 0, revenue: 0 };
            }
            routeAggregator[trip.route.id].trips += 1;
            routeAggregator[trip.route.id].revenue += tripRevenue;
          }
        }
      });

      // Calculate approximate capacity utilization across all trips with strict failsafe validations
      const safeCapacity = vehicle.capacity > 0 ? vehicle.capacity : 1;
      const safeTrips = totalTrips > 0 ? totalTrips : 1;
      let avgUtilization = totalTrips > 0 
        ? (totalBookedWeight / (safeCapacity * safeTrips)) * 100
        : 0;

      // Ensure it doesn't exceed 100% due to data anomalies and isn't NaN
      if (isNaN(avgUtilization)) avgUtilization = 0;
      avgUtilization = Math.min(100, Math.max(0, avgUtilization));

      return {
        id: vehicle.id,
        number: vehicle.number,
        type: vehicle.type,
        capacity: vehicle.capacity,
        totalTrips,
        totalRevenue,
        utilizationPercentage: avgUtilization.toFixed(1)
      };
    });

    const routesHeatmap = Object.keys(routeAggregator).map(id => ({
      id,
      ...routeAggregator[id]
    })).sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({ success: true, fleetData, routesHeatmap });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
