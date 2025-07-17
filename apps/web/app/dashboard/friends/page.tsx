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

function UserAvatar({ username }: { username: string | undefined }) {
  const color = 'bg-blue-500';
  const initial = (username?.[0] ?? '?').toUpperCase();
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${color} text-white font-bold mr-2`}>
      {initial}
    </span>
  );
}

function playFriendRequestSound() {
  const audio = new Audio('/friend-request.mp3');
  audio.play();
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
  const [userMap, setUserMap] = useState<Record<string, { username: string; name?: string }>>({});
  const supabase = createClient();
  const [prevIncomingCount, setPrevIncomingCount] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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
      // Collect all user IDs to fetch
      const userIds = [
        ...incomingReqs.map((r: any) => r.sender_id),
        ...sentReqs.map((r: any) => r.receiver_id)
      ];
      // Remove duplicates
      const uniqueUserIds = Array.from(new Set(userIds));
      // Fetch user profiles in batch
      if (uniqueUserIds.length > 0) {
        const profileRes = await fetch(`/api/user-search?ids=${uniqueUserIds.join(',')}`);
        const profileData = await profileRes.json();
        // Map userId to username/name
        const map: Record<string, { username: string; name?: string }> = {};
        (profileData.users || []).forEach((u: any) => {
          map[u.id] = { username: u.username, name: u.name };
        });
        setUserMap(map);
      }
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

  // Play sound when a new incoming friend request is received
  useEffect(() => {
    if (incoming.length > prevIncomingCount) {
      playFriendRequestSound();
    }
    setPrevIncomingCount(incoming.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming.length]);

  const handleAccept = async (requestId: string) => {
    if (!userId) {
      setActionError('User ID missing. Please refresh and try again.');
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch('/api/friend-requests/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', userId, requestId })
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to accept request');
        console.error('Accept error:', data);
      } else {
        setActionSuccess('Friend request accepted!');
      }
    } catch (e) {
      setActionError('Network error. Please try again.');
      console.error('Accept network error:', e);
    }
  };
  const handleDecline = async (requestId: string) => {
    if (!userId) {
      setActionError('User ID missing. Please refresh and try again.');
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch('/api/friend-requests/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline', userId, requestId })
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to decline request');
        console.error('Decline error:', data);
      } else {
        setActionSuccess('Friend request declined.');
      }
    } catch (e) {
      setActionError('Network error. Please try again.');
      console.error('Decline network error:', e);
    }
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
          {actionError && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">{actionError}</div>}
          {actionSuccess && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">{actionSuccess}</div>}
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
                      <UserAvatar username={userMap?.[f.friend_id]?.username || f.friend_id} />
                      {userMap?.[f.friend_id]?.username || f.friend_id}
                      {userMap?.[f.friend_id]?.name ? (
                        <span className="ml-2 text-gray-500 text-sm">({userMap[f.friend_id]?.name})</span>
                      ) : null}
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
                    <span className="font-medium text-gray-800 flex items-center">
                      <UserAvatar username={userMap?.[r.sender_id]?.username || r.sender_id} />
                      {userMap?.[r.sender_id]?.username || r.sender_id}
                      {userMap?.[r.sender_id]?.name ? (
                        <span className="ml-2 text-gray-500 text-sm">({userMap[r.sender_id]?.name})</span>
                      ) : null}
                    </span>
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
                    <span className="font-medium text-gray-800 flex items-center">
                      <UserAvatar username={userMap?.[r.receiver_id]?.username || r.receiver_id} />
                      {userMap?.[r.receiver_id]?.username || r.receiver_id}
                      {userMap?.[r.receiver_id]?.name ? (
                        <span className="ml-2 text-gray-500 text-sm">({userMap[r.receiver_id]?.name})</span>
                      ) : null}
                    </span>
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