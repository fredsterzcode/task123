import { createClient } from '@supabase/supabase-js';
import { platform, hostname } from 'os';

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate unique device ID
const getDeviceId = (): string => {
  // Use a simple but unique device ID based on hostname and timestamp
  return `${hostname()}-${Date.now()}`;
};

// Get device name
const getDeviceName = (): string => {
  return `${hostname()} (${platform()})`;
};

export class AuthService {
  private deviceId: string;
  private deviceName: string;
  private platform: string;

  constructor() {
    this.deviceId = getDeviceId();
    this.deviceName = getDeviceName();
    this.platform = platform();
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Register device with backend
        const deviceResult = await this.registerDevice(data.user.id);
        if (!deviceResult.success) {
          return { success: false, error: deviceResult.error };
        }

        // Activate session (terminate other sessions)
        const sessionResult = await this.activateSession(data.user.id);
        if (!sessionResult.success) {
          return { success: false, error: sessionResult.error };
        }

        return { success: true };
      }

      return { success: false, error: 'Authentication failed' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }

  private async registerDevice(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://realcheck-backend.vercel.app/api/auth/device/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          userId,
          deviceId: this.deviceId,
          deviceName: this.deviceName,
          platform: this.platform
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      console.error('Device registration error:', error);
      return { success: false, error: 'Failed to register device' };
    }
  }

  private async activateSession(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://realcheck-backend.vercel.app/api/auth/session/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          userId,
          deviceId: this.deviceId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      console.error('Session activation error:', error);
      return { success: false, error: 'Failed to activate session' };
    }
  }

  async checkDeviceAuthorization(userId: string): Promise<{ success: boolean; isAuthorized: boolean; error?: string }> {
    try {
      const response = await fetch(`https://realcheck-backend.vercel.app/api/auth/device/check/${userId}/${this.deviceId}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, isAuthorized: false, error: result.error };
      }

      return { success: true, isAuthorized: result.isAuthorized };
    } catch (error) {
      console.error('Device authorization check error:', error);
      return { success: false, isAuthorized: false, error: 'Failed to check device authorization' };
    }
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  getDeviceName(): string {
    return this.deviceName;
  }
} 