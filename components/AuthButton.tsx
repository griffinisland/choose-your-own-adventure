'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';

export function AuthButton() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  const handleSignOut = () => {
    logout();
    router.push('/login');
    router.refresh();
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-300 text-gray-600 rounded-md cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Signed in as {user.username}
        </span>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return null; // Should not happen if routes are protected
}
