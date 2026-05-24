export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const list = await db.driver.findMany();
    return NextResponse.json({ success: true, drivers: list });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, nic, contact, address, licenseNumber, experience, emergencyContact, salary 
    } = body;

    if (!name || !nic || !contact || !address || !licenseNumber || !experience || !emergencyContact || !salary) {
      return NextResponse.json({ error: 'Missing required driver fields' }, { status: 400 });
    }

    const existingNIC = await db.driver.findUnique({ where: { nic } });
    if (existingNIC) {
      return NextResponse.json({ error: 'Driver with this NIC already exists' }, { status: 400 });
    }

    const existingLic = await db.driver.findUnique({ where: { licenseNumber } });
    if (existingLic) {
      return NextResponse.json({ error: 'Driver with this license number already exists' }, { status: 400 });
    }

    const driver = await db.driver.create({
      data: {
        name,
        nic,
        contact,
        address,
        licenseNumber,
        experience: Number(experience),
        emergencyContact,
        salary: Number(salary)
      }
    });

    await db.auditLog.create({
      data: {
        action: "Register Driver",
        details: `Registered driver: ${name} (NIC: ${nic})`
      }
    });

    return NextResponse.json({ success: true, driver });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
