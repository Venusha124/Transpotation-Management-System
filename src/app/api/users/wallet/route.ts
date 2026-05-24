export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyTokenNode } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyTokenNode(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Update user wallet balance
    const updatedUser = await db.user.update({
      where: { id: payload.id },
      data: {
        walletBalance: { increment: amount }
      }
    });

    // Create Audit Log
    await db.auditLog.create({
      data: {
        userId: payload.id,
        action: 'Wallet Top-Up',
        details: `Topped up LKR ${amount.toFixed(2)} to E-Wallet.`
      }
    });

    // Create Notification
    await db.notification.create({
      data: {
        userId: payload.id,
        title: 'Payment Successful',
        message: `Your E-Wallet was successfully credited with LKR ${amount.toFixed(2)}.`,
        type: 'WALLET_TOPUP'
      }
    });

    return NextResponse.json({ success: true, walletBalance: updatedUser.walletBalance });
  } catch (error: any) {
    console.error('Wallet Top-Up API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
