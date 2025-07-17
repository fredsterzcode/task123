import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "RealCheck - AI-Powered Interview Monitoring",
  description: "Monitor live video calls and detect AI-assisted behavior in real-time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={Inter({ subsets: ["latin"] }).className + " bg-gray-50 min-h-screen"}>
        <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">R</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">RealCheck</span>
              </Link>
              <div className="flex items-center space-x-4">
                {/* Auth logic will be handled in client component below */}
                <NavActions />
              </div>
            </div>
          </div>
        </nav>
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-96px)] px-4">
          <div className="w-full max-w-5xl mx-auto py-12">
            {children}
          </div>
        </main>
        <footer className="bg-white border-t border-gray-200 py-8">
          <div className="max-w-4xl mx-auto px-4 text-center text-gray-600">
            <p>&copy; 2024 RealCheck. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

// Client component for auth actions in nav
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

function NavActions() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  if (loading) return null;
  if (user) {
    return (
      <>
        <Link
          href="/download"
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Download Monitor
        </Link>
        <span className="text-sm text-gray-600">{user.email}</span>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Sign Out
        </button>
      </>
    );
  }
  return (
    <>
      <Link
        href="/auth/login"
        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Sign In
      </Link>
      <Link
        href="/auth/register"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Get Started
      </Link>
    </>
  );
}
