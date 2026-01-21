'use client';

import { TopNav } from '@/components/TopNav';
import { AuthProvider } from '@/lib/auth/authContext';
import { InstantDBAuthInit } from '@/components/InstantDBAuthInit';
import { MaterialIconsLoader } from '@/components/MaterialIconsLoader';

export function LayoutClient({ children }: { children: React.ReactNode }) {
  // If InstantDB isn't configured at build time, the app will crash when initializing the client.
  // On Netlify, set this in Site settings → Environment variables and redeploy.
  const instantAppId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
  if (!instantAppId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-xl w-full bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="text-lg font-semibold text-gray-900">Missing InstantDB config</div>
          <div className="mt-2 text-sm text-gray-700">
            This deployment is missing <code className="font-mono">NEXT_PUBLIC_INSTANT_APP_ID</code>.
          </div>
          <div className="mt-3 text-sm text-gray-700">
            Add it in Netlify → <span className="font-semibold">Site settings</span> →{' '}
            <span className="font-semibold">Environment variables</span>, then redeploy.
          </div>
        </div>
      </div>
    );
  }

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
