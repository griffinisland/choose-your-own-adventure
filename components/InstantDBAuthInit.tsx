'use client';

import { useEffect } from 'react';
import { db } from '@/lib/instantdb/client';

// Initialize InstantDB guest authentication
// This is separate from our custom authentication system
// InstantDB needs authentication for queries, but we use custom auth for app access control
export function InstantDBAuthInit() {
  useEffect(() => {
    // Sign in as guest to InstantDB so queries work
    db.auth.signInAsGuest().catch((err) => {
      console.warn('Failed to sign in as guest to InstantDB:', err);
    });
  }, []);

  return null; // This component doesn't render anything
}
