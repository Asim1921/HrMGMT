import { useState, useEffect, useMemo, useRef } from 'react';
import {
  IconShieldLock,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconAlertCircle,
  IconX,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { useAuth } from '../hooks/useAuth';
import { listAuditLogs } from '../api/audit';
import { listUsers } from '../api/users';

const ENTITIES = [
  { value: '', label: 'All entities' },
  { value: 'user', label: 'User' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'leave_request', label: 'Leave Request' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'document', label: 'Document' },
  { value: 'task', label: 'Task' },
  { value: 'auth', label: 'Auth' },
];

const ACTIONS = [
  { value: '', label: 'All actions' },
  { value: 'login', label: 'Login' },
  { value: 'signup', label: 'Signup' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'mark', label: 'Mark' },
  { value: 'verify', label: 'Verify' },
  { value: 'complete', label: 'Complete' },
];

const ACTION_COLORS = {
  create: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/40',
  update: 'bg-sky-500/20 text-sky-400 ring-sky-500/40',
  delete: 'bg-red-500/20 text-red-400 ring-red-500/40',
  login: 'bg-violet-500/20 text-violet-400 ring-violet-500/40',
  signup: 'bg-indigo-500/20 text-indigo-400 ring-indigo-500/40',
  approve: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/40',
  reject: 'bg-red-500/20 text-red-400 ring-red-500/40',
  mark: 'bg-amber-500/20 text-amber-400 ring-amber-500/40',
  verify: 'bg-cyan-500/20 text-cyan-400 ring-cyan-500/40',
  complete: 'bg-teal-500/20 text-teal-400 ring-teal-500/40',
};

function formatTime(d) {
  return new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' });
}

function truncateJson(obj, maxLen = 80) {
  if (obj == null) return '—';
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return str.length <= maxLen ? str : str.slice(0, maxLen) + '...';
}

export function AuditLog() {
  const { isSuperAdmin } = useAuth();
  const [actorSearch, setActorSearch] = useState('');
  const [actorId, setActorId] = useState('');
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [actorDropdownOpen, setActorDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const filteredUsers = useMemo(() => {
    if (!actorSearch.trim()) return users.slice(0, 10);
    const q = actorSearch.toLowerCase();
    return users.filter((u) => (u.fullName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)).slice(0, 10);
  }, [users, actorSearch]);

  const selectedUser = useMemo(() => users.find((u) => u.id === actorId), [users, actorId]);

  useEffect(() => {
    if (isSuperAdmin) {
      listUsers({ limit: 200 }).then((res) => setUsers(res.items || [])).catch(() => setUsers([]));
    }
  }, [isSuperAdmin]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (actorId) params.actorId = actorId;
      if (entity) params.entity = entity;
      if (action) params.action = action;
      if (dateStart) params.start = dateStart;
      if (dateEnd) params.end = dateEnd;
      const res = await listAuditLogs(params);
      setItems(res.items || []);
      setTotal(res.total ?? 0);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin, page, limit, actorId, entity, action, dateStart, dateEnd]);

  const totalPages = Math.ceil(total / limit) || 1;
  const selectClass = 'w-full rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 focus:border-military-base focus:outline-none';

  if (!isSuperAdmin) {
    return (
      <SidebarLayout>
        <CardSpotlight className="flex flex-col items-center justify-center p-12">
          <IconShieldLock className="h-16 w-16 text-slate-600" />
          <h2 className="mt-4 text-xl font-semibold text-slate-50">Access Restricted</h2>
          <p className="mt-2 text-center text-slate-400">Audit logs are only available to Super Administrators.</p>
        </CardSpotlight>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-military-pale/60">Administration</p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-50">
            <IconShieldLock className="h-7 w-7 text-military-pale" />
            Audit Log
          </h2>
          <p className="mt-1 text-sm text-slate-400">System activity and security events</p>
        </div>

        {/* Filters */}
        <CardSpotlight className="relative z-20 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {/* Actor search */}
            <div className="relative" ref={dropdownRef}>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Actor</label>
              <div className="relative">
                <IconSearch className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={selectedUser ? selectedUser.fullName : actorSearch}
                  onChange={(e) => { setActorSearch(e.target.value); setActorId(''); setActorDropdownOpen(true); }}
                  onFocus={() => setActorDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setActorDropdownOpen(false), 200)}
                  placeholder="Search by name..."
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-800/40 py-2.5 pl-9 pr-8 text-sm text-slate-200 placeholder-slate-600 focus:border-military-base focus:outline-none"
                />
                {actorId && (
                  <button type="button" onClick={() => { setActorId(''); setActorSearch(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 hover:bg-slate-700 hover:text-slate-300">
                    <IconX className="h-3.5 w-3.5" />
                  </button>
                )}
                {actorDropdownOpen && filteredUsers.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-auto rounded-lg border border-slate-700/80 bg-slate-900 shadow-xl">
                    {filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onMouseDown={() => { setActorId(u.id); setActorSearch(u.fullName || ''); setActorDropdownOpen(false); }}
                        className="block w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800/80"
                      >
                        <span className="font-medium">{u.fullName}</span>
                        {u.email && <span className="ml-1 text-slate-500 text-xs">({u.email})</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Entity */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Entity</label>
              <select value={entity} onChange={(e) => setEntity(e.target.value)} className={selectClass}>
                {ENTITIES.map((o) => (<option key={o.value || 'all'} value={o.value}>{o.label}</option>))}
              </select>
            </div>

            {/* Action */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Action</label>
              <select value={action} onChange={(e) => setAction(e.target.value)} className={selectClass}>
                {ACTIONS.map((o) => (<option key={o.value || 'all'} value={o.value}>{o.label}</option>))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">From</label>
              <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className={selectClass} />
            </div>

            {/* Date To */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">To</label>
              <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className={selectClass} />
            </div>
          </div>
        </CardSpotlight>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            <IconAlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}

        {/* Table - card view on mobile, table on desktop */}
        <CardSpotlight className="overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="max-h-[500px] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur">
                  <tr className="border-b border-slate-800/80">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Time</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actor</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Action</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Entity</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Details</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-military-base border-t-transparent" /><p className="mt-2 text-slate-500">Loading...</p></td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No audit logs found</td></tr>
                  ) : items.map((row) => (
                    <tr key={row.id} className="border-b border-slate-800/50 transition hover:bg-slate-800/30">
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-400">{formatTime(row.createdAt)}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-300">{row.actor?.fullName || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${ACTION_COLORS[row.action] || 'bg-slate-500/20 text-slate-400 ring-slate-500/40'}`}>
                          {row.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-300">{row.entity}</td>
                      <td className="max-w-[250px] truncate px-4 py-2.5 font-mono text-xs text-slate-500" title={truncateJson(row.details, 300)}>{truncateJson(row.details)}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{row.ipAddress || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile card view */}
          <div className="block md:hidden">
            <div className="max-h-[500px] divide-y divide-slate-800/50 overflow-auto">
              {loading ? (
                <div className="py-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-military-base border-t-transparent" /><p className="mt-2 text-slate-500">Loading...</p></div>
              ) : items.length === 0 ? (
                <div className="py-12 text-center text-slate-500">No audit logs found</div>
              ) : items.map((row) => (
                <div key={row.id} className="space-y-1.5 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${ACTION_COLORS[row.action] || 'bg-slate-500/20 text-slate-400 ring-slate-500/40'}`}>
                      {row.action}
                    </span>
                    <span className="text-[11px] text-slate-500">{formatTime(row.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-slate-300">{row.actor?.fullName || '—'}</span>
                    <span className="text-slate-600">on</span>
                    <span className="text-slate-400">{row.entity}</span>
                  </div>
                  {row.details && (
                    <p className="break-all font-mono text-[11px] text-slate-600">{truncateJson(row.details, 120)}</p>
                  )}
                  {row.ipAddress && <p className="font-mono text-[11px] text-slate-600">IP: {row.ipAddress}</p>}
                </div>
              ))}
            </div>
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between border-t border-slate-800/80 px-4 py-3">
              <p className="text-xs text-slate-500">
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800/60 hover:text-military-pale disabled:opacity-40">
                  <IconChevronLeft className="h-5 w-5" />
                </button>
                <span className="px-3 text-sm text-slate-400">{page}/{totalPages}</span>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800/60 hover:text-military-pale disabled:opacity-40">
                  <IconChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </CardSpotlight>
      </div>
    </SidebarLayout>
  );
}
