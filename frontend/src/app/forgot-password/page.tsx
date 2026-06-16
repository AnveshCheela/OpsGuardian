"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
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
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md p-8 glass-panel">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded bg-mocha flex items-center justify-center text-cream font-bold text-xl mx-auto mb-4 shadow-lg shadow-mocha/20">
            OG
          </div>
          <h1 className="text-2xl font-extrabold text-cream tracking-tight">Forgot Password</h1>
          <p className="text-cream/50 mt-2 text-sm">Enter your email and we will send you a reset link.</p>
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
            <label className="text-sm font-medium text-cream/80 pl-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-espresso-dark border border-mocha/50 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-mocha/50 focus:border-mocha transition-all"
              placeholder="engineer@opsguardian.com"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 px-4 bg-mocha hover:bg-mocha/90 text-cream font-semibold rounded-xl shadow-[0_0_15px_rgba(65,45,21,0.5)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="text-center mt-6">
            <Link href="/login" className="text-cream/60 hover:text-cream text-sm font-medium transition-colors">
              &larr; Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
