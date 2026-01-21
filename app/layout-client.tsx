'use client';

import { TopNav } from '@/components/TopNav';
import { AuthProvider } from '@/lib/auth/authContext';
import { InstantDBAuthInit } from '@/components/InstantDBAuthInit';
import { MaterialIconsLoader } from '@/components/MaterialIconsLoader';

export function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MaterialIconsLoader />
      <InstantDBAuthInit />
      <AuthProvider>
        <TopNav />
        {children}
      </AuthProvider>
    </>
  );
}
