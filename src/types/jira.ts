export type JiraAuthType = 'cloud' | 'server';
export type ThemeMode = 'dark' | 'light';

export interface JiraConfig {
  serverUrl: string;
  authType: JiraAuthType;
  email?: string;
  apiToken?: string;
  targetHoursPerDay: number;
  demoMode: boolean;
  theme?: ThemeMode;
  reminderEnabled?: boolean;
  reminderTime?: string; // '17:30'
  idleDetectionMinutes?: number; // e.g. 15
}

export interface JiraUser {
  id: string;
  displayName: string;
  emailAddress?: string;
  avatarUrl?: string;
}

export interface JiraIssueStatus {
  id: string;
  name: string;
  category: 'To Do' | 'In Progress' | 'Done' | string;
}

export interface JiraIssuePriority {
  id: string;
  name: string;
  iconUrl?: string;
}

export interface JiraIssueType {
  id: string;
  name: string;
  iconUrl?: string;
  subtask?: boolean;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  avatarUrl?: string;
}

export interface JiraComment {
  id: string;
  author: JiraUser;
  body: string;
  created: string;
  updated?: string;
}

export interface JiraTimeTracking {
  originalEstimate?: string;
  remainingEstimate?: string;
  timeSpent?: string;
  originalEstimateSeconds?: number;
  remainingEstimateSeconds?: number;
  timeSpentSeconds?: number;
}

export interface JiraFieldDefinition {
  id: string;
  name: string;
  custom: boolean;
  orderable?: boolean;
  navigable?: boolean;
  searchable?: boolean;
  schema?: {
    type: string;
    system?: string;
    custom?: string;
    customId?: number;
  };
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: JiraIssueStatus;
  priority?: JiraIssuePriority;
  issueType?: JiraIssueType;
  assignee?: JiraUser;
  reporter?: JiraUser;
  created?: string;
  updated: string;
  timeTracking?: JiraTimeTracking;
  projectKey?: string;
  rawFields?: Record<string, any>;
  [key: string]: any;
}

export interface JiraWorklog {
  id: string;
  issueKey: string;
  issueSummary?: string;
  author: JiraUser;
  started: string;
  timeSpent: string;
  timeSpentSeconds: number;
  comment?: string;
}

export interface JiraTransition {
  id: string;
  name: string;
  to: JiraIssueStatus;
}

export interface TimerState {
  isRunning: boolean;
  issueKey: string | null;
  issueSummary: string | null;
  startedAt: number | null;
  elapsedSeconds: number;
  notes: string;
}

export interface LogWorkPayload {
  issueKey: string;
  timeSpent: string;
  timeSpentSeconds?: number;
  started: string;
  comment?: string;
  adjustEstimate?: 'auto' | 'leave' | 'manual';
  newEstimate?: string;
}

export interface CreateIssuePayload {
  projectKey: string;
  issueTypeId: string;
  summary: string;
  description?: string;
  priorityId?: string;
}

export interface SavedReport {
  id: string;
  name: string;
  description?: string;
  jql: string;
  fields: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  details?: any;
}

export interface SearchJqlOptions {
  jql: string;
  fields?: string[];
  startAt?: number;
  maxResults?: number;
}

export interface SearchJqlResult {
  issues: JiraIssue[];
  total: number;
  startAt: number;
  maxResults: number;
  error?: string;
}

export interface ElectronApi {
  getConfig: () => Promise<JiraConfig>;
  saveConfig: (config: JiraConfig) => Promise<{ success: boolean; error?: string }>;
  testConnection: (config?: JiraConfig) => Promise<{ success: boolean; user?: JiraUser; error?: string }>;
  getMyIssues: () => Promise<{ issues: JiraIssue[]; error?: string }>;
  searchJql: (options: SearchJqlOptions | string, fields?: string[]) => Promise<SearchJqlResult>;
  getJiraFields: () => Promise<{ fields: JiraFieldDefinition[]; error?: string }>;
  getProjects: () => Promise<{ projects: JiraProject[]; error?: string }>;
  getIssueTypes: (projectKey?: string) => Promise<{ issueTypes: JiraIssueType[]; error?: string }>;
  createIssue: (payload: CreateIssuePayload) => Promise<{ success: boolean; issue?: JiraIssue; error?: string }>;
  getIssueComments: (issueKey: string) => Promise<{ comments: JiraComment[]; error?: string }>;
  addIssueComment: (issueKey: string, body: string) => Promise<{ success: boolean; comment?: JiraComment; error?: string }>;
  getWorklogs: (startDate: string, endDate: string) => Promise<{ worklogs: JiraWorklog[]; error?: string }>;
  logWork: (payload: LogWorkPayload) => Promise<{ success: boolean; worklog?: JiraWorklog; error?: string }>;
  deleteWorklog: (issueKey: string, worklogId: string) => Promise<{ success: boolean; error?: string }>;
  getTransitions: (issueKey: string) => Promise<{ transitions: JiraTransition[]; error?: string }>;
  transitionIssue: (issueKey: string, transitionId: string) => Promise<{ success: boolean; error?: string }>;
  getTimerState: () => Promise<TimerState>;
  updateTimerState: (state: TimerState) => Promise<boolean>;
  getSavedReports: () => Promise<SavedReport[]>;
  saveReport: (report: SavedReport) => Promise<{ success: boolean; error?: string }>;
  deleteReport: (id: string) => Promise<{ success: boolean; error?: string }>;
  getLogs: () => Promise<LogEntry[]>;
  clearLogs: () => Promise<boolean>;
  openLogsFile: () => Promise<void>;
  openLogsFolder: () => Promise<void>;
  getSystemIdleTime: () => Promise<number>;
  setCompactMode: (compact: boolean) => Promise<void>;
  showNotification: (title: string, body: string) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
}

declare global {
  interface Window {
    jiraApi: ElectronApi;
  }
}
