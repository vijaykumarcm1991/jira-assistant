import React from 'react';
import {
  PieChart,
  BarChart3,
  Clock,
  TrendingUp,
  FolderGit2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { JiraIssue, JiraWorklog } from '../../../types/jira';

interface DashboardViewProps {
  worklogs: JiraWorklog[];
  issues: JiraIssue[];
  targetHours: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  worklogs,
  issues,
  targetHours,
}) => {
  // Aggregate time spent by Project
  const projectMap: Record<string, number> = {};
  worklogs.forEach((w) => {
    const proj = w.issueKey.split('-')[0] || 'OTHER';
    projectMap[proj] = (projectMap[proj] || 0) + (w.timeSpentSeconds || 0);
  });

  const totalLoggedSec = worklogs.reduce((acc, c) => acc + (c.timeSpentSeconds || 0), 0);
  const totalLoggedHours = (totalLoggedSec / 3600).toFixed(1);

  const projectStats = Object.entries(projectMap)
    .map(([key, sec]) => ({
      key,
      hours: (sec / 3600).toFixed(1),
      percent: totalLoggedSec > 0 ? Math.round((sec / totalLoggedSec) * 100) : 0,
    }))
    .sort((a, b) => Number(b.hours) - Number(a.hours));

  // Issues by status category
  const statusMap: Record<string, number> = {};
  issues.forEach((i) => {
    const cat = i.status.category || 'Other';
    statusMap[cat] = (statusMap[cat] || 0) + 1;
  });

  // Recent high-logged issues
  const issueTimeMap: Record<string, { summary: string; sec: number }> = {};
  worklogs.forEach((w) => {
    if (!issueTimeMap[w.issueKey]) {
      issueTimeMap[w.issueKey] = {
        summary: w.issueSummary || w.issueKey,
        sec: 0,
      };
    }
    issueTimeMap[w.issueKey].sec += w.timeSpentSeconds || 0;
  });

  const topIssues = Object.entries(issueTimeMap)
    .map(([key, data]) => ({
      key,
      summary: data.summary,
      hours: (data.sec / 3600).toFixed(1),
      sec: data.sec,
    }))
    .sort((a, b) => b.sec - a.sec)
    .slice(0, 5);

  const palette = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-indigo-500',
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PieChart className="w-5 h-5 text-blue-500" />
          Visual Analytics & Gadgets
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Time distribution metrics by project, issue, and workflow categories
        </p>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Logged Time</div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{totalLoggedHours}h</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Projects</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{projectStats.length}</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Assigned Issues</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{issues.length}</div>
            </div>
          </div>
        </div>

        {/* Charts & Distribution Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Time Distribution */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Time by Project
            </h3>

            {projectStats.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No worklogs recorded yet</div>
            ) : (
              <div className="space-y-3">
                {projectStats.map((p, idx) => (
                  <div key={p.key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{p.key}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        {p.hours}h ({p.percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${palette[idx % palette.length]} transition-all duration-500`}
                        style={{ width: `${p.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Time Consuming Issues */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Top Time Consuming Issues
            </h3>

            {topIssues.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No ticket logs recorded yet</div>
            ) : (
              <div className="space-y-3">
                {topIssues.map((iss) => (
                  <div
                    key={iss.key}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="truncate pr-3">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 mr-2">
                        {iss.key}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">{iss.summary}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                      {iss.hours}h
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
