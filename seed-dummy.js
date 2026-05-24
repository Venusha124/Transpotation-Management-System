const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Starting dummy data generation...');

  // 1. Vehicles (Buses)
  const vehicleData = [
    { number: 'ND-1234', type: 'AC_BUS', capacity: 45, model: 'Lanka Ashok Leyland', brand: 'Leyland', fuelType: 'Diesel', insuranceExpiry: new Date('2027-12-31'), licenseExpiry: new Date('2027-12-31'), totalMileage: 125000, availability: true },
    { number: 'NB-9988', type: 'NON_AC_BUS', capacity: 54, model: 'Tata LP', brand: 'Tata', fuelType: 'Diesel', insuranceExpiry: new Date('2027-10-15'), licenseExpiry: new Date('2027-10-15'), totalMileage: 230000, availability: true },
    { number: 'NC-4567', type: 'LUXURY_COACH', capacity: 40, model: 'Volvo B11R', brand: 'Volvo', fuelType: 'Diesel', insuranceExpiry: new Date('2028-01-20'), licenseExpiry: new Date('2028-01-20'), totalMileage: 45000, availability: true },
    { number: 'ND-5555', type: 'AC_BUS', capacity: 45, model: 'Micro', brand: 'Micro', fuelType: 'Diesel', insuranceExpiry: new Date('2027-05-10'), licenseExpiry: new Date('2027-05-10'), totalMileage: 89000, availability: false, status: 'In Maintenance' },
    { number: 'NC-1122', type: 'LUXURY_COACH', capacity: 35, model: 'King Long', brand: 'King Long', fuelType: 'Diesel', insuranceExpiry: new Date('2028-06-30'), licenseExpiry: new Date('2028-06-30'), totalMileage: 60000, availability: true },
  ];

  const vehicles = [];
  for (const v of vehicleData) {
    const created = await prisma.vehicle.upsert({ where: { number: v.number }, update: v, create: v });
    vehicles.push(created);
  }
  console.log(`Seeded ${vehicles.length} Vehicles.`);

  // 2. Drivers
  const driverData = [
    { name: 'Kamal Perera', nic: '851234567V', contact: '+94771234567', address: '12 Temple Rd, Colombo', licenseNumber: 'DL-00123', experience: 10, emergencyContact: '+94779876543', salary: 85000, attendanceStatus: 'Present', availability: true, rating: 4.8 },
    { name: 'Nimal Fernando', nic: '901234567V', contact: '+94712345678', address: '45 Galle Rd, Panadura', licenseNumber: 'DL-00456', experience: 5, emergencyContact: '+94719876543', salary: 75000, attendanceStatus: 'Present', availability: true, rating: 4.2 },
    { name: 'Sunil Silva', nic: '821234567V', contact: '+94781234567', address: '88 Kandy Rd, Kadawatha', licenseNumber: 'DL-00789', experience: 12, emergencyContact: '+94789876543', salary: 90000, attendanceStatus: 'Present', availability: true, rating: 4.9 },
    { name: 'Ajith Kumara', nic: '781234567V', contact: '+94721234567', address: '21 Negombo Rd, Ja-Ela', licenseNumber: 'DL-00321', experience: 15, emergencyContact: '+94729876543', salary: 95000, attendanceStatus: 'Absent', availability: false, rating: 4.5 },
    { name: 'Ruwan Rajapaksha', nic: '921234567V', contact: '+94751234567', address: '56 High Level Rd, Nugegoda', licenseNumber: 'DL-00654', experience: 3, emergencyContact: '+94759876543', salary: 60000, attendanceStatus: 'Present', availability: true, rating: 3.9 },
  ];

  const drivers = [];
  for (const d of driverData) {
    const created = await prisma.driver.upsert({ where: { nic: d.nic }, update: d, create: d });
    drivers.push(created);
  }
  console.log(`Seeded ${drivers.length} Drivers.`);

  // 3. Stops (Ensure we have them)
  const stopsData = [
    { name: 'Colombo Fort Bus Stand', code: 'CMB-FT', address: 'Olcott Mawatha, Colombo 01100', status: 'ACTIVE', latitude: 6.9338, longitude: 79.8500 },
    { name: 'Kandy Central Bus Station', code: 'KDY-CN', address: 'S.W.R.D. Bandaranaike Mawatha, Kandy', status: 'ACTIVE', latitude: 7.2906, longitude: 80.6337 },
    { name: 'Galle Bus Station', code: 'GAL-CN', address: 'Colombo Road, Galle', status: 'ACTIVE', latitude: 6.0328, longitude: 80.2149 },
    { name: 'Kurunegala Bus Stand', code: 'KUR-CN', address: 'Colombo Rd, Kurunegala', status: 'ACTIVE', latitude: 7.4818, longitude: 80.3609 },
    { name: 'Jaffna Central Bus Stand', code: 'JAF-CN', address: 'Hospital St, Jaffna', status: 'ACTIVE', latitude: 9.6615, longitude: 80.0255 },
    { name: 'Trincomalee Bus Stand', code: 'TRC-CN', address: 'Main St, Trincomalee', status: 'ACTIVE', latitude: 8.5711, longitude: 81.2335 },
    { name: 'Nuwara Eliya Main Stand', code: 'NWE-CN', address: 'Lawson St, Nuwara Eliya', status: 'ACTIVE', latitude: 6.9708, longitude: 80.7829 },
    { name: 'Matara Bus Station', code: 'MTR-CN', address: 'Beach Rd, Matara', status: 'ACTIVE', latitude: 5.9496, longitude: 80.5353 },
    { name: 'Anuradhapura Bus Stand', code: 'ANP-CN', address: 'Maithripala Senanayake Mawatha', status: 'ACTIVE', latitude: 8.3114, longitude: 80.4037 }
  ];

  const stops = {};
  for (const s of stopsData) {
    stops[s.code] = await prisma.stop.upsert({ where: { code: s.code }, update: s, create: s });
  }
  console.log(`Seeded Stops.`);

  // 4. Routes
  const routeData = [
    {
      name: 'Colombo - Kandy Express', code: 'EX-01', startLocation: 'Colombo', endLocation: 'Kandy',
      distance: 115, duration: 180, basePrice: 1200, status: 'PUBLISHED',
      stops: [ { stopId: stops['CMB-FT'].id, offset: 0 }, { stopId: stops['KUR-CN'].id, offset: 110 }, { stopId: stops['KDY-CN'].id, offset: 180 } ]
    },
    {
      name: 'Colombo - Galle Highway', code: 'EX-02', startLocation: 'Colombo', endLocation: 'Galle',
      distance: 125, duration: 120, basePrice: 1500, status: 'PUBLISHED',
      stops: [ { stopId: stops['CMB-FT'].id, offset: 0 }, { stopId: stops['GAL-CN'].id, offset: 120 } ]
    },
    {
      name: 'Colombo - Jaffna Intercity', code: 'EX-03', startLocation: 'Colombo', endLocation: 'Jaffna',
      distance: 395, duration: 420, basePrice: 3500, status: 'PUBLISHED',
      stops: [ { stopId: stops['CMB-FT'].id, offset: 0 }, { stopId: stops['ANP-CN'].id, offset: 210 }, { stopId: stops['JAF-CN'].id, offset: 420 } ]
    },
    {
      name: 'Colombo - Nuwara Eliya AC', code: 'AC-01', startLocation: 'Colombo', endLocation: 'Nuwara Eliya',
      distance: 160, duration: 300, basePrice: 2000, status: 'PUBLISHED',
      stops: [ { stopId: stops['CMB-FT'].id, offset: 0 }, { stopId: stops['KDY-CN'].id, offset: 180 }, { stopId: stops['NWE-CN'].id, offset: 300 } ]
    },
    {
      name: 'Kandy - Trincomalee Normal', code: 'NR-01', startLocation: 'Kandy', endLocation: 'Trincomalee',
      distance: 180, duration: 270, basePrice: 850, status: 'PUBLISHED',
      stops: [ { stopId: stops['KDY-CN'].id, offset: 0 }, { stopId: stops['TRC-CN'].id, offset: 270 } ]
    },
    {
      name: 'Galle - Matara Local', code: 'LC-01', startLocation: 'Galle', endLocation: 'Matara',
      distance: 45, duration: 60, basePrice: 300, status: 'PUBLISHED',
      stops: [ { stopId: stops['GAL-CN'].id, offset: 0 }, { stopId: stops['MTR-CN'].id, offset: 60 } ]
    },
    {
      name: 'Colombo - Anuradhapura Semi', code: 'SM-01', startLocation: 'Colombo', endLocation: 'Anuradhapura',
      distance: 205, duration: 240, basePrice: 1100, status: 'DRAFT',
      stops: [ { stopId: stops['CMB-FT'].id, offset: 0 }, { stopId: stops['KUR-CN'].id, offset: 110 }, { stopId: stops['ANP-CN'].id, offset: 240 } ]
    }
  ];

  const routes = [];
  for (const r of routeData) {
    const routeStopsInput = {
      create: r.stops.map((s, idx) => ({ orderIndex: idx, arrivalOffset: s.offset, stopId: s.stopId }))
    };

    let route = await prisma.route.findUnique({ where: { code: r.code } });
    if (!route) {
      route = await prisma.route.create({
        data: {
          name: r.name, code: r.code, startLocation: r.startLocation, endLocation: r.endLocation,
          distance: r.distance, duration: r.duration, basePrice: r.basePrice, status: r.status,
          routeStops: routeStopsInput
        }
      });
    }
    routes.push(route);
  }
  console.log(`Seeded ${routes.length} Routes.`);

  // 5. Trips (Active and Completed)
  const tripsData = [
    {
      trackingNumber: 'TRP-1001',
      driverId: drivers[0].id,
      vehicleId: vehicles[0].id,
      routeId: routes[0].id,
      pickup: 'Colombo',
      destination: 'Kandy',
      weight: 45,
      cargoType: 'Inter-City Express',
      status: 'IN_TRANSIT',
      eta: '2 hours 30 mins',
      routePoints: '[[6.9338, 79.85], [7.2906, 80.6337]]',
      waypoints: JSON.stringify([{lat: 6.9338, lng: 79.85}, {lat: 7.2906, lng: 80.6337}]),
      currentLat: 7.15, currentLng: 80.1,
      startAt: new Date(Date.now() - 3600000)
    },
    {
      trackingNumber: 'TRP-1002',
      driverId: drivers[1].id,
      vehicleId: vehicles[2].id,
      routeId: routes[1].id,
      pickup: 'Colombo',
      destination: 'Galle',
      weight: 38,
      cargoType: 'Air-Conditioned',
      status: 'COMPLETED',
      eta: '1 hour 45 mins',
      routePoints: '[[6.9338, 79.85], [6.0328, 80.2149]]',
      waypoints: JSON.stringify([{lat: 6.9338, lng: 79.85}, {lat: 6.0328, lng: 80.2149}]),
      startAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
      endAt: new Date(Date.now() - 86400000 * 2 + 7200000)
    }
  ];

  for (const t of tripsData) {
    await prisma.trip.upsert({ where: { trackingNumber: t.trackingNumber }, update: t, create: t });
  }
  console.log(`Seeded ${tripsData.length} Trips.`);

  // 6. Maintenance Logs
  const maintenanceData = [
    { vehicleId: vehicles[0].id, type: 'ROUTINE', description: 'Oil Change & Brake Inspection', cost: 15000, status: 'COMPLETED', scheduledDate: new Date(Date.now() - 86400000 * 15), completedDate: new Date(Date.now() - 86400000 * 15), partsUsed: 'Oil Filter, Engine Oil' },
    { vehicleId: vehicles[3].id, type: 'REPAIR', description: 'AC Compressor Replacement', cost: 120000, status: 'IN_PROGRESS', scheduledDate: new Date(Date.now() - 86400000 * 2) },
  ];
  for (const m of maintenanceData) {
    await prisma.maintenance.create({ data: m });
  }
  console.log(`Seeded ${maintenanceData.length} Maintenance logs.`);

  // 7. Fuel Logs
  const fuelData = [
    { vehicleId: vehicles[0].id, driverId: drivers[0].id, liters: 120, cost: 42000, mileage: 124500, date: new Date(Date.now() - 86400000 * 2) },
    { vehicleId: vehicles[1].id, driverId: drivers[1].id, liters: 150, cost: 52500, mileage: 229800, date: new Date(Date.now() - 86400000 * 5) },
  ];
  for (const f of fuelData) {
    await prisma.fuelLog.create({ data: f });
  }
  console.log(`Seeded ${fuelData.length} Fuel logs.`);

  console.log('Dummy Data Injection Complete!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
