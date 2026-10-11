import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { JiraIssue, LogWorkPayload } from '../../../types/jira';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: LogWorkPayload) => Promise<boolean>;
  initialIssueKey?: string;
  initialDuration?: string;
  initialComment?: string;
  issues: JiraIssue[];
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialIssueKey = '',
  initialDuration = '',
  initialComment = '',
  issues,
}) => {
  const [issueKey, setIssueKey] = useState(initialIssueKey);
  const [timeSpent, setTimeSpent] = useState(initialDuration || '1h');
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 16));
  const [comment, setComment] = useState(initialComment);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIssueKey(initialIssueKey || (issues[0]?.key ?? ''));
      setTimeSpent(initialDuration || '1h');
      setComment(initialComment || '');
      setDateStr(new Date().toISOString().slice(0, 16));
      setError(null);
    }
  }, [isOpen, initialIssueKey, initialDuration, initialComment, issues]);

  if (!isOpen) return null;

  const quickDurations = ['15m', '30m', '1h', '2h', '3h 30m', '4h'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueKey.trim()) {
      setError('Please specify an issue key.');
      return;
    }
    if (!timeSpent.trim()) {
      setError('Please specify time spent (e.g. 1h 30m).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const success = await onSubmit({
        issueKey: issueKey.trim().toUpperCase(),
        timeSpent: timeSpent.trim(),
        started: new Date(dateStr).toISOString(),
        comment: comment.trim(),
      });
      if (success) {
        onClose();
      } else {
        setError('Failed to log work. Please check Jira connection.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Log Work</h2>
              <p className="text-xs text-slate-400">Submit time spent to Jira</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Issue Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Issue Key / Ticket
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={issueKey}
                onChange={(e) => setIssueKey(e.target.value.toUpperCase())}
                placeholder="e.g. ENG-2041"
                required
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              {issues.length > 0 && (
                <select
                  onChange={(e) => setIssueKey(e.target.value)}
                  value={issueKey}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[150px]"
                >
                  <option value="">Recent...</option>
                  {issues.map((i) => (
                    <option key={i.key} value={i.key}>
                      {i.key} - {i.summary.slice(0, 20)}...
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Time Spent & Quick Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">Time Spent</label>
              <span className="text-[11px] text-slate-500">e.g. 1h 30m, 45m</span>
            </div>
            <input
              type="text"
              value={timeSpent}
              onChange={(e) => setTimeSpent(e.target.value)}
              placeholder="e.g. 1h 30m"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickDurations.map((dur) => (
                <button
                  type="button"
                  key={dur}
                  onClick={() => setTimeSpent(dur)}
                  className={`text-xs px-2.5 py-1 rounded-md font-mono transition ${
                    timeSpent === dur
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {dur}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Date Started
            </label>
            <input
              type="datetime-local"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Worklog Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              Work Description / Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="What did you work on? (optional)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>Submit Worklog</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
