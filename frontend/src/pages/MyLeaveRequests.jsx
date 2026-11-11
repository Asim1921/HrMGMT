import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  IconX,
  IconAlertCircle,
  IconCircleCheck,
  IconSend,
  IconArrowRight,
  IconInbox,
  IconClock,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { LeaveRequestComments } from '../components/LeaveRequestComments';
import { getMyLeaves, cancelLeave } from '../api/leaves';

const PAGE_SIZE = 8;

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'cancelled', label: 'Cancelled' },
];

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

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   cls: 'bg-amber-500/15 text-amber-300 ring-amber-500/30', icon: IconClock },
  approved:  { label: 'Approved',  cls: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30', icon: IconCircleCheck },
  rejected:  { label: 'Rejected',  cls: 'bg-red-500/15 text-red-400 ring-red-500/30', icon: IconX },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-500/15 text-slate-500 ring-slate-500/30', icon: IconX },
};

const LEVEL_LABEL = { G2: 'G-2 (Offr)', G1: 'G-1', Comdt: 'Comdt' };

function ApprovalStep({ label, approver, timestamp }) {
  if (!approver) return null;
  return (
    <div className="flex items-start gap-2">
      <IconCircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
      <div>
        <span className="text-xs font-semibold text-emerald-400">{label}</span>
        <span className="text-xs text-slate-400"> — {approver.fullName}</span>
        {timestamp && (
          <p className="text-[10px] text-slate-600">{new Date(timestamp).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

function LeaveRequestCard({ row, expanded, onToggle, onCancel, cancelling }) {
  const typeConf = LEAVE_TYPE_CONFIG[row.leaveType] || LEAVE_TYPE_CONFIG.casual;
  const statusConf = STATUS_CONFIG[row.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConf.icon;

  return (
    <CardSpotlight className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 p-5 text-left transition hover:bg-slate-800/20"
      >
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 ${typeConf.cls}`}>
              {typeConf.label}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 ${statusConf.cls}`}>
              <StatusIcon className="h-3 w-3" />
              {statusConf.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span>{formatDate(row.startDate)} – {formatDate(row.endDate)}</span>
            <span className="rounded-md bg-slate-800/60 px-2 py-0.5 text-xs font-semibold">
              {row.totalDays} day{row.totalDays > 1 ? 's' : ''}
            </span>
          </div>
          {row.reason && !expanded && (
            <p className="truncate text-xs text-slate-500">{row.reason}</p>
          )}
        </div>
        <IconChevronDown
          className={`mt-1 h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-slate-800/60 px-5 pb-5 pt-4">
          {row.reason && (
            <p className="mb-4 rounded-lg bg-slate-800/40 px-3 py-2 text-xs leading-relaxed text-slate-400">
              <span className="font-semibold text-slate-500">Reason: </span>
              {row.reason}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Approval Trail</p>
            {row.status === 'pending' && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onCancel(row.id); }}
                disabled={cancelling}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-700/50 bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-900/40 disabled:opacity-50"
              >
                <IconX className="h-3.5 w-3.5" />
                {cancelling ? 'Cancelling…' : 'Cancel Request'}
              </button>
            )}
          </div>

          <div className="mt-3 space-y-2 rounded-lg bg-slate-800/30 px-4 py-3">
            <ApprovalStep label={LEVEL_LABEL.G2} approver={row.approvedByG2} timestamp={row.approvedAtG2} />
            <ApprovalStep label={LEVEL_LABEL.G1} approver={row.approvedByG1} timestamp={row.approvedAtG1} />
            <ApprovalStep label={LEVEL_LABEL.Comdt} approver={row.approvedByComdt} timestamp={row.approvedAtComdt} />

            {!row.approvedByG2 && !row.approvedByG1 && !row.approvedByComdt && row.status === 'pending' && (
              <p className="flex items-center gap-1.5 text-[11px] text-amber-300/80">
                <IconClock className="h-3.5 w-3.5" />
                Awaiting approval: G-2 → G-1 → Comdt
              </p>
            )}

            {!row.approvedByG2 && !row.approvedByG1 && !row.approvedByComdt && row.status !== 'pending' && (
              <p className="text-[11px] text-slate-600">No approvals recorded.</p>
            )}
          </div>

          <div className="mt-4">
            <LeaveRequestComments leaveRequestId={row.id} compact readOnly={row.status !== 'pending'} />
          </div>
        </div>
      )}
    </CardSpotlight>
  );
}

export function MyLeaveRequests() {
  const [activeTab, setActiveTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, cancelled: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await getMyLeaves({ status: activeTab, page, limit: PAGE_SIZE });
      setItems(res.items || []);
      setCounts(res.counts || { pending: 0, approved: 0, cancelled: 0 });
      setTotalPages(res.totalPages || 1);
      setTotal(res.total ?? 0);
      setExpandedId(null);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => { load(); }, [load]);

  function handleTabChange(tab) {
    setActiveTab(tab);
    setPage(1);
  }

  async function handleCancel(id) {
    setError('');
    setCancellingId(id);
    try {
      await cancelLeave(id);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to cancel request');
    } finally {
      setCancellingId(null);
    }
  }

  const tabCount = (key) => counts[key] ?? 0;

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-military-pale/60">Leave</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-50">My Leave Requests</h2>
            <p className="mt-1 text-sm text-slate-400">Browse by status — click a request to view details and discussion.</p>
          </div>
          <Link
            to="/leaves/apply"
            className="group flex items-center gap-2 rounded-xl bg-military-base px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-military-dark/30 transition hover:bg-military-dark"
          >
            <IconSend className="h-4 w-4" />
            New Request
            <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800/60 pb-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            const count = tabCount(tab.key);
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`relative flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? 'bg-slate-800/60 text-slate-50 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-military-base'
                    : 'text-slate-500 hover:bg-slate-800/30 hover:text-slate-300'
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  active ? 'bg-military-base/25 text-military-pale' : 'bg-slate-800/80 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            <IconAlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-military-base border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500">Loading requests…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <IconInbox className="h-14 w-14 text-slate-700" strokeWidth={1.2} />
            <p className="mt-4 text-base font-medium text-slate-400">
              No {TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} requests
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {activeTab === 'pending' ? (
                <>
                  <Link to="/leaves/apply" className="text-military-pale hover:underline">Apply for leave</Link> to get started.
                </>
              ) : (
                'Try another tab or submit a new request.'
              )}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {items.map((row) => (
                <LeaveRequestCard
                  key={row.id}
                  row={row}
                  expanded={expandedId === row.id}
                  onToggle={() => setExpandedId((id) => (id === row.id ? null : row.id))}
                  onCancel={handleCancel}
                  cancelling={cancellingId === row.id}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/60 pt-4">
                <p className="text-xs text-slate-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800/70 disabled:opacity-40"
                  >
                    <IconChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="px-2 text-xs font-medium text-slate-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800/70 disabled:opacity-40"
                  >
                    Next
                    <IconChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
