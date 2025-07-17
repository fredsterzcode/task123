'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Friends', href: '/dashboard/friends' },
  { name: 'Chats', href: '/dashboard/chats' },
  { name: 'Calls', href: '/dashboard/calls' },
  { name: 'Search', href: '/dashboard/search' },
  { name: 'Settings', href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="h-full w-64 bg-gray-900 text-white flex flex-col py-6 px-2 border-r border-gray-800">
      <div className="flex items-center mb-8 px-4">
        <span className="text-2xl font-bold tracking-tight">RealCheck</span>
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
              pathname === item.href
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-800 hover:text-blue-400 text-gray-200'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
} 