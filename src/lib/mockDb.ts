import fs from 'fs';
import path from 'path';

// Define DB file path
const DB_FILE = path.join(process.cwd(), 'tms_local_db.json');

// Interface for Mock DB structure
interface LocalDB {
  users: any[];
  vehicles: any[];
  drivers: any[];
  trips: any[];
  bookings: any[];
  maintenance: any[];
  fuelLogs: any[];
  payments: any[];
  auditLogs: any[];
  notifications: any[];
}

// Initial Seed Data with pre-calculated bcrypt hashes for password "password123"
// Hash: "$2a$10$954tHw6K/ZkG.a9bLwZ45O0lH.4r1f2w.b3F0o.t1Lw/1O1Gg/a6W"
const DEFAULT_PASS_HASH = "$2a$10$954tHw6K/ZkG.a9bLwZ45O0lH.4r1f2w.b3F0o.t1Lw/1O1Gg/a6W";

const INITIAL_DATA: LocalDB = {
  users: [
    {
      id: "u-admin-1",
      email: "admin@tms.com",
      passwordHash: DEFAULT_PASS_HASH,
      name: "Super Administrator",
      role: "ADMIN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "u-manager-1",
      email: "manager@tms.com",
      passwordHash: DEFAULT_PASS_HASH,
      name: "John Manager",
      role: "TRANSPORT_MANAGER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "u-dispatcher-1",
      email: "dispatcher@tms.com",
      passwordHash: DEFAULT_PASS_HASH,
      name: "Sarah Dispatcher",
      role: "DISPATCHER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "u-driver-1",
      email: "driver@tms.com",
      passwordHash: DEFAULT_PASS_HASH,
      name: "Marcus Driver",
      role: "DRIVER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "u-accountant-1",
      email: "accountant@tms.com",
      passwordHash: DEFAULT_PASS_HASH,
      name: "Elena Accountant",
      role: "ACCOUNTANT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "u-customer-1",
      email: "customer@tms.com",
      passwordHash: DEFAULT_PASS_HASH,
      name: "Acme Logistics Customer",
      role: "CUSTOMER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  vehicles: [
    {
      id: "v-1",
      number: "V-TRUCK-8899",
      type: "Heavy Cargo Truck",
      capacity: 15000, // 15 Tons
      model: "FH16",
      brand: "Volvo",
      fuelType: "Diesel",
      insuranceExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      licenseExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),   // 90 days
      availability: true,
      status: "Available",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "v-2",
      number: "V-VAN-4433",
      type: "Delivery Van",
      capacity: 2500, // 2.5 Tons
      model: "Transit",
      brand: "Ford",
      fuelType: "Petrol",
      insuranceExpiry: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Expired 5 days ago! (Trigger Maintenance Alert)
      licenseExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      availability: true,
      status: "Maintenance",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "v-3",
      number: "V-LORRY-5511",
      type: "Flatbed Lorry",
      capacity: 8000, // 8 Tons
      model: "Canter",
      brand: "Mitsubishi",
      fuelType: "Diesel",
      insuranceExpiry: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      licenseExpiry: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(), // Expiring in 12 days
      availability: false,
      status: "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  drivers: [
    {
      id: "d-1",
      name: "Marcus Driver",
      nic: "991234567V",
      contact: "+1-555-0199",
      address: "456 Route Ave, Logistics Town",
      licenseNumber: "DL-99887766",
      experience: 8,
      emergencyContact: "+1-555-0100 (Wife)",
      salary: 3200.0,
      availability: false,
      attendanceStatus: "Present",
      rating: 4.8,
      userId: "u-driver-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "d-2",
      name: "Robert Miller",
      nic: "882345678V",
      contact: "+1-555-0211",
      address: "789 Freight Rd, Cargo City",
      licenseNumber: "DL-55443322",
      experience: 12,
      emergencyContact: "+1-555-0200 (Son)",
      salary: 3800.0,
      availability: true,
      attendanceStatus: "Present",
      rating: 4.9,
      userId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  trips: [
    {
      id: "t-1",
      trackingNumber: "TRIP-2026-0001",
      driverId: "d-1",
      vehicleId: "v-3",
      pickup: "Colombo Port, Warehouse A",
      destination: "Jaffna Central Depot",
      weight: 7500,
      cargoType: "Electronics",
      status: "IN_PROGRESS",
      eta: "6 hours",
      routePoints: JSON.stringify([
        [6.9271, 79.8612], // Colombo
        [7.4863, 80.3647], // Kurunegala
        [7.8731, 80.6514], // Dambulla
        [8.3114, 80.4037], // Anuradhapura
        [8.7542, 80.4982], // Vavuniya
        [9.3803, 80.3992], // Kilinochchi
        [9.6615, 80.0255]  // Jaffna
      ]),
      currentLat: 7.8731,
      currentLng: 80.6514,
      startAt: new Date().toISOString(),
      endAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  bookings: [
    {
      id: "b-1",
      customerId: "u-customer-1",
      pickup: "Orugodawatta Yard, Colombo",
      destination: "Kandy Goods Yard",
      weight: 1200,
      cargoDetails: "Boxed Apparel - 50 cartons",
      deliveryType: "Standard",
      status: "APPROVED",
      paymentStatus: "PAID",
      scheduledTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      tripId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "b-2",
      customerId: "u-customer-1",
      pickup: "Express Center, Colombo",
      destination: "Galle Fort Depot",
      weight: 3400,
      cargoDetails: "Medical Supplies",
      deliveryType: "Express",
      status: "PENDING",
      paymentStatus: "PENDING",
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      tripId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  maintenance: [
    {
      id: "m-1",
      vehicleId: "v-2",
      type: "Oil Change",
      description: "Scheduled preventive maintenance oil & filter change",
      cost: 150.0,
      status: "SCHEDULED",
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      completedDate: null,
      partsUsed: "Synthetic Oil, Oil Filter",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  fuelLogs: [
    {
      id: "f-1",
      vehicleId: "v-3",
      driverId: "d-1",
      liters: 120.5,
      cost: 216.9,
      mileage: 45200.0,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  payments: [
    {
      id: "p-1",
      bookingId: "b-1",
      amount: 1450.0,
      method: "Card",
      status: "PAID",
      transactionId: "TXN-CARD-998122",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  auditLogs: [
    {
      id: "al-1",
      userId: "u-admin-1",
      action: "System Setup",
      details: "Database initialized with seed profiles.",
      timestamp: new Date().toISOString()
    }
  ],
  notifications: [
    {
      id: "n-1",
      userId: "u-admin-1",
      title: "Welcome to TMS",
      message: "Transportation Management System is successfully initialized.",
      read: false,
      type: "Alert",
      createdAt: new Date().toISOString()
    },
    {
      id: "n-2",
      userId: "u-admin-1",
      title: "Insurance Expiry Warning",
      message: "Vehicle V-VAN-4433 has an expired insurance policy.",
      read: false,
      type: "Alert",
      createdAt: new Date().toISOString()
    }
  ]
};

// Read Database
const readDB = (): LocalDB => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
      return INITIAL_DATA;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading JSON fallback DB, using in-memory state:', error);
    return INITIAL_DATA;
  }
};

// Write Database
const writeDB = (data: LocalDB) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to JSON fallback DB:', error);
  }
};

// Emulated Query Methods mapping to Prisma syntax
const makeModelManager = (modelName: keyof LocalDB) => {
  return {
    findMany: async (args?: { where?: any }) => {
      const db = readDB();
      const list = db[modelName];
      if (!args || !args.where) return list;
      return list.filter((item: any) => {
        return Object.keys(args.where).every(key => {
          return item[key] === args.where[key];
        });
      });
    },
    findUnique: async (args: { where: any }) => {
      const db = readDB();
      const list = db[modelName];
      const found = list.find((item: any) => {
        return Object.keys(args.where).every(key => {
          return item[key] === args.where[key];
        });
      });
      return found || null;
    },
    findFirst: async (args: { where: any }) => {
      const db = readDB();
      const list = db[modelName];
      const found = list.find((item: any) => {
        return Object.keys(args.where).every(key => {
          return item[key] === args.where[key];
        });
      });
      return found || null;
    },
    create: async (args: { data: any }) => {
      const db = readDB();
      const newItem = {
        id: args.data.id || `${modelName.charAt(0)}-${Math.random().toString(36).substr(2, 9)}`,
        ...args.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db[modelName].push(newItem);
      writeDB(db);
      return newItem;
    },
    update: async (args: { where: { id: string }; data: any }) => {
      const db = readDB();
      const list = db[modelName];
      const index = list.findIndex((item: any) => item.id === args.where.id);
      if (index === -1) throw new Error(`Record not found in mock ${modelName}`);
      const updatedItem = {
        ...list[index],
        ...args.data,
        updatedAt: new Date().toISOString()
      };
      list[index] = updatedItem;
      db[modelName] = list;
      writeDB(db);
      return updatedItem;
    },
    delete: async (args: { where: { id: string } }) => {
      const db = readDB();
      const list = db[modelName];
      const index = list.findIndex((item: any) => item.id === args.where.id);
      if (index === -1) throw new Error(`Record not found in mock ${modelName}`);
      const deletedItem = list[index];
      db[modelName] = list.filter((item: any) => item.id !== args.where.id);
      writeDB(db);
      return deletedItem;
    }
  };
};

export const mockDb = {
  user: makeModelManager('users'),
  vehicle: makeModelManager('vehicles'),
  driver: makeModelManager('drivers'),
  trip: makeModelManager('trips'),
  booking: makeModelManager('bookings'),
  maintenance: makeModelManager('maintenance'),
  fuelLog: makeModelManager('fuelLogs'),
  payment: makeModelManager('payments'),
  auditLog: makeModelManager('auditLogs'),
  notification: makeModelManager('notifications'),
  // Helper to get total database size/state
  getState: () => readDB()
};
