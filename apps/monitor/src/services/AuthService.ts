import axios from 'axios';
import { ConfigService } from './ConfigService';
import os from 'os';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}

export class AuthService {
  private configService: ConfigService;
  private authToken: string | null = null;
  private user: any = null;
  private deviceId: string;
  private deviceName: string;
  private platform: string;

  constructor() {
    this.configService = new ConfigService();
    this.deviceId = `${os.hostname()}-${os.platform()}-${os.userInfo().username}`;
    this.deviceName = os.hostname();
    this.platform = os.platform();
  }

  async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      const config = await this.configService.getConfig();
      const response = await axios.post<AuthResponse>(`${config.backendUrl}/api/auth/login`, credentials);
      if (response.data.token) {
        this.authToken = response.data.token;
        this.user = response.data.user;
        await this.configService.setAuthToken(this.authToken);
        await this.configService.setUser(this.user);
        // Register device
        const regRes = await axios.post(`${config.backendUrl}/api/auth/device/register`, {
          userId: this.user.id,
          deviceId: this.deviceId,
          deviceName: this.deviceName,
          platform: this.platform
        }, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });
        if (!regRes.data.success) {
          throw new Error(regRes.data.error || 'Device registration failed');
        }
        // Activate session (deactivate other devices)
        const actRes = await axios.post(`${config.backendUrl}/api/auth/session/activate`, {
          userId: this.user.id,
          deviceId: this.deviceId
        }, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });
        if (!actRes.data.success) {
          throw new Error(actRes.data.error || 'Session activation failed');
        }
        // Check device authorization
        const checkRes = await axios.get(`${config.backendUrl}/api/auth/device/check/${this.user.id}/${this.deviceId}`, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });
        if (!checkRes.data.isAuthorized) {
          throw new Error('This device is not authorized for monitoring.');
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      const config = await this.configService.getConfig();
      
      if (this.authToken) {
        // Notify backend of logout
        await axios.post(`${config.backendUrl}/api/auth/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local auth data
      this.authToken = null;
      this.user = null;
      await this.configService.clearAuth();
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      // Check if we have stored auth data
      const storedToken = await this.configService.getAuthToken();
      const storedUser = await this.configService.getUser();
      
      if (!storedToken || !storedUser) {
        return false;
      }

      // Validate token with backend
      const config = await this.configService.getConfig();
      const response = await axios.get(`${config.backendUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });

      if (response.status === 200) {
        this.authToken = storedToken;
        this.user = storedUser;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Auth validation failed:', error);
      return false;
    }
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  getUser(): any {
    return this.user;
  }
} 