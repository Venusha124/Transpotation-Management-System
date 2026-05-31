const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting route update script...');

  // 1. Clear existing route-related data (Order matters to avoid foreign key constraints)
  console.log('Clearing old data...');
  await prisma.auditLog.deleteMany({ where: { action: 'Assign Trip' } }); // Optional, just to clean up
  await prisma.payment.deleteMany({});
  await prisma.dispute.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.routeStop.deleteMany({});
  await prisma.route.deleteMany({});
  await prisma.stop.deleteMany({});

  // 2. Create Stops
  console.log('Creating Stops...');
  const stopsData = [
    { name: 'Kandy', code: 'KND', address: 'Kandy Central Bus Stand' },
    { name: 'Colombo', code: 'CMB', address: 'Bastian Mawatha, Colombo' },
    { name: 'Galle', code: 'GAL', address: 'Galle Central Bus Station' },
    { name: 'Matara', code: 'MTR', address: 'Matara Bus Stand' },
    { name: 'Trincomalee', code: 'TRC', address: 'Trinco Main Bus Stand' },
    { name: 'Nuwara Eliya', code: 'NWE', address: 'Nuwara Eliya Bus Stand' },
    { name: 'Jaffna', code: 'JAF', address: 'Jaffna Central Bus Station' }
  ];

  const createdStops = {};
  for (const s of stopsData) {
    createdStops[s.code] = await prisma.stop.create({ data: s });
  }

  // 3. Create Routes
  console.log('Creating Routes...');
  const routesData = [
    { name: 'Kandy - Colombo', code: 'R-KND-CMB', start: 'KND', end: 'CMB', distance: 115, duration: 180, price: 500 },
    { name: 'Galle - Matara Local', code: 'R-GAL-MTR', start: 'GAL', end: 'MTR', distance: 45, duration: 60, price: 150 },
    { name: 'Kandy - Trincomalee Normal', code: 'R-KND-TRC', start: 'KND', end: 'TRC', distance: 180, duration: 240, price: 600 },
    { name: 'Colombo - Nuwara Eliya AC', code: 'R-CMB-NWE', start: 'CMB', end: 'NWE', distance: 170, duration: 270, price: 1200 },
    { name: 'Colombo - Jaffna Intercity', code: 'R-CMB-JAF', start: 'CMB', end: 'JAF', distance: 400, duration: 420, price: 1800 },
    { name: 'Colombo - Galle Highway', code: 'R-CMB-GAL', start: 'CMB', end: 'GAL', distance: 120, duration: 90, price: 800 },
  ];

  const createdRoutes = [];
  for (const r of routesData) {
    const route = await prisma.route.create({
      data: {
        name: r.name,
        code: r.code,
        startLocation: createdStops[r.start].name,
        endLocation: createdStops[r.end].name,
        distance: r.distance,
        duration: r.duration,
        basePrice: r.price,
        status: 'PUBLISHED',
        routeStops: {
          create: [
            { stopId: createdStops[r.start].id, orderIndex: 0, arrivalOffset: 0 },
            { stopId: createdStops[r.end].id, orderIndex: 1, arrivalOffset: r.duration }
          ]
        }
      }
    });
    createdRoutes.push(route);
  }

  // 4. Create dummy Trips to make them available in the booking system
  console.log('Creating dummy Trips for booking availability...');
  
  // Find a valid driver and vehicle to assign
  const driver = await prisma.driver.findFirst();
  const vehicle = await prisma.vehicle.findFirst();

  if (driver && vehicle) {
    for (const route of createdRoutes) {
      const trackingNumber = `TRIP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      await prisma.trip.create({
        data: {
          trackingNumber,
          driverId: driver.id,
          vehicleId: vehicle.id,
          routeId: route.id,
          pickup: route.startLocation,
          destination: route.endLocation,
          weight: 0,
          cargoType: 'Passenger',
          routePoints: JSON.stringify([{ lat: 0, lng: 0 }]), // Dummy coordinates
          eta: '12:00 PM',
          status: 'ASSIGNED',
        }
      });
    }
    console.log(`Created 6 trips assigned to Driver ${driver.name} and Vehicle ${vehicle.number}`);
  } else {
    console.log('Warning: No Driver or Vehicle found in the database. Trips were not created.');
  }

  console.log('Successfully updated system routes!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
