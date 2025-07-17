"use client";
import Sidebar from '../../components/Sidebar';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '../../../lib/supabase';

function playCallNotificationSound() {
  const audio = new Audio('/call-notification.mp3');
  audio.play();
}

function UserAvatar({ user }: { user: any }) {
  if (user.avatar_url) {
    return <img src={user.avatar_url} alt={user.username || user.name} className="w-8 h-8 rounded-full object-cover" />;
  }
  const initials = user.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : (user.username || '?')[0].toUpperCase();
  return <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">{initials}</div>;
}

// --- WebRTC helpers ---
const RTC_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function CallsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [chatId, setChatId] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();
  const [micAvailable, setMicAvailable] = useState<boolean | null>(null);
  const [camAvailable, setCamAvailable] = useState<boolean | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [participants, setParticipants] = useState<Record<string, any[]>>({}); // callId -> users
  const [peerStreams, setPeerStreams] = useState<Record<string, MediaStream>>({}); // userId -> MediaStream
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const signalingChannel = useRef<any>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [inCall, setInCall] = useState(true);

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

  // Device/media detection
  useEffect(() => {
    async function detectDevices() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setMediaStream(stream);
        setMicAvailable(stream.getAudioTracks().length > 0);
        setCamAvailable(stream.getVideoTracks().length > 0);
        setMediaError(null);
      } catch (err: any) {
        setMediaError('Could not access microphone/camera. Please check permissions.');
        setMicAvailable(false);
        setCamAvailable(false);
      }
    }
    detectDevices();
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach video stream to video element
  useEffect(() => {
    if (videoRef.current && mediaStream && camAvailable) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, camAvailable]);

  // Mute/unmute microphone
  const handleToggleMute = () => {
    if (!mediaStream) return;
    mediaStream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
      setMicMuted(!track.enabled);
    });
  };

  // Toggle camera on/off
  const handleToggleCamera = () => {
    if (!mediaStream) return;
    mediaStream.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setCameraOn(prev => !prev);
  };

  // End call: clean up all connections and streams
  const handleEndCall = () => {
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    setPeerStreams({});
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    setInCall(false);
  };

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

  // Fetch participants for a call
  const fetchParticipants = async (callId: string) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(`/api/group-calls/${callId}/participants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setParticipants(prev => ({ ...prev, [callId]: data.participants || [] }));
    } catch {
      setParticipants(prev => ({ ...prev, [callId]: [] }));
    }
  };

  // Fetch participants for all calls when calls change
  useEffect(() => {
    if (!calls.length) return;
    calls.forEach(call => fetchParticipants(call.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calls.length]);

  // Subscribe to call_participants changes for real-time updates
  useEffect(() => {
    if (!userId) return;
    const sub = supabase.channel('call-participants-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_participants' }, (payload) => {
        // Refetch participants for the affected call
        const callId = (payload.new && (payload.new as any).call_id) || (payload.old && (payload.old as any).call_id);
        if (callId) fetchParticipants(callId);
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // --- WebRTC signaling logic ---
  // Listen for signaling messages
  useEffect(() => {
    if (!userId) return;
    if (!signalingChannel.current) {
      signalingChannel.current = supabase.channel('webrtc-signaling')
        .on('broadcast', { event: 'signal' }, async (payload) => {
          const { from, to, type, data } = payload.payload;
          if (to !== userId) return;
          if (!peerConnections.current[from]) {
            // Create peer connection if not exists
            peerConnections.current[from] = createPeerConnection(from);
          }
          const pc = peerConnections.current[from];
          if (type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal(from, 'answer', answer);
          } else if (type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data));
          } else if (type === 'ice') {
            try { await pc.addIceCandidate(new RTCIceCandidate(data)); } catch {}
          }
        })
        .subscribe();
    }
    return () => {
      if (signalingChannel.current) supabase.removeChannel(signalingChannel.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Helper to send signaling messages
  const sendSignal = (to: string, type: string, data: any) => {
    supabase.channel('webrtc-signaling').send({
      type: 'broadcast',
      event: 'signal',
      payload: { from: userId, to, type, data }
    });
  };

  // Create a peer connection for a given user
  const createPeerConnection = (peerId: string) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => pc.addTrack(track, mediaStream));
    }
    pc.onicecandidate = (event) => {
      if (event.candidate) sendSignal(peerId, 'ice', event.candidate);
    };
    pc.ontrack = (event) => {
      if (event.streams[0]) {
        setPeerStreams(prev => ({ ...prev, [peerId]: event.streams[0] }));
      }
    };
    return pc;
  };

  // When joining a call, initiate connections to all other participants
  useEffect(() => {
    if (!userId || !mediaStream) return;
    // For each participant (except self), create a connection and send offer
    Object.keys(participants).forEach(callId => {
      (participants[callId] || []).forEach((user: any) => {
        if (user.id === userId) return;
        if (!peerConnections.current[user.id]) {
          const pc = createPeerConnection(user.id);
          peerConnections.current[user.id] = pc;
          pc.createOffer().then(offer => {
            pc.setLocalDescription(offer);
            sendSignal(user.id, 'offer', offer);
          });
        }
      });
    });
    // Cleanup on leave
    return () => {
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      setPeerStreams({});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(participants), mediaStream, userId]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">Group Calls</h1>
        {/* Device/media status */}
        <div className="mb-4">
          {mediaError ? (
            <div className="text-red-600 font-medium">{mediaError}</div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
              <span className="text-gray-700">Microphone: {micAvailable === null ? 'Detecting...' : micAvailable ? 'Detected' : 'Not found'}</span>
              <span className="text-gray-700">Camera: {camAvailable === null ? 'Detecting...' : camAvailable ? 'Detected' : 'Not found'}</span>
              {micAvailable && (
                <button
                  onClick={handleToggleMute}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${micMuted ? 'bg-red-500 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  {micMuted ? 'Unmute Mic' : 'Mute Mic'}
                </button>
              )}
            </div>
          )}
        </div>
        {/* Camera preview */}
        <div className="mb-6">
          {camAvailable && mediaStream ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-48 h-36 bg-black rounded shadow border border-gray-300"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="w-48 h-36 flex items-center justify-center bg-gray-200 rounded border border-gray-300 text-gray-500">
              {camAvailable === false ? 'No camera found' : 'Camera preview unavailable'}
            </div>
          )}
        </div>
        {/* Participant list */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Participants</h2>
          {calls.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded p-4 text-gray-500">(No calls yet)</div>
          ) : (
            calls.map(call => (
              <div key={call.id} className="mb-2">
                <div className="font-medium text-gray-700 mb-1">Call {call.id}</div>
                <div className="flex flex-wrap gap-2">
                  {(participants[call.id] || []).length === 0 ? (
                    <span className="text-gray-400 text-sm">No participants</span>
                  ) : (
                    participants[call.id].map((user: any) => (
                      <div key={user.id} className="flex items-center space-x-2 bg-white border rounded px-2 py-1 shadow-sm">
                        <UserAvatar user={user} />
                        <span className="text-gray-800 text-sm">{user.name || user.username || user.id}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
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
        {/* Call controls */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={handleToggleMute}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${micMuted ? 'bg-red-500 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}
          >
            {micMuted ? 'Unmute Mic' : 'Mute Mic'}
          </button>
          <button
            onClick={handleToggleCamera}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${cameraOn ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-500 text-white'}`}
          >
            {cameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
          </button>
          <button
            onClick={handleEndCall}
            className="px-3 py-1 rounded text-sm font-medium bg-gray-700 text-white hover:bg-gray-900"
          >
            End Call
          </button>
        </div>
        {/* Video tiles for all streams */}
        {inCall ? (
        <div className="mb-6 flex flex-wrap gap-4">
          {/* Local video */}
          <div className="relative">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <UserAvatar user={{ name: 'You' }} /> You
              <span className={`ml-2 text-xs ${micMuted ? 'text-red-500' : 'text-green-600'}`}>{micMuted ? 'Muted' : 'Mic On'}</span>
              <span className={`ml-2 text-xs ${cameraOn ? 'text-green-600' : 'text-red-500'}`}>{cameraOn ? 'Camera On' : 'Camera Off'}</span>
            </div>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-48 h-36 bg-black rounded shadow border border-gray-300 ${!cameraOn ? 'opacity-40 grayscale' : ''}`}
              style={{ objectFit: 'cover' }}
            />
            {!cameraOn && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-lg font-bold bg-black bg-opacity-40">Camera Off</div>
            )}
          </div>
          {/* Remote videos */}
          {Object.entries(peerStreams).map(([peerId, stream]) => (
            <div key={peerId} className="relative">
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <UserAvatar user={(participants && Object.values(participants).flat().find((u: any) => u.id === peerId)) || { name: peerId }} />
                {(participants && Object.values(participants).flat().find((u: any) => u.id === peerId)?.name) || peerId}
                {/* TODO: Show remote mute/camera status if signaled */}
              </div>
              <video
                autoPlay
                playsInline
                className="w-48 h-36 bg-black rounded shadow border border-gray-300"
                style={{ objectFit: 'cover' }}
                ref={el => { if (el && stream instanceof MediaStream) el.srcObject = stream; }}
              />
            </div>
          ))}
        </div>
        ) : (
          <div className="mb-6 text-center text-gray-500 font-medium">You have left the call.</div>
        )}
      </main>
    </div>
  );
} 