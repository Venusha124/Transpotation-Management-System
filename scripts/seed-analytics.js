const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting analytics seeding script...');

  // 1. Fetch dependencies
  let customer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
  if (!customer) {
    console.log('No customer found. Creating dummy customer...');
    customer = await prisma.user.create({
      data: {
        email: 'dummy_customer@example.com',
        name: 'Dummy Customer',
        passwordHash: 'dummyhash123',
        role: 'CUSTOMER'
      }
    });
  }

  const trips = await prisma.trip.findMany({
    include: {
      vehicle: true,
      route: true
    }
  });

  if (trips.length === 0) {
    console.log('No trips found. Please run update-routes.js first.');
    return;
  }

  // 2. Delete existing dummy bookings and payments to avoid duplication
  console.log('Clearing old bookings and payments...');
  await prisma.payment.deleteMany({});
  await prisma.booking.deleteMany({});

  // 3. Generate new Bookings and Payments for each trip to simulate utilization
  console.log('Generating dummy bookings and payments for analytics...');
  
  let totalBookings = 0;
  let totalRevenue = 0;

  for (let i = 0; i < trips.length; i++) {
    const trip = trips[i];
    if (!trip.vehicle || !trip.route) continue;

    const capacity = trip.vehicle.capacity || 50;
    
    // Simulate varying utilization rates to make the heatmap interesting
    // E.g., Trip 0: 90% full, Trip 1: 30% full, Trip 2: 70% full, etc.
    const utilizationRates = [0.95, 0.25, 0.75, 0.45, 0.85, 0.35];
    const targetUtilization = utilizationRates[i % utilizationRates.length];
    
    const targetSeats = Math.floor(capacity * targetUtilization);
    
    // Split target seats into random bookings
    let currentSeats = 0;
    
    let tripRevenue = 0;
    while (currentSeats < targetSeats) {
      const seatsToBook = Math.floor(Math.random() * 4) + 1; // 1 to 4 seats per booking
      if (currentSeats + seatsToBook > targetSeats) break;

      const baseFare = trip.route.basePrice || 500;
      const amount = baseFare * seatsToBook;

      const booking = await prisma.booking.create({
        data: {
          customerId: customer.id,
          tripId: trip.id,
          pickup: trip.route.startLocation,
          destination: trip.route.endLocation,
          weight: seatsToBook, // Using weight as seat count representation
          cargoDetails: 'Passenger',
          deliveryType: 'Standard',
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          scheduledTime: new Date().toISOString(),
          seatNumber: `S${currentSeats+1}`, // Dummy seat
        }
      });

      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: amount,
          method: 'Credit Card',
          status: 'PAID',
          transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        }
      });

      currentSeats += seatsToBook;
      totalBookings++;
      totalRevenue += amount;
      tripRevenue += amount;
    }

    // Update trip with realistic timestamps
    const start = new Date();
    start.setHours(start.getHours() - Math.floor(Math.random() * 5)); // Started a few hours ago
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + (trip.route.duration || 120));

    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        startAt: start,
        endAt: end,
        status: 'IN_TRANSIT'
      }
    });

    console.log(`Trip ${trip.trackingNumber} (${trip.route.name}): Seeded ${currentSeats} seats (Utilization: ${Math.round(currentSeats/capacity * 100)}%). Revenue: LKR ${tripRevenue}`);
  }

  console.log(`\n✅ Analytics Seeding Complete!`);
  console.log(`Total Dummy Bookings: ${totalBookings}`);
  console.log(`Total Simulated Revenue: LKR ${totalRevenue.toLocaleString()}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
