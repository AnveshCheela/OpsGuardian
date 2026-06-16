"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<'Leader' | 'Employee'>('Leader');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Strict Password Validation (Frontend)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError('Password must contain an uppercase letter, a lowercase letter, and a number.');
      setIsLoading(false);
      return;
    }

    if (name && password.toLowerCase().includes(name.toLowerCase())) {
      setError('Password cannot contain your name.');
      setIsLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, contactNumber, companyName, role }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (data.pendingApproval) {
          router.push('/pending');
        } else {
          login(data.token, data.user);
          router.push('/');
        }
      } else {
        setError(data.error || 'Signup failed');
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
      
      {/* Left Panel - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="w-12 h-12 rounded bg-mocha flex items-center justify-center text-cream font-bold text-xl mx-auto mb-6 shadow-lg shadow-mocha/20">
              OG
            </div>
            <h1 className="text-3xl font-bold text-cream mb-2">Create an Account</h1>
            <p className="text-cream/60">Join OpsGuardian to protect your infrastructure.</p>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole('Leader')}
              className={`p-4 rounded-xl border-2 transition-all duration-300 text-center cursor-pointer ${
                role === 'Leader'
                  ? 'border-mocha bg-mocha/20 shadow-[0_0_20px_rgba(65,45,21,0.5)]'
                  : 'border-mocha/30 bg-espresso-dark/50 hover:border-mocha/60'
              }`}
            >
              <div className="text-2xl mb-1">👑</div>
              <div className="text-cream font-semibold text-sm">I am a Team Leader</div>
            </button>
            <button
              type="button"
              onClick={() => setRole('Employee')}
              className={`p-4 rounded-xl border-2 transition-all duration-300 text-center cursor-pointer ${
                role === 'Employee'
                  ? 'border-mocha bg-mocha/20 shadow-[0_0_20px_rgba(65,45,21,0.5)]'
                  : 'border-mocha/30 bg-espresso-dark/50 hover:border-mocha/60'
              }`}
            >
              <div className="text-2xl mb-1">👤</div>
              <div className="text-cream font-semibold text-sm">I am an Employee</div>
            </button>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="bg-red-900/30 border border-red-900/50 text-red-400 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium text-cream/80 pl-1">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-espresso-dark/50 border border-mocha/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-mocha text-cream placeholder-cream/30 transition-all"
                placeholder="Ada Lovelace"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-cream/80 pl-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-espresso-dark border border-mocha/50 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-mocha/50 focus:border-mocha transition-all"
                placeholder="ada@opsguardian.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-cream/80 pl-1">
                {role === 'Leader'
                  ? "Company Name (this will be your team's identity)"
                  : "Company Name (enter your leader's company name)"}
              </label>
              <input 
                type="text" 
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 bg-espresso-dark border border-mocha/50 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-mocha/50 focus:border-mocha transition-all"
                placeholder="Acme Corp"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-cream/80 pl-1">Contact Number</label>
              <input 
                type="tel" 
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-4 py-3 bg-espresso-dark border border-mocha/50 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-mocha/50 focus:border-mocha transition-all"
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-cream/80 pl-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-espresso-dark/50 border border-mocha/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-mocha text-cream placeholder-cream/30 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-mocha hover:bg-mocha/80 text-cream font-bold rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-mocha/20 disabled:opacity-50 disabled:hover:transform-none flex justify-center items-center h-12 mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-cream/30 border-t-cream rounded-full animate-spin"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-cream/60">
            Already have an account?{' '}
            <Link href="/login" className="text-mocha hover:text-cream font-semibold transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Illustration */}
      <div className="hidden lg:flex w-1/2 relative bg-espresso-dark items-center justify-center overflow-hidden border-l border-mocha/30 order-1 lg:order-2">
        <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none"></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/images/auth-bg.png" 
          alt="Tech Illustration" 
          className="w-full h-full object-cover object-center opacity-80"
        />
        <div className="absolute bottom-12 right-12 z-20 max-w-md text-right">
          <h2 className="text-4xl font-extrabold text-cream mb-4 tracking-tight">Scale with Confidence.</h2>
          <p className="text-cream/70 text-lg">Join thousands of engineering teams who sleep peacefully knowing we are on guard.</p>
        </div>
      </div>

    </div>
  );
}
