import axios from 'axios';
import { ConfigService } from './ConfigService';

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

  constructor() {
    this.configService = new ConfigService();
  }

  async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      const config = await this.configService.getConfig();
      
      const response = await axios.post<AuthResponse>(`${config.backendUrl}/api/auth/login`, credentials);
      
      if (response.data.token) {
        this.authToken = response.data.token;
        this.user = response.data.user;
        
        // Save auth data
        await this.configService.setAuthToken(this.authToken);
        await this.configService.setUser(this.user);
        
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