import { useState, useEffect, useMemo } from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconAlertCircle,
  IconSun,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAuth } from '../hooks/useAuth';
import { getLeavesReport } from '../api/reports';
import { getMyLeaves } from '../api/leaves';
import { listHolidays } from '../api/holidays';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LEAVE_TYPE_LABEL = { casual: 'Casual', medical: 'Medical', emergency: 'Emergency', unpaid: 'Unpaid' };

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

function dateKey(d) {
  return typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10);
}

function isWeekend(d) {
  const dow = d.getDay(); // 0=Sun, 6=Sat
  return dow === 0 || dow === 6;
}

function getDayCellClasses(dayLeaves, isHoliday, weekend, isCurrentMonth) {
  if (dayLeaves.length > 0) {
    const hasPending = dayLeaves.some((l) => l.status === 'pending');
    const hasApproved = dayLeaves.some((l) => l.status === 'approved');
    const hasRejected = dayLeaves.some((l) => l.status === 'rejected');
    const muted = !isCurrentMonth ? 'opacity-60' : '';

    if (hasPending) {
      return `${muted} bg-amber-500/30 ring-1 ring-inset ring-amber-500/50 text-amber-50`;
    }
    if (hasApproved) {
      return `${muted} bg-emerald-500/30 ring-1 ring-inset ring-emerald-500/50 text-emerald-50`;
    }
    if (hasRejected) {
      return `${muted} bg-red-500/20 ring-1 ring-inset ring-red-500/40 text-red-100`;
    }
    return `${muted} bg-slate-700/40 text-slate-300`;
  }

  if (isHoliday || weekend) {
    return !isCurrentMonth ? 'bg-red-950/15 text-slate-600' : 'bg-red-950/25 text-slate-200';
  }

  return !isCurrentMonth ? 'bg-slate-950/50 text-slate-600' : 'text-slate-200';
}

function getDayLeaveSummary(dayLeaves) {
  if (!dayLeaves.length) return '';
  const pending = dayLeaves.filter((l) => l.status === 'pending').length;
  const approved = dayLeaves.filter((l) => l.status === 'approved').length;
  if (pending > 0) return `${pending} pending`;
  if (approved > 0) return `${approved} approved`;
  return `${dayLeaves.length} leave${dayLeaves.length !== 1 ? 's' : ''}`;
}

