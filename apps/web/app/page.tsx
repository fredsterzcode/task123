'use client'

import { useState } from 'react';

export default function Home() {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSubmitted(false);
    
    try {
      const response = await fetch('https://realcheck-backend.vercel.app/api/invites/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          company: '',
          role: '',
          useCase: ''
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSubmitted(true);
        setEmail('');
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Hero Section */}
      <header className="w-full px-4 pt-8 pb-12 flex flex-col items-center text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
            RealCheck
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-6 font-medium">
            <span className="bg-yellow-200 px-2 py-1 rounded">Invite Only</span> &mdash; AI-Powered Interview & Exam Monitoring
          </p>
          <p className="text-lg text-gray-600 mb-8">
            Prevent cheating, ensure fairness, and protect your reputation with real-time AI detection for live video interviews and assessments.
          </p>
          <button
            className="inline-block px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition text-lg"
            onClick={() => setShowRequestModal(true)}
          >
            Request Access
          </button>
        </div>
      </header>

      {/* Value Props */}
      <section className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center">
          <div className="bg-blue-100 rounded-full p-3 mb-4">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="font-bold text-lg mb-2">AI & Cheating Detection</h3>
          <p className="text-gray-600">Detects AI tools, multiple people, phones, and suspicious behavior in real time.</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center">
          <div className="bg-green-100 rounded-full p-3 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="font-bold text-lg mb-2">Seamless Video Experience</h3>
          <p className="text-gray-600">Crystal-clear video calls with built-in monitoring, alerts, and session recording.</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center">
          <div className="bg-yellow-100 rounded-full p-3 mb-4">
            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
          </div>
          <h3 className="font-bold text-lg mb-2">Privacy & Security</h3>
          <p className="text-gray-600">All data is encrypted, monitoring is transparent, and privacy is our top priority.</p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Trusted by forward-thinking teams</h2>
        <div className="flex flex-wrap justify-center gap-6 items-center">
          <span className="text-gray-500 text-lg font-semibold">Acme Corp</span>
          <span className="text-gray-500 text-lg font-semibold">NextGen Talent</span>
          <span className="text-gray-500 text-lg font-semibold">EduProctor</span>
          <span className="text-gray-500 text-lg font-semibold">RemoteHire</span>
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center text-center">
          <div className="bg-indigo-100 rounded-full p-3 mb-4">
            <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
          </div>
          <h3 className="font-bold text-lg mb-2">Request Access</h3>
          <p className="text-gray-600">Apply to join the RealCheck platform. We review every request for quality and security.</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="bg-indigo-100 rounded-full p-3 mb-4">
            <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 01-8 0" /></svg>
          </div>
          <h3 className="font-bold text-lg mb-2">Get Your Invite</h3>
          <p className="text-gray-600">If approved, you’ll receive an invite link to create your account and get started.</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="bg-indigo-100 rounded-full p-3 mb-4">
            <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9" /></svg>
          </div>
          <h3 className="font-bold text-lg mb-2">Start Monitoring</h3>
          <p className="text-gray-600">Run secure interviews and exams with AI-powered monitoring and real-time alerts.</p>
        </div>
      </section>

      {/* Request Access Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowRequestModal(false)}
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Request Access</h3>
            <p className="text-gray-600 mb-4">Enter your work email to request an invite. We’ll review and get back to you soon.</p>
            <form onSubmit={handleRequestAccess} className="space-y-4">
              <input
                type="email"
                required
                placeholder="you@company.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading || submitted}
              />
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                disabled={loading || submitted}
              >
                {loading ? 'Requesting...' : submitted ? 'Requested!' : 'Request Access'}
              </button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {submitted && <p className="text-green-600 text-sm">Request received! We’ll be in touch soon.</p>}
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} RealCheck. All rights reserved. &middot; <a href="#" className="underline">Contact</a> &middot; <a href="#" className="underline">Privacy</a>
      </footer>
    </div>
  );
}
