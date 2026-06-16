"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';

export default function PendingPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setStatusMessage('');

    try {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/auth/me`, {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.status === 'Approved') {
            login(storedToken, data.user);
            router.push('/');
            return;
          } else if (data.user && data.user.status === 'Rejected') {
            setStatusMessage('Your request has been rejected by the team leader.');
            return;
          }
        }
      }
      setStatusMessage('Still waiting for leader approval...');
    } catch (err) {
      console.error(err);
      setStatusMessage('Could not check status. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="glass-panel p-12 max-w-lg w-full text-center">
        {/* Animated Hourglass */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-mocha/10 animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute inset-2 rounded-full bg-mocha/5 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
            <div className="relative text-6xl animate-pulse" style={{ animationDuration: '2s' }}>
              ⏳
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-cream mb-3 tracking-tight">
          Awaiting Leader Approval
        </h1>
        <p className="text-cream/60 text-lg mb-8 leading-relaxed">
          Your account is pending approval from your team leader. You&apos;ll be able to access the dashboard once approved.
        </p>

        {statusMessage && (
          <div className={`mb-6 p-3 rounded-lg text-sm ${
            statusMessage.includes('rejected') 
              ? 'bg-red-900/30 border border-red-900/50 text-red-400'
              : 'bg-mocha/20 border border-mocha/50 text-cream/80'
          }`}>
            {statusMessage}
          </div>
        )}

        <button
          onClick={handleCheckStatus}
          disabled={isChecking}
          className="w-full py-3 px-6 bg-mocha hover:bg-mocha/80 text-cream font-bold rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-mocha/20 disabled:opacity-50 disabled:hover:transform-none flex justify-center items-center h-12 mb-4"
        >
          {isChecking ? (
            <div className="w-5 h-5 border-2 border-cream/30 border-t-cream rounded-full animate-spin"></div>
          ) : (
            'Check Status'
          )}
        </button>

        <Link 
          href="/login"
          className="inline-block text-mocha hover:text-cream font-semibold transition-colors text-sm"
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}
