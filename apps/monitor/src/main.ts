import { app, BrowserWindow, ipcMain, dialog, session } from 'electron';
import * as path from 'path';
import { MonitorService } from './services/MonitorService';
import { AuthService } from './services/AuthService';
import { ConfigService } from './services/ConfigService';

class RealCheckMonitor {
  private mainWindow: BrowserWindow | null = null;
  private monitorService: MonitorService;
  private authService: AuthService;
  private configService: ConfigService;

  constructor() {
    this.monitorService = new MonitorService();
    this.authService = new AuthService();
    this.configService = new ConfigService();
  }

  async initialize() {
    // Check if user is authenticated
    const isAuthenticated = await this.authService.isAuthenticated();
    
    if (!isAuthenticated) {
      await this.showLoginWindow();
    } else {
      await this.showMainWindow();
    }
  }

  private async showLoginWindow() {
    this.mainWindow = new BrowserWindow({
      width: 400,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      resizable: false,
      titleBarStyle: 'hidden',
      show: false
    });

    this.mainWindow.loadFile(path.join(__dirname, 'login.html'));
    
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Handle login success
    ipcMain.handle('login', async (event, credentials) => {
      try {
        const success = await this.authService.login(credentials);
        if (success) {
          this.mainWindow?.close();
          await this.showMainWindow();
        }
        return { success };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: errorMessage };
      }
    });
  }

  private async showMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      show: false,
      icon: path.join(__dirname, '../assets/icon.png')
    });

    this.mainWindow.loadFile(path.join(__dirname, 'main.html'));
    
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Start monitoring
    await this.startMonitoring();

    // Handle logout
    ipcMain.handle('logout', async () => {
      await this.authService.logout();
      this.mainWindow?.close();
      await this.showLoginWindow();
    });

    // Handle monitoring controls
    ipcMain.handle('start-monitoring', async () => {
      await this.monitorService.start();
      return { success: true };
    });

    ipcMain.handle('stop-monitoring', async () => {
      await this.monitorService.stop();
      return { success: true };
    });

    // Handle status requests
    ipcMain.handle('get-status', async () => {
      return {
        isMonitoring: this.monitorService.isMonitoring(),
        lastCheck: this.monitorService.getLastCheck(),
        alerts: this.monitorService.getAlerts()
      };
    });
  }

  private async startMonitoring() {
    try {
      await this.monitorService.start();
      console.log('Monitoring started successfully');
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      dialog.showErrorBox('Monitoring Error', 'Failed to start monitoring. Please restart the application.');
    }
  }
}

// App lifecycle
app.whenReady().then(async () => {
  const monitor = new RealCheckMonitor();
  await monitor.initialize();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const monitor = new RealCheckMonitor();
    monitor.initialize();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      if (windows[0].isMinimized()) windows[0].restore();
      windows[0].focus();
    }
  });
} 