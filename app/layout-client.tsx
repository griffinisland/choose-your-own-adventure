'use client';

import { TopNav } from '@/components/TopNav';
import { AuthProvider } from '@/lib/auth/authContext';
import { InstantDBAuthInit } from '@/components/InstantDBAuthInit';

export function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InstantDBAuthInit />
      <AuthProvider>
        <TopNav />
        {children}
      </AuthProvider>
    </>
  );
}
