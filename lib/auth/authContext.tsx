'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: { username: string } | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    if (typeof window !== 'undefined') {
      const storedUsername = sessionStorage.getItem('adminUsername');
      if (storedUsername) {
        setUser({ username: storedUsername });
      }
      setIsLoading(false);
    } else {
      // Server-side: set loading to false immediately
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const { validateAdminCredentials } = await import('./adminUsers');
    
    if (validateAdminCredentials(username, password)) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('adminUsername', username);
      }
      setUser({ username });
      return true;
    }
    return false;
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('adminUsername');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
