import Sidebar from '../components/Sidebar';

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">Welcome to RealCheck</h1>
        <p className="text-lg text-gray-700 mb-4">
          This is your dashboard. Use the sidebar to access friends, chats, calls, search, and settings.
        </p>
        {/* Feature widgets or quick links can go here */}
      </main>
    </div>
  );
} 