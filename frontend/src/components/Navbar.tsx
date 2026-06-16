"use client";

import Link from 'next/link';
import React from 'react';
import { useAuth } from '@/context/AuthProvider';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="w-full bg-espresso-dark/90 backdrop-blur-md border-b border-mocha/50 px-8 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-mocha flex items-center justify-center text-cream font-bold">
            OG
          </div>
          <span className="text-xl font-extrabold text-cream tracking-tight">OpsGuardian</span>
        </Link>
        <div className="flex items-center gap-6 text-cream/80 text-sm font-medium">
          <Link href="/" className="hover:text-cream transition-colors">Dashboard</Link>
          <Link href="/incidents" className="hover:text-cream transition-colors">Incidents</Link>
          <Link href="/chat" className="hover:text-cream transition-colors">Chat</Link>
          
          {user?.role === 'Leader' && (
            <>
              <Link href="/employees" className="hover:text-cream transition-colors">Employees</Link>
              <Link href="/approvals" className="hover:text-cream transition-colors">Approvals</Link>
            </>
          )}

          {user ? (
            <>
              <Link href="/profile" className="hover:text-cream transition-colors flex items-center gap-2 border-l border-mocha/50 pl-6 ml-2">
                <div className="w-6 h-6 rounded-full bg-mocha flex items-center justify-center text-cream text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span>{user.name}</span>
                <span className="text-xs uppercase tracking-wider text-mocha font-bold ml-1">{user.role === 'Leader' ? '(Leader)' : '(Employee)'}</span>
              </Link>
              <button 
                onClick={logout}
                className="px-4 py-2 bg-red-900/20 border border-red-900/50 rounded-lg hover:bg-red-900/40 text-red-400 transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="px-4 py-2 bg-mocha/30 border border-mocha/50 rounded-lg hover:bg-mocha/50 text-cream transition-all">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
