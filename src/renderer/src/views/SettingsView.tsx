import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Globe,
  Key,
  Mail,
  Target,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Save,
  Sparkles,
} from 'lucide-react';
import { JiraConfig, JiraUser } from '../../../types/jira';

interface SettingsViewProps {
  initialConfig: JiraConfig | null;
  onSaveConfig: (config: JiraConfig) => Promise<boolean>;
  onTestConnection: (config: JiraConfig) => Promise<{ success: boolean; user?: JiraUser; error?: string }>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  initialConfig,
  onSaveConfig,
  onTestConnection,
}) => {
  const [serverUrl, setServerUrl] = useState('');
  const [authType, setAuthType] = useState<'cloud' | 'server'>('cloud');
  const [email, setEmail] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [targetHours, setTargetHours] = useState(8);
  const [demoMode, setDemoMode] = useState(true);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      setServerUrl(initialConfig.serverUrl || '');
      setAuthType(initialConfig.authType || 'cloud');
      setEmail(initialConfig.email || '');
      setApiToken(initialConfig.apiToken || '');
      setTargetHours(initialConfig.targetHoursPerDay || 8);
      setDemoMode(initialConfig.demoMode ?? true);
    }
  }, [initialConfig]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection({
        serverUrl,
        authType,
        email,
        apiToken,
        targetHoursPerDay: targetHours,
        demoMode,
      });

      if (res.success) {
        setTestResult({
          success: true,
          message: `Connected successfully as ${res.user?.displayName || 'User'}!`,
        });
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Connection failed.',
        });
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const ok = await onSaveConfig({
        serverUrl,
        authType,
        email,
        apiToken,
        targetHoursPerDay: targetHours,
        demoMode,
      });
      if (ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white dark:bg-slate-900 p-8 transition-colors">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Jira Connection & Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure your Atlassian Cloud or Jira Server credentials and worklog goals
          </p>
        </div>

        {/* Demo Mode Banner */}
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-gradient-to-r dark:from-blue-900/40 dark:to-indigo-900/40 border border-blue-200 dark:border-blue-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Demo / Offline Mode</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Explore timesheets, stopwatch, and board features with realistic sample data
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={demoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Connection Card */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Jira Server Credentials
            </h3>

            {/* Auth Type Switcher */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Environment Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAuthType('cloud')}
                  className={`p-3 rounded-xl border text-left transition ${
                    authType === 'cloud'
                      ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-500 text-blue-900 dark:text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs">Jira Cloud (Atlassian)</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    company.atlassian.net (Email + API Token)
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthType('server')}
                  className={`p-3 rounded-xl border text-left transition ${
                    authType === 'server'
                      ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-500 text-blue-900 dark:text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs">Jira Server / Data Center</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Self-hosted (Personal Access Token)
                  </div>
                </button>
              </div>
            </div>

            {/* Server URL */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Jira Base URL
              </label>
              <input
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://your-domain.atlassian.net"
                required
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>

            {/* Email (Cloud only) */}
            {authType === 'cloud' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Atlassian Account Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required={authType === 'cloud'}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
            )}

            {/* API Token / PAT */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  {authType === 'cloud' ? 'API Token' : 'Personal Access Token'}
                </label>
                {authType === 'cloud' && (
                  <button
                    type="button"
                    onClick={() =>
                      window.jiraApi?.openExternal(
                        'https://id.atlassian.com/manage-profile/security/api-tokens'
                      )
                    }
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Generate Token</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
              <input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder={authType === 'cloud' ? 'Paste Atlassian API Token' : 'Paste Jira PAT Token'}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Protected with Windows DPAPI encryption via Electron SafeStorage.</span>
              </p>
            </div>

            {/* Test Connection Result */}
            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="px-4 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-xs text-slate-800 dark:text-white font-medium transition flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {testing && (
                  <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-800 dark:border-white/30 dark:border-t-white rounded-full animate-spin" />
                )}
                <span>Test Connection</span>
              </button>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Worklog Goals
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Target Hours per Working Day
              </label>
              <input
                type="number"
                min={1}
                max={24}
                value={targetHours}
                onChange={(e) => setTargetHours(parseInt(e.target.value, 10) || 8)}
                className="w-32 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Used to compute daily and weekly timesheet progress rings.
              </p>
            </div>

            {/* Daily Reminder & Idle Detection */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Daily Worklog Reminder
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    defaultValue={initialConfig?.reminderTime || '17:30'}
                    id="reminderTimeInput"
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white shadow-sm"
                  />
                  <span className="text-[11px] text-slate-500">Alert if daily target not reached</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Idle Time Detection
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={5}
                    max={120}
                    defaultValue={initialConfig?.idleDetectionMinutes || 15}
                    id="idleMinutesInput"
                    className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white shadow-sm"
                  />
                  <span className="text-[11px] text-slate-500">minutes away prompts timer adjustment</span>
                </div>
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {saveSuccess && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Settings saved successfully!
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
