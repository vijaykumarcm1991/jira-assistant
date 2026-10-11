import React from 'react';
import {
  Play,
  Pause,
  Square,
  Clock,
  Plus,
  Minus,
  Square as WindowSquare,
  X,
  Zap,
  FileCode,
  Sun,
  Moon,
  PlusCircle,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import { JiraConfig, TimerState, ThemeMode } from '../../../types/jira';

interface HeaderProps {
  timer: TimerState;
  config: JiraConfig | null;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onToggleTimer: () => void;
  onStopAndLog: () => void;
  onDiscardTimer: () => void;
  onOpenQuickLog: () => void;
  onOpenCreateIssue: () => void;
  onOpenStandupModal: () => void;
  onToggleCompactMode: () => void;
  onOpenLogsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  timer,
  config,
  theme,
  onToggleTheme,
  onToggleTimer,
  onStopAndLog,
  onDiscardTimer,
  onOpenQuickLog,
  onOpenCreateIssue,
  onOpenStandupModal,
  onToggleCompactMode,
  onOpenLogsModal,
}) => {
  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleMinimize = () => window.jiraApi?.minimizeWindow();
  const handleMaximize = () => window.jiraApi?.maximizeWindow();
  const handleClose = () => window.jiraApi?.closeWindow();

  return (
    <header className="h-14 bg-white/95 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 select-none shrink-0 z-30 transition-colors">
      {/* Brand & Connection Status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              Jira Assistant
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 bg-blue-500/20 text-blue-400 rounded">
                Desktop
              </span>
            </h1>
          </div>
        </div>

        {/* Demo / Live Status Pill */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <div
            className={`w-2 h-2 rounded-full ${
              config?.demoMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          <span>{config?.demoMode ? 'Demo / Offline Mode' : 'Connected to Jira'}</span>
        </div>
      </div>

      {/* Active Timer Widget in Header */}
      <div className="flex items-center">
        {timer.issueKey ? (
          <div
            className={`flex items-center space-x-3 px-3.5 py-1.5 rounded-full border transition-all ${
              timer.isRunning
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-500/40 shadow-sm shadow-blue-500/10'
                : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-400">
                {timer.issueKey}
              </span>
              <span
                className="text-xs text-slate-700 dark:text-slate-300 max-w-[160px] truncate hidden lg:inline"
                title={timer.issueSummary || ''}
              >
                {timer.issueSummary}
              </span>
            </div>

            <div className="font-mono text-sm font-semibold tracking-wider text-slate-900 dark:text-white">
              {formatTime(timer.elapsedSeconds)}
            </div>

            <div className="flex items-center space-x-1 border-l border-slate-300 dark:border-slate-700/60 pl-2">
              <button
                onClick={onToggleTimer}
                title={timer.isRunning ? 'Pause Timer' : 'Resume Timer'}
                className={`p-1.5 rounded-full transition-colors ${
                  timer.isRunning
                    ? 'hover:bg-amber-500/20 text-amber-500 dark:text-amber-400'
                    : 'hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {timer.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onStopAndLog}
                title="Stop & Log Work"
                className="p-1.5 rounded-full hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onDiscardTimer}
                title="Discard Timer"
                className="p-1.5 rounded-full hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Zap className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
            <span>Select any issue to start tracking time</span>
          </div>
        )}
      </div>

      {/* Right Action & Window Controls */}
      <div className="flex items-center space-x-2">
        {/* Standup Generator */}
        <button
          onClick={onOpenStandupModal}
          title="Daily Standup Generator (Copy Slack/Teams update)"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          <span className="hidden xl:inline">Standup</span>
        </button>

        {/* Create Issue */}
        <button
          onClick={onOpenCreateIssue}
          title="Create New Jira Issue"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition"
        >
          <PlusCircle className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden sm:inline">New Issue</span>
        </button>

        {/* Mini Widget Toggle */}
        <button
          onClick={onToggleCompactMode}
          title="Toggle Floating Mini Stopwatch Widget"
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
        </button>

        {/* Logs Button */}
        <button
          onClick={onOpenLogsModal}
          title="Open Diagnostics & Logs"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition"
        >
          <FileCode className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden lg:inline">Logs</span>
        </button>

        {/* Log Work Button */}
        <button
          onClick={onOpenQuickLog}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Work</span>
        </button>

        {/* Window controls */}
        <div className="flex items-center space-x-1 border-l border-slate-300 dark:border-slate-800 pl-2">
          <button
            onClick={handleMinimize}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
            title="Maximize"
          >
            <WindowSquare className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded transition"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
