import { exec } from 'child_process';
import { promisify } from 'util';
import * as screenshot from 'screenshot-desktop';
import axios from 'axios';
import { ConfigService } from './ConfigService';

const execAsync = promisify(exec);

interface Alert {
  id: string;
  type: 'ai_process' | 'suspicious_behavior' | 'screen_capture' | 'network_activity';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
  evidence?: string;
}

interface ProcessInfo {
  name: string;
  pid: string;
  memory: string;
}

export class MonitorService {
  private isMonitoringActive = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alerts: Alert[] = [];
  private lastCheck: Date | null = null;
  private configService: ConfigService;

  // AI and cheating detection patterns
  private readonly aiProcesses = [
    'chatgpt', 'copilot', 'claude', 'bard', 'notion', 'obsidian',
    'discord', 'slack', 'telegram', 'whatsapp', 'teams',
    'chrome', 'firefox', 'edge', 'safari', // Browser processes
    'code', 'vscode', 'sublime', 'atom', // Code editors
    'word', 'excel', 'powerpoint', 'onenote' // Office apps
  ];

  private readonly suspiciousWebsites = [
    'chat.openai.com', 'claude.ai', 'bard.google.com',
    'github.com/copilot', 'notion.so', 'discord.com',
    'slack.com', 'telegram.org', 'whatsapp.com'
  ];

  constructor() {
    this.configService = new ConfigService();
  }

  async start(): Promise<void> {
    if (this.isMonitoringActive) {
      return;
    }

    this.isMonitoringActive = true;
    console.log('Starting RealCheck monitoring...');

    // Start periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.performCheck();
    }, 5000); // Check every 5 seconds

    // Initial check
    await this.performCheck();
  }

  async stop(): Promise<void> {
    if (!this.isMonitoringActive) {
      return;
    }

    this.isMonitoringActive = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('RealCheck monitoring stopped');
  }

  isMonitoring(): boolean {
    return this.isMonitoringActive;
  }

  getLastCheck(): Date | null {
    return this.lastCheck;
  }

  getAlerts(): Alert[] {
    return this.alerts;
  }

  private async performCheck(): Promise<void> {
    try {
      this.lastCheck = new Date();
      
      // Check for AI processes
      await this.checkForAIProcesses();
      
      // Check for suspicious browser activity
      await this.checkBrowserActivity();
      
      // Check for screen sharing or recording
      await this.checkScreenActivity();
      
      // Check for network activity to AI services
      await this.checkNetworkActivity();

    } catch (error) {
      console.error('Error during monitoring check:', error);
      this.addAlert('suspicious_behavior', 'high', 'Monitoring error occurred');
    }
  }

  private async checkForAIProcesses(): Promise<void> {
    try {
      const processes = await this.getRunningProcesses();
      
      for (const process of processes) {
        const processName = process.name.toLowerCase();
        
        for (const aiProcess of this.aiProcesses) {
          if (processName.includes(aiProcess)) {
            this.addAlert('ai_process', 'high', `AI tool detected: ${process.name}`, {
              processName: process.name,
              pid: process.pid,
              memory: process.memory
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking processes:', error);
    }
  }

  private async checkBrowserActivity(): Promise<void> {
    try {
      // Check for browser processes and their activity
      const processes = await this.getRunningProcesses();
      const browserProcesses = processes.filter(p => 
        ['chrome', 'firefox', 'edge', 'safari'].some(browser => 
          p.name.toLowerCase().includes(browser)
        )
      );

      if (browserProcesses.length > 0) {
        // In a real implementation, you'd check browser tabs
        // This is a simplified version
        this.addAlert('suspicious_behavior', 'medium', 'Browser activity detected during session');
      }
    } catch (error) {
      console.error('Error checking browser activity:', error);
    }
  }

  private async checkScreenActivity(): Promise<void> {
    try {
      // Check if screen recording/sharing is active
      const processes = await this.getRunningProcesses();
      const screenProcesses = processes.filter(p => 
        ['obs', 'streamlabs', 'xsplit', 'bandicam', 'fraps', 'camstudio'].some(app => 
          p.name.toLowerCase().includes(app)
        )
      );

      if (screenProcesses.length > 0) {
        this.addAlert('screen_capture', 'high', 'Screen recording software detected', {
          processes: screenProcesses.map(p => p.name)
        });
      }
    } catch (error) {
      console.error('Error checking screen activity:', error);
    }
  }

  private async checkNetworkActivity(): Promise<void> {
    try {
      // In a real implementation, you'd monitor network connections
      // This is a placeholder for network monitoring
      // You could use tools like netstat or similar
    } catch (error) {
      console.error('Error checking network activity:', error);
    }
  }

  private async getRunningProcesses(): Promise<ProcessInfo[]> {
    try {
      let command: string;
      
      if (process.platform === 'win32') {
        command = 'tasklist /FO CSV /NH';
      } else if (process.platform === 'darwin') {
        command = 'ps -ax -o pid,comm,pmem';
      } else {
        command = 'ps -ax -o pid,comm,%mem';
      }

      const { stdout } = await execAsync(command);
      return this.parseProcessList(stdout, process.platform);
    } catch (error) {
      console.error('Error getting processes:', error);
      return [];
    }
  }

  private parseProcessList(output: string, platform: string): ProcessInfo[] {
    const processes: ProcessInfo[] = [];
    const lines = output.trim().split('\n');

    for (const line of lines) {
      if (platform === 'win32') {
        // Parse Windows tasklist CSV format
        const match = line.match(/"([^"]+)","(\d+)","([^"]+)"/);
        if (match) {
          processes.push({
            name: match[1],
            pid: match[2],
            memory: match[3]
          });
        }
      } else {
        // Parse Unix ps format
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          processes.push({
            name: parts[2],
            pid: parts[1],
            memory: parts[3] || '0'
          });
        }
      }
    }

    return processes;
  }

  private addAlert(type: Alert['type'], severity: Alert['severity'], message: string, evidence?: any): void {
    const alert: Alert = {
      id: Date.now().toString(),
      type,
      severity,
      message,
      timestamp: new Date(),
      evidence: evidence ? JSON.stringify(evidence) : undefined
    };

    this.alerts.push(alert);
    
    // Send alert to backend
    this.sendAlertToBackend(alert);
    
    console.log(`Alert: ${severity.toUpperCase()} - ${message}`);
  }

  private async sendAlertToBackend(alert: Alert): Promise<void> {
    try {
      const config = await this.configService.getConfig();
      
      await axios.post(`${config.backendUrl}/api/alerts`, {
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp,
        evidence: alert.evidence
      }, {
        headers: {
          'Authorization': `Bearer ${config.authToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Failed to send alert to backend:', error);
    }
  }

  async captureScreenshot(): Promise<Buffer | null> {
    try {
      return await screenshot();
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      return null;
    }
  }
} 