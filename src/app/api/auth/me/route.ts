import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyTokenNode } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = verifyTokenNode(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Fetch fresh user data
    const user = await db.user.findUnique({
      where: { id: payload.id }
    });

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
