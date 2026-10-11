import fs from 'fs';
import path from 'path';
import { app, safeStorage } from 'electron';
import { JiraConfig, SavedReport, TimerState } from '../types/jira';
import { logger } from './logger';

const DEFAULT_CONFIG: JiraConfig = {
  serverUrl: 'https://jira-assistant.atlassian.net',
  authType: 'cloud',
  email: 'developer@example.com',
  apiToken: '',
  targetHoursPerDay: 8,
  demoMode: true,
};

const DEFAULT_TIMER: TimerState = {
  isRunning: false,
  issueKey: null,
  issueSummary: null,
  startedAt: null,
  elapsedSeconds: 0,
  notes: '',
};

const DEFAULT_REPORTS: SavedReport[] = [
  {
    id: 'report-my-open',
    name: 'My Assigned Open Issues',
    description: 'All unresolved tickets assigned to current user',
    jql: 'assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC',
    fields: ['key', 'summary', 'status', 'priority', 'issueType', 'timeSpent', 'remainingEstimate', 'updated'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'report-recent',
    name: 'Recently Updated Tickets',
    description: 'Issues updated within the last 14 days',
    jql: 'updated >= -14d ORDER BY updated DESC',
    fields: ['key', 'summary', 'status', 'priority', 'assignee', 'updated'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'report-high-priority',
    name: 'High Priority & Blocker Issues',
    description: 'Highest and High priority open issues',
    jql: 'priority in (High, Highest) AND statusCategory != Done ORDER BY created DESC',
    fields: ['key', 'summary', 'status', 'priority', 'assignee', 'created'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'report-done-this-week',
    name: 'Resolved / Done Recently',
    description: 'Issues moved to Done in the past 7 days',
    jql: 'statusCategory = Done AND updated >= -7d ORDER BY updated DESC',
    fields: ['key', 'summary', 'status', 'assignee', 'timeSpent', 'updated'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class AppStorage {
  private configPath: string;
  private timerPath: string;
  private reportsPath: string;
  private config: JiraConfig;
  private timerState: TimerState;
  private savedReports: SavedReport[];

  constructor() {
    const userData = app.getPath('userData');
    this.configPath = path.join(userData, 'jira-assistant-config.json');
    this.timerPath = path.join(userData, 'jira-assistant-timer.json');
    this.reportsPath = path.join(userData, 'jira-assistant-reports.json');
    this.config = this.loadConfig();
    this.timerState = this.loadTimer();
    this.savedReports = this.loadReports();
  }

  private loadConfig(): JiraConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.encryptedToken && safeStorage.isEncryptionAvailable()) {
          try {
            const buffer = Buffer.from(parsed.encryptedToken, 'base64');
            parsed.apiToken = safeStorage.decryptString(buffer);
          } catch (decErr) {
            logger.error('Failed to decrypt stored token:', decErr);
          }
        }
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch (e) {
      logger.error('Failed to load config file:', e);
    }
    return { ...DEFAULT_CONFIG };
  }

  public saveConfig(newConfig: JiraConfig): boolean {
    try {
      this.config = { ...newConfig };
      const toSave: any = { ...newConfig };

      if (toSave.apiToken && safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(toSave.apiToken);
        toSave.encryptedToken = encrypted.toString('base64');
        delete toSave.apiToken; // Never store plaintext
      }

      fs.writeFileSync(this.configPath, JSON.stringify(toSave, null, 2), 'utf8');
      logger.info('Config saved successfully', {
        serverUrl: newConfig.serverUrl,
        authType: newConfig.authType,
        email: newConfig.email,
        demoMode: newConfig.demoMode,
      });
      return true;
    } catch (e) {
      logger.error('Failed to save config:', e);
      return false;
    }
  }

  public getConfig(): JiraConfig {
    return { ...this.config };
  }

  private loadTimer(): TimerState {
    try {
      if (fs.existsSync(this.timerPath)) {
        const raw = fs.readFileSync(this.timerPath, 'utf8');
        return { ...DEFAULT_TIMER, ...JSON.parse(raw) };
      }
    } catch (e) {
      logger.error('Failed to load timer:', e);
    }
    return { ...DEFAULT_TIMER };
  }

  public saveTimer(state: TimerState): boolean {
    try {
      this.timerState = { ...state };
      fs.writeFileSync(this.timerPath, JSON.stringify(state, null, 2), 'utf8');
      return true;
    } catch (e) {
      logger.error('Failed to save timer:', e);
      return false;
    }
  }

  public getTimer(): TimerState {
    return { ...this.timerState };
  }

  // Saved Reports & Custom Fields
  private loadReports(): SavedReport[] {
    try {
      if (fs.existsSync(this.reportsPath)) {
        const raw = fs.readFileSync(this.reportsPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      logger.error('Failed to load saved reports:', e);
    }
    // Return defaults if none exist
    return [...DEFAULT_REPORTS];
  }

  public getSavedReports(): SavedReport[] {
    return [...this.savedReports];
  }

  public saveReport(report: SavedReport): boolean {
    try {
      const idx = this.savedReports.findIndex((r) => r.id === report.id);
      if (idx !== -1) {
        this.savedReports[idx] = { ...report, updatedAt: new Date().toISOString() };
      } else {
        this.savedReports.unshift({
          ...report,
          id: report.id || `report-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      fs.writeFileSync(this.reportsPath, JSON.stringify(this.savedReports, null, 2), 'utf8');
      logger.info('Saved report updated', { id: report.id, name: report.name, jql: report.jql });
      return true;
    } catch (e) {
      logger.error('Failed to save report:', e);
      return false;
    }
  }

  public deleteReport(id: string): boolean {
    try {
      this.savedReports = this.savedReports.filter((r) => r.id !== id);
      fs.writeFileSync(this.reportsPath, JSON.stringify(this.savedReports, null, 2), 'utf8');
      logger.info('Deleted report', { id });
      return true;
    } catch (e) {
      logger.error('Failed to delete report:', e);
      return false;
    }
  }
}
