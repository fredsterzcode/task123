"use client";
import Sidebar from '../../components/Sidebar';
import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase';

function playCallNotificationSound() {
  const audio = new Audio('/call-notification.mp3');
  audio.play();
}

export default function CallsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [chatId, setChatId] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, [supabase.auth]);

  // Helper to fetch calls
  const fetchCalls = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/group-calls?userId=${userId}`);
      const data = await res.json();
      setCalls(data.calls || []);
    } catch {
      setError('Failed to load group calls');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) return;
    fetchCalls();
    // Subscribe to group_calls table
    const callsSub = supabase.channel('group-calls-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_calls' }, (payload) => {
        fetchCalls();
        playCallNotificationSound();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(callsSub);
    };
  }, [userId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId || !userId) return;
    setCreating(true);
    await fetch('/api/group-calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, chatId })
    });
    setChatId('');
    setCreating(false);
    // No reload needed, realtime will update
  };

  const handleJoin = async (callId: string) => {
    await fetch(`/api/group-calls/${callId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    // No reload needed, realtime will update
  };

  const handleLeave = async (callId: string) => {
    await fetch(`/api/group-calls/${callId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    // No reload needed, realtime will update
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">Group Calls</h1>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleCreate} className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Enter chat ID to start a call"
              value={chatId}
              onChange={e => setChatId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Start Call'}
            </button>
          </form>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <p className="text-gray-500">Loading group calls...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : calls.length === 0 ? (
            <p className="text-gray-600">No group calls available.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {calls.map((call) => (
                <li key={call.id} className="flex items-center justify-between py-3">
                  <div>
                    <span className="font-medium text-gray-800">Call {call.id}</span>
                    <span className="ml-2 text-gray-500 text-sm">(Chat: {call.chat_id})</span>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleJoin(call.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                    >
                      Join
                    </button>
                    <button
                      onClick={() => handleLeave(call.id)}
                      className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400 text-sm"
                    >
                      Leave
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
} 