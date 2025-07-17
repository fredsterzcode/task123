"use client";
import Sidebar from '../../components/Sidebar';
import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [friends, setFriends] = useState<string[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, [supabase.auth]);

  // Fetch friends and friend requests on mount
  useEffect(() => {
    const fetchRelations = async () => {
      if (!userId) return;
      // Fetch friends
      const friendsRes = await fetch(`/api/friends?userId=${userId}`);
      const friendsData = await friendsRes.json();
      setFriends((friendsData.friends || []).map((f: any) => f.friend_id));
      // Fetch friend requests
      const reqRes = await fetch(`/api/friend-requests?userId=${userId}`);
      const reqData = await reqRes.json();
      setSentRequests((reqData.requests || []).filter((r: any) => r.sender_id === userId).map((r: any) => r.receiver_id));
      setReceivedRequests((reqData.requests || []).filter((r: any) => r.receiver_id === userId).map((r: any) => r.sender_id));
    };
    fetchRelations();
  }, [userId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResults([]);
    const res = await fetch(`/api/user-search?username=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Search failed');
    } else {
      setResults(data.users || []);
    }
    setLoading(false);
  };

  const handleSendRequest = async (receiverId: string) => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    const res = await fetch('/api/friend-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, receiverId })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to send friend request');
    } else {
      setSuccess('Friend request sent!');
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">User Search</h1>
        <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-6">
          <input
            type="text"
            placeholder="Search by username..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">{success}</div>}
        <div className="bg-white rounded-lg shadow p-6">
          {results.length === 0 ? (
            <p className="text-gray-600">No users found. Try searching for a different username.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {results.map((user) => (
                <li key={user.id} className="flex items-center justify-between py-3">
                  <div>
                    <span className="font-medium text-gray-800">{user.username}</span>
                    {user.name && <span className="ml-2 text-gray-500 text-sm">({user.name})</span>}
                  </div>
                  <button
                    onClick={() => handleSendRequest(user.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm disabled:opacity-50"
                    disabled={
                      user.id === userId ||
                      friends.includes(user.id) ||
                      sentRequests.includes(user.id) ||
                      receivedRequests.includes(user.id)
                    }
                  >
                    {user.id === userId
                      ? 'You'
                      : friends.includes(user.id)
                        ? 'Already Friends'
                        : sentRequests.includes(user.id)
                          ? 'Request Sent'
                          : receivedRequests.includes(user.id)
                            ? 'Request Received'
                            : 'Add Friend'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
} 