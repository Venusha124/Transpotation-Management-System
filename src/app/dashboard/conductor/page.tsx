import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyTokenNode } from '@/lib/auth';
import { db } from '@/lib/db';
import ConductorPOSPageClient from './ConductorPOSPageClient';

export default async function DashboardConductorPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = verifyTokenNode(token);
  if (!payload) {
    redirect('/login');
  }

  // Fetch user information to ensure session validity and authorize roles
  const user = await db.user.findUnique({
    where: { id: payload.id }
  });

  if (!user) {
    redirect('/login');
  }

  const allowedRoles = ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER', 'CONDUCTOR'];
  if (!allowedRoles.includes(user.role)) {
    redirect('/dashboard');
  }

  const serializedUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };

  return <ConductorPOSPageClient initialUser={serializedUser} />;
}
