import React from 'react';
import {
  LayoutGrid,
  Play,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { JiraIssue } from '../../../types/jira';

interface KanbanBoardViewProps {
  issues: JiraIssue[];
  activeTimerIssueKey: string | null;
  onStartTimer: (issueKey: string, summary: string) => void;
  onOpenQuickLog: (issueKey: string) => void;
  onTransitionIssue: (issueKey: string, transitionId: string) => Promise<void>;
  onRefresh: () => void;
  loading: boolean;
}

export const KanbanBoardView: React.FC<KanbanBoardViewProps> = ({
  issues,
  activeTimerIssueKey,
  onStartTimer,
  onOpenQuickLog,
  onTransitionIssue,
  onRefresh,
  loading,
}) => {
  const columns = [
    {
      id: 'todo',
      title: 'To Do',
      color: 'border-slate-300 dark:border-slate-800',
      badgeBg: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      filter: (i: JiraIssue) =>
        i.status.category.toLowerCase().includes('to do') ||
        i.status.name.toLowerCase().includes('to do') ||
        i.status.name.toLowerCase().includes('open'),
      transitionId: '11',
    },
    {
      id: 'inprogress',
      title: 'In Progress',
      color: 'border-blue-400 dark:border-blue-500/40',
      badgeBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
      filter: (i: JiraIssue) => i.status.category.toLowerCase().includes('progress'),
      transitionId: '21',
    },
    {
      id: 'done',
      title: 'Done',
      color: 'border-emerald-400 dark:border-emerald-500/40',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
      filter: (i: JiraIssue) => i.status.category.toLowerCase().includes('done'),
      transitionId: '31',
    },
  ];

  const getPriorityBadge = (priorityName?: string) => {
    switch (priorityName?.toLowerCase()) {
      case 'highest':
      case 'high':
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-blue-500" />
            Sprint Kanban Board
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualize your workflow states and transition sprint cards
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm transition"
          title="Refresh board"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6 flex gap-6">
        {columns.map((col) => {
          const colIssues = issues.filter(col.filter);
          return (
            <div
              key={col.id}
              className={`flex-1 min-w-[280px] max-w-[420px] flex flex-col bg-slate-50 dark:bg-slate-950/60 rounded-2xl border ${col.color} p-4 shadow-sm`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {col.title}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${col.badgeBg}`}>
                    {colIssues.length}
                  </span>
                </div>
              </div>

              {/* Column Issue Cards */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colIssues.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No tickets in this column
                  </div>
                ) : (
                  colIssues.map((issue) => {
                    const isTracking = activeTimerIssueKey === issue.key;
                    return (
                      <div
                        key={issue.key}
                        className={`p-3.5 rounded-xl border bg-white dark:bg-slate-900 shadow-sm transition space-y-2.5 ${
                          isTracking
                            ? 'border-blue-500 ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                            {issue.key}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadge(
                              issue.priority?.name
                            )}`}
                          >
                            {issue.priority?.name || 'Medium'}
                          </span>
                        </div>

                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                          {issue.summary}
                        </p>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => onStartTimer(issue.key, issue.summary)}
                              className="p-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition"
                              title="Start timer"
                            >
                              <Play className="w-3 h-3 fill-current" />
                            </button>
                            <button
                              onClick={() => onOpenQuickLog(issue.key)}
                              className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                              title="Log work"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Quick Workflow Transition action */}
                          {col.id === 'todo' && (
                            <button
                              onClick={() => onTransitionIssue(issue.key, '21')}
                              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                            >
                              <span>Start</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          {col.id === 'inprogress' && (
                            <button
                              onClick={() => onTransitionIssue(issue.key, '31')}
                              className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                            >
                              <span>Resolve</span>
                              <CheckCircle2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
