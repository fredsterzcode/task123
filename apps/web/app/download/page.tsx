'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'

export default function DownloadPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [platform, setPlatform] = useState<string>('')
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setUserId(user?.id || null);
      setLoading(false);
    });
    // Detect platform
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Win')) {
      setPlatform('windows');
    } else if (userAgent.includes('Mac')) {
      setPlatform('mac');
    } else {
      setPlatform('linux');
    }
  }, [supabase.auth]);

  const downloadLinks = {
    windows: {
      url: 'https://github.com/fredsterzcode/realcheck/releases/latest/download/RealCheck-Setup.exe',
      size: '45.2 MB',
      version: '1.0.0'
    },
    mac: {
      url: 'https://github.com/fredsterzcode/realcheck/releases/latest/download/RealCheck.dmg',
      size: '52.1 MB',
      version: '1.0.0'
    },
    linux: {
      url: 'https://github.com/fredsterzcode/realcheck/releases/latest/download/RealCheck.AppImage',
      size: '48.7 MB',
      version: '1.0.0'
    }
  }

  const handleDownload = async (platform: string) => {
    const link = downloadLinks[platform as keyof typeof downloadLinks]
    
    // Track download
    try {
      await fetch('https://realcheck-backend.vercel.app/api/analytics/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          platform,
          version: link.version,
          userId: userId
        })
      })
    } catch (error) {
      console.error('Failed to track download:', error)
    }

    // Start download
    window.open(link.url, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h1>
            <p className="text-gray-600 mb-8">Please sign in to download the RealCheck monitor.</p>
            <Link 
              href="/auth/login"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Download RealCheck Monitor</h1>
          <p className="text-xl text-gray-600 mb-8">
            Secure AI-powered monitoring for your interviews and assessments
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-800 font-medium">Welcome, {user.email}</span>
            </div>
          </div>
        </div>

        {/* Download Options */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-blue-50 rounded-2xl shadow-lg p-8 border border-green-200">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">RealCheck Monitor</h2>
            <span className="inline-block bg-green-200 text-green-800 text-xs font-semibold px-3 py-1 rounded-full mb-2">Latest Version</span>
            <p className="text-gray-700 mb-2">Download the official RealCheck Monitor app for your platform below.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Windows */}
          <div className={`bg-white rounded-xl shadow-lg border-2 p-6 ${platform === 'windows' ? 'border-blue-500' : 'border-gray-200'}`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M0 3.545L9.818 2.182v7.636H0V3.545zm9.818 0L19.636 1.818v7.636H9.818V3.545zm9.818 0L29.454 1.091v7.636h-9.818V3.545zM0 12.727L9.818 11.364v7.636H0v-6.273zm9.818 0L19.636 10v7.636H9.818v-6.273zm9.818 0L29.454 8.636v7.636h-9.818v-6.273zM0 21.909L9.818 20.545v2.455H0v-1.091zm9.818 0L19.636 19.182v2.455H9.818v-1.091zm9.818 0L29.454 17.818v2.455h-9.818v-1.091z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Windows</h3>
              <p className="text-gray-600 mb-4">Windows 10/11 (64-bit)</p>
              <div className="text-sm text-gray-500 mb-4">
                <p>Version {downloadLinks.windows.version}</p>
                <p>{downloadLinks.windows.size}</p>
              </div>
              <button
                onClick={() => handleDownload('windows')}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download for Windows
              </button>
            </div>
          </div>

          {/* macOS */}
          <div className={`bg-white rounded-xl shadow-lg border-2 p-6 ${platform === 'mac' ? 'border-blue-500' : 'border-gray-200'}`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">macOS</h3>
              <p className="text-gray-600 mb-4">macOS 10.15 or later</p>
              <div className="text-sm text-gray-500 mb-4">
                <p>Version {downloadLinks.mac.version}</p>
                <p>{downloadLinks.mac.size}</p>
              </div>
              <button
                onClick={() => handleDownload('mac')}
                className="w-full bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Download for macOS
              </button>
            </div>
          </div>

          {/* Linux */}
          <div className={`bg-white rounded-xl shadow-lg border-2 p-6 ${platform === 'linux' ? 'border-blue-500' : 'border-gray-200'}`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10S2 17.514 2 12 6.486 2 12 2zm0 3c-3.866 0-7 3.134-7 7s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7zm0 2c2.761 0 5 2.239 5 5s-2.239 5-5 5-5-2.239-5-5 2.239-5 5-5z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Linux</h3>
              <p className="text-gray-600 mb-4">Ubuntu 18.04+ / AppImage</p>
              <div className="text-sm text-gray-500 mb-4">
                <p>Version {downloadLinks.linux.version}</p>
                <p>{downloadLinks.linux.size}</p>
              </div>
              <button
                onClick={() => handleDownload('linux')}
                className="w-full bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Download for Linux
              </button>
            </div>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Installation Instructions</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Windows</h3>
              <ol className="text-sm text-gray-600 space-y-2">
                <li>1. Download the .exe file</li>
                <li>2. Run the installer as administrator</li>
                <li>3. Follow the installation wizard</li>
                <li>4. Launch RealCheck Monitor</li>
                <li>5. Sign in with your credentials</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">macOS</h3>
              <ol className="text-sm text-gray-600 space-y-2">
                <li>1. Download the .dmg file</li>
                <li>2. Open the .dmg file</li>
                <li>3. Drag RealCheck to Applications</li>
                <li>4. Launch from Applications</li>
                <li>5. Sign in with your credentials</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Linux</h3>
              <ol className="text-sm text-gray-600 space-y-2">
                <li>1. Download the .AppImage file</li>
                <li>2. Make it executable: chmod +x</li>
                <li>3. Run the AppImage</li>
                <li>4. Sign in with your credentials</li>
                <li>5. Monitor will start automatically</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Security & Privacy</h3>
              <p className="text-blue-800 text-sm">
                RealCheck Monitor is designed with your privacy and security in mind. The app only monitors for AI tools and suspicious behavior during authorized sessions. 
                All data is encrypted and transmitted securely to our servers. You can stop monitoring at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Need help? Contact our support team</p>
          <Link 
            href="/support"
            className="inline-block px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
          >
            Get Support
          </Link>
        </div>
      </div>
    </div>
  )
} 