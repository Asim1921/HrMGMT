import { useState, useEffect } from 'react';
import {
  IconClipboardCheck,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconInbox,
  IconUser,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { LeaveRequestComments } from '../components/LeaveRequestComments';
import { useAuth } from '../hooks/useAuth';
import { getPendingLeaves, approveLeave, rejectLeave } from '../api/leaves';

function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const LEAVE_TYPE_CONFIG = {
  casual:    { label: 'Casual',    cls: 'bg-sky-500/15 text-sky-400 ring-sky-500/25' },
  medical:   { label: 'Medical',   cls: 'bg-rose-500/15 text-rose-400 ring-rose-500/25' },
  emergency: { label: 'Emergency', cls: 'bg-amber-500/15 text-amber-400 ring-amber-500/25' },
  unpaid:    { label: 'Unpaid',    cls: 'bg-slate-500/15 text-slate-400 ring-slate-500/25' },
};

const LEVEL_LABEL = { 1: 'G-2 (Offr)', 2: 'G-1', 3: 'Comdt' };

export function LeavesApprovals() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  const approvalLevel = user?.approvalLevel ?? (user?.role === 'super_admin' ? 3 : null);
  const levelLabel = approvalLevel != null ? LEVEL_LABEL[approvalLevel] : null;

  async function load() {
    setError('');
    setLoading(true);
    try {
      const res = await getPendingLeaves();
      setItems(res.items || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(id) {
    setError('');
    setActionId(id);
    try {
      await approveLeave(id);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to approve');
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id) {
    setError('');
    setActionId(id);
    try {
      await rejectLeave(id);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to reject');
    } finally {
      setActionId(null);
    }
  }

  if (approvalLevel == null) {
    return (
      <SidebarLayout>
        <div className="mx-auto max-w-lg py-20 text-center">
          <IconClipboardCheck className="mx-auto h-14 w-14 text-slate-700" strokeWidth={1.2} />
          <p className="mt-4 text-base text-slate-400">
            You do not have an approval level. Only G-2, G-1, or Comdt approvers can review leave requests.
          </p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/60">Command</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-50">Pending Approvals</h2>
            <p className="mt-1 text-sm text-slate-400">
              Your level: <span className="font-semibold text-amber-300">{levelLabel}</span>. Comdt approval finalizes and deducts balance.
            </p>
          </div>
          {!loading && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2">
              <span className="text-2xl font-extrabold text-amber-300">{items.length}</span>
              <span className="ml-2 text-sm text-amber-200/70">pending</span>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            <IconAlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500">Loading requests…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <IconInbox className="h-14 w-14 text-slate-700" strokeWidth={1.2} />
            <p className="mt-4 text-base font-medium text-slate-400">No pending requests at your level</p>
            <p className="mt-1 text-sm text-slate-600">All caught up. Check back later.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((row) => {
              const typeConf = LEAVE_TYPE_CONFIG[row.leaveType] || LEAVE_TYPE_CONFIG.casual;
              const isActioning = actionId === row.id;
              return (
                <CardSpotlight key={row.id} className="p-5" spotlightColor="rgba(245,158,11,0.08)">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800 text-sm font-bold text-slate-300 ring-2 ring-slate-700/50">
                        {row.user?.fullName?.[0]?.toUpperCase() || <IconUser className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{row.user?.fullName}</p>
                        <p className="text-xs text-slate-500">
                          {row.user?.employeeId || '\u2014'} &middot; {row.user?.unit || '\u2014'}
                          {row.user?.designation && <span> &middot; {row.user.designation}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(row.id)}
                        disabled={actionId != null}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-military-base px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-military-dark disabled:opacity-50"
                      >
                        <IconCheck className="h-4 w-4" />
                        {isActioning ? '\u2026' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(row.id)}
                        disabled={actionId != null}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-700/50 bg-red-950/30 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-900/40 disabled:opacity-50"
                      >
                        <IconX className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 ${typeConf.cls}`}>
                      {typeConf.label}
                    </span>
                    <span className="text-sm text-slate-400">
                      {formatDate(row.startDate)} – {formatDate(row.endDate)}
                    </span>
                    <span className="rounded-md bg-slate-800/60 px-2 py-0.5 text-xs font-semibold text-slate-300">
                      {row.totalDays} day{row.totalDays > 1 ? 's' : ''}
                    </span>
                  </div>

                  {row.reason && (
                    <p className="mt-3 rounded-lg bg-slate-800/40 px-3 py-2 text-xs leading-relaxed text-slate-400">
                      {row.reason}
                    </p>
                  )}

                  <div className="mt-4">
                    <LeaveRequestComments leaveRequestId={row.id} compact />
                  </div>
                </CardSpotlight>
              );
            })}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
