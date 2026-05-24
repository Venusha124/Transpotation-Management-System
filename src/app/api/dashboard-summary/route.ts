export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // 1. Gather all databases collections
    const vehicles = await db.vehicle.findMany();
    const drivers = await db.driver.findMany();
    const trips = await db.trip.findMany();
    const fuelLogs = await db.fuelLog.findMany();
    const payments = await db.payment.findMany();
    const notifications = await db.notification.findMany();
    const auditLogs = await db.auditLog.findMany();

    // 2. Compute KPI Stats
    const totalVehicles = vehicles.length;
    const activeDrivers = drivers.filter((d: any) => d.attendanceStatus === "Present" && !d.availability).length;
    const ongoingDeliveries = trips.filter((t: any) => t.status === "IN_PROGRESS").length;
    const completedTrips = trips.filter((t: any) => t.status === "COMPLETED").length;
    
    // Revenue calculations
    const totalRevenue = payments
      .filter((p: any) => p.status === "PAID")
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    // Fuel summaries
    const totalFuelUsed = fuelLogs.reduce((sum: number, f: any) => sum + f.liters, 0);
    const totalFuelCost = fuelLogs.reduce((sum: number, f: any) => sum + f.cost, 0);

    // Vehicle Availability
    const availableVehicles = vehicles.filter((v: any) => v.availability && v.status === "Available").length;

    // Filter alerts
    const alerts = notifications
      .filter((n: any) => n.type === "Alert" && !n.read)
      .slice(0, 5);

    // Recent activities from audit logs
    const activities = auditLogs
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    return NextResponse.json({
      stats: {
        totalVehicles,
        activeDrivers,
        ongoingDeliveries,
        completedTrips,
        totalRevenue,
        totalFuelUsed,
        totalFuelCost,
        availableVehicles
      },
      alerts,
      activities,
      tripsDistribution: {
        pending: trips.filter((t: any) => t.status === "PENDING").length,
        assigned: trips.filter((t: any) => t.status === "ASSIGNED").length,
        inProgress: ongoingDeliveries,
        completed: completedTrips,
        cancelled: trips.filter((t: any) => t.status === "CANCELLED").length
      }
    });
  } catch (error) {
    console.error('Failed to aggregate dashboard summary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
