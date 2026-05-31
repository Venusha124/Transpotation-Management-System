import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyTokenNode } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyTokenNode(token);
    if (!payload || !['ADMIN', 'TRANSPORT_MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, refundAmount } = body;

    const dispute = await db.dispute.findUnique({ where: { id } });
    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    if (status === 'RESOLVED' && dispute.status !== 'RESOLVED' && refundAmount > 0) {
      // Process refund
      const user = await db.user.findUnique({ where: { id: dispute.customerId } });
      if (user) {
        await db.user.update({
          where: { id: user.id },
          data: { walletBalance: user.walletBalance + Number(refundAmount) }
        });
      }
    }

    const updated = await db.dispute.update({
      where: { id },
      data: {
        status: status || dispute.status,
        refundAmount: refundAmount !== undefined ? Number(refundAmount) : dispute.refundAmount
      }
    });

    return NextResponse.json({ success: true, dispute: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
