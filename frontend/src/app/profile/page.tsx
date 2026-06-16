"use client";

import React, { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <main className="flex-1 w-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-mocha/30 border-t-mocha rounded-full animate-spin"></div>
        </main>
      </div>
    );
  }

  const isLeader = user.role === 'Leader';

  // Build team members list
  const team = user.teams?.[0];
  const leaderInfo = team?.leader || null;
  const employees = team?.users?.filter(u => u.status === 'Approved' && u.id !== leaderInfo?.id) || [];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />
      
      <main className="flex-1 w-full p-8 max-w-3xl mx-auto mt-12">
        <h1 className="text-4xl font-extrabold text-cream tracking-tight mb-8">
          Your Profile
        </h1>

        <div className="glass-panel p-8">
          {/* Profile Header */}
          <div className="flex items-center gap-6 mb-8 border-b border-mocha/30 pb-8">
            <div className="w-24 h-24 rounded-full bg-mocha flex items-center justify-center text-cream font-bold text-4xl shadow-lg shadow-mocha/20 uppercase">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-cream flex items-center gap-3">
                {user.name}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-mocha/20 border border-mocha/50 rounded-full text-sm font-semibold text-cream/90 uppercase tracking-wider">
                  {isLeader ? 'Team Leader' : 'Team Employee'}
                </span>
              </h2>
              <p className="text-cream/60 mt-1">{user.email}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-semibold text-cream/80 uppercase tracking-wider mb-2">Contact Information</h3>
              <p className="text-cream font-medium">{user.email}</p>
              {user.contactNumber && (
                <p className="text-cream/60 text-sm mt-1">{user.contactNumber}</p>
              )}
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold text-cream/80 uppercase tracking-wider mb-2">Company</h3>
              <p className="text-cream font-medium">{user.companyName}</p>
            </div>

            {/* Role */}
            <div>
              <h3 className="text-sm font-semibold text-cream/80 uppercase tracking-wider mb-2">Role</h3>
              <p className="text-cream font-medium uppercase tracking-wider text-sm">{isLeader ? 'Leader' : 'Employee'}</p>
            </div>

            {/* Your Team */}
            <div>
              <h3 className="text-sm font-semibold text-cream/80 uppercase tracking-wider mb-4">Your Team</h3>
              <div className="space-y-3">
                {/* Leader */}
                {leaderInfo && (
                  <div className="flex items-center gap-3 p-3 bg-mocha/10 border border-mocha/30 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-mocha/30 border border-mocha/50 flex items-center justify-center text-cream font-bold uppercase">
                      {leaderInfo.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-cream font-medium truncate flex items-center gap-2">
                        {leaderInfo.name}
                        <span className="text-xs px-2 py-0.5 bg-mocha/20 border border-mocha/40 rounded-full text-cream/70 uppercase tracking-wider font-bold">Leader</span>
                        {isLeader && <span className="text-cream/40 text-xs">(you)</span>}
                      </p>
                      <p className="text-cream/50 text-sm truncate">{leaderInfo.email}</p>
                    </div>
                  </div>
                )}

                {/* Employees */}
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <div key={emp.id} className="flex items-center gap-3 p-3 bg-espresso-dark/50 border border-mocha/20 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-mocha/20 border border-mocha/40 flex items-center justify-center text-cream font-semibold uppercase">
                        {emp.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-cream font-medium truncate flex items-center gap-2">
                          {emp.name}
                          <span className="text-xs px-2 py-0.5 bg-espresso-dark border border-mocha/30 rounded-full text-cream/60 uppercase tracking-wider font-bold">Employee</span>
                          {emp.id === user.id && <span className="text-cream/40 text-xs">(you)</span>}
                        </p>
                        <p className="text-cream/50 text-sm truncate">{emp.email}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  !leaderInfo && (
                    <p className="text-cream/50 text-sm">No team members found.</p>
                  )
                )}
              </div>
            </div>

            {/* Logout */}
            <div className="pt-6 mt-6 border-t border-mocha/30">
              <button 
                onClick={logout}
                className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg transition-colors font-medium text-sm"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