export function LeaveCalendar() {
  const { isAdmin } = useAuth();
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [units, setUnits] = useState([]);
  const [unitFilter, setUnitFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);

  const startOfMonth = useMemo(() => new Date(year, month, 1), [year, month]);
  const endOfMonth = useMemo(() => new Date(year, month + 1, 0), [year, month]);

  const loadData = useMemo(() => async () => {
    setError('');
    setLoading(true);
    try {
      const start = new Date(year, month, 1).toISOString().slice(0, 10);
      const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);

      const [leavesRes, holidaysRes] = await Promise.all([
        isAdmin
          ? getLeavesReport({ start, end })
          : getMyLeaves({ limit: 100 }),
        listHolidays(year),
      ]);

      let leaveItems = leavesRes?.items ?? leavesRes ?? [];
      leaveItems = Array.isArray(leaveItems) ? leaveItems : [];
      if (!isAdmin) {
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);
        leaveItems = leaveItems.filter((l) => {
          const lEnd = new Date(l.endDate);
          const lStart = new Date(l.startDate);
          return lStart <= end && lEnd >= start;
        });
      }
      setLeaves(leaveItems);

      const holidayItems = Array.isArray(holidaysRes) ? holidaysRes : holidaysRes?.items ?? [];
      setHolidays(holidayItems);

      if (isAdmin && leaveItems.length > 0) {
        const u = [...new Set(leaveItems.map((l) => l.user?.unit).filter(Boolean))].sort();
        setUnits(u);
        if (!u.includes(unitFilter)) setUnitFilter('');
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load data');
      setLeaves([]);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, [year, month, isAdmin]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredLeaves = useMemo(() => {
    if (!isAdmin || !unitFilter) return leaves;
    return leaves.filter((l) => l.user?.unit === unitFilter);
  }, [leaves, isAdmin, unitFilter]);

  const holidaySet = useMemo(() => {
    const s = new Set();
    holidays.forEach((h) => {
      const d = h.date?.slice?.(0, 10) ?? new Date(h.date).toISOString().slice(0, 10);
      s.add(d);
    });
    return s;
  }, [holidays]);

  const leavesByDate = useMemo(() => {
    const map = {};
    filteredLeaves.forEach((l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(l);
      }
    });
    return map;
  }, [filteredLeaves]);

  const calendarDays = useMemo(() => {
    const first = new Date(startOfMonth);
    const last = new Date(endOfMonth);
    const startDow = first.getDay();
    const offset = startDow === 0 ? 6 : startDow - 1;
    const padStart = offset;
    const daysInMonth = last.getDate();
    const totalCells = Math.ceil((padStart + daysInMonth) / 7) * 7;
    const days = [];

    for (let i = 0; i < padStart; i++) {
      const d = new Date(first);
      d.setDate(d.getDate() - (padStart - i));
      days.push({ date: d, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = totalCells - days.length;
    for (let i = 0; i < remaining; i++) {
      const d = new Date(last);
      d.setDate(d.getDate() + i + 1);
      days.push({ date: d, isCurrentMonth: false });
    }
    return days;
  }, [startOfMonth, endOfMonth, year, month]);

  const todayKey = dateKey(new Date());

  function handlePrevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function handleDayClick(e, day) {
    const key = dateKey(day.date);
    const dayLeaves = leavesByDate[key] || [];
    const isHoliday = holidaySet.has(key);
    if (dayLeaves.length === 0 && !isHoliday) {
      setSelectedDay(null);
      return;
    }
    setSelectedDay({ date: day.date, leaves: dayLeaves, isHoliday });
  }

  const monthName = startOfMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-military-pale/60">Calendar</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-50">Leave Calendar</h2>
          <p className="mt-1 text-sm text-slate-400">View leave requests and holidays by month.</p>
        </div>

        {/* Month nav + unit filter */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-lg border border-slate-700/60 bg-slate-800/50 p-2 text-slate-400 transition hover:bg-slate-700/50 hover:text-slate-200"
            >
              <IconChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="min-w-[180px] text-center text-lg font-semibold text-slate-50">{monthName}</h3>
            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-lg border border-slate-700/60 bg-slate-800/50 p-2 text-slate-400 transition hover:bg-slate-700/50 hover:text-slate-200"
            >
              <IconChevronRight className="h-5 w-5" />
            </button>
          </div>
          {isAdmin && units.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Unit:</span>
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 focus:border-military-base focus:outline-none"
              >
                <option value="">All units</option>
                {units.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
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
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-military-base border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500">Loading calendar…</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-slate-800/80">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="border-r border-slate-800/80 px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500 last:border-r-0"
                >
                  {d}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const key = dateKey(day.date);
                const dayLeaves = leavesByDate[key] || [];
                const isHoliday = holidaySet.has(key);
                const weekend = isWeekend(day.date);
                const isToday = key === todayKey;
                const cellCls = getDayCellClasses(dayLeaves, isHoliday, weekend, day.isCurrentMonth);
                const summary = getDayLeaveSummary(dayLeaves);

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => handleDayClick(e, day)}
                    title={dayLeaves.map((l) => `${l.user?.fullName || 'Leave'} - ${LEAVE_TYPE_LABEL[l.leaveType] || l.leaveType} (${l.status})`).join(', ')}
                    className={`min-h-[80px] border-b border-r border-slate-800/60 p-2 text-left transition last:border-r-0 hover:brightness-110 ${cellCls} ${isToday ? 'ring-2 ring-inset ring-military-base' : ''}`}
                  >
                    <span className="text-sm font-semibold">{day.date.getDate()}</span>
                    {summary && (
                      <p className="mt-1 text-[10px] font-medium opacity-90">{summary}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-800/60 bg-slate-800/30 px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Legend</span>
          <div className="flex items-center gap-2">
            <div className="h-4 w-6 rounded bg-emerald-500/30 ring-1 ring-inset ring-emerald-500/50" />
            <span className="text-xs text-slate-400">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-6 rounded bg-amber-500/30 ring-1 ring-inset ring-amber-500/50" />
            <span className="text-xs text-slate-400">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-6 rounded bg-red-500/20 ring-1 ring-inset ring-red-500/40" />
            <span className="text-xs text-slate-400">Rejected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-red-950/60" />
            <span className="text-xs text-slate-400">Holiday / Weekend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded ring-2 ring-military-base" />
            <span className="text-xs text-slate-400">Today</span>
          </div>
        </div>

        {/* Day popup */}
        {selectedDay && (
          <div
            className="fixed inset-0 z-50"
            onClick={() => setSelectedDay(null)}
          >
            <div
              className="absolute left-1/2 top-1/2 z-10 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-700/80 bg-slate-900 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-slate-800/80 px-4 py-3">
                <p className="text-sm font-semibold text-slate-50">
                  {formatDate(selectedDay.date)}
                </p>
                {selectedDay.isHoliday && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-blue-400">
                    <IconSun className="h-4 w-4" />
                    {holidays.find((h) => dateKey(h.date) === dateKey(selectedDay.date))?.name || 'Holiday'}
                  </p>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto px-4 py-3">
                {selectedDay.leaves.length === 0 ? (
                  selectedDay.isHoliday ? (
                    <p className="text-xs text-slate-500">No leave requests on this holiday.</p>
                  ) : (
                    <p className="text-xs text-slate-500">No leave requests.</p>
                  )
                ) : (
                  <ul className="space-y-2">
                    {selectedDay.leaves.map((l) => (
                      <li key={l.id} className="rounded-lg bg-slate-800/50 px-3 py-2">
                        <p className="text-sm font-medium text-slate-200">
                          {isAdmin ? (l.user?.fullName || 'Unknown') : 'Your leave'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {LEAVE_TYPE_LABEL[l.leaveType] || l.leaveType} · {l.totalDays} day{l.totalDays !== 1 ? 's' : ''}
                        </p>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          l.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                          l.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {l.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
