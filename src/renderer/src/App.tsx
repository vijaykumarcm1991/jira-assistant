import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { QuickLogModal } from './components/QuickLogModal';
import { LogsModal } from './components/LogsModal';
import { StandupModal } from './components/StandupModal';
import { CreateIssueModal } from './components/CreateIssueModal';
import { TimesheetView } from './views/TimesheetView';
import { MyIssuesView } from './views/MyIssuesView';
import { KanbanBoardView } from './views/KanbanBoardView';
import { JqlSearchView } from './views/JqlSearchView';
import { DashboardView } from './views/DashboardView';
import { SettingsView } from './views/SettingsView';
import {
  JiraConfig,
  JiraIssue,
  JiraUser,
  JiraWorklog,
  LogWorkPayload,
  TimerState,
  ThemeMode,
} from '../../types/jira';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('timesheet');
  const [config, setConfig] = useState<JiraConfig | null>(null);
  const [user, setUser] = useState<JiraUser | null>(null);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [worklogs, setWorklogs] = useState<JiraWorklog[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [standupModalOpen, setStandupModalOpen] = useState(false);
  const [createIssueModalOpen, setCreateIssueModalOpen] = useState(false);

  // Theme State (Dark / Light)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('jira_theme') as ThemeMode) || 'dark';
  });

  // Floating Mini Stopwatch Widget compact mode state
  const [isCompact, setIsCompact] = useState(false);

  // Apply theme to document root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('jira_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleCompactMode = () => {
    const next = !isCompact;
    setIsCompact(next);
    window.jiraApi?.setCompactMode(next);
  };

  // Timer State
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    issueKey: null,
    issueSummary: null,
    startedAt: null,
    elapsedSeconds: 0,
    notes: '',
  });

  // Quick Log Modal State
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [quickLogTargetKey, setQuickLogTargetKey] = useState<string>('');
  const [quickLogDuration, setQuickLogDuration] = useState<string>('');
  const [quickLogComment, setQuickLogComment] = useState<string>('');

  // Toast alert
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Helper format seconds to duration
  const formatSecondsToJira = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${Math.max(1, m)}m`;
  };

  // Load config and initial data
  useEffect(() => {
    const init = async () => {
      try {
        if (!window.jiraApi) return;
        const cfg = await window.jiraApi.getConfig();
        setConfig(cfg);

        // Load active timer state
        const savedTimer = await window.jiraApi.getTimerState();
        if (savedTimer) {
          // If was running, adjust for elapsed wall time
          if (savedTimer.isRunning && savedTimer.startedAt) {
            const added = Math.floor((Date.now() - savedTimer.startedAt) / 1000);
            savedTimer.elapsedSeconds += Math.max(0, added);
            savedTimer.startedAt = Date.now();
          }
          setTimer(savedTimer);
        }

        // Test / Get user profile
        const conn = await window.jiraApi.testConnection();
        if (conn.user) setUser(conn.user);

        // Load issues and worklogs
        await loadData();
      } catch (err) {
        console.error('Failed to init app:', err);
      }
    };
    init();
  }, []);

  const loadData = async () => {
    if (!window.jiraApi) return;
    setLoadingIssues(true);
    try {
      const issuesRes = await window.jiraApi.getMyIssues();
      if (issuesRes.issues) {
        setIssues(issuesRes.issues);
      }

      // Fetch worklogs for current month window
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
      const worklogsRes = await window.jiraApi.getWorklogs(start, end);
      if (worklogsRes.worklogs) {
        setWorklogs(worklogsRes.worklogs);
      }
    } finally {
      setLoadingIssues(false);
    }
  };

  // Calculate today's logged seconds
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLoggedSeconds = worklogs
    .filter((w) => w.started.slice(0, 10) === todayStr)
    .reduce((acc, curr) => acc + (curr.timeSpentSeconds || 0), 0);

  // Active Timer Interval
  const timerRef = useRef(timer);
  timerRef.current = timer;

  useEffect(() => {
    let reminderFiredToday = false;

    const interval = setInterval(async () => {
      // Stopwatch increment
      if (timerRef.current.isRunning) {
        setTimer((prev: TimerState) => {
          const updated: TimerState = {
            ...prev,
            elapsedSeconds: prev.elapsedSeconds + 1,
          };
          if (updated.elapsedSeconds % 10 === 0 && window.jiraApi) {
            window.jiraApi.updateTimerState(updated);
          }
          return updated;
        });

        // Idle time check when timer is actively running
        if (window.jiraApi && config?.idleDetectionMinutes) {
          const idleSec = await window.jiraApi.getSystemIdleTime();
          const idleThresholdSec = (config.idleDetectionMinutes || 15) * 60;
          if (idleSec >= idleThresholdSec) {
            window.jiraApi.showNotification(
              'Away from Keyboard Detected',
              `You have been idle for ${Math.floor(idleSec / 60)} minutes while tracking ${timerRef.current.issueKey || 'time'}.`
            );
          }
        }
      }

      // Daily worklog reminder notification check
      const now = new Date();
      const currentHHMM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const targetTime = config?.reminderTime || '17:30';

      if (currentHHMM === targetTime && !reminderFiredToday && window.jiraApi) {
        reminderFiredToday = true;
        const targetSec = (config?.targetHoursPerDay || 8) * 3600;
        if (todayLoggedSeconds < targetSec) {
          window.jiraApi.showNotification(
            'Daily Worklog Reminder',
            `You have logged ${(todayLoggedSeconds / 3600).toFixed(1)}h of your ${config?.targetHoursPerDay || 8}h goal today.`
          );
        }
      } else if (currentHHMM !== targetTime) {
        reminderFiredToday = false;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [config, todayLoggedSeconds]);

  // Timer controls
  const handleToggleTimer = () => {
    const nextRunning = !timer.isRunning;
    const updated: TimerState = {
      ...timer,
      isRunning: nextRunning,
      startedAt: nextRunning ? Date.now() : null,
    };
    setTimer(updated);
    window.jiraApi?.updateTimerState(updated);
  };

  const handleStartTimer = (issueKey: string, summary: string) => {
    const updated: TimerState = {
      isRunning: true,
      issueKey,
      issueSummary: summary,
      startedAt: Date.now(),
      elapsedSeconds: timer.issueKey === issueKey ? timer.elapsedSeconds : 0,
      notes: '',
    };
    setTimer(updated);
    window.jiraApi?.updateTimerState(updated);
    window.jiraApi?.showNotification('Timer Started', `Tracking time for ${issueKey}`);
    showToast(`Timer started for ${issueKey}`);
  };

  const handleStopAndLog = () => {
    if (!timer.issueKey) return;
    const duration = formatSecondsToJira(timer.elapsedSeconds);
    setQuickLogTargetKey(timer.issueKey);
    setQuickLogDuration(duration);
    setQuickLogComment(timer.notes || '');
    setQuickLogOpen(true);
  };

  const handleDiscardTimer = () => {
    const updated: TimerState = {
      isRunning: false,
      issueKey: null,
      issueSummary: null,
      startedAt: null,
      elapsedSeconds: 0,
      notes: '',
    };
    setTimer(updated);
    window.jiraApi?.updateTimerState(updated);
    showToast('Timer discarded.');
  };

  // Worklog actions
  const handleSubmitWorklog = async (payload: LogWorkPayload): Promise<boolean> => {
    if (!window.jiraApi) return false;
    const res = await window.jiraApi.logWork(payload);
    if (res.success) {
      showToast(`Worklog of ${payload.timeSpent} logged to ${payload.issueKey}!`);
      window.jiraApi.showNotification('Work Logged', `Logged ${payload.timeSpent} on ${payload.issueKey}`);

      // If logging for the active timer ticket, reset the timer
      if (timer.issueKey === payload.issueKey) {
        handleDiscardTimer();
      }

      await loadData();
      return true;
    }
    return false;
  };

  const handleDeleteWorklog = async (issueKey: string, worklogId: string) => {
    if (!window.jiraApi) return;
    const ok = await window.jiraApi.deleteWorklog(issueKey, worklogId);
    if (ok.success) {
      showToast('Worklog entry removed.');
      await loadData();
    }
  };

  const handleTransitionIssue = async (issueKey: string, transitionId: string) => {
    if (!window.jiraApi) return;
    const res = await window.jiraApi.transitionIssue(issueKey, transitionId);
    if (res.success) {
      showToast(`Status updated for ${issueKey}`);
      await loadData();
    }
  };

  const handleSaveConfig = async (newConfig: JiraConfig): Promise<boolean> => {
    if (!window.jiraApi) return false;
    const res = await window.jiraApi.saveConfig(newConfig);
    if (res.success) {
      setConfig(newConfig);
      await loadData();
      return true;
    }
    return false;
  };

  const handleTestConnection = async (testConfig: JiraConfig) => {
    if (!window.jiraApi) return { success: false, error: 'API unavailable' };
    const res = await window.jiraApi.testConnection(testConfig);
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors">
      {/* Top Header with Active Stopwatch Mini-Bar */}
      <Header
        timer={timer}
        config={config}
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleTimer={handleToggleTimer}
        onStopAndLog={handleStopAndLog}
        onDiscardTimer={handleDiscardTimer}
        onOpenQuickLog={() => {
          setQuickLogTargetKey(issues[0]?.key || '');
          setQuickLogDuration('1h');
          setQuickLogComment('');
          setQuickLogOpen(true);
        }}
        onOpenCreateIssue={() => setCreateIssueModalOpen(true)}
        onOpenStandupModal={() => setStandupModalOpen(true)}
        onToggleCompactMode={toggleCompactMode}
        onOpenLogsModal={() => setLogsModalOpen(true)}
      />

      {/* Main Body with Sidebar + Tab View */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          user={user}
          todayLoggedSeconds={todayLoggedSeconds}
          targetHours={config?.targetHoursPerDay || 8}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          {currentTab === 'timesheet' && (
            <TimesheetView
              worklogs={worklogs}
              targetHours={config?.targetHoursPerDay || 8}
              onOpenQuickLogWithIssue={(issueKey, duration, comment) => {
                setQuickLogTargetKey(issueKey || issues[0]?.key || '');
                setQuickLogDuration(duration || '1h');
                setQuickLogComment(comment || '');
                setQuickLogOpen(true);
              }}
              onDeleteWorklog={handleDeleteWorklog}
              onStartTimer={handleStartTimer}
            />
          )}

          {currentTab === 'my-issues' && (
            <MyIssuesView
              issues={issues}
              activeTimerIssueKey={timer.issueKey}
              onStartTimer={handleStartTimer}
              onOpenQuickLog={(key) => {
                setQuickLogTargetKey(key);
                setQuickLogDuration('1h');
                setQuickLogComment('');
                setQuickLogOpen(true);
              }}
              onTransitionIssue={handleTransitionIssue}
              onRefresh={loadData}
              loading={loadingIssues}
            />
          )}

          {currentTab === 'kanban' && (
            <KanbanBoardView
              issues={issues}
              activeTimerIssueKey={timer.issueKey}
              onStartTimer={handleStartTimer}
              onOpenQuickLog={(key) => {
                setQuickLogTargetKey(key);
                setQuickLogDuration('1h');
                setQuickLogComment('');
                setQuickLogOpen(true);
              }}
              onTransitionIssue={handleTransitionIssue}
              onRefresh={loadData}
              loading={loadingIssues}
            />
          )}

          {currentTab === 'jql-search' && (
            <JqlSearchView
              onSearch={async (options, fields) => {
                const res = await window.jiraApi?.searchJql(options as any, fields);
                return {
                  issues: res?.issues || [],
                  total: res?.total,
                  startAt: res?.startAt,
                  maxResults: res?.maxResults,
                  error: res?.error,
                };
              }}
              onStartTimer={handleStartTimer}
              onOpenQuickLog={(key) => {
                setQuickLogTargetKey(key);
                setQuickLogDuration('1h');
                setQuickLogComment('');
                setQuickLogOpen(true);
              }}
              onOpenLogsModal={() => setLogsModalOpen(true)}
              serverUrl={config?.serverUrl}
            />
          )}

          {currentTab === 'analytics' && (
            <DashboardView
              worklogs={worklogs}
              issues={issues}
              targetHours={config?.targetHoursPerDay || 8}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              initialConfig={config}
              onSaveConfig={handleSaveConfig}
              onTestConnection={handleTestConnection}
            />
          )}
        </main>
      </div>

      {/* Quick Log Modal */}
      <QuickLogModal
        isOpen={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        onSubmit={handleSubmitWorklog}
        initialIssueKey={quickLogTargetKey}
        initialDuration={quickLogDuration}
        initialComment={quickLogComment}
        issues={issues}
      />

      {/* Daily Standup Generator Modal */}
      <StandupModal
        isOpen={standupModalOpen}
        onClose={() => setStandupModalOpen(false)}
        worklogs={worklogs}
        issues={issues}
      />

      {/* Create Issue Modal */}
      <CreateIssueModal
        isOpen={createIssueModalOpen}
        onClose={() => setCreateIssueModalOpen(false)}
        onIssueCreated={(newIssue) => {
          showToast(`Issue ${newIssue.key} created successfully!`);
          loadData();
        }}
      />

      {/* Logs and Diagnostics Modal */}
      <LogsModal
        isOpen={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-medium flex items-center space-x-2 animate-in slide-in-from-bottom-3 duration-200">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
