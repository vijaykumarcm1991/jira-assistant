import React from 'react';
import {
  CalendarDays,
  CheckSquare,
  Search,
  Settings,
  Target,
  LayoutGrid,
  PieChart,
} from 'lucide-react';
import { JiraUser } from '../../../types/jira';

export type NavTab = 'timesheet' | 'my-issues' | 'kanban' | 'jql-search' | 'analytics' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: JiraUser | null;
  todayLoggedSeconds: number;
  targetHours: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  todayLoggedSeconds,
  targetHours,
}) => {
  const navItems = [
    { id: 'timesheet' as NavTab, label: 'Timesheets & Worklog', icon: CalendarDays },
    { id: 'my-issues' as NavTab, label: 'My Assigned Issues', icon: CheckSquare },
    { id: 'kanban' as NavTab, label: 'Sprint Kanban Board', icon: LayoutGrid },
    { id: 'jql-search' as NavTab, label: 'JQL Search & Navigator', icon: Search },
    { id: 'analytics' as NavTab, label: 'Visual Analytics', icon: PieChart },
    { id: 'settings' as NavTab, label: 'Settings & Connection', icon: Settings },
  ];

  const todayLoggedHours = (todayLoggedSeconds / 3600).toFixed(1);
  const progressPercent = Math.min(100, Math.round((todayLoggedSeconds / (targetHours * 3600)) * 100));

  return (
    <aside className="w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shrink-0 select-none transition-colors">
      {/* Navigation Links */}
      <div className="p-3 space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Daily Progress & Profile at bottom */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
        {/* Daily Goal Progress Bar */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
              <Target className="w-3.5 h-3.5 text-blue-500" />
              Daily Target
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {todayLoggedHours}h / {targetHours}h
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                progressPercent >= 100
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
            <span>{progressPercent}% completed</span>
            {progressPercent >= 100 && <span className="text-emerald-500 dark:text-emerald-400 font-medium">Goal reached!</span>}
          </div>
        </div>

        {/* User Badge */}
        <div className="flex items-center space-x-3 px-2 py-1.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <span>{user?.displayName?.[0] || 'U'}</span>
            )}
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {user?.displayName || 'Jira User'}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {user?.emailAddress || 'Local Profile'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
