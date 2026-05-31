const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Reassigning trips to different buses and drivers...');

  const trips = await prisma.trip.findMany();
  const vehicles = await prisma.vehicle.findMany();
  
  if (trips.length === 0) {
    console.log('No trips found.');
    return;
  }

  // Ensure we have at least 6 drivers
  let drivers = await prisma.driver.findMany();
  const driverNames = ['Venusha', 'Nimal Perera', 'Kasun Silva', 'Ruwan Fernando', 'Chaminda Bandara', 'Saman Kumara'];
  
  for (let i = drivers.length; i < 6; i++) {
    const newDriver = await prisma.driver.create({
      data: {
        name: driverNames[i] || `Driver ${i+1}`,
        license: `B${Math.floor(100000 + Math.random() * 900000)}`,
        phone: `07${Math.floor(10000000 + Math.random() * 90000000)}`,
        availability: true
      }
    });
    drivers.push(newDriver);
  }

  // Ensure all drivers are available
  await prisma.driver.updateMany({
    data: { availability: true }
  });
  
  // Re-fetch to ensure we have the latest
  drivers = await prisma.driver.findMany();

  // Reassign each trip
  for (let i = 0; i < trips.length; i++) {
    const trip = trips[i];
    const vehicle = vehicles[i % vehicles.length];
    const driver = drivers[i % drivers.length];

    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        vehicleId: vehicle.id,
        driverId: driver.id
      }
    });

    console.log(`Assigned Trip ${trip.trackingNumber} to Bus ${vehicle.number} and Driver ${driver.name}`);
  }

  console.log('Reassignment complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
