import {
  JiraConfig,
  JiraIssue,
  JiraTransition,
  JiraUser,
  JiraWorklog,
  LogWorkPayload,
  JiraProject,
  JiraIssueType,
  JiraComment,
  CreateIssuePayload,
} from '../types/jira';
import { logger } from './logger';

// Demo sample data store so user can test all features right out of the box
class DemoDataStore {
  public user: JiraUser = {
    id: 'user-demo-123',
    displayName: 'Vijay Kumar',
    emailAddress: 'vijay@company.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  };

  public issues: JiraIssue[] = [
    {
      id: '10001',
      key: 'ENG-2041',
      summary: 'Implement OAuth 2.0 PKCE authentication flow for desktop client',
      description: 'Need to support secure PKCE authentication flow without client secret for the desktop client.',
      status: { id: '3', name: 'In Progress', category: 'In Progress' },
      priority: { id: '2', name: 'High' },
      issueType: { id: '1', name: 'Task' },
      assignee: { id: 'user-demo-123', displayName: 'Vijay Kumar' },
      reporter: { id: 'rep-01', displayName: 'Sarah Connor' },
      timeTracking: {
        originalEstimate: '16h',
        remainingEstimate: '6h 30m',
        timeSpent: '9h 30m',
        originalEstimateSeconds: 57600,
        remainingEstimateSeconds: 23400,
        timeSpentSeconds: 34200,
      },
      created: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated: new Date().toISOString(),
      projectKey: 'ENG',
    },
    {
      id: '10002',
      key: 'ENG-2045',
      summary: 'Optimize timesheet calendar rendering performance and caching',
      description: 'Virtualize weekly grid items and cache query responses to reduce redundant Jira REST calls.',
      status: { id: '1', name: 'To Do', category: 'To Do' },
      priority: { id: '3', name: 'Medium' },
      issueType: { id: '2', name: 'Improvement' },
      assignee: { id: 'user-demo-123', displayName: 'Vijay Kumar' },
      reporter: { id: 'rep-02', displayName: 'Alex Murphy' },
      timeTracking: {
        originalEstimate: '8h',
        remainingEstimate: '8h',
        timeSpent: '0m',
        originalEstimateSeconds: 28800,
        remainingEstimateSeconds: 28800,
        timeSpentSeconds: 0,
      },
      created: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated: new Date(Date.now() - 3600000 * 4).toISOString(),
      projectKey: 'ENG',
    },
    {
      id: '10003',
      key: 'ENG-1992',
      summary: 'Fix memory leak in background electron polling loop',
      description: 'Timer event listener was not detached on window unmount, causing multiple interval callbacks.',
      status: { id: '3', name: 'In Progress', category: 'In Progress' },
      priority: { id: '1', name: 'Highest' },
      issueType: { id: '3', name: 'Bug' },
      assignee: { id: 'user-demo-123', displayName: 'Vijay Kumar' },
      reporter: { id: 'rep-01', displayName: 'Sarah Connor' },
      timeTracking: {
        originalEstimate: '4h',
        remainingEstimate: '1h',
        timeSpent: '3h',
        originalEstimateSeconds: 14400,
        remainingEstimateSeconds: 3600,
        timeSpentSeconds: 10800,
      },
      created: new Date(Date.now() - 86400000 * 4).toISOString(),
      updated: new Date(Date.now() - 3600000 * 12).toISOString(),
      projectKey: 'ENG',
    },
    {
      id: '10004',
      key: 'ENG-1880',
      summary: 'Setup automated Windows installer and CI release pipeline',
      description: 'Configure electron-builder for NSIS installer and code signing certificates.',
      status: { id: '10002', name: 'Done', category: 'Done' },
      priority: { id: '3', name: 'Medium' },
      issueType: { id: '4', name: 'Story' },
      assignee: { id: 'user-demo-123', displayName: 'Vijay Kumar' },
      reporter: { id: 'rep-03', displayName: 'Elena Vance' },
      timeTracking: {
        originalEstimate: '12h',
        remainingEstimate: '0m',
        timeSpent: '11h 30m',
        originalEstimateSeconds: 43200,
        remainingEstimateSeconds: 0,
        timeSpentSeconds: 41400,
      },
      created: new Date(Date.now() - 86400000 * 7).toISOString(),
      updated: new Date(Date.now() - 86400000 * 2).toISOString(),
      projectKey: 'ENG',
    },
    {
      id: '10005',
      key: 'ENG-2050',
      summary: 'Add support for custom JQL saved filters and favorites',
      description: 'Allow users to star frequently used JQL filters and access them via top navigation bar.',
      status: { id: '1', name: 'To Do', category: 'To Do' },
      priority: { id: '4', name: 'Low' },
      issueType: { id: '4', name: 'Story' },
      assignee: { id: 'user-demo-123', displayName: 'Vijay Kumar' },
      reporter: { id: 'rep-02', displayName: 'Alex Murphy' },
      timeTracking: {
        originalEstimate: '6h',
        remainingEstimate: '6h',
        timeSpent: '0m',
        originalEstimateSeconds: 21600,
        remainingEstimateSeconds: 21600,
        timeSpentSeconds: 0,
      },
      created: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated: new Date(Date.now() - 86400000).toISOString(),
      projectKey: 'ENG',
    },
  ];

  public worklogs: JiraWorklog[] = [];

  constructor() {
    const now = new Date();
    const todayLog1 = new Date(now);
    todayLog1.setHours(9, 30, 0, 0);
    const todayLog2 = new Date(now);
    todayLog2.setHours(13, 0, 0, 0);

    const yestLog = new Date(now);
    yestLog.setDate(yestLog.getDate() - 1);
    yestLog.setHours(10, 0, 0, 0);

    const day2Log = new Date(now);
    day2Log.setDate(day2Log.getDate() - 2);
    day2Log.setHours(11, 0, 0, 0);

    this.worklogs = [
      {
        id: 'wl-101',
        issueKey: 'ENG-2041',
        issueSummary: 'Implement OAuth 2.0 PKCE authentication flow for desktop client',
        author: this.user,
        started: todayLog1.toISOString(),
        timeSpent: '3h 30m',
        timeSpentSeconds: 12600,
        comment: 'Designed token exchange workflow and implemented PKCE code challenge generation.',
      },
      {
        id: 'wl-102',
        issueKey: 'ENG-1992',
        issueSummary: 'Fix memory leak in background electron polling loop',
        author: this.user,
        started: todayLog2.toISOString(),
        timeSpent: '2h',
        timeSpentSeconds: 7200,
        comment: 'Isolated listener leak with Chrome DevTools heap profiling.',
      },
      {
        id: 'wl-103',
        issueKey: 'ENG-2041',
        issueSummary: 'Implement OAuth 2.0 PKCE authentication flow for desktop client',
        author: this.user,
        started: yestLog.toISOString(),
        timeSpent: '6h',
        timeSpentSeconds: 21600,
        comment: 'Configured redirect URI interception and secure token storage in safeStorage.',
      },
      {
        id: 'wl-104',
        issueKey: 'ENG-1880',
        issueSummary: 'Setup automated Windows installer and CI release pipeline',
        author: this.user,
        started: day2Log.toISOString(),
        timeSpent: '7h 30m',
        timeSpentSeconds: 27000,
        comment: 'Configured GitHub Actions workflow for building Windows electron installer.',
      },
    ];
  }
}

export class JiraClient {
  private demoStore = new DemoDataStore();

