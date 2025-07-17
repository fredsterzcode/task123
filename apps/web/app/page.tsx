'use client'

export default function Home() {
  return (
    <>
      <section className="text-center py-16">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          RealCheck Pro
        </h1>
        <p className="text-2xl text-gray-700 mb-8">
          <span className="bg-yellow-200 px-3 py-1 rounded-lg">Invite Only</span> — AI-Powered Interview & Exam Monitoring
        </p>
        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
          Prevent cheating, ensure fairness, and protect your reputation with real-time AI detection for live video interviews and assessments.
        </p>
      </section>
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">AI & Cheating Detection</h3>
            <p className="text-gray-600">Detects AI tools, multiple people, phones, and suspicious behavior in real time.</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Seamless Video Experience</h3>
            <p className="text-gray-600">Crystal-clear video calls with built-in monitoring, alerts, and session recording.</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Privacy & Security</h3>
            <p className="text-gray-600">All data is encrypted, monitoring is transparent, and privacy is our top priority.</p>
          </div>
        </div>
      </section>
    </>
  )
} 