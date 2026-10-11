import React, { useState, useEffect } from 'react';
import {
  Search,
  Play,
  Plus,
  Filter,
  CheckCircle2,
  FileText,
  Bookmark,
  BookmarkPlus,
  Trash2,
  Download,
  SlidersHorizontal,
  X,
  AlertCircle,
  FileCode,
  Tag,
  Check,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { JiraFieldDefinition, JiraIssue, SavedReport } from '../../../types/jira';

interface JqlSearchViewProps {
  onSearch: (options: { jql: string; fields?: string[]; startAt?: number; maxResults?: number } | string, fields?: string[]) => Promise<{ issues: JiraIssue[]; total?: number; startAt?: number; maxResults?: number; error?: string }>;
  onStartTimer: (issueKey: string, summary: string) => void;
  onOpenQuickLog: (issueKey: string) => void;
  onOpenLogsModal: () => void;
  serverUrl?: string;
}

// Fallback initial fields if offline
const DEFAULT_INITIAL_FIELDS: JiraFieldDefinition[] = [
  { id: 'summary', name: 'Summary', custom: false },
  { id: 'status', name: 'Status', custom: false },
  { id: 'priority', name: 'Priority', custom: false },
  { id: 'issuetype', name: 'Issue Type', custom: false },
  { id: 'assignee', name: 'Assignee', custom: false },
  { id: 'reporter', name: 'Reporter', custom: false },
  { id: 'created', name: 'Created', custom: false },
  { id: 'updated', name: 'Updated', custom: false },
  { id: 'duedate', name: 'Due Date', custom: false },
  { id: 'resolution', name: 'Resolution', custom: false },
  { id: 'labels', name: 'Labels', custom: false },
  { id: 'components', name: 'Components', custom: false },
  { id: 'fixVersions', name: 'Fix Versions', custom: false },
  { id: 'timetracking', name: 'Time Tracking', custom: false },
];

export const JqlSearchView: React.FC<JqlSearchViewProps> = ({
  onSearch,
  onStartTimer,
  onOpenQuickLog,
  onOpenLogsModal,
  serverUrl,
}) => {
  const [jql, setJql] = useState('assignee = currentUser() ORDER BY updated DESC');
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<JiraIssue | null>(null);

  // Pagination & Total Results State
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Comments state for selected issue in drawer
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [activeDrawerTab, setActiveDrawerTab] = useState<'details' | 'comments'>('details');

  // All dynamic fields fetched from this Jira instance
  const [instanceFields, setInstanceFields] = useState<JiraFieldDefinition[]>(DEFAULT_INITIAL_FIELDS);
  const [loadingFields, setLoadingFields] = useState(false);

  // Saved reports
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newReportName, setNewReportName] = useState('');
  const [newReportDesc, setNewReportDesc] = useState('');

  // Selected column field IDs for current view/report
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([
    'summary',
    'status',
    'priority',
    'issuetype',
    'assignee',
    'updated',
  ]);

  // Field selector modal
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [fieldSearch, setFieldSearch] = useState('');
  const [fieldFilterTab, setFieldFilterTab] = useState<'ALL' | 'SELECTED' | 'SYSTEM' | 'CUSTOM'>('ALL');

  // Fetch instance fields & saved reports on mount
  useEffect(() => {
    loadInstanceFields();
    fetchReports();
    handleRunSearch('assignee = currentUser() ORDER BY updated DESC', selectedFieldIds, 1, 25);
  }, []);

  // When selected issue changes, load comments
  useEffect(() => {
    if (selectedIssue && activeDrawerTab === 'comments') {
      loadIssueComments(selectedIssue.key);
    }
  }, [selectedIssue, activeDrawerTab]);

  const loadIssueComments = async (issueKey: string) => {
    if (!window.jiraApi) return;
    setLoadingComments(true);
    try {
      const res = await window.jiraApi.getIssueComments(issueKey);
      setComments(res.comments || []);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !newCommentText.trim() || !window.jiraApi) return;
    const res = await window.jiraApi.addIssueComment(selectedIssue.key, newCommentText.trim());
    if (res.success && res.comment) {
      setComments((prev) => [...prev, res.comment!]);
      setNewCommentText('');
    }
  };

  const loadInstanceFields = async () => {
    if (!window.jiraApi) return;
    setLoadingFields(true);
    try {
      const res = await window.jiraApi.getJiraFields();
      if (res.fields && res.fields.length > 0) {
        setInstanceFields(res.fields);
      }
    } finally {
      setLoadingFields(false);
    }
  };

  const fetchReports = async () => {
    if (!window.jiraApi) return;
    const reports = await window.jiraApi.getSavedReports();
    setSavedReports(reports);
  };

  const handleRunSearch = async (
    queryToRun?: string,
    fieldsToQuery?: string[],
    pageToRun = currentPage,
    sizeToRun = pageSize
  ) => {
    const q = queryToRun !== undefined ? queryToRun : jql;
    const flds = fieldsToQuery || selectedFieldIds;
    const startAt = (pageToRun - 1) * sizeToRun;

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await onSearch({
        jql: q,
        fields: flds,
        startAt,
        maxResults: sizeToRun,
      });

      if (res.error) {
        setErrorMsg(res.error);
        setIssues([]);
        setTotalCount(0);
      } else {
        setIssues(res.issues || []);
        setTotalCount(res.total ?? (res.issues?.length || 0));
        setCurrentPage(pageToRun);
        setPageSize(sizeToRun);
        if (res.issues && res.issues.length > 0) {
          setSelectedIssue(res.issues[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReport = (report: SavedReport) => {
    setActiveReportId(report.id);
    setJql(report.jql);
    if (report.fields && report.fields.length > 0) {
      setSelectedFieldIds(report.fields);
    }
    handleRunSearch(report.jql, report.fields, 1, pageSize);
  };

  const handleSaveReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportName.trim()) return;

    const report: SavedReport = {
      id: `report-${Date.now()}`,
      name: newReportName.trim(),
      description: newReportDesc.trim(),
      jql: jql.trim(),
      fields: selectedFieldIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await window.jiraApi?.saveReport(report);
    await fetchReports();
    setActiveReportId(report.id);
    setSaveModalOpen(false);
    setNewReportName('');
    setNewReportDesc('');
  };

  const handleDeleteReport = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this saved report?')) {
      await window.jiraApi?.deleteReport(id);
      await fetchReports();
      if (activeReportId === id) setActiveReportId(null);
    }
  };

  const toggleFieldSelection = (fieldId: string) => {
    if (fieldId === 'summary') return; // summary is always essential
    setSelectedFieldIds((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  const handleApplyFields = () => {
    setFieldModalOpen(false);
    // Re-run search with the updated column selections
    handleRunSearch(jql, selectedFieldIds);
  };

  // Helper to get field definition by ID
  const getFieldDef = (fieldId: string): JiraFieldDefinition => {
    const found = instanceFields.find((f) => f.id === fieldId);
    return found || { id: fieldId, name: fieldId, custom: fieldId.startsWith('customfield_') };
  };

  // Universal cell value formatter
  const renderCellValue = (fieldId: string, issue: JiraIssue): React.ReactNode => {
    if (fieldId === 'key') {
      return <span className="font-mono font-bold text-blue-400">{issue.key}</span>;
    }
    if (fieldId === 'summary') {
      return <span className="font-medium text-slate-200 block truncate max-w-xs">{issue.summary}</span>;
    }

    // Check rawFields from Jira API first
    const val = issue.rawFields ? issue.rawFields[fieldId] : issue[fieldId];

    if (val === null || val === undefined || val === '') {
      return <span className="text-slate-600">—</span>;
    }

    // String / number / boolean
    if (typeof val === 'string') {
      // Check if it's an ISO date string
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val) || /^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return <span className="text-slate-400 whitespace-nowrap">{new Date(val).toLocaleDateString()}</span>;
      }
      return <span className="text-slate-300 block truncate max-w-[200px]">{val}</span>;
    }

    if (typeof val === 'number') {
      return <span className="font-mono text-slate-300">{val}</span>;
    }

    if (typeof val === 'boolean') {
      return <span className="text-slate-300">{val ? 'Yes' : 'No'}</span>;
    }

    // Arrays (labels, components, fixVersions, etc.)
    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-slate-600">—</span>;
      return (
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {val.slice(0, 3).map((item: any, idx: number) => {
            const label = typeof item === 'string' ? item : item?.name || item?.value || JSON.stringify(item);
            return (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 truncate max-w-[100px]"
              >
                {label}
              </span>
            );
          })}
          {val.length > 3 && (
            <span className="text-[10px] text-slate-500 self-center">+{val.length - 3}</span>
          )}
        </div>
      );
    }

    // Objects
    if (typeof val === 'object') {
      // User object
      if (val.displayName) {
        return (
          <span className="text-slate-300 block truncate max-w-[130px]">
            {val.displayName}
          </span>
        );
      }
      // Status, Priority, IssueType, Resolution with name
      if (val.name) {
        return (
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] whitespace-nowrap">
            {val.name}
          </span>
        );
      }
      // Select option with value
      if (val.value) {
        return <span className="text-slate-300">{val.value}</span>;
      }
      // Time tracking object
      if (val.timeSpent || val.remainingEstimate || val.originalEstimate) {
        return (
          <span className="font-mono text-slate-300">
            {val.timeSpent || val.remainingEstimate || val.originalEstimate || '0m'}
          </span>
        );
      }
      // ADF Document or other object
      if (val.content && Array.isArray(val.content)) {
        try {
          const text = val.content
            .map((p: any) => (p.content || []).map((c: any) => c.text || '').join(''))
            .filter(Boolean)
            .join(' ');
          return <span className="text-slate-400 block truncate max-w-[200px]">{text || '—'}</span>;
        } catch {
          return <span className="text-slate-500">[Document]</span>;
        }
      }
      return <span className="text-slate-400 truncate block max-w-[150px]">{JSON.stringify(val)}</span>;
    }

    return <span className="text-slate-400">{String(val)}</span>;
  };

  // Plain string value for CSV export
  const getCellExportText = (fieldId: string, issue: JiraIssue): string => {
    if (fieldId === 'key') return issue.key;
    if (fieldId === 'summary') return issue.summary;

    const val = issue.rawFields ? issue.rawFields[fieldId] : issue[fieldId];
    if (val === null || val === undefined) return '';
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (Array.isArray(val)) {
      return val.map((v) => (typeof v === 'string' ? v : v?.name || v?.value || '')).join(', ');
    }
    if (typeof val === 'object') {
      if (val.displayName) return val.displayName;
      if (val.name) return val.name;
      if (val.value) return val.value;
      if (val.timeSpent) return val.timeSpent;
    }
    return JSON.stringify(val);
  };

  const handleExportCsv = () => {
    if (issues.length === 0) return;
    const columns = ['key', ...selectedFieldIds];
    const headerRow = columns.map((colId) => `"${(colId === 'key' ? 'Key' : getFieldDef(colId).name).replace(/"/g, '""')}"`).join(',');
    const rows = issues.map((issue) =>
      columns.map((colId) => `"${(getCellExportText(colId, issue) || '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headerRow, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `jira-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter fields in the Field Selector modal
  const filteredModalFields = instanceFields.filter((f) => {
    if (fieldFilterTab === 'SELECTED' && !selectedFieldIds.includes(f.id) && f.id !== 'key') return false;
    if (fieldFilterTab === 'SYSTEM' && f.custom) return false;
    if (fieldFilterTab === 'CUSTOM' && !f.custom) return false;
    if (fieldSearch.trim()) {
      const q = fieldSearch.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      {/* Top Search Controls */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-500" />
              JQL Navigator & Custom Reports
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Execute Jira queries, configure instance columns for each report, and export reports
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Configure Columns Button */}
            <button
              onClick={() => setFieldModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
              <span>Select Columns ({selectedFieldIds.length})</span>
            </button>

            {/* Save Current as Report Button */}
            <button
              onClick={() => {
                setNewReportName(`Report: ${jql.slice(0, 25)}...`);
                setSaveModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition flex items-center gap-1.5"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-blue-500" />
              <span>Save Report</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              disabled={issues.length === 0}
              className="px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-40"
              title="Export report to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Diagnostics Logs Button */}
            <button
              onClick={onOpenLogsModal}
              className="px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition flex items-center gap-1.5"
              title="Open diagnostic logs"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-500" />
              <span>Logs</span>
            </button>
          </div>
        </div>

        {/* Query Input Box */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={jql}
              onChange={(e) => {
                setJql(e.target.value);
                setActiveReportId(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleRunSearch()}
              placeholder="e.g. assignee = currentUser() ORDER BY updated DESC"
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
          <button
            onClick={() => handleRunSearch()}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Run Query</span>
          </button>
        </div>

        {/* Saved Reports Chips Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 flex items-center gap-1 shrink-0 font-medium text-[11px]">
            <Bookmark className="w-3 h-3" />
            Saved Reports:
          </span>
          {savedReports.map((report) => {
            const isActive = activeReportId === report.id;
            return (
              <div
                key={report.id}
                onClick={() => handleSelectReport(report)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-xs cursor-pointer transition shrink-0 ${
                  isActive
                    ? 'bg-blue-600/20 border-blue-500 text-white font-medium shadow-sm'
                    : 'bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{report.name}</span>
                <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-900 px-1 py-0.2 rounded">
                  {report.fields?.length || 6} cols
                </span>
                <button
                  onClick={(e) => handleDeleteReport(e, report.id)}
                  className="p-0.5 text-slate-400 hover:text-rose-500 rounded transition"
                  title="Delete report"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Results Counter & Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Found {totalCount} {totalCount === 1 ? 'issue' : 'issues'} total
            </span>
            {totalCount > 0 && (
              <span className="text-slate-500 dark:text-slate-400">
                (Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)}–
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount})
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Page Size Selector */}
            <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setPageSize(newSize);
                  handleRunSearch(jql, selectedFieldIds, 1, newSize);
                }}
                className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Pagination Controls */}
            {totalCount > pageSize && (
              <div className="flex items-center space-x-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                <button
                  disabled={currentPage <= 1 || loading}
                  onClick={() => handleRunSearch(jql, selectedFieldIds, currentPage - 1, pageSize)}
                  className="px-2.5 py-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition"
                >
                  Previous
                </button>
                <span className="px-2 font-mono text-slate-700 dark:text-slate-300">
                  {currentPage} / {Math.max(1, Math.ceil(totalCount / pageSize))}
                </span>
                <button
                  disabled={currentPage >= Math.ceil(totalCount / pageSize) || loading}
                  onClick={() => handleRunSearch(jql, selectedFieldIds, currentPage + 1, pageSize)}
                  className="px-2.5 py-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Prominent Error Banner */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs flex items-start justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-800 dark:text-rose-200">Jira API Error: </span>
                <span>{errorMsg}</span>
                <p className="text-[11px] text-rose-600 dark:text-rose-400/80 mt-1">
                  Tip: In Jira Cloud Service Desk, queries must be bounded (e.g. include{' '}
                  <code className="bg-rose-100 dark:bg-rose-900/60 px-1 py-0.5 rounded">assignee = currentUser()</code>{' '}
                  or <code className="bg-rose-100 dark:bg-rose-900/60 px-1 py-0.5 rounded">created &gt;= -30d</code>).
                </p>
              </div>
            </div>
            <button
              onClick={onOpenLogsModal}
              className="px-2.5 py-1 rounded-lg bg-rose-200 dark:bg-rose-900/60 hover:bg-rose-300 dark:hover:bg-rose-900 text-rose-900 dark:text-rose-200 text-xs font-semibold shrink-0 transition"
            >
              View Logs
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area: Dynamic Dynamic Table & Details Drawer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Table View */}
        <div className="flex-1 overflow-auto border-r border-slate-200 dark:border-slate-800/80">
          {issues.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-2">
              <FileText className="w-9 h-9 mx-auto text-slate-400 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {loading ? 'Searching Jira...' : 'No issues found'}
              </p>
              <p className="text-xs">
                {errorMsg
                  ? 'Resolve the query error above or inspect diagnostic logs.'
                  : 'Run a query or pick a saved report to display tickets.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 font-medium sticky top-0 z-10 backdrop-blur">
                  <th className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">Key</th>
                  {selectedFieldIds.map((colId) => (
                    <th key={colId} className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {getFieldDef(colId).name}
                    </th>
                  ))}
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {issues.map((issue) => {
                  const isSelected = selectedIssue?.key === issue.key;
                  return (
                    <tr
                      key={issue.key}
                      onClick={() => setSelectedIssue(issue)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-slate-900 dark:text-white'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-950/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <td className="py-3 px-4">{renderCellValue('key', issue)}</td>
                      {selectedFieldIds.map((colId) => (
                        <td key={colId} className="py-3 px-4">
                          {renderCellValue(colId, issue)}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end space-x-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onStartTimer(issue.key, issue.summary)}
                            title="Start Timer"
                            className="p-1.5 rounded-lg bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                          <button
                            onClick={() => onOpenQuickLog(issue.key)}
                            title="Log Work"
                            className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Issue Details & Comments Drawer */}
        {selectedIssue && (
          <div className="w-80 md:w-96 bg-white dark:bg-slate-950 p-5 overflow-y-auto space-y-4 shrink-0 border-l border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded">
                {selectedIssue.key}
              </span>
              {serverUrl && (
                <button
                  onClick={() =>
                    window.jiraApi?.openExternal(`${serverUrl}/browse/${selectedIssue.key}`)
                  }
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                >
                  <span>Open in Jira</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Drawer Tabs: Details vs Comments */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={() => setActiveDrawerTab('details')}
                className={`flex-1 py-1.5 text-center font-medium border-b-2 transition ${
                  activeDrawerTab === 'details'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveDrawerTab('comments')}
                className={`flex-1 py-1.5 text-center font-medium border-b-2 transition ${
                  activeDrawerTab === 'comments'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Comments ({comments.length})
              </button>
            </div>

            {activeDrawerTab === 'details' ? (
              <>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {selectedIssue.summary}
                  </h3>
                </div>

                {selectedIssue.description && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedIssue.description}
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Status</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{selectedIssue.status.name}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Priority</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedIssue.priority?.name || 'Medium'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Type</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedIssue.issueType?.name || 'Task'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Assignee</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedIssue.assignee?.displayName || 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Time Spent</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">
                      {selectedIssue.timeTracking?.timeSpent || '0m'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                  <button
                    onClick={() => onStartTimer(selectedIssue.key, selectedIssue.summary)}
                    className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Timer</span>
                  </button>
                  <button
                    onClick={() => onOpenQuickLog(selectedIssue.key)}
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-white text-xs font-medium transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              /* In-App Comments Thread */
              <div className="space-y-3">
                <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                  {loadingComments ? (
                    <div className="py-6 text-center text-xs text-slate-500">Loading comments...</div>
                  ) : comments.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">No comments on this issue yet.</div>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{c.author?.displayName}</span>
                          <span>{new Date(c.created).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{c.body}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <textarea
                    rows={2}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Add a comment to Jira..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newCommentText.trim()}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-medium transition"
                    >
                      Post Comment
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Field Selector Modal (Shows ALL instance fields) */}
      {fieldModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl h-[75vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Select Report Columns
                  </h3>
                  <p className="text-xs text-slate-400">
                    Choose from all {instanceFields.length} fields configured in your Jira instance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFieldModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/20 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  placeholder="Search fields (e.g. Epic, Sprint, Story Points)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
                {[
                  { id: 'ALL', label: `All (${instanceFields.length})` },
                  { id: 'SELECTED', label: `Selected (${selectedFieldIds.length})` },
                  { id: 'SYSTEM', label: 'System' },
                  { id: 'CUSTOM', label: 'Custom' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFieldFilterTab(tab.id as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                      fieldFilterTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fields Grid / List */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-950/40">
              {filteredModalFields.map((field) => {
                const isSelected = selectedFieldIds.includes(field.id) || field.id === 'key';
                const isKey = field.id === 'key';
                return (
                  <div
                    key={field.id}
                    onClick={() => !isKey && toggleFieldSelection(field.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/60 shadow-sm'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'border-slate-700 bg-slate-950'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-medium text-slate-200 block truncate">
                          {field.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 block truncate">
                          {field.id}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold shrink-0 ml-2 ${
                        field.custom
                          ? 'bg-purple-950/60 text-purple-400 border border-purple-800/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {field.custom ? 'Custom' : 'System'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {selectedFieldIds.length} column{selectedFieldIds.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedFieldIds(['summary', 'status', 'priority', 'issuetype', 'assignee', 'updated'])}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={handleApplyFields}
                  className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-600/20"
                >
                  Apply Columns
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Report Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <BookmarkPlus className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-white">Save Custom Report</h3>
              </div>
              <button
                onClick={() => setSaveModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Report Name</label>
                <input
                  type="text"
                  value={newReportName}
                  onChange={(e) => setNewReportName(e.target.value)}
                  placeholder="e.g. Sprint 24 Backend Incidents"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newReportDesc}
                  onChange={(e) => setNewReportDesc(e.target.value)}
                  placeholder="Short description of this report"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-slate-400">Current JQL Query:</span>
                <p className="font-mono text-slate-200 line-clamp-2">{jql}</p>
                <span className="text-slate-400 block pt-1">
                  Selected Columns ({selectedFieldIds.length}):{' '}
                  {selectedFieldIds.map((id) => getFieldDef(id).name).join(', ')}
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
                >
                  Save Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
