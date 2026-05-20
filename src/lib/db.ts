import { PrismaClient } from '@prisma/client';
import { mockDb } from './mockDb';

let prismaInstance: any;
try {
  prismaInstance = new PrismaClient();
} catch (e) {
  prismaInstance = {
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve()
  };
}

export const prisma = prismaInstance;

// Dynamic wrapper to catch database connection errors and fallback to local JSON database
const wrapModel = (modelName: string, mockModel: any) => {
  return {
    findMany: async (args?: any) => {
      try {
        // Quick environment variable check
        if (!process.env.DATABASE_URL) {
          return await mockModel.findMany(args);
        }
        return await (prisma as any)[modelName].findMany(args);
      } catch (error) {
        return await mockModel.findMany(args);
      }
    },
    findUnique: async (args: any) => {
      try {
        if (!process.env.DATABASE_URL) {
          return await mockModel.findUnique(args);
        }
        return await (prisma as any)[modelName].findUnique(args);
      } catch (error) {
        return await mockModel.findUnique(args);
      }
    },
    findFirst: async (args?: any) => {
      try {
        if (!process.env.DATABASE_URL) {
          return await mockModel.findFirst(args);
        }
        return await (prisma as any)[modelName].findFirst(args);
      } catch (error) {
        return await mockModel.findFirst(args);
      }
    },
    create: async (args: any) => {
      try {
        if (!process.env.DATABASE_URL) {
          return await mockModel.create(args);
        }
        const result = await (prisma as any)[modelName].create(args);
        try {
          await mockModel.create(args);
        } catch (syncErr) {
          console.warn(`Fallback DB sync error during create on ${modelName}:`, syncErr);
        }
        return result;
      } catch (error) {
        return await mockModel.create(args);
      }
    },
    update: async (args: any) => {
      try {
        if (!process.env.DATABASE_URL) {
          return await mockModel.update(args);
        }
        const result = await (prisma as any)[modelName].update(args);
        try {
          await mockModel.update(args);
        } catch (syncErr) {
          console.warn(`Fallback DB sync error during update on ${modelName}:`, syncErr);
        }
        return result;
      } catch (error) {
        return await mockModel.update(args);
      }
    },
    delete: async (args: any) => {
      try {
        if (!process.env.DATABASE_URL) {
          return await mockModel.delete(args);
        }
        const result = await (prisma as any)[modelName].delete(args);
        try {
          await mockModel.delete(args);
        } catch (syncErr) {
          console.warn(`Fallback DB sync error during delete on ${modelName}:`, syncErr);
        }
        return result;
      } catch (error) {
        return await mockModel.delete(args);
      }
    }
  };
};

export const db = {
  user: wrapModel('user', mockDb.user),
  vehicle: wrapModel('vehicle', mockDb.vehicle),
  driver: wrapModel('driver', mockDb.driver),
  trip: wrapModel('trip', mockDb.trip),
  booking: wrapModel('booking', mockDb.booking),
  maintenance: wrapModel('maintenance', mockDb.maintenance),
  fuelLog: wrapModel('fuelLog', mockDb.fuelLog),
  payment: wrapModel('payment', mockDb.payment),
  auditLog: wrapModel('auditLog', mockDb.auditLog),
  notification: wrapModel('notification', mockDb.notification)
};
