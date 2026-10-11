import { contextBridge, ipcRenderer } from 'electron';
import { JiraConfig, LogWorkPayload, SavedReport, TimerState, ElectronApi } from '../types/jira';

const api: ElectronApi = {
  getConfig: () => ipcRenderer.invoke('jira:get-config'),
  saveConfig: (config: JiraConfig) => ipcRenderer.invoke('jira:save-config', config),
  testConnection: (config?: JiraConfig) => ipcRenderer.invoke('jira:test-connection', config),
  getMyIssues: () => ipcRenderer.invoke('jira:get-my-issues'),
  searchJql: (options: any, fields?: string[]) => {
    if (typeof options === 'string') {
      return ipcRenderer.invoke('jira:search-jql', options, fields);
    }
    return ipcRenderer.invoke('jira:search-jql', options);
  },
  getJiraFields: () => ipcRenderer.invoke('jira:get-jira-fields'),
  getProjects: () => ipcRenderer.invoke('jira:get-projects'),
  getIssueTypes: (projectKey?: string) => ipcRenderer.invoke('jira:get-issue-types', projectKey),
  createIssue: (payload: any) => ipcRenderer.invoke('jira:create-issue', payload),
  getIssueComments: (issueKey: string) => ipcRenderer.invoke('jira:get-issue-comments', issueKey),
  addIssueComment: (issueKey: string, body: string) => ipcRenderer.invoke('jira:add-issue-comment', issueKey, body),
  getWorklogs: (startDate: string, endDate: string) => ipcRenderer.invoke('jira:get-worklogs', startDate, endDate),
  logWork: (payload: LogWorkPayload) => ipcRenderer.invoke('jira:log-work', payload),
  deleteWorklog: (issueKey: string, worklogId: string) => ipcRenderer.invoke('jira:delete-worklog', issueKey, worklogId),
  getTransitions: (issueKey: string) => ipcRenderer.invoke('jira:get-transitions', issueKey),
  transitionIssue: (issueKey: string, transitionId: string) => ipcRenderer.invoke('jira:transition-issue', issueKey, transitionId),
  getTimerState: () => ipcRenderer.invoke('timer:get-state'),
  updateTimerState: (state: TimerState) => ipcRenderer.invoke('timer:update-state', state),
  getSavedReports: () => ipcRenderer.invoke('jira:get-saved-reports'),
  saveReport: (report: SavedReport) => ipcRenderer.invoke('jira:save-report', report),
  deleteReport: (id: string) => ipcRenderer.invoke('jira:delete-report', id),
  getLogs: () => ipcRenderer.invoke('jira:get-logs'),
  clearLogs: () => ipcRenderer.invoke('jira:clear-logs'),
  openLogsFile: () => ipcRenderer.invoke('jira:open-logs-file'),
  openLogsFolder: () => ipcRenderer.invoke('jira:open-logs-folder'),
  getSystemIdleTime: () => ipcRenderer.invoke('app:get-system-idle-time'),
  setCompactMode: (compact: boolean) => ipcRenderer.invoke('window:set-compact-mode', compact),
  showNotification: (title: string, body: string) => ipcRenderer.invoke('app:show-notification', title, body),
  openExternal: (url: string) => ipcRenderer.invoke('app:open-external', url),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
};

contextBridge.exposeInMainWorld('jiraApi', api);
