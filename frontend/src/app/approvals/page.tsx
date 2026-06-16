"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';

type PendingUser = {
  id: string;
  name: string;
  email: string;
  status: string;
};

export default function ApprovalsPage() {
  const { user, token, isLoading, isLeader, refreshUser } = useAuth();
  const router = useRouter();
  
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvalActions, setApprovalActions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isLeader) {
        router.push('/');
      }
    }
  }, [user, isLoading, isLeader, router]);

  const fetchPendingUsers = useCallback(async () => {
    if (!isLeader || !token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/approval/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingUsers(data.pendingUsers || data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch pending users:", err);
    }
  }, [isLeader, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  const handleApprove = async (userId: string) => {
    setApprovalActions(prev => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/approval/${userId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        await refreshUser(); // Force the React state to grab the new team list
      }
    } catch (err) {
      console.error("Failed to approve user:", err);
    } finally {
      setApprovalActions(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleReject = async (userId: string) => {
    setApprovalActions(prev => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/approval/${userId}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        await refreshUser();
      }
    } catch (err) {
      console.error("Failed to reject user:", err);
    } finally {
      setApprovalActions(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (isLoading || !user || !isLeader) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <main className="flex-1 w-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-mocha/30 border-t-mocha rounded-full animate-spin"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />
      <main className="flex-1 w-full p-8 max-w-5xl mx-auto mt-8">
        <header className="mb-12 border-b border-mocha/30 pb-6">
          <h1 className="text-4xl font-extrabold text-cream tracking-tight flex items-center gap-4">
            Team Approvals
            {pendingUsers.length > 0 && (
              <span className="px-3 py-1 bg-mocha/30 border border-mocha/50 rounded-full text-lg font-medium text-cream/80">
                {pendingUsers.length} Pending
              </span>
            )}
          </h1>
          <p className="text-cream/60 mt-2">Manage requests from employees attempting to join your team.</p>
        </header>

        {pendingUsers.length === 0 ? (
          <div className="text-center py-20 glass-panel">
            <h2 className="text-xl font-medium text-cream">You&apos;re all caught up!</h2>
            <p className="text-cream/50 mt-2">There are no pending employee approvals at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pendingUsers.map((pUser) => (
              <div key={pUser.id} className="glass-panel p-6 flex flex-col h-full transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-mocha/10">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-mocha/30 border border-mocha/50 flex items-center justify-center text-cream font-bold text-xl uppercase shadow-inner">
                    {pUser.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-cream text-lg font-bold truncate">{pUser.name}</p>
                    <p className="text-cream/50 text-sm truncate">{pUser.email}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-yellow-900/30 border border-yellow-900/50 rounded-md text-xs font-semibold text-yellow-500 uppercase tracking-wider">
                      Pending
                    </span>
                  </div>
                </div>
                <div className="mt-auto flex gap-3">
                  <button
                    onClick={() => handleApprove(pUser.id)}
                    disabled={approvalActions[pUser.id]}
                    className="flex-1 py-2.5 bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-900/50 rounded-xl text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(pUser.id)}
                    disabled={approvalActions[pUser.id]}
                    className="flex-1 py-2.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-xl text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
