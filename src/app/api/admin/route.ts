import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const usersList = await db.user.findMany();
    const logsList = await db.auditLog.findMany();

    // Sort audit logs by date
    const sortedLogs = [...logsList].sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Filter out password hashes for security
    const cleanUsers = usersList.map((u: any) => {
      const { passwordHash, ...clean } = u;
      return clean;
    });

    return NextResponse.json({ 
      success: true, 
      users: cleanUsers, 
      auditLogs: sortedLogs 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing user ID or role field' }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { role }
    });

    await db.auditLog.create({
      data: {
        action: "Modify RBAC Role",
        details: `Modified user role for ${updated.name} to ${role}`
      }
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
