'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '../../stores/use-auth';

interface AuthGuardProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function AuthGuard({ children, adminOnly = false }: AuthGuardProps) {
  const router = useRouter();
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    if (adminOnly && user?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [token, user, adminOnly, router]);

  if (!token) return null;
  if (adminOnly && user?.role !== 'admin') return null;

  return <>{children}</>;
}
