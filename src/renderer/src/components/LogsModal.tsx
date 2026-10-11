import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  FolderOpen,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { LogEntry } from '../../../types/jira';

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogsModal: React.FC<LogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ERROR' | 'WARN' | 'INFO'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchLogs = async () => {
    if (!window.jiraApi) return;
    setLoading(true);
    try {
      const entries = await window.jiraApi.getLogs();
      setLogs(entries.reverse()); // most recent first
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all logs?')) {
      await window.jiraApi?.clearLogs();
      fetchLogs();
    }
  };

  const handleCopy = () => {
    const text = logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.level}] ${l.message}${
            l.details ? ' ' + JSON.stringify(l.details) : ''
          }`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((l) => {
    if (filter !== 'ALL' && l.level !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchMsg = l.message.toLowerCase().includes(q);
      const matchDet = l.details ? JSON.stringify(l.details).toLowerCase().includes(q) : false;
      return matchMsg || matchDet;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Diagnostics & Logs</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect Jira API requests, response status codes, and application events
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.jiraApi?.openLogsFile()}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
              title="Open log file in default text editor"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Open .log File</span>
            </button>
            <button
              onClick={() => window.jiraApi?.openLogsFolder()}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
              title="Open logs directory in Explorer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Open Folder</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter logs..."
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 w-56 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
            />

            <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 text-xs">
              {(['ALL', 'ERROR', 'WARN', 'INFO'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilter(lvl)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    filter === lvl ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy All'}</span>
            </button>

            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-500/20 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
              title="Clear Logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Log Entries List */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 bg-slate-50 dark:bg-slate-950/60">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-sans">
              No log entries match your filter.
            </div>
          ) : (
            filteredLogs.map((log, idx) => {
              const isError = log.level === 'ERROR';
              const isWarn = log.level === 'WARN';
              const isInfo = log.level === 'INFO';

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border leading-relaxed break-all shadow-sm ${
                    isError
                      ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30 text-rose-900 dark:text-rose-300'
                      : isWarn
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-300'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 text-[11px] mb-1">
                    <span className="text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                        isError
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                          : isWarn
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="font-semibold">{log.message}</span>
                  </div>

                  {log.details && (
                    <pre className="mt-1 p-2 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 text-[11px] text-slate-700 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap">
                      {typeof log.details === 'string'
                        ? log.details
                        : JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
