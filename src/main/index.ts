import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, Notification, shell, powerMonitor } from 'electron';
import path from 'path';
import fs from 'fs';
import { AppStorage } from './storage';
import { JiraClient } from './jira-client';
import { JiraConfig, LogWorkPayload, SavedReport, TimerState, CreateIssuePayload } from '../types/jira';
import { logger } from './logger';

// Set application identity so safeStorage DPAPI and userData are consistent
app.setName('jira-assistant-desktop');
const userDataPath = path.join(app.getPath('appData'), 'jira-assistant-desktop');
app.setPath('userData', userDataPath);

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION:', err);
});

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let storage: AppStorage;
let jiraClient: JiraClient;
let isQuitting = false;

function createDefaultTrayIcon() {
  const iconPath = path.join(app.getAppPath(), 'resources/tray.png');
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }
  const iconBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZElEQVQ4T2NkIBIwEqmOgdrG/y+v3wxiw8RDmBh+/mPA5T7k8B8ffuDjh6b7979/eB0D1gGgGEOMiXQDGOMgVwNqK8ZlG14NYmE0jAYkMQajBjDqgMEaYDBsGBUu5HgYZiJdAACh9S9h1R+c/QAAAABJRU5ErkJggg==';
  return nativeImage.createFromBuffer(Buffer.from(iconBase64, 'base64'));
}

function updateTrayMenu(timerState: TimerState) {
  if (!tray) return;

  const timerText = timerState.isRunning && timerState.issueKey
    ? `⏱ Active: ${timerState.issueKey} (${formatTime(timerState.elapsedSeconds)})`
    : '⏱ Timer: Stopped';

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Jira Assistant', enabled: false },
    { type: 'separator' },
    { label: timerText, enabled: false },
    {
      label: timerState.isRunning ? 'Pause Timer' : 'Resume Timer',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send('timer:toggle-request');
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Open Jira Assistant',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip(`Jira Assistant - ${timerText}`);
  tray.setContextMenu(contextMenu);
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function createWindow() {
  const iconPath = path.join(app.getAppPath(), 'resources/icon.png');
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    title: 'Jira Assistant',
    backgroundColor: '#0F172A',
    show: true,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.on('did-finish-load', () => {
    logger.info('Renderer UI loaded successfully');
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    logger.error('Failed to load renderer UI:', { errorCode, errorDescription });
  });

  // Load Vite dev server or production index.html
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
  }

  mainWindow.center();
  mainWindow.show();
  mainWindow.focus();

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupTray() {
  try {
    const icon = createDefaultTrayIcon();
    tray = new Tray(icon);
    const initialTimer = storage.getTimer();
    updateTrayMenu(initialTimer);

    tray.on('double-click', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    logger.error('Failed to initialize tray:', err);
  }
}

function registerIpcHandlers() {
  ipcMain.handle('jira:get-config', () => storage.getConfig());

  ipcMain.handle('jira:save-config', async (_event, config: JiraConfig) => {
    const success = storage.saveConfig(config);
    return { success };
  });

  ipcMain.handle('jira:test-connection', async (_event, config?: JiraConfig) => {
    return jiraClient.testConnection(config);
  });

  ipcMain.handle('jira:get-my-issues', async () => {
    return jiraClient.getMyIssues();
  });

  ipcMain.handle('jira:search-jql', async (_event, options: any, fields?: string[]) => {
    return jiraClient.searchJql(options, fields);
  });

  ipcMain.handle('jira:get-jira-fields', async () => {
    return jiraClient.getJiraFields();
  });

  ipcMain.handle('jira:get-worklogs', async (_event, startDate: string, endDate: string) => {
    return jiraClient.getWorklogs(startDate, endDate);
  });

  ipcMain.handle('jira:log-work', async (_event, payload: LogWorkPayload) => {
    return jiraClient.logWork(payload);
  });

  ipcMain.handle('jira:delete-worklog', async (_event, issueKey: string, worklogId: string) => {
    return jiraClient.deleteWorklog(issueKey, worklogId);
  });

  ipcMain.handle('jira:get-transitions', async (_event, issueKey: string) => {
    return jiraClient.getTransitions(issueKey);
  });

  ipcMain.handle('jira:transition-issue', async (_event, issueKey: string, transitionId: string) => {
    return jiraClient.transitionIssue(issueKey, transitionId);
  });

  ipcMain.handle('jira:get-projects', async () => {
    return jiraClient.getProjects();
  });

  ipcMain.handle('jira:get-issue-types', async (_event, projectKey?: string) => {
    return jiraClient.getIssueTypes(projectKey);
  });

  ipcMain.handle('jira:create-issue', async (_event, payload: CreateIssuePayload) => {
    return jiraClient.createIssue(payload);
  });

  ipcMain.handle('jira:get-issue-comments', async (_event, issueKey: string) => {
    return jiraClient.getIssueComments(issueKey);
  });

  ipcMain.handle('jira:add-issue-comment', async (_event, issueKey: string, body: string) => {
    return jiraClient.addIssueComment(issueKey, body);
  });

  ipcMain.handle('timer:get-state', () => {
    return storage.getTimer();
  });

  ipcMain.handle('timer:update-state', (_event, state: TimerState) => {
    storage.saveTimer(state);
    updateTrayMenu(state);
    return true;
  });

  // System Idle & Compact Window Mode
  ipcMain.handle('app:get-system-idle-time', () => {
    try {
      return powerMonitor.getSystemIdleTime();
    } catch {
      return 0;
    }
  });

  ipcMain.handle('window:set-compact-mode', (_event, compact: boolean) => {
    if (!mainWindow) return;
    if (compact) {
      mainWindow.setAlwaysOnTop(true, 'floating');
      mainWindow.setSize(380, 180, true);
    } else {
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setSize(1200, 800, true);
    }
  });

  // Saved Reports
  ipcMain.handle('jira:get-saved-reports', () => {
    return storage.getSavedReports();
  });

  ipcMain.handle('jira:save-report', (_event, report: SavedReport) => {
    const success = storage.saveReport(report);
    return { success };
  });

  ipcMain.handle('jira:delete-report', (_event, id: string) => {
    const success = storage.deleteReport(id);
    return { success };
  });

  // Diagnostics and Logs
  ipcMain.handle('jira:get-logs', () => {
    return logger.getLogs();
  });

  ipcMain.handle('jira:clear-logs', () => {
    return logger.clearLogs();
  });

  ipcMain.handle('jira:open-logs-file', () => {
    logger.openLogsFile();
  });

  ipcMain.handle('jira:open-logs-folder', () => {
    logger.openLogsFolder();
  });

  ipcMain.handle('app:show-notification', (_event, title: string, body: string) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });

  ipcMain.handle('app:open-external', (_event, url: string) => {
    shell.openExternal(url);
  });

  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.handle('window:close', () => mainWindow?.close());
}

app.whenReady().then(() => {
  logger.init();
  storage = new AppStorage();
  jiraClient = new JiraClient(() => storage.getConfig());

  registerIpcHandlers();
  createWindow();
  setupTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (isQuitting) {
    app.quit();
  }
});
