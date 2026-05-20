import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyTokenNode } from '@/lib/auth';
import { db } from '@/lib/db';
import DashboardLayoutClient from './DashboardLayoutClient';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = verifyTokenNode(token);
  if (!payload) {
    // Session is corrupt or expired
    redirect('/login');
  }

  // Fetch user information to ensure session validity
  const user = await db.user.findUnique({
    where: { id: payload.id }
  });

  if (!user) {
    redirect('/login');
  }

  const serializedUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };

  return (
    <DashboardLayoutClient user={serializedUser}>
      {children}
    </DashboardLayoutClient>
  );
}
