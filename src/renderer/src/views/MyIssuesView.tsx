import React, { useState } from 'react';
import {
  CheckSquare,
  Play,
  Plus,
  Search,
  Clock,
  Layers,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { JiraIssue } from '../../../types/jira';

interface MyIssuesViewProps {
  issues: JiraIssue[];
  activeTimerIssueKey: string | null;
  onStartTimer: (issueKey: string, summary: string) => void;
  onOpenQuickLog: (issueKey: string) => void;
  onTransitionIssue: (issueKey: string, transitionId: string) => Promise<void>;
  onRefresh: () => void;
  loading: boolean;
}

export const MyIssuesView: React.FC<MyIssuesViewProps> = ({
  issues,
  activeTimerIssueKey,
  onStartTimer,
  onOpenQuickLog,
  onTransitionIssue,
  onRefresh,
  loading,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.summary.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'in-progress') return issue.status.category.toLowerCase().includes('progress');
    if (filter === 'todo') return issue.status.category.toLowerCase().includes('to do') || issue.status.name.toLowerCase().includes('to do');
    if (filter === 'done') return issue.status.category.toLowerCase().includes('done');
    return true;
  });

  const getPriorityColor = (priorityName?: string) => {
    switch (priorityName?.toLowerCase()) {
      case 'highest':
      case 'high':
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20';
    }
  };

  const getStatusColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'done':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      case 'in progress':
        return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      {/* Header Bar */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-500" />
            My Assigned Issues
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your sprint backlog, track work, and transition workflow statuses
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by key or summary..."
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 md:w-64 shadow-sm"
            />
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition"
            title="Refresh Issues"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 flex items-center space-x-2">
        {[
          { id: 'all', label: `All (${issues.length})` },
          { id: 'in-progress', label: `In Progress (${issues.filter(i => i.status.category.toLowerCase().includes('progress')).length})` },
          { id: 'todo', label: `To Do (${issues.filter(i => i.status.category.toLowerCase().includes('to do') || i.status.name.toLowerCase().includes('to do')).length})` },
          { id: 'done', label: `Done (${issues.filter(i => i.status.category.toLowerCase().includes('done')).length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
        {filteredIssues.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2">
            <CheckSquare className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-800 dark:text-slate-300">No issues found matching criteria</p>
            <p className="text-xs text-slate-500">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const isTimerActive = activeTimerIssueKey === issue.key;

            return (
              <div
                key={issue.key}
                className={`bg-white dark:bg-slate-950 border rounded-xl p-4 transition-all duration-200 shadow-sm ${
                  isTimerActive
                    ? 'border-blue-500/80 bg-blue-50/50 dark:bg-blue-950/20 shadow-lg shadow-blue-500/5'
                    : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Key, Summary, Badges */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        {issue.key}
                      </span>

                      {issue.priority && (
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded border ${getPriorityColor(
                            issue.priority.name
                          )}`}
                        >
                          {issue.priority.name}
                        </span>
                      )}

                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded border ${getStatusColor(
                          issue.status.category
                        )}`}
                      >
                        {issue.status.name}
                      </span>

                      {issue.issueType && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          {issue.issueType.name}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight leading-snug">
                      {issue.summary}
                    </h3>

                    {/* Time Tracking Progress */}
                    {issue.timeTracking && (
                      <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          Spent:{' '}
                          <span className="text-slate-800 dark:text-slate-200 font-semibold font-mono">
                            {issue.timeTracking.timeSpent || '0m'}
                          </span>
                        </span>
                        {issue.timeTracking.remainingEstimate && (
                          <span>
                            Remaining:{' '}
                            <span className="text-slate-800 dark:text-slate-200 font-semibold font-mono">
                              {issue.timeTracking.remainingEstimate}
                            </span>
                          </span>
                        )}
                        {issue.timeTracking.originalEstimate && (
                          <span>
                            Estimate:{' '}
                            <span className="text-slate-800 dark:text-slate-200 font-semibold font-mono">
                              {issue.timeTracking.originalEstimate}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Quick Actions & Status Workflow */}
                  <div className="flex items-center space-x-2.5 shrink-0 self-end md:self-center">
                    {/* Status Transition Select */}
                    <select
                      value={issue.status.name}
                      onChange={(e) => {
                        const targetName = e.target.value;
                        const transId = targetName === 'Done' ? '31' : targetName === 'In Progress' ? '21' : '11';
                        onTransitionIssue(issue.key, transId);
                      }}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>

                    {/* Log Work Button */}
                    <button
                      onClick={() => onOpenQuickLog(issue.key)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
                      title="Log Work"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log</span>
                    </button>

                    {/* Start Timer Button */}
                    <button
                      onClick={() => onStartTimer(issue.key, issue.summary)}
                      className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                        isTimerActive
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isTimerActive ? 'Tracking' : 'Timer'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
