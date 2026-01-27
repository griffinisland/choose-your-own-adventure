'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthButton } from './AuthButton';

export function TopNav() {
  const pathname = usePathname();
  const isPlayPage = pathname?.startsWith('/play/');
  const isLoginPage = pathname === '/login';

  // Don't show nav on login page
  if (isLoginPage) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-xl font-bold text-gray-800 flex items-center gap-2">
          Adventure Builder
          <span className="text-sm font-normal text-gray-500">v2.0</span>
        </Link>
        {isPlayPage && (
          <Link
            href="/"
            className="px-3 py-1.5 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
          >
            Stop playing
          </Link>
        )}
      </div>
      <AuthButton />
    </nav>
  );
}
