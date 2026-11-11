import { useState, useEffect } from 'react';
import {
  IconChecklist,
  IconPlus,
  IconX,
  IconUser,
  IconCalendarDue,
  IconAlertCircle,
  IconFilter,
  IconCheck,
  IconArrowBackUp,
  IconCircleCheck,
  IconArrowLeft,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { TaskCommentsPanel } from '../components/TaskCommentsPanel';
import { useAuth } from '../hooks/useAuth';
import {
  listMyTasks,
  listAllTasks,
  createTask,
  updateTask,
  completeTask,
  getTask,
  taskReviewAction,
} from '../api/tasks';
import { listUsers } from '../api/users';

const PRIORITY_CONFIG = {
  low: { label: 'Low', cls: 'bg-slate-500/15 text-slate-400 ring-slate-500/30' },
  medium: { label: 'Medium', cls: 'bg-sky-500/15 text-sky-400 ring-sky-500/30' },
  high: { label: 'High', cls: 'bg-amber-500/15 text-amber-400 ring-amber-500/30' },
  critical: { label: 'Critical', cls: 'bg-red-500/15 text-red-400 ring-red-500/30' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', cls: 'bg-slate-500/15 text-slate-400 ring-slate-500/30' },
  in_progress: { label: 'In Progress', cls: 'bg-sky-500/15 text-sky-400 ring-sky-500/30' },
  completed: { label: 'Awaiting Verification', cls: 'bg-amber-500/15 text-amber-400 ring-amber-500/30' },
  approved: { label: 'Approved', cls: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30' },
  rejected: { label: 'Rejected', cls: 'bg-red-500/15 text-red-400 ring-red-500/30' },
  review: { label: 'Needs Review', cls: 'bg-violet-500/15 text-violet-400 ring-violet-500/30' },
  overdue: { label: 'Overdue', cls: 'bg-red-500/15 text-red-400 ring-red-500/30' },
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatShortDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function formatTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function preview(text, maxLen = 80) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  return t.length <= maxLen ? t : t.slice(0, maxLen) + '…';
}

export function Tasks() {
  const { user, isAdmin } = useAuth();
  const [view, setView] = useState('my');
  const [tasks, setTasks] = useState([]);
  const [allTasksData, setAllTasksData] = useState({ items: [], total: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedToId: '',
    priority: 'medium',
    dueDate: '',
  });

  async function loadMyTasks() {
    setLoading(true);
    setError('');
    try {
      const data = await listMyTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  async function loadAllTasks() {
    setLoading(true);
    setError('');
    try {
      const data = await listAllTasks({
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
        limit: 100,
      });
      setAllTasksData({ items: data?.items || [], total: data?.total ?? 0 });
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      const res = await listUsers({ limit: 200 });
      setUsers(res?.items || []);
    } catch (_e) {
      setUsers([]);
    }
  }

  useEffect(() => {
    if (view === 'my') loadMyTasks();
    else loadAllTasks();
  }, [view, filterStatus, filterPriority]);

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  async function openTaskDetail(taskId) {
    setDetailLoading(true);
    setSelectedTask(null);
    try {
      const t = await getTask(taskId);
      setSelectedTask(t);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load task');
    } finally {
      setDetailLoading(false);
    }
  }

  function refreshDetail() {
    if (selectedTask?.id) openTaskDetail(selectedTask.id);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title || !form.assignedToId) return;
    setSubmitting(true);
    setError('');
    try {
      await createTask({
        title: form.title,
        description: form.description || null,
        assignedToId: form.assignedToId,
        priority: form.priority,
        dueDate: form.dueDate || null,
      });
      setForm({ title: '', description: '', assignedToId: '', priority: 'medium', dueDate: '' });
      setModalOpen(false);
      if (view === 'my') loadMyTasks();
      else loadAllTasks();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleComplete(id) {
    setActionLoading('complete');
    try {
      const updated = await completeTask(id);
      setSelectedTask(updated);
      if (view === 'my') loadMyTasks();
      else loadAllTasks();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to complete task');
    } finally {
      setActionLoading('');
    }
  }

  async function handleReviewAction(id, action) {
    setActionLoading(action);
    try {
      const updated = await taskReviewAction(id, action);
      setSelectedTask(updated);
      if (view === 'my') loadMyTasks();
      else loadAllTasks();
    } catch (e) {
      setError(e.response?.data?.error || `Failed to ${action} task`);
    } finally {
      setActionLoading('');
    }
  }

  const displayTasks = view === 'my' ? tasks : allTasksData.items;
  const canComplete = (t) =>
    (t.status === 'pending' || t.status === 'in_progress' || t.status === 'review') && t.assignedToId === user?.id;
  const canVerify = (t) =>
    t.status === 'completed' && t.assignedById === user?.id;

  const inputCls =
    'w-full rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 focus:border-military-base focus:outline-none';
  const labelCls = 'mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500';

  return (
    <SidebarLayout>
      {(selectedTask || detailLoading) ? (
        <div className="flex min-h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-lg">
          {error && (
            <div className="flex shrink-0 items-center gap-3 border-b border-red-800/40 bg-red-950/40 px-6 py-3 text-sm text-red-200">
              <IconAlertCircle className="h-5 w-5 shrink-0" /> {error}
            </div>
          )}
          {detailLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-military-base border-t-transparent" />
              <p className="mt-4 text-sm text-slate-500">Loading task…</p>
            </div>
          ) : selectedTask && (
            <>
              <div className="shrink-0 border-b border-slate-800/80 px-6 py-5">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800/60 hover:text-slate-200"
                >
                  <IconArrowLeft className="h-4 w-4" />
                  Back to Tasks
                </button>

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-slate-50">{selectedTask.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 ${PRIORITY_CONFIG[selectedTask.priority]?.cls}`}>
                        {PRIORITY_CONFIG[selectedTask.priority]?.label}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 ${STATUS_CONFIG[selectedTask.status]?.cls}`}>
                        {STATUS_CONFIG[selectedTask.status]?.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Assigned To</p>
                    <p className="mt-0.5 font-medium text-slate-300">{selectedTask.assignedTo?.fullName ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Assigned By</p>
                    <p className="mt-0.5 font-medium text-slate-300">{selectedTask.assignedBy?.fullName ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Due Date</p>
                    <p className="mt-0.5 font-medium text-slate-300">{formatDate(selectedTask.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Created</p>
                    <p className="mt-0.5 font-medium text-slate-300">{formatDate(selectedTask.createdAt)}</p>
                  </div>
                </div>

                {selectedTask.description && (
                  <div className="mt-4 rounded-xl bg-slate-800/40 p-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Description</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{selectedTask.description}</p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {canComplete(selectedTask) && (
                    <button
                      onClick={() => handleComplete(selectedTask.id)}
                      disabled={!!actionLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/20 px-4 py-2 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-600/30 transition hover:bg-emerald-600/30 disabled:opacity-50"
                    >
                      <IconCircleCheck className="h-4 w-4" />
                      {actionLoading === 'complete' ? 'Submitting…' : 'Mark as Completed'}
                    </button>
                  )}
                  {canVerify(selectedTask) && (
                    <>
                      <button
                        onClick={() => handleReviewAction(selectedTask.id, 'approve')}
                        disabled={!!actionLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/20 px-4 py-2 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-600/30 transition hover:bg-emerald-600/30 disabled:opacity-50"
                      >
                        <IconCheck className="h-4 w-4" />
                        {actionLoading === 'approve' ? 'Approving…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReviewAction(selectedTask.id, 'reject')}
                        disabled={!!actionLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600/20 px-4 py-2 text-xs font-semibold text-red-400 ring-1 ring-red-600/30 transition hover:bg-red-600/30 disabled:opacity-50"
                      >
                        <IconX className="h-4 w-4" />
                        {actionLoading === 'reject' ? 'Rejecting…' : 'Reject'}
                      </button>
                      <button
                        onClick={() => handleReviewAction(selectedTask.id, 'review')}
                        disabled={!!actionLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600/20 px-4 py-2 text-xs font-semibold text-violet-400 ring-1 ring-violet-600/30 transition hover:bg-violet-600/30 disabled:opacity-50"
                      >
                        <IconArrowBackUp className="h-4 w-4" />
                        {actionLoading === 'review' ? 'Sending…' : 'Send Back for Review'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <TaskCommentsPanel
                task={selectedTask}
                fullHeight
                onCommentAdded={refreshDetail}
                onError={(msg) => setError(msg)}
              />
            </>
          )}
        </div>
      ) : (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-military-pale/60">Operations</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-50">Tasks</h2>
            <p className="mt-1 text-sm text-slate-400">Track and manage assignments</p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-military-base/60 bg-military-base/20 px-4 py-2.5 text-sm font-semibold text-military-pale transition hover:bg-military-base/40"
            >
              <IconPlus className="h-4 w-4" /> Assign Task
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-slate-800/50 p-1">
            {[
              { key: 'my', label: 'My Tasks' },
              { key: 'all', label: 'All Tasks', adminOnly: true },
            ].map(({ key, label, adminOnly }) => {
              if (adminOnly && !isAdmin) return null;
              return (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                    view === key ? 'bg-military-base text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {view === 'all' && isAdmin && (
            <div className="flex items-center gap-2">
              <IconFilter className="h-4 w-4 text-slate-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-300 focus:border-military-base focus:outline-none"
              >
                <option value="">All Status</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-300 focus:border-military-base focus:outline-none"
              >
                <option value="">All Priority</option>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            <IconAlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-military-base border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500">Loading tasks…</p>
          </div>
        ) : displayTasks.length === 0 ? (
          <CardSpotlight className="flex flex-col items-center justify-center p-12 text-center">
            <IconChecklist className="h-14 w-14 text-slate-600" />
            <p className="mt-4 text-slate-400">No tasks found</p>
          </CardSpotlight>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayTasks.map((t) => (
              <CardSpotlight
                key={t.id}
                className="relative cursor-pointer p-4 transition-transform hover:-translate-y-0.5"
                onClick={() => openTaskDetail(t.id)}
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-50">{t.title}</h3>
                  {t.description && (
                    <p className="mt-1 text-sm text-slate-400 line-clamp-2">{preview(t.description)}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${PRIORITY_CONFIG[t.priority]?.cls ?? PRIORITY_CONFIG.medium.cls}`}>
                      {PRIORITY_CONFIG[t.priority]?.label ?? t.priority}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${STATUS_CONFIG[t.status]?.cls ?? STATUS_CONFIG.pending.cls}`}>
                      {STATUS_CONFIG[t.status]?.label ?? t.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <IconCalendarDue className="h-3.5 w-3.5" />
                      Due: {formatShortDate(t.dueDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconUser className="h-3.5 w-3.5" />
                      {t.assignedTo?.fullName ?? '—'}
                    </span>
                  </div>
                  {t.comments?.length > 0 && (
                    <p className="mt-2 text-[11px] text-slate-600">{t.comments.length} comment{t.comments.length !== 1 ? 's' : ''}</p>
                  )}
                </div>
              </CardSpotlight>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Assign Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <CardSpotlight className="relative w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-50">Assign Task</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded p-2 text-slate-500 hover:bg-slate-800/60 hover:text-slate-300">
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className={labelCls}>Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="Task title" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Task description" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Assign To</label>
                <select value={form.assignedToId} onChange={(e) => setForm((f) => ({ ...f, assignedToId: e.target.value }))} required className={inputCls}>
                  <option value="">Select user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName} {u.unit ? `(${u.unit})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className={inputCls}>
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-slate-700/60 px-4 py-2 text-sm font-semibold text-slate-400 transition hover:bg-slate-800/60">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-lg bg-military-base px-4 py-2 text-sm font-semibold text-white transition hover:bg-military-light disabled:opacity-50">
                  {submitting ? 'Assigning…' : 'Assign Task'}
                </button>
              </div>
            </form>
          </CardSpotlight>
        </div>
      )}
    </SidebarLayout>
  );
}
