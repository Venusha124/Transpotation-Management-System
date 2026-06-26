export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// Get all conductors
export async function GET() {
  try {
    const conductors = await db.user.findMany({
      where: { role: 'CONDUCTOR' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        walletBalance: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, conductors });
  } catch (error) {
    console.error('Failed to fetch conductors:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Create a new conductor
export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);

    const newConductor = await db.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: 'CONDUCTOR'
      },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    await db.auditLog.create({
      data: {
        action: "Create Conductor",
        details: `Created new conductor: ${newConductor.name} (${newConductor.email})`
      }
    });

    return NextResponse.json({ success: true, conductor: newConductor });
  } catch (error) {
    console.error('Failed to create conductor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
