import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  Plus,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { JiraWorklog } from '../../../types/jira';

interface TimesheetViewProps {
  worklogs: JiraWorklog[];
  targetHours: number;
  onOpenQuickLogWithIssue: (issueKey?: string, duration?: string, comment?: string) => void;
  onDeleteWorklog: (issueKey: string, worklogId: string) => Promise<void>;
  onStartTimer: (issueKey: string, summary: string) => void;
}

const QUICK_TEMPLATES = [
  { label: 'Daily Standup (15m)', duration: '15m', comment: 'Daily Standup meeting & team sync' },
  { label: 'Sprint Planning (1h)', duration: '1h', comment: 'Sprint planning and backlog grooming' },
  { label: 'Code Review (45m)', duration: '45m', comment: 'Peer code review and PR walkthrough' },
  { label: 'Team Retrospective (1h)', duration: '1h', comment: 'Sprint retrospective meeting' },
];

export const TimesheetView: React.FC<TimesheetViewProps> = ({
  worklogs,
  targetHours,
  onOpenQuickLogWithIssue,
  onDeleteWorklog,
  onStartTimer,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');

  // Navigate dates
  const handlePrev = () => {
    const next = new Date(selectedDate);
    if (viewMode === 'day') next.setDate(next.getDate() - 1);
    else if (viewMode === 'week') next.setDate(next.getDate() - 7);
    else next.setMonth(next.getMonth() - 1);
    setSelectedDate(next);
  };

  const handleNext = () => {
    const next = new Date(selectedDate);
    if (viewMode === 'day') next.setDate(next.getDate() + 1);
    else if (viewMode === 'week') next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Filter logs for selected day
  const selectedDateStr = selectedDate.toISOString().slice(0, 10);
  const dayLogs = worklogs.filter((w) => w.started.slice(0, 10) === selectedDateStr);

  const dayTotalSeconds = dayLogs.reduce((acc, curr) => acc + (curr.timeSpentSeconds || 0), 0);
  const dayTotalHours = (dayTotalSeconds / 3600).toFixed(1);
  const dayPercent = Math.min(100, Math.round((dayTotalSeconds / (targetHours * 3600)) * 100));

  // Week statistics
  const startOfWeek = new Date(selectedDate);
  const dayIndex = startOfWeek.getDay(); // 0 is Sunday
  const diffToMonday = dayIndex === 0 ? -6 : 1 - dayIndex;
  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const dStr = d.toISOString().slice(0, 10);
    const logs = worklogs.filter((w) => w.started.slice(0, 10) === dStr);
    const secs = logs.reduce((a, c) => a + (c.timeSpentSeconds || 0), 0);
    return {
      date: d,
      dateStr: dStr,
      logs,
      totalSeconds: secs,
      hours: (secs / 3600).toFixed(1),
      isToday: dStr === new Date().toISOString().slice(0, 10),
      isSelected: dStr === selectedDateStr,
    };
  });

  const weekTotalSeconds = weekDays.reduce((a, c) => a + c.totalSeconds, 0);
  const weekTotalHours = (weekTotalSeconds / 3600).toFixed(1);

  // Month Calendar Computation
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(currentYear, currentMonth, i + 1);
    const dStr = d.toISOString().slice(0, 10);
    const logs = worklogs.filter((w) => w.started.slice(0, 10) === dStr);
    const secs = logs.reduce((a, c) => a + (c.timeSpentSeconds || 0), 0);
    const hours = (secs / 3600).toFixed(1);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const isToday = dStr === new Date().toISOString().slice(0, 10);
    const targetMet = secs >= targetHours * 3600;
    const hasWork = secs > 0;
    return {
      date: d,
      dStr,
      dayNum: i + 1,
      hours,
      secs,
      isWeekend,
      isToday,
      targetMet,
      hasWork,
    };
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      {/* Top Bar / Controls */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            Timesheet & Worklogs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track daily, weekly, and monthly worklogs logged to Jira
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Day / Week / Month Switcher */}
          <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 text-xs shadow-sm">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'day' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'week' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Month Calendar
            </button>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
            <button
              onClick={handlePrev}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-l-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-r-lg transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => onOpenQuickLogWithIssue()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Worklog</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Quick Fill Templates Bar */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Quick Worklog Templates:
          </span>
          <div className="flex flex-wrap gap-2">
            {QUICK_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                onClick={() => onOpenQuickLogWithIssue(undefined, tmpl.duration, tmpl.comment)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
              >
                + {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {viewMode === 'month' ? (
          /* Monthly Calendar Grid View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Target Met (&ge;{targetHours}h)
                </span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Partial Log
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" /> No Worklog
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2.5">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center font-semibold text-[11px] text-slate-400 py-1">
                  {d}
                </div>
              ))}
              {/* Padding offset for first day */}
              {Array.from({ length: firstDayOfMonth.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border border-transparent" />
              ))}
              {monthDays.map((d) => (
                <div
                  key={d.dStr}
                  onClick={() => {
                    setSelectedDate(d.date);
                    setViewMode('day');
                  }}
                  className={`h-20 rounded-xl p-2.5 border transition cursor-pointer flex flex-col justify-between ${
                    d.isToday
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                      : d.targetMet
                      ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/10'
                      : d.hasWork
                      ? 'border-amber-300 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${d.isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                      {d.dayNum}
                    </span>
                    {d.targetMet && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-mono font-bold ${d.hasWork ? (d.targetMet ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400') : 'text-slate-400'}`}>
                      {d.hours}h
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Weekly Summary Cards */
          <div className="grid grid-cols-5 gap-3">
            {weekDays.map((d) => (
              <div
                key={d.dateStr}
                onClick={() => setSelectedDate(d.date)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  d.isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {d.date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-[11px] text-slate-500">{d.date.getDate()}</span>
                  </div>
                  <div className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                    {d.hours}h
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">{d.logs.length} logged</span>
                  {Number(d.hours) >= targetHours && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Day Details Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Worklog Entries for {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ({dayLogs.length})
            </h4>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Total Day: <span className="font-mono text-blue-600 dark:text-blue-400">{dayTotalHours}h</span> / {targetHours}h ({dayPercent}%)
            </div>
          </div>

          {dayLogs.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-300">No worklogs for this day</p>
                <p className="text-xs text-slate-500 mt-1">
                  Start tracking time or click a template above to log work.
                </p>
              </div>
              <button
                onClick={() => onOpenQuickLogWithIssue()}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Time for {selectedDate.toLocaleDateString('en-US', { weekday: 'short' })}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dayLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 rounded-xl p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => onStartTimer(log.issueKey, log.issueSummary || log.issueKey)}
                      title="Start timer for this ticket"
                      className="mt-0.5 p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                          {log.issueKey}
                        </span>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {log.issueSummary || 'No summary'}
                        </span>
                      </div>
                      {log.comment && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{log.comment}</p>
                      )}
                      <div className="text-[11px] text-slate-400 mt-1">
                        Started: {new Date(log.started).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 self-end md:self-center">
                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 inline-block">
                        {log.timeSpent}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteWorklog(log.issueKey, log.id)}
                      title="Delete worklog"
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
