"use client";
import Sidebar from '../../components/Sidebar';
import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase';

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-400',
  dnd: 'bg-red-600',
  offline: 'bg-gray-400',
};

function StatusDot({ status }: { status: string }) {
  return <span className={`inline-block w-3 h-3 rounded-full mr-2 align-middle ${statusColors[status] || 'bg-gray-300'}`}></span>;
}

export default function FriendsPage() {
  const [tab, setTab] = useState<'friends' | 'incoming' | 'sent'>('friends');
  const [friends, setFriends] = useState<any[]>([]);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, string>>({});
  const [incoming, setIncoming] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, [supabase.auth]);

  // Helper to fetch all data
  const fetchAll = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch friends
      const res = await fetch(`/api/friends?userId=${userId}`);
      const data = await res.json();
      setFriends(data.friends || []);
      // Fetch presence for each friend
      if (data.friends && data.friends.length > 0) {
        const statusArr = await Promise.all(
          data.friends.map((f: any) =>
            fetch(`/api/presence/${f.friend_id}`)
              .then(res => res.json())
              .then(pres => ({ id: f.friend_id, status: pres.presence?.status || 'offline' }))
              .catch(() => ({ id: f.friend_id, status: 'offline' }))
          )
        );
        const statusMap: Record<string, string> = {};
        statusArr.forEach(s => { statusMap[s.id] = s.status; });
        setFriendStatuses(statusMap);
      }
      // Fetch friend requests
      const reqRes = await fetch(`/api/friend-requests?userId=${userId}`);
      const reqData = await reqRes.json();
      const incomingReqs = (reqData.requests || []).filter((r: any) => r.receiver_id === userId);
      const sentReqs = (reqData.requests || []).filter((r: any) => r.sender_id === userId);
      setIncoming(incomingReqs);
      setSent(sentReqs);
    } catch {
      setError('Failed to load friends or requests');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) return;
    fetchAll();
    // Subscribe to friends table
    const friendsSub = supabase.channel('friends-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends', filter: `user_id=eq.${userId}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends', filter: `friend_id=eq.${userId}` }, fetchAll)
      .subscribe();
    // Subscribe to friend_requests table
    const requestsSub = supabase.channel('friend-requests-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `sender_id=eq.${userId}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `receiver_id=eq.${userId}` }, fetchAll)
      .subscribe();
    return () => {
      supabase.removeChannel(friendsSub);
      supabase.removeChannel(requestsSub);
    };
  }, [userId]);

  const handleAccept = async (requestId: string) => {
    if (!userId) return;
    await fetch('/api/friend-requests/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, requestId })
    });
    // No reload needed, realtime will update
  };
  const handleDecline = async (requestId: string) => {
    if (!userId) return;
    await fetch('/api/friend-requests/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, requestId })
    });
  };
  const handleRemove = async (friendId: string) => {
    if (!userId) return;
    await fetch(`/api/friends/${friendId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  };
  const handleCancel = async (requestId: string) => {
    if (!userId) return;
    await fetch(`/api/friend-requests/${requestId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">Friends & Friend Requests</h1>
        <div className="flex space-x-2 mb-6">
          <button className={`px-4 py-2 rounded-t-lg font-medium focus:outline-none transition-colors ${tab === 'friends' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}`} onClick={() => setTab('friends')}>Friends</button>
          <button className={`px-4 py-2 rounded-t-lg font-medium focus:outline-none transition-colors ${tab === 'incoming' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}`} onClick={() => setTab('incoming')}>Incoming Requests</button>
          <button className={`px-4 py-2 rounded-t-lg font-medium focus:outline-none transition-colors ${tab === 'sent' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}`} onClick={() => setTab('sent')}>Sent Requests</button>
        </div>
        <div className="bg-white rounded-lg shadow p-6 min-h-[300px]">
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : tab === 'friends' ? (
            friends.length === 0 ? (
              <p className="text-gray-600">You have no friends yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {friends.map((f) => (
                  <li key={f.friend_id} className="flex items-center justify-between py-3">
                    <span className="font-medium text-gray-800 flex items-center">
                      <StatusDot status={friendStatuses[f.friend_id] || 'offline'} />
                      {f.friend_id}
                    </span>
                    <button
                      onClick={() => handleRemove(f.friend_id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : tab === 'incoming' ? (
            incoming.length === 0 ? (
              <p className="text-gray-600">No incoming friend requests.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {incoming.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-3">
                    <span className="font-medium text-gray-800">{r.sender_id}</span>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleAccept(r.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecline(r.id)}
                        className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400 text-sm"
                      >
                        Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : tab === 'sent' ? (
            sent.length === 0 ? (
              <p className="text-gray-600">No sent friend requests.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {sent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-3">
                    <span className="font-medium text-gray-800">{r.receiver_id}</span>
                    <button
                      onClick={() => handleCancel(r.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Cancel
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>
        <div className="mt-6">
          <a
            href="/dashboard/search"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Add Friend
          </a>
        </div>
      </main>
    </div>
  );
} 