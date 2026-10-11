import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Copy,
  Check,
  Send,
  X,
  AlertTriangle,
} from 'lucide-react';
import { JiraIssue, JiraWorklog } from '../../../types/jira';

interface StandupModalProps {
  isOpen: boolean;
  onClose: () => void;
  worklogs: JiraWorklog[];
  issues: JiraIssue[];
}

export const StandupModal: React.FC<StandupModalProps> = ({
  isOpen,
  onClose,
  worklogs,
  issues,
}) => {
  const [copied, setCopied] = useState(false);
  const [blockers, setBlockers] = useState<string>('None');

  if (!isOpen) return null;

  // Compute yesterday and today's dates
  const today = new Date();
  const yesterday = new Date();
  // If today is Monday, look back to Friday (3 days)
  if (today.getDay() === 1) {
    yesterday.setDate(today.getDate() - 3);
  } else {
    yesterday.setDate(today.getDate() - 1);
  }

  const yestStr = yesterday.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  // Yesterday's logged tickets
  const yestLogs = worklogs.filter((w) => w.started.slice(0, 10) === yestStr);
  const yestIssueKeys = Array.from(new Set(yestLogs.map((w) => w.issueKey)));
  const yestEntries = yestIssueKeys.map((key) => {
    const logs = yestLogs.filter((w) => w.issueKey === key);
    const totalSec = logs.reduce((a, c) => a + (c.timeSpentSeconds || 0), 0);
    const hours = (totalSec / 3600).toFixed(1);
    const summary = logs[0]?.issueSummary || issues.find((i) => i.key === key)?.summary || '';
    return { key, summary, hours };
  });

  // Today's assigned active tickets (In Progress or To Do)
  const todayIssues = issues.filter(
    (i) =>
      i.status.category.toLowerCase().includes('progress') ||
      i.status.category.toLowerCase().includes('to do')
  );

  // Generate Slack / Teams markdown
  const markdownText = `*Daily Standup Update - ${today.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}*

*1. What I did yesterday:*
${
  yestEntries.length > 0
    ? yestEntries.map((e) => `• [${e.key}] ${e.summary} (${e.hours}h logged)`).join('\n')
    : '• Continued ongoing assigned tasks and sprint tickets'
}

*2. What I plan to do today:*
${
  todayIssues.length > 0
    ? todayIssues.slice(0, 5).map((i) => `• [${i.key}] ${i.summary} (${i.status.name})`).join('\n')
    : '• Pick next sprint backlog ticket from Jira board'
}

*3. Blockers:*
• ${blockers.trim() || 'None'}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Daily Standup Generator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1-click formatted Slack / Teams update generated from your Jira tickets & worklogs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
          {/* Custom Blockers input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Any Impediments or Blockers today?
            </label>
            <input
              type="text"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="e.g. Waiting on API deployment from DevOps, or None"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Formatted Markdown Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Markdown Output (Slack / Microsoft Teams):
              </span>
              <button
                onClick={handleCopy}
                className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
              {markdownText}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium"
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