  constructor(private getConfig: () => JiraConfig) {}

  private getAuthHeaders(config: JiraConfig): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (config.authType === 'cloud') {
      const email = (config.email || '').trim();
      const token = (config.apiToken || '').trim();
      const basic = Buffer.from(`${email}:${token}`).toString('base64');
      headers['Authorization'] = `Basic ${basic}`;
    } else {
      // Server / Data Center Personal Access Token
      headers['Authorization'] = `Bearer ${(config.apiToken || '').trim()}`;
    }

    return headers;
  }

  private cleanBaseUrl(url: string): string {
    let cleaned = (url || '').trim().replace(/\/+$/, '');
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = 'https://' + cleaned;
    }
    return cleaned;
  }

  private parseErrorResponse(status: number, statusText: string, text: string): string {
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json.errorMessages) && json.errorMessages.length > 0) {
        return json.errorMessages.join('. ');
      }
      if (json.errors && typeof json.errors === 'object') {
        const errs = Object.entries(json.errors).map(([k, v]) => `${k}: ${v}`);
        if (errs.length > 0) return errs.join(', ');
      }
      if (json.message) return json.message;
    } catch {
      // not JSON
    }
    return text ? `${status} ${statusText}: ${text.slice(0, 200)}` : `${status} ${statusText}`;
  }

  public async testConnection(customConfig?: JiraConfig): Promise<{ success: boolean; user?: JiraUser; error?: string }> {
    const config = customConfig || this.getConfig();

    if (config.demoMode) {
      logger.info('testConnection called in Demo Mode');
      return { success: true, user: this.demoStore.user };
    }

    if (!config.serverUrl) {
      return { success: false, error: 'Server URL is required.' };
    }
    if (config.authType === 'cloud' && (!config.email || !config.apiToken)) {
      return { success: false, error: 'Email and API Token are required for Jira Cloud.' };
    }
    if (config.authType === 'server' && !config.apiToken) {
      return { success: false, error: 'Personal Access Token is required for Jira Server / Data Center.' };
    }

    try {
      const baseUrl = this.cleanBaseUrl(config.serverUrl);
      const isCloud = config.authType === 'cloud';
      // In Cloud, /rest/api/3/myself; in Server, /rest/api/2/myself
      const endpoint = `${baseUrl}/rest/api/${isCloud ? '3' : '2'}/myself`;
      
      logger.info(`Testing Jira connection to: ${endpoint} (${config.authType})`);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: this.getAuthHeaders(config),
      });

      const text = await response.text();

      if (!response.ok) {
        const errorMsg = this.parseErrorResponse(response.status, response.statusText, text);
        logger.error(`testConnection failed: ${response.status}`, { errorMsg });
        return { success: false, error: errorMsg };
      }

      const data = JSON.parse(text);
      const user: JiraUser = {
        id: data.accountId || data.name || data.key,
        displayName: data.displayName || data.name,
        emailAddress: data.emailAddress,
        avatarUrl: data.avatarUrls?.['48x48'] || data.avatarUrls?.['32x32'],
      };

      logger.info(`testConnection successful for: ${user.displayName} (${user.emailAddress})`);
      return { success: true, user };
    } catch (err: any) {
      logger.error('testConnection exception', err);
      return { success: false, error: err.message || 'Unable to connect to Jira server.' };
    }
  }

  public async getMyIssues(): Promise<{ issues: JiraIssue[]; error?: string }> {
    const config = this.getConfig();
    if (config.demoMode) {
      return { issues: this.demoStore.issues };
    }

    // Bounded query safe for all Jira Cloud instances
    const jql = 'assignee = currentUser() ORDER BY updated DESC';
    const res = await this.searchJql(jql);
    return { issues: res.issues, error: res.error };
  }

  public async searchJql(
    queryOrOptions: import('../types/jira').SearchJqlOptions | string,
    requestedFields?: string[]
  ): Promise<import('../types/jira').SearchJqlResult> {
    const config = this.getConfig();

    const jql = typeof queryOrOptions === 'string' ? queryOrOptions : queryOrOptions.jql;
    const fieldsToUse = typeof queryOrOptions === 'string' ? requestedFields : queryOrOptions.fields || requestedFields;
    const startAt = typeof queryOrOptions === 'object' && queryOrOptions.startAt !== undefined ? queryOrOptions.startAt : 0;
    const maxResults = typeof queryOrOptions === 'object' && queryOrOptions.maxResults !== undefined ? queryOrOptions.maxResults : 25;

    if (config.demoMode) {
      logger.info(`searchJql (Demo Mode): "${jql}" (startAt: ${startAt}, maxResults: ${maxResults})`);
      const q = jql.toLowerCase();
      const filtered = this.demoStore.issues.filter(
        (i) =>
          i.key.toLowerCase().includes(q) ||
          i.summary.toLowerCase().includes(q) ||
          (i.status?.name && i.status.name.toLowerCase().includes(q))
      );
      const list = filtered.length > 0 ? filtered : this.demoStore.issues;
      const total = list.length;
      const paginated = list.slice(startAt, startAt + maxResults);
      return { issues: paginated, total, startAt, maxResults };
    }

    const defaultFieldList = [
      'summary',
      'description',
      'status',
      'priority',
      'issuetype',
      'assignee',
      'reporter',
      'timetracking',
      'updated',
      'created',
      'project',
    ];

    const fields = fieldsToUse && fieldsToUse.length > 0
      ? Array.from(new Set([...fieldsToUse, 'summary', 'status', 'project']))
      : defaultFieldList;

    const baseUrl = this.cleanBaseUrl(config.serverUrl);
    const isCloud = config.authType === 'cloud';

    logger.info(`Executing JQL search (${isCloud ? 'Cloud API v3' : 'Server API v2'}): "${jql}" (startAt: ${startAt}, max: ${maxResults})`);

    try {
      let response: Response;

      if (isCloud) {
        // Jira Cloud modern endpoint: POST /rest/api/3/search/jql
        // Note: startAt is NOT allowed in modern search/jql payload; maxResults is supported.
        const url = `${baseUrl}/rest/api/3/search/jql`;
        const body: any = {
          jql: jql.trim(),
          maxResults,
          fields,
        };
        logger.debug(`Jira Cloud POST ${url}`, body);
        response = await fetch(url, {
          method: 'POST',
          headers: this.getAuthHeaders(config),
          body: JSON.stringify(body),
        });
      } else {
        // Jira Server / Data Center endpoint: GET /rest/api/2/search
        const url = `${baseUrl}/rest/api/2/search?jql=${encodeURIComponent(jql)}&startAt=${startAt}&maxResults=${maxResults}&fields=${fields.join(',')}`;
        logger.debug(`Jira Server GET ${url}`);
        response = await fetch(url, {
          method: 'GET',
          headers: this.getAuthHeaders(config),
        });
      }

      const text = await response.text();

      if (!response.ok) {
        const parsedError = this.parseErrorResponse(response.status, response.statusText, text);
        logger.error(`JQL Search returned error: ${response.status}`, { jql, error: parsedError });
        return { issues: [], total: 0, startAt, maxResults, error: parsedError };
      }

      const data = JSON.parse(text);

      // In Jira Cloud, fetch approximate-count if total is not present
      let total = data.total ?? data.issues?.length ?? 0;
      if (isCloud && data.total === undefined) {
        try {
          const countRes = await fetch(`${baseUrl}/rest/api/3/search/approximate-count`, {
            method: 'POST',
            headers: this.getAuthHeaders(config),
            body: JSON.stringify({ jql: jql.trim() }),
          });
          if (countRes.ok) {
            const countData = await countRes.json();
            total = countData.count ?? (data.issues?.length || 0);
          }
        } catch {
          // ignore count error
        }
      }

      logger.info(`JQL Search succeeded. Found ${data.issues?.length || 0} issues (total: ${total})`);

      const issues: JiraIssue[] = (data.issues || []).map((item: any) => {
        const fieldsObj = item.fields || {};

        let desc = '';
        if (typeof fieldsObj.description === 'string') {
          desc = fieldsObj.description;
        } else if (fieldsObj.description && typeof fieldsObj.description === 'object') {
          try {
            desc = (fieldsObj.description.content || [])
              .map((p: any) => (p.content || []).map((c: any) => c.text || '').join(''))
              .filter(Boolean)
              .join('\n\n');
          } catch {
            desc = '';
          }
        }

        return {
          id: item.id,
          key: item.key,
          summary: fieldsObj.summary || item.key,
          description: desc,
          status: {
            id: fieldsObj.status?.id,
            name: fieldsObj.status?.name || 'Unknown',
            category: fieldsObj.status?.statusCategory?.name || 'In Progress',
          },
          priority: fieldsObj.priority ? {
            id: fieldsObj.priority.id,
            name: fieldsObj.priority.name,
            iconUrl: fieldsObj.priority.iconUrl,
          } : undefined,
          issueType: fieldsObj.issuetype ? {
            id: fieldsObj.issuetype.id,
            name: fieldsObj.issuetype.name,
            iconUrl: fieldsObj.issuetype.iconUrl,
            subtask: fieldsObj.issuetype.subtask,
          } : undefined,
          assignee: fieldsObj.assignee ? {
            id: fieldsObj.assignee.accountId || fieldsObj.assignee.name,
            displayName: fieldsObj.assignee.displayName,
            avatarUrl: fieldsObj.assignee.avatarUrls?.['48x48'] || fieldsObj.assignee.avatarUrls?.['32x32'],
          } : undefined,
          reporter: fieldsObj.reporter ? {
            id: fieldsObj.reporter.accountId || fieldsObj.reporter.name,
            displayName: fieldsObj.reporter.displayName,
            avatarUrl: fieldsObj.reporter.avatarUrls?.['48x48'],
          } : undefined,
          created: fieldsObj.created,
          updated: fieldsObj.updated || new Date().toISOString(),
          timeTracking: {
            originalEstimate: fieldsObj.timetracking?.originalEstimate,
            remainingEstimate: fieldsObj.timetracking?.remainingEstimate,
            timeSpent: fieldsObj.timetracking?.timeSpent,
            originalEstimateSeconds: fieldsObj.timetracking?.originalEstimateSeconds,
            remainingEstimateSeconds: fieldsObj.timetracking?.remainingEstimateSeconds,
            timeSpentSeconds: fieldsObj.timetracking?.timeSpentSeconds,
          },
          projectKey: fieldsObj.project?.key,
          rawFields: fieldsObj,
        };
      });

      return { issues, total, startAt, maxResults };
    } catch (err: any) {
      logger.error('searchJql exception', err);
      return { issues: [], total: 0, startAt, maxResults, error: err.message || 'Error executing JQL query.' };
    }
  }

  public async getJiraFields(): Promise<{ fields: import('../types/jira').JiraFieldDefinition[]; error?: string }> {
    const config = this.getConfig();

    if (config.demoMode) {
      return {
        fields: [
          { id: 'summary', name: 'Summary', custom: false, navigable: true },
          { id: 'status', name: 'Status', custom: false, navigable: true },
          { id: 'priority', name: 'Priority', custom: false, navigable: true },
          { id: 'issuetype', name: 'Issue Type', custom: false, navigable: true },
          { id: 'assignee', name: 'Assignee', custom: false, navigable: true },
          { id: 'reporter', name: 'Reporter', custom: false, navigable: true },
          { id: 'created', name: 'Created', custom: false, navigable: true },
          { id: 'updated', name: 'Updated', custom: false, navigable: true },
          { id: 'duedate', name: 'Due Date', custom: false, navigable: true },
          { id: 'resolution', name: 'Resolution', custom: false, navigable: true },
          { id: 'labels', name: 'Labels', custom: false, navigable: true },
          { id: 'components', name: 'Components', custom: false, navigable: true },
          { id: 'fixVersions', name: 'Fix Versions', custom: false, navigable: true },
          { id: 'timetracking', name: 'Time Tracking', custom: false, navigable: true },
          { id: 'timeoriginalestimate', name: 'Original Estimate', custom: false, navigable: true },
          { id: 'timeestimate', name: 'Remaining Estimate', custom: false, navigable: true },
          { id: 'timespent', name: 'Time Spent', custom: false, navigable: true },
          { id: 'description', name: 'Description', custom: false, navigable: true },
          { id: 'environment', name: 'Environment', custom: false, navigable: true },
          { id: 'customfield_10014', name: 'Epic Link', custom: true, navigable: true },
          { id: 'customfield_10016', name: 'Story Points', custom: true, navigable: true },
          { id: 'customfield_10020', name: 'Sprint', custom: true, navigable: true },
          { id: 'customfield_10025', name: 'Customer Request Type', custom: true, navigable: true },
          { id: 'customfield_10026', name: 'Time to Resolution (SLA)', custom: true, navigable: true },
        ],
      };
    }

    try {
      const baseUrl = this.cleanBaseUrl(config.serverUrl);
      const isCloud = config.authType === 'cloud';
      const endpoint = `${baseUrl}/rest/api/${isCloud ? '3' : '2'}/field`;
      logger.info(`Fetching all configured fields from Jira: ${endpoint}`);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: this.getAuthHeaders(config),
      });

      const text = await response.text();
      if (!response.ok) {
        const errorMsg = this.parseErrorResponse(response.status, response.statusText, text);
        logger.error('Failed to fetch Jira fields:', { errorMsg });
        return { fields: [], error: errorMsg };
      }

      const rawFields: any[] = JSON.parse(text);
      const fields = rawFields.map((f) => ({
        id: f.id,
        name: f.name || f.id,
        custom: !!f.custom,
        orderable: f.orderable,
        navigable: f.navigable,
        searchable: f.searchable,
        schema: f.schema,
      }));

      fields.sort((a, b) => a.name.localeCompare(b.name));
      logger.info(`Loaded ${fields.length} dynamic field definitions from Jira instance`);
      return { fields };
    } catch (err: any) {
      logger.error('getJiraFields exception:', err);
      return { fields: [], error: err.message };
    }
  }

  public async getWorklogs(startDate: string, endDate: string): Promise<{ worklogs: JiraWorklog[]; error?: string }> {
    const config = this.getConfig();
    if (config.demoMode) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const filtered = this.demoStore.worklogs.filter((w) => {
        const t = new Date(w.started).getTime();
        return t >= start && t <= end;
      });
      return { worklogs: filtered.sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime()) };
    }

    try {
      // Find issues updated or worked on by current user
      const isCloud = config.authType === 'cloud';
      const jql = `worklogAuthor = currentUser() AND worklogDate >= "${startDate.slice(0, 10)}" AND worklogDate <= "${endDate.slice(0, 10)}"`;
      const searchRes = await this.searchJql(jql);

      if (searchRes.error || !searchRes.issues) {
        logger.warn('Could not fetch issues by worklogAuthor, falling back to assigned issues', { err: searchRes.error });
        const fallbackRes = await this.getMyIssues();
        if (fallbackRes.error || !fallbackRes.issues) {
          return { worklogs: [], error: searchRes.error };
        }
        searchRes.issues = fallbackRes.issues;
      }

      const baseUrl = this.cleanBaseUrl(config.serverUrl);
      const apiVer = isCloud ? '3' : '2';
      const allLogs: JiraWorklog[] = [];

      for (const issue of searchRes.issues) {
        try {
          const res = await fetch(`${baseUrl}/rest/api/${apiVer}/issue/${issue.key}/worklog`, {
            method: 'GET',
            headers: this.getAuthHeaders(config),
          });
          if (res.ok) {
            const data = (await res.json()) as any;
            const issueLogs: JiraWorklog[] = (data.worklogs || []).map((wl: any) => {
              let commentStr = '';
              if (typeof wl.comment === 'string') {
                commentStr = wl.comment;
              } else if (wl.comment && typeof wl.comment === 'object') {
                try {
                  commentStr = (wl.comment.content || [])
                    .map((p: any) => (p.content || []).map((c: any) => c.text || '').join(''))
                    .join(' ');
                } catch {
                  commentStr = '';
                }
              }

              return {
                id: wl.id,
                issueKey: issue.key,
                issueSummary: issue.summary,
                author: {
                  id: wl.author?.accountId || wl.author?.name,
                  displayName: wl.author?.displayName || 'User',
                  avatarUrl: wl.author?.avatarUrls?.['48x48'],
                },
                started: wl.started,
                timeSpent: wl.timeSpent,
                timeSpentSeconds: wl.timeSpentSeconds,
                comment: commentStr,
              };
            });
            allLogs.push(...issueLogs);
          }
        } catch {
          // ignore single issue worklog error
        }
      }

      logger.info(`Fetched ${allLogs.length} worklogs between ${startDate} and ${endDate}`);
      return { worklogs: allLogs.sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime()) };
    } catch (err: any) {
      logger.error('getWorklogs exception', err);
      return { worklogs: [], error: err.message };
    }
  }

  public async logWork(payload: LogWorkPayload): Promise<{ success: boolean; worklog?: JiraWorklog; error?: string }> {
    const config = this.getConfig();

    if (config.demoMode) {
      const issue = this.demoStore.issues.find((i) => i.key === payload.issueKey);
      const seconds = payload.timeSpentSeconds || this.parseDurationToSeconds(payload.timeSpent);
      const newWl: JiraWorklog = {
        id: `wl-${Date.now()}`,
        issueKey: payload.issueKey,
        issueSummary: issue?.summary || payload.issueKey,
        author: this.demoStore.user,
        started: payload.started,
        timeSpent: payload.timeSpent,
        timeSpentSeconds: seconds,
        comment: payload.comment || '',
      };
      this.demoStore.worklogs.unshift(newWl);

      if (issue && issue.timeTracking) {
        issue.timeTracking.timeSpentSeconds = (issue.timeTracking.timeSpentSeconds || 0) + seconds;
        issue.timeTracking.timeSpent = this.formatSeconds(issue.timeTracking.timeSpentSeconds);
        if (issue.timeTracking.remainingEstimateSeconds) {
          issue.timeTracking.remainingEstimateSeconds = Math.max(0, issue.timeTracking.remainingEstimateSeconds - seconds);
          issue.timeTracking.remainingEstimate = this.formatSeconds(issue.timeTracking.remainingEstimateSeconds);
        }
      }

      logger.info(`Work logged in Demo Mode for ${payload.issueKey} (${payload.timeSpent})`);
      return { success: true, worklog: newWl };
    }

    try {
      const baseUrl = this.cleanBaseUrl(config.serverUrl);
      const isCloud = config.authType === 'cloud';
      const apiVer = isCloud ? '3' : '2';
      const url = `${baseUrl}/rest/api/${apiVer}/issue/${payload.issueKey}/worklog`;

      let commentPayload: any = payload.comment || '';
      if (isCloud && payload.comment) {
        // Atlassian Cloud ADF comment format
        commentPayload = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: payload.comment }],
            },
          ],
        };
      }

      const body: any = {
        timeSpent: payload.timeSpent,
        started: new Date(payload.started).toISOString().replace('Z', '+0000'),
        comment: commentPayload,
      };

      logger.info(`Posting worklog to ${url}`, { timeSpent: payload.timeSpent, issue: payload.issueKey });

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(config),
        body: JSON.stringify(body),
      });

      const text = await response.text();

      if (!response.ok) {
        const errorMsg = this.parseErrorResponse(response.status, response.statusText, text);
        logger.error(`Failed to log work: ${response.status}`, { errorMsg });
        return { success: false, error: errorMsg };
      }

      const data = JSON.parse(text);
      const worklog: JiraWorklog = {
        id: data.id,
        issueKey: payload.issueKey,
        author: {
          id: data.author?.accountId || data.author?.name,
          displayName: data.author?.displayName || 'User',
        },
        started: data.started,
        timeSpent: data.timeSpent,
        timeSpentSeconds: data.timeSpentSeconds,
        comment: payload.comment || '',
      };

      logger.info(`Work logged successfully for ${payload.issueKey}`);
      return { success: true, worklog };
    } catch (err: any) {
      logger.error('logWork exception', err);
      return { success: false, error: err.message };
    }
  }

  public async deleteWorklog(issueKey: string, worklogId: string): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();

    if (config.demoMode) {
      const idx = this.demoStore.worklogs.findIndex((w) => w.id === worklogId);
      if (idx !== -1) {
        this.demoStore.worklogs.splice(idx, 1);
      }
      return { success: true };
    }

    try {
      const baseUrl = this.cleanBaseUrl(config.serverUrl);
      const isCloud = config.authType === 'cloud';
      const apiVer = isCloud ? '3' : '2';
      const url = `${baseUrl}/rest/api/${apiVer}/issue/${issueKey}/worklog/${worklogId}`;

      logger.info(`Deleting worklog ${worklogId} for issue ${issueKey}`);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getAuthHeaders(config),
      });

      if (!response.ok) {
        const text = await response.text();
        const err = this.parseErrorResponse(response.status, response.statusText, text);
        logger.error(`Failed to delete worklog: ${err}`);
        return { success: false, error: err };
      }
      return { success: true };
    } catch (err: any) {
      logger.error('deleteWorklog exception', err);
      return { success: false, error: err.message };
    }
  }

  public async getTransitions(issueKey: string): Promise<{ transitions: JiraTransition[]; error?: string }> {
    const config = this.getConfig();

    if (config.demoMode) {
      return {
        transitions: [
          { id: '11', name: 'To Do', to: { id: '1', name: 'To Do', category: 'To Do' } },
          { id: '21', name: 'In Progress', to: { id: '3', name: 'In Progress', category: 'In Progress' } },
          { id: '31', name: 'Done', to: { id: '10002', name: 'Done', category: 'Done' } },
        ],
      };
    }

    try {
      const baseUrl = this.cleanBaseUrl(config.serverUrl);
      const isCloud = config.authType === 'cloud';
      const apiVer = isCloud ? '3' : '2';
      const url = `${baseUrl}/rest/api/${apiVer}/issue/${issueKey}/transitions`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(config),
      });

      if (!response.ok) {
        const text = await response.text();
        return { transitions: [], error: this.parseErrorResponse(response.status, response.statusText, text) };
      }

      const data = (await response.json()) as any;
      const transitions: JiraTransition[] = (data.transitions || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        to: {
          id: t.to?.id,
          name: t.to?.name,
          category: t.to?.statusCategory?.name || 'In Progress',
        },
      }));

      return { transitions };
    } catch (err: any) {
      logger.error('getTransitions exception', err);
      return { transitions: [], error: err.message };
    }
  }

  public async transitionIssue(issueKey: string, transitionId: string): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();

    if (config.demoMode) {
      const issue = this.demoStore.issues.find((i) => i.key === issueKey);
      if (issue) {
        const transMap: Record<string, string> = { '11': 'To Do', '21': 'In Progress', '31': 'Done' };
        const newName = transMap[transitionId] || 'In Progress';
        issue.status = { id: transitionId, name: newName, category: newName };
      }
      return { success: true };
    }

    try {
      const baseUrl = this.cleanBaseUrl(config.serverUrl);
      const isCloud = config.authType === 'cloud';
      const apiVer = isCloud ? '3' : '2';
      const url = `${baseUrl}/rest/api/${apiVer}/issue/${issueKey}/transitions`;

      logger.info(`Transitioning issue ${issueKey} with transitionId ${transitionId}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(config),
        body: JSON.stringify({ transition: { id: transitionId } }),
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, error: this.parseErrorResponse(response.status, response.statusText, text) };
      }

      return { success: true };
    } catch (err: any) {
      logger.error('transitionIssue exception', err);
      return { success: false, error: err.message };
    }
  }

  private parseDurationToSeconds(duration: string): number {
    let totalSeconds = 0;
    const regex = /(\d+)\s*(w|d|h|m|s)/gi;
    let match;
    while ((match = regex.exec(duration)) !== null) {
      const val = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      if (unit === 'w') totalSeconds += val * 5 * 8 * 3600;
      else if (unit === 'd') totalSeconds += val * 8 * 3600;
      else if (unit === 'h') totalSeconds += val * 3600;
      else if (unit === 'm') totalSeconds += val * 60;
      else if (unit === 's') totalSeconds += val;
    }
    return totalSeconds || 3600;
  }

  private formatSeconds(totalSec: number): string {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  }

  public async getProjects(): Promise<{ projects: JiraProject[]; error?: string }> {
    const config = this.getConfig();

    if (config.demoMode) {
      return {
        projects: [
          { id: '10000', key: 'DEV', name: 'Core Development' },
          { id: '10001', key: 'SD', name: 'Service Desk Support' },
          { id: '10002', key: 'PROJ', name: 'Mobile App Project' },
        ],
      };
    }

    try {
      const baseUrl = this.cleanBaseUrl(config.serverUrl);
      const isCloud = config.authType === 'cloud';
      const apiVer = isCloud ? '3' : '2';
      const url = `${baseUrl}/rest/api/${apiVer}/project`;

      logger.info(`Fetching projects from: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(config),
      });

      if (!response.ok) {
        const text = await response.text();
        return { projects: [], error: this.parseErrorResponse(response.status, response.statusText, text) };
      }

      const data = (await response.json()) as any[];
      const projects: JiraProject[] = data.map((p: any) => ({
        id: p.id,
        key: p.key,
        name: p.name,
        avatarUrl: p.avatarUrls?.['48x48'] || p.avatarUrls?.['32x32'],
      }));

      return { projects };
    } catch (err: any) {
      logger.error('getProjects exception', err);
      return { projects: [], error: err.message };
    }
  }

  public async getIssueTypes(projectKey?: string): Promise<{ issueTypes: JiraIssueType[]; error?: string }> {
    const config = this.getConfig();

    if (config.demoMode) {
      return {
        issueTypes: [
          { id: '10001', name: 'Task', subtask: false },
          { id: '10002', name: 'Bug', subtask: false },
          { id: '10003', name: 'Story', subtask: false },
          { id: '10004', name: 'Sub-task', subtask: true },
        ],
      };
    }

    try {
      const baseUrl = this.cleanBaseUrl(config.serverUrl);
      const isCloud = config.authType === 'cloud';
      const apiVer = isCloud ? '3' : '2';
      const url = projectKey
        ? `${baseUrl}/rest/api/${apiVer}/issue/createmeta/${projectKey}/issuetypes`
        : `${baseUrl}/rest/api/${apiVer}/issuetype`;

      logger.info(`Fetching issue types from: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(config),
      });

      if (!response.ok) {
        // Fallback to global issuetype if project createmeta isn't available
        const fallbackUrl = `${baseUrl}/rest/api/${apiVer}/issuetype`;
        const fbRes = await fetch(fallbackUrl, {
          method: 'GET',
          headers: this.getAuthHeaders(config),
        });
        if (!fbRes.ok) {
          const text = await fbRes.text();
          return { issueTypes: [], error: this.parseErrorResponse(fbRes.status, fbRes.statusText, text) };
        }
        const fbData = (await fbRes.json()) as any[];
        return {
          issueTypes: fbData.map((t: any) => ({
            id: t.id,
            name: t.name,
            iconUrl: t.iconUrl,
            subtask: !!t.subtask,
          })),
        };
      }

      const data = await response.json();
      const rawTypes = Array.isArray(data) ? data : data.values || [];
      const issueTypes: JiraIssueType[] = rawTypes.map((t: any) => ({
        id: t.id,
        name: t.name,
        iconUrl: t.iconUrl,
        subtask: !!t.subtask,
      }));

      return { issueTypes };
    } catch (err: any) {
      logger.error('getIssueTypes exception', err);
      return { issueTypes: [], error: err.message };
    }
  }

  public async createIssue(payload: CreateIssuePayload): Promise<{ success: boolean; issue?: JiraIssue; error?: string }> {
    const config = this.getConfig();

    if (config.demoMode) {
      const newKey = `${payload.projectKey}-${Math.floor(100 + Math.random() * 900)}`;
      const newIssue: JiraIssue = {
        id: `demo-${Date.now()}`,
        key: newKey,
        summary: payload.summary,
        description: payload.description || '',
        status: { id: '1', name: 'To Do', category: 'To Do' },
        priority: { id: payload.priorityId || '3', name: 'Medium' },
        issueType: { id: payload.issueTypeId, name: 'Task', subtask: false },
        assignee: this.demoStore.user,
        reporter: this.demoStore.user,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        projectKey: payload.projectKey,
      };
      this.demoStore.issues.unshift(newIssue);
      return { success: true, issue: newIssue };
    }

    try {
      const baseUrl = this.cleanBaseUrl(config.serverUrl);
      const isCloud = config.authType === 'cloud';
      const apiVer = isCloud ? '3' : '2';
      const url = `${baseUrl}/rest/api/${apiVer}/issue`;

      logger.info(`Creating issue in Jira: ${payload.projectKey} - ${payload.summary}`);

      let descriptionField: any = payload.description || '';
      if (isCloud && payload.description) {
        descriptionField = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: payload.description }],
            },
          ],
        };
      }

      const bodyFields: any = {
        project: { key: payload.projectKey },
        summary: payload.summary,
        issuetype: { id: payload.issueTypeId },
      };

      if (payload.description) {
        bodyFields.description = descriptionField;
      }

      if (payload.priorityId) {
        bodyFields.priority = { id: payload.priorityId };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(config),
        body: JSON.stringify({ fields: bodyFields }),
      });

      const text = await response.text();
      if (!response.ok) {
        const errorMsg = this.parseErrorResponse(response.status, response.statusText, text);
        logger.error(`createIssue failed: ${response.status}`, { errorMsg });
        return { success: false, error: errorMsg };
      }

      const data = JSON.parse(text);
      logger.info(`Created issue successfully: ${data.key}`);

      return {
        success: true,
        issue: {
          id: data.id,
          key: data.key,
          summary: payload.summary,
          status: { id: '1', name: 'To Do', category: 'To Do' },
          updated: new Date().toISOString(),
        },
      };
    } catch (err: any) {
      logger.error('createIssue exception', err);
      return { success: false, error: err.message };
    }
  }

  public async getIssueComments(issueKey: string): Promise<{ comments: JiraComment[]; error?: string }> {
    const config = this.getConfig();

    if (config.demoMode) {
      return {
        comments: [
          {
            id: 'c1',
            author: this.demoStore.user,
            body: 'Initial analysis completed. Proceeding with implementation.',
            created: new Date(Date.now() - 3600000 * 4).toISOString(),
          },
          {
            id: 'c2',
            author: { id: 'u2', displayName: 'QA Engineer' },
            body: 'Test cases added to the verification checklist.',
            created: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
        ],
      };
    }

    try {
      const baseUrl = this.cleanBaseUrl(config.serverUrl);
      const isCloud = config.authType === 'cloud';
      const apiVer = isCloud ? '3' : '2';
      const url = `${baseUrl}/rest/api/${apiVer}/issue/${issueKey}/comment`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(config),
      });

      if (!response.ok) {
        const text = await response.text();
        return { comments: [], error: this.parseErrorResponse(response.status, response.statusText, text) };
      }

      const data = (await response.json()) as any;
      const rawComments: any[] = data.comments || [];

      const comments: JiraComment[] = rawComments.map((c: any) => {
        let bodyText = '';
        if (typeof c.body === 'string') {
          bodyText = c.body;
        } else if (c.body && typeof c.body === 'object') {
          try {
            bodyText = (c.body.content || [])
              .map((p: any) => (p.content || []).map((t: any) => t.text || '').join(''))
              .filter(Boolean)
              .join('\n\n');
          } catch {
            bodyText = '';
          }
        }

        return {
          id: c.id,
          author: {
            id: c.author?.accountId || c.author?.name || 'unknown',
            displayName: c.author?.displayName || 'User',
            avatarUrl: c.author?.avatarUrls?.['48x48'],
          },
          body: bodyText,
          created: c.created,
          updated: c.updated,
        };
      });

      return { comments };
    } catch (err: any) {
      logger.error('getIssueComments exception', err);
      return { comments: [], error: err.message };
    }
  }

  public async addIssueComment(issueKey: string, body: string): Promise<{ success: boolean; comment?: JiraComment; error?: string }> {
    const config = this.getConfig();

    if (config.demoMode) {
      const comment: JiraComment = {
        id: `c-${Date.now()}`,
        author: this.demoStore.user,
        body,
        created: new Date().toISOString(),
      };
      return { success: true, comment };
    }

    try {
      const baseUrl = this.cleanBaseUrl(config.serverUrl);
      const isCloud = config.authType === 'cloud';
      const apiVer = isCloud ? '3' : '2';
      const url = `${baseUrl}/rest/api/${apiVer}/issue/${issueKey}/comment`;

      let commentPayload: any = { body };
      if (isCloud) {
        commentPayload = {
          body: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: body }],
              },
            ],
          },
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(config),
        body: JSON.stringify(commentPayload),
      });

      const text = await response.text();
      if (!response.ok) {
        const errorMsg = this.parseErrorResponse(response.status, response.statusText, text);
        return { success: false, error: errorMsg };
      }

      const data = JSON.parse(text);
      return {
        success: true,
        comment: {
          id: data.id,
          author: {
            id: data.author?.accountId || data.author?.name || 'me',
            displayName: data.author?.displayName || 'Me',
          },
          body,
          created: data.created || new Date().toISOString(),
        },
      };
    } catch (err: any) {
      logger.error('addIssueComment exception', err);
      return { success: false, error: err.message };
    }
  }
}

