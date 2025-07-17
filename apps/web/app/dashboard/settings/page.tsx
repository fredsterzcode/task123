"use client";
import Sidebar from '../../components/Sidebar';
import { useEffect, useState } from 'react';

const statusOptions = [
  { value: 'online', label: 'Online', color: 'bg-green-500' },
  { value: 'away', label: 'Away', color: 'bg-yellow-400' },
  { value: 'dnd', label: 'Do Not Disturb', color: 'bg-red-600' },
  { value: 'offline', label: 'Offline', color: 'bg-gray-400' },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('online');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/profiles/${userId}`).then(res => res.json()),
      fetch(`/api/presence/${userId}`).then(res => res.json())
    ])
      .then(([profileData, presenceData]) => {
        setProfile(profileData.profile || {});
        setUsername(profileData.profile?.username || '');
        setName(profileData.profile?.name || '');
        setStatus(presenceData.presence?.status || 'online');
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    // Save profile
    const res = await fetch(`/api/profiles/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, name })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to update profile');
      setSaving(false);
      return;
    }
    // Save presence
    await fetch('/api/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status })
    });
    setSuccess('Profile updated!');
    setSaving(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">Settings & Profile</h1>
        <div className="bg-white rounded-lg shadow p-6 max-w-lg">
          {loading ? (
            <p className="text-gray-500">Loading profile...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">{success}</div>}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="flex space-x-4">
                  {statusOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className={`flex items-center px-3 py-2 rounded-lg font-medium border transition-colors focus:outline-none ${
                        status === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-100'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full mr-2 ${opt.color}`}></span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
} 