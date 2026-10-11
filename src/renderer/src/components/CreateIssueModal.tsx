import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  X,
  Layers,
  FolderGit2,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { JiraProject, JiraIssueType, JiraIssue } from '../../../types/jira';

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueCreated: (issue: JiraIssue) => void;
}

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  isOpen,
  onClose,
  onIssueCreated,
}) => {
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[]>([]);
  const [selectedProjectKey, setSelectedProjectKey] = useState<string>('');
  const [selectedIssueTypeId, setSelectedIssueTypeId] = useState<string>('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [priorityId, setPriorityId] = useState('3'); // 3 = Medium
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProjectsAndTypes();
    }
  }, [isOpen]);

  const loadProjectsAndTypes = async () => {
    if (!window.jiraApi) return;
    try {
      const projRes = await window.jiraApi.getProjects();
      const projs = projRes.projects || [];
      setProjects(projs);
      if (projs.length > 0) {
        const firstKey = projs[0].key;
        setSelectedProjectKey(firstKey);
        loadTypesForProject(firstKey);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const loadTypesForProject = async (key: string) => {
    if (!window.jiraApi) return;
    try {
      const typeRes = await window.jiraApi.getIssueTypes(key);
      const types = (typeRes.issueTypes || []).filter((t) => !t.subtask);
      setIssueTypes(types);
      if (types.length > 0) {
        setSelectedIssueTypeId(types[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim() || !selectedProjectKey || !selectedIssueTypeId || !window.jiraApi) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await window.jiraApi.createIssue({
        projectKey: selectedProjectKey,
        issueTypeId: selectedIssueTypeId,
        summary: summary.trim(),
        description: description.trim() || undefined,
        priorityId,
      });

      if (res.success && res.issue) {
        onIssueCreated(res.issue);
        onClose();
        setSummary('');
        setDescription('');
      } else {
        setErrorMsg(res.error || 'Failed to create issue.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Create Jira Issue
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quickly file a new task, bug, or story into your project
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Project Selector */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Project
              </label>
              <select
                value={selectedProjectKey}
                onChange={(e) => {
                  setSelectedProjectKey(e.target.value);
                  loadTypesForProject(e.target.value);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.key}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
            </div>

            {/* Issue Type Selector */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Issue Type
              </label>
              <select
                value={selectedIssueTypeId}
                onChange={(e) => setSelectedIssueTypeId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {issueTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Priority
            </label>
            <select
              value={priorityId}
              onChange={(e) => setPriorityId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="1">Highest</option>
              <option value="2">High</option>
              <option value="3">Medium</option>
              <option value="4">Low</option>
              <option value="5">Lowest</option>
            </select>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Summary *
            </label>
            <input
              type="text"
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Implement user login API endpoint"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Description (optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details, steps to reproduce, or acceptance criteria..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Footer Controls */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !summary.trim()}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-600/20 disabled:opacity-40 flex items-center gap-1.5"
            >
              {submitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <PlusCircle className="w-3.5 h-3.5" />
              )}
              <span>Create Ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
