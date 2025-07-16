'use client'

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';

export default function DevicesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const fetchDevices = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/devices?userId=${user.id}`, {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });
        const result = await res.json();
        if (res.ok) {
          setDevices(result.devices);
        } else {
          setError(result.error || 'Failed to fetch devices');
        }
      } catch (e) {
        setError('Failed to fetch devices');
      }
      setLoading(false);
    };
    fetchDevices();
  }, [supabase.auth]);

  const handleRemove = async (deviceId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        setDevices(devices.filter(d => d.id !== deviceId));
      } else {
        const result = await res.json();
        setError(result.error || 'Failed to remove device');
      }
    } catch (e) {
      setError('Failed to remove device');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  if (!user) {
    return (
      <div className="p-8 text-center">
        <p>Please <Link href="/auth/login" className="text-blue-600 underline">sign in</Link> to view your devices.</p>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">My Devices</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <table className="w-full border rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Device Name</th>
            <th className="p-2 text-left">Platform</th>
            <th className="p-2 text-left">Last Login</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {devices.map(device => (
            <tr key={device.id} className="border-b">
              <td className="p-2">{device.device_name}</td>
              <td className="p-2">{device.platform}</td>
              <td className="p-2">{new Date(device.last_login).toLocaleString()}</td>
              <td className="p-2">
                <button
                  onClick={() => handleRemove(device.id)}
                  className="text-red-600 hover:underline"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 