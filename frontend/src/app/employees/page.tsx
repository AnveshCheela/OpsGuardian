"use client";

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';

export default function EmployeesPage() {
  const { user, isLoading, isLeader, token, refreshUser } = useAuth();
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveEmployee = async (userId: string) => {
    if (!confirm('Are you sure you want to completely remove this employee and erase their data?')) return;
    
    setRemovingId(userId);
    try {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/approval/${userId}/remove`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await refreshUser();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove employee');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Failed to remove employee.');
    } finally {
      setRemovingId(null);
    }
  };

  const [savingOrder, setSavingOrder] = useState(false);

  const saveOrderToBackend = async (newOrderIds: string[]) => {
    setSavingOrder(true);
    try {
      await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/teams/order`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ employeeOrder: newOrderIds })
      });
      await refreshUser();
    } catch (err) {
      console.error('Failed to save order:', err);
    } finally {
      setSavingOrder(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isLeader) {
        router.push('/');
      }
    }
  }, [user, isLoading, isLeader, router]);

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

  // Get all approved employees from the teams payload
  const team = user.teams?.[0];
  const leaderId = team?.leader?.id;
  const rawEmployees = team?.users?.filter(u => u.status === 'Approved' && u.id !== leaderId) || [];
  
  // Sort based on saved employeeOrder
  const employeeOrder = team?.employeeOrder || [];
  const employees = [...rawEmployees].sort((a, b) => {
    const idxA = employeeOrder.indexOf(a.id);
    const idxB = employeeOrder.indexOf(b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0; // Both not in order list, keep natural order
  });

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...employees];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    saveOrderToBackend(newOrder.map(e => e.id));
  };

  const handleMoveDown = (index: number) => {
    if (index === employees.length - 1) return;
    const newOrder = [...employees];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    saveOrderToBackend(newOrder.map(e => e.id));
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />
      <main className="flex-1 w-full p-8 max-w-6xl mx-auto mt-8">
        <header className="mb-12 border-b border-mocha/30 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-cream tracking-tight flex items-center gap-4">
              Your Employees
            </h1>
            <p className="text-cream/60 mt-2">View and manage all approved members of your engineering team.</p>
          </div>
          <div className="px-4 py-2 bg-espresso-dark border border-mocha/50 rounded-xl text-cream font-medium">
            Total Staff: {employees.length}
          </div>
        </header>

        {employees.length === 0 ? (
          <div className="text-center py-20 glass-panel">
            <h2 className="text-xl font-medium text-cream">It&apos;s quiet in here...</h2>
            <p className="text-cream/50 mt-2">You don&apos;t have any approved employees yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {employees.map((emp, index) => (
              <div key={emp.id} className="glass-panel p-6 flex flex-col h-full transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-mocha/10 relative">
                
                {/* Order Controls Overlay (for saving state) */}
                {savingOrder && <div className="absolute inset-0 bg-black/20 rounded-xl z-10 flex items-center justify-center backdrop-blur-[1px]"></div>}
                
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-14 h-14 shrink-0 rounded-full bg-mocha/20 border border-mocha/40 flex items-center justify-center text-cream font-bold text-2xl uppercase shadow-inner">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="min-w-0 pt-1">
                      <p className="text-cream text-lg font-bold truncate pr-2">{emp.name}</p>
                      <p className="text-mocha text-sm font-semibold mb-1">Employee</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0 z-20">
                    <button 
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0 || savingOrder}
                      className="px-2 py-1 bg-espresso/80 hover:bg-mocha/30 border border-mocha/30 hover:border-mocha/60 rounded text-[9px] font-bold tracking-widest uppercase text-cream/60 hover:text-cream disabled:opacity-20 disabled:hover:bg-espresso/80 disabled:hover:border-mocha/30 transition-all shadow-sm w-full text-center"
                    >
                      Move Up
                    </button>
                    <button 
                      onClick={() => handleMoveDown(index)}
                      disabled={index === employees.length - 1 || savingOrder}
                      className="px-2 py-1 bg-espresso/80 hover:bg-mocha/30 border border-mocha/30 hover:border-mocha/60 rounded text-[9px] font-bold tracking-widest uppercase text-cream/60 hover:text-cream disabled:opacity-20 disabled:hover:bg-espresso/80 disabled:hover:border-mocha/30 transition-all shadow-sm w-full text-center"
                    >
                      Move Down
                    </button>
                  </div>
                </div>

                <div className="space-y-4 mt-auto border-t border-mocha/20 pt-4">
                  <div>
                    <p className="text-cream/40 text-xs font-semibold uppercase tracking-wider mb-1">Email Address</p>
                    <p className="text-cream text-sm truncate">{emp.email}</p>
                  </div>
                  
                  {emp.contactNumber && (
                    <div>
                      <p className="text-cream/40 text-xs font-semibold uppercase tracking-wider mb-1">Contact Number</p>
                      <p className="text-cream text-sm">{emp.contactNumber}</p>
                    </div>
                  )}

                  {emp.createdAt && (
                    <div>
                      <p className="text-cream/40 text-xs font-semibold uppercase tracking-wider mb-1">Joined Date</p>
                      <p className="text-cream text-sm">
                        {new Date(emp.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={() => handleRemoveEmployee(emp.id)}
                      disabled={removingId === emp.id}
                      className="w-full py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {removingId === emp.id ? (
                        <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                      ) : (
                        'Remove Employee'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
