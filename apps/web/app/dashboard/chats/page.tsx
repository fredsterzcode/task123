"use client";
import Sidebar from '../../components/Sidebar';
import { useEffect, useState } from 'react';

function ChatSidebar({ chats, selectedChatId, onSelect }: { chats: any[]; selectedChatId: string | null; onSelect: (id: string) => void }) {
  return (
    <aside className="w-64 bg-gray-900 text-white h-full flex flex-col border-r border-gray-800">
      <div className="p-4 font-bold text-lg">Chats</div>
      <nav className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="text-gray-400 px-4">No chats yet.</div>
        ) : (
          <ul>
            {chats.map((chat) => (
              <li key={chat.id}>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors ${selectedChatId === chat.id ? 'bg-blue-700' : ''}`}
                  onClick={() => onSelect(chat.id)}
                >
                  {chat.name || `Chat ${chat.id}`}
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <a href="/dashboard/search" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors">Start New Chat</a>
      </div>
    </aside>
  );
}

export default function ChatsPage() {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    if (!userId) return;
    setLoadingChats(true);
    fetch(`/api/chats?userId=${userId}`)
      .then(res => res.json())
      .then(data => setChats(data.chats || []))
      .catch(() => setError('Failed to load chats'))
      .finally(() => setLoadingChats(false));
  }, [userId]);

  useEffect(() => {
    if (!selectedChatId) return;
    setLoadingMessages(true);
    fetch(`/api/chats/${selectedChatId}/messages`)
      .then(res => res.json())
      .then(data => setMessages(data.messages || []))
      .catch(() => setError('Failed to load messages'))
      .finally(() => setLoadingMessages(false));
  }, [selectedChatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedChatId || !userId) return;
    await fetch(`/api/chats/${selectedChatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, content: message })
    });
    setMessage('');
    // Refresh messages
    fetch(`/api/chats/${selectedChatId}/messages`)
      .then(res => res.json())
      .then(data => setMessages(data.messages || []));
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <ChatSidebar chats={chats} selectedChatId={selectedChatId} onSelect={setSelectedChatId} />
      <main className="flex-1 flex flex-col">
        {!selectedChatId ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat to start messaging.
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-8 bg-white rounded-lg shadow mb-2">
              {loadingMessages ? (
                <p className="text-gray-500">Loading messages...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : messages.length === 0 ? (
                <p className="text-gray-600">No messages yet.</p>
              ) : (
                <ul className="space-y-4">
                  {messages.map((msg) => (
                    <li key={msg.id} className="">
                      <div className="font-semibold text-blue-700">{msg.sender_id}</div>
                      <div className="text-gray-800">{msg.content}</div>
                      <div className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <form onSubmit={handleSend} className="flex p-4 bg-gray-50 border-t border-gray-200">
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-r-lg font-medium hover:bg-blue-700 transition-colors"
                disabled={!message.trim()}
              >
                Send
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
} 