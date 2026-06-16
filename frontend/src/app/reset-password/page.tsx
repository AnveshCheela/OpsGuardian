"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage('Password has been reset successfully. Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 glass-panel">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold text-cream tracking-tight">Set New Password</h1>
        <p className="text-cream/50 mt-2 text-sm">Enter your new secure password below.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {message && (
          <div className="bg-green-900/30 border border-green-900/50 text-green-400 p-3 rounded-lg text-sm text-center">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-900/30 border border-red-900/50 text-red-400 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-cream/80 pl-1">New Password</label>
          <input 
            type="password" 
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 bg-espresso-dark border border-mocha/50 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-mocha/50 focus:border-mocha transition-all"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading || !token}
          className="w-full py-3 px-4 bg-mocha hover:bg-mocha/90 text-cream font-semibold rounded-xl shadow-[0_0_15px_rgba(65,45,21,0.5)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Suspense fallback={<div className="text-cream">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
