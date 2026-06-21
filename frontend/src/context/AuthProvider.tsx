"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'Leader' | 'Employee';
  status: 'Pending' | 'Approved' | 'Rejected';
  contactNumber?: string;
  companyName: string;
  teams?: { 
    id: string; 
    name: string; 
    employeeOrder?: string[];
    leader: { id: string; name: string; email: string; role: string; status: string; contactNumber?: string; createdAt?: string };
    users: { id: string; name: string; email: string; role: string; status: string; contactNumber?: string; createdAt?: string }[] 
  }[];
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLeader: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLeader = user?.role === 'Leader';

  const fetchUser = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      window.location.href = '/login';
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const refreshUser = useCallback(async () => {
    const currentToken = token || localStorage.getItem('token');
    if (!currentToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to refresh user', error);
    }
  }, [token]);

  const login = (newToken: string, userToSet: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userToSet); // Set immediately to prevent race condition on redirect
    // We can still fetchUser to get any nested relations (like teams) that might be missing from the login payload
    fetchUser(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, isLeader, login, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
