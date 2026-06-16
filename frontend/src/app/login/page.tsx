"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (data.user?.status === 'Pending' || data.pendingApproval) {
          if (data.token) {
            localStorage.setItem('token', data.token);
          }
          router.push('/pending');
        } else {
          login(data.token, data.user);
          router.push('/');
        }
      } else {
        if (data.error?.toLowerCase().includes('pending') || data.error?.toLowerCase().includes('approval')) {
          router.push('/pending');
        } else {
          setError(data.error || 'Login failed');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-black">
      {/* Left Panel - Illustration */}
      <div className="hidden lg:flex w-1/2 relative bg-espresso-dark items-center justify-center overflow-hidden border-r border-mocha/30">
        <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none"></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/images/auth-bg.png" 
          alt="Tech Illustration" 
          className="w-full h-full object-cover object-center opacity-80"
        />
        <div className="absolute bottom-12 left-12 z-20 max-w-md">
          <h2 className="text-4xl font-extrabold text-cream mb-4 tracking-tight">Protect Your Infrastructure.</h2>
          <p className="text-cream/70 text-lg">Intelligent event-driven monitoring that predicts failures before they wake you up.</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="w-12 h-12 rounded bg-mocha flex items-center justify-center text-cream font-bold text-xl mx-auto mb-6 shadow-lg shadow-mocha/20">
              OG
            </div>
            <h1 className="text-3xl font-bold text-cream mb-2">Welcome Back</h1>
            <p className="text-cream/60">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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
                className="w-full px-4 py-3 bg-espresso-dark/50 border border-mocha/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-mocha text-cream placeholder-cream/30 transition-all"
                placeholder="engineer@opsguardian.com"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-cream/80 pl-1">Password</label>
                <Link href="/forgot-password" className="text-xs text-mocha hover:text-mocha/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-espresso-dark border border-mocha/50 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-mocha/50 focus:border-mocha transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 px-4 bg-mocha hover:bg-mocha/90 text-cream font-semibold rounded-xl shadow-[0_0_15px_rgba(65,45,21,0.5)] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center h-12"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-cream/30 border-t-cream rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-cream/60">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-mocha hover:text-cream font-semibold transition-colors">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
