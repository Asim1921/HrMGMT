import { useState, useEffect } from 'react';
import {
  IconCalendarCheck,
  IconClock,
  IconCircleCheck,
  IconCircleX,
  IconBeach,
  IconPlane,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { getMyAttendance } from '../api/attendance';

function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getDateRange(daysBack) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

const STATUS_CONFIG = {
  present: { label: 'Present', icon: IconCircleCheck, cls: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30' },
  absent:  { label: 'Absent',  icon: IconCircleX,     cls: 'bg-red-500/15 text-red-400 ring-red-500/30' },
  leave:   { label: 'On Leave', icon: IconPlane,      cls: 'bg-amber-500/15 text-amber-400 ring-amber-500/30' },
  holiday: { label: 'Holiday', icon: IconBeach,        cls: 'bg-sky-500/15 text-sky-400 ring-sky-500/30' },
};

const RANGE_OPTIONS = [
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 180, label: 'Last 6 months' },
  { value: 365, label: 'Last 12 months' },
];

export function AttendanceHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rangeDays, setRangeDays] = useState(90);

  useEffect(() => {
    let cancelled = false;
    const { start, end } = getDateRange(rangeDays);
    (async () => {
      setError('');
      setLoading(true);
      try {
        const res = await getMyAttendance({ start, end });
        if (!cancelled) setItems(res.items || []);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || 'Failed to load attendance');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [rangeDays]);

  const workingItems = items.filter((i) => i.status !== 'holiday');
  const presentCount = workingItems.filter((i) => i.status === 'present').length;

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-military-pale/60">My Record</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-50">Attendance History</h2>
            <p className="mt-1 text-sm text-slate-400">Track your daily check-ins and presence record.</p>
          </div>
          <div className="flex items-center gap-3">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRangeDays(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  rangeDays === opt.value
                    ? 'bg-military-base/20 text-military-pale ring-1 ring-military-base/40'
                    : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <CardSpotlight className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Records</p>
              <p className="mt-1 text-2xl font-bold text-slate-50">{items.length}</p>
            </CardSpotlight>
            <CardSpotlight className="p-4" spotlightColor="rgba(16,185,129,0.12)">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Present Days</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">{presentCount}</p>
            </CardSpotlight>
            <CardSpotlight className="p-4 col-span-2 sm:col-span-1" spotlightColor="rgba(245,158,11,0.12)">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Attendance Rate</p>
              <p className="mt-1 text-2xl font-bold text-amber-300">
                {workingItems.length > 0 ? Math.round((presentCount / workingItems.length) * 100) : 0}%
              </p>
            </CardSpotlight>
          </div>
        )}

        {/* Table */}
        <CardSpotlight className="overflow-hidden">
          {error && (
            <div className="mx-6 mt-6 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-military-base border-t-transparent" />
              <p className="mt-4 text-sm text-slate-500">Loading records\u2026</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <IconCalendarCheck className="h-14 w-14 text-slate-700" strokeWidth={1.2} />
              <p className="mt-4 text-base font-medium text-slate-400">No attendance records found</p>
              <p className="mt-1 text-sm text-slate-600">Mark attendance to start building your record.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Check-In Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {items.map((row) => {
                    const conf = STATUS_CONFIG[row.status] || STATUS_CONFIG.present;
                    const StatusIcon = conf.icon;
                    return (
                      <tr key={row.id} className="transition-colors hover:bg-slate-800/20">
                        <td className="px-6 py-4 text-sm font-medium text-slate-100">{formatDate(row.date)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${conf.cls}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {conf.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 text-sm tabular-nums text-slate-400">
                            <IconClock className="h-4 w-4 text-slate-600" />
                            {formatTime(row.markedAt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardSpotlight>
      </div>
    </SidebarLayout>
  );
}
