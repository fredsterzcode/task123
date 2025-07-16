import Store from 'electron-store';

interface AppConfig {
  backendUrl: string;
  authToken?: string;
  user?: any;
  monitoringEnabled: boolean;
  checkInterval: number;
}

export class ConfigService {
  private store: Store<AppConfig>;

  constructor() {
    this.store = new Store<AppConfig>({
      defaults: {
        backendUrl: 'https://realcheck-backend.vercel.app',
        monitoringEnabled: true,
        checkInterval: 5000
      }
    });
  }

  async getConfig(): Promise<AppConfig> {
    return this.store.store;
  }

  async setConfig(config: Partial<AppConfig>): Promise<void> {
    this.store.set(config);
  }

  async getAuthToken(): Promise<string | undefined> {
    return this.store.get('authToken');
  }

  async setAuthToken(token: string): Promise<void> {
    this.store.set('authToken', token);
  }

  async getUser(): Promise<any> {
    return this.store.get('user');
  }

  async setUser(user: any): Promise<void> {
    this.store.set('user', user);
  }

  async clearAuth(): Promise<void> {
    this.store.delete('authToken');
    this.store.delete('user');
  }

  async isMonitoringEnabled(): Promise<boolean> {
    return this.store.get('monitoringEnabled', true);
  }

  async setMonitoringEnabled(enabled: boolean): Promise<void> {
    this.store.set('monitoringEnabled', enabled);
  }

  async getCheckInterval(): Promise<number> {
    return this.store.get('checkInterval', 5000);
  }

  async setCheckInterval(interval: number): Promise<void> {
    this.store.set('checkInterval', interval);
  }
} 