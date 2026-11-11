import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  IconCalendarEvent,
  IconCalendarStats,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconChartBar,
  IconUsers,
  IconDownload,
  IconFilter,
  IconCalendarDue,
  IconSun,
  IconFileTypePdf,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { getAttendanceReport, getLeavesReport } from '../api/reports';
import { exportAttendancePDF, exportLeavesPDF } from '../utils/pdfExport';

const COLORS = {
  emerald: '#34d399', sky: '#38bdf8', amber: '#fbbf24', rose: '#fb7185',
  violet: '#a78bfa', slate: '#94a3b8', military: '#6a7c42', fuchsia: '#e879f9',
  cyan: '#22d3ee', lime: '#a3e635',
};

const LEAVE_TYPE_LABEL = { casual: 'Casual', medical: 'Medical', emergency: 'Emergency', unpaid: 'Unpaid' };
const LEAVE_STATUS_CONFIG = {
  pending:   { label: 'Pending',   cls: 'bg-amber-500/15 text-amber-400 ring-amber-500/30' },
  approved:  { label: 'Approved',  cls: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30' },
  rejected:  { label: 'Rejected',  cls: 'bg-red-500/15 text-red-400 ring-red-500/30' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-500/15 text-slate-400 ring-slate-500/30' },
};
const LEAVE_TYPE_COLOR_HEX = { casual: COLORS.sky, medical: COLORS.rose, emergency: COLORS.amber, unpaid: COLORS.slate };

const PIE_COLORS = [COLORS.emerald, COLORS.amber, COLORS.rose, COLORS.slate];

const LEAVE_STATUS_PIE_COLORS = {
  Approved: COLORS.emerald,
  Pending: COLORS.amber,
  Rejected: COLORS.rose,
  Cancelled: COLORS.slate,
};

function DonutChart({ data, size = 200, innerRadius = 58, outerRadius = 82, colorKey = 'fill' }) {
  if (!data?.length) return null;
  const paddingAngle = data.length > 1 ? 4 : 0;

  return (
    <div className="mx-auto shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={paddingAngle}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={entry[colorKey] || PIE_COLORS[i % PIE_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip {...chartTooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieLegend({ items, colorKey = 'fill' }) {
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
      {items.map((s, i) => (
        <div key={s.name} className="flex items-center gap-1.5 text-[11px]">
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: s[colorKey] || PIE_COLORS[i % PIE_COLORS.length] }}
          />
          <span className="text-slate-400">{s.name}</span>
          <span className="font-bold text-slate-200">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function rangePreset(key) {
  const end = new Date();
  const start = new Date();
  if (key === 'today') { /* start = today */ }
  else if (key === '7d') start.setDate(end.getDate() - 7);
  else if (key === '30d') start.setDate(end.getDate() - 30);
  else if (key === '90d') start.setDate(end.getDate() - 90);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatShortDate(d) {
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function isWeekendDateKey(key) {
  if (!key) return false;
  const d = new Date(key);
  const dow = d.getDay();
  return dow === 0 || dow === 6;
}

const chartTooltipStyle = {
  contentStyle: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12, color: '#e2e8f0' },
  itemStyle: { color: '#e2e8f0' },
  labelStyle: { color: '#94a3b8', fontWeight: 600, marginBottom: 4 },
};

export function Reports() {
  const [preset, setPreset] = useState('today');
  const [dateRange, setDateRange] = useState(rangePreset('today'));
  const [attendanceData, setAttendanceData] = useState([]);
  const [leavesData, setLeavesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  function applyPreset(key) {
    setPreset(key);
    setDateRange(rangePreset(key));
  }

  function handleCustomDate(field, value) {
    setPreset('custom');
    setDateRange((p) => ({ ...p, [field]: value }));
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [attRes, leaveRes] = await Promise.all([
        getAttendanceReport({ start: dateRange.start, end: dateRange.end }),
        getLeavesReport({ start: dateRange.start, end: dateRange.end }),
      ]);
      setAttendanceData(attRes.items || []);
      setLeavesData(leaveRes.items || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [dateRange.start, dateRange.end]);

  // ── Computed Analytics ──

  const attStats = useMemo(() => {
    const working = attendanceData.filter((r) => r.status !== 'holiday' && !isWeekendDateKey(r.date?.slice(0, 10)));
    const uniqueUsers = new Set(attendanceData.map((r) => r.userId));
    const present = working.filter((r) => r.status === 'present').length;
    const uniqueDates = new Set(working.map((r) => r.date?.slice(0, 10)));
    return { total: working.length, present, uniqueUsers: uniqueUsers.size, days: uniqueDates.size };
  }, [attendanceData]);

  const leaveStats = useMemo(() => {
    const total = leavesData.length;
    const approved = leavesData.filter((r) => r.status === 'approved').length;
    const pending = leavesData.filter((r) => r.status === 'pending').length;
    const rejected = leavesData.filter((r) => r.status === 'rejected').length;
    const cancelled = leavesData.filter((r) => r.status === 'cancelled').length;
    const totalDays = leavesData.reduce((s, r) => s + (r.totalDays || 0), 0);
    const byType = {};
    leavesData.forEach((r) => { byType[r.leaveType] = (byType[r.leaveType] || 0) + 1; });
    return { total, approved, pending, rejected, cancelled, totalDays, byType };
  }, [leavesData]);

  // ── Chart data: Daily attendance bar + line ──
  const dailyChartData = useMemo(() => {
    const map = {};
    attendanceData.forEach((r) => {
      const d = r.date?.slice(0, 10);
      if (!d) return;
      if (r.status === 'holiday' || isWeekendDateKey(d)) return;
      if (!map[d]) map[d] = { date: d, present: 0, absent: 0, leave: 0, holiday: 0, total: 0 };
      map[d][r.status] = (map[d][r.status] || 0) + 1;
      map[d].total++;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({
      ...d,
      label: formatShortDate(d.date),
    }));
  }, [attendanceData]);

  // ── Pie: leave status ──
  const leaveStatusPie = useMemo(() => [
    { name: 'Approved', value: leaveStats.approved, fill: LEAVE_STATUS_PIE_COLORS.Approved },
    { name: 'Pending', value: leaveStats.pending, fill: LEAVE_STATUS_PIE_COLORS.Pending },
    { name: 'Rejected', value: leaveStats.rejected, fill: LEAVE_STATUS_PIE_COLORS.Rejected },
    { name: 'Cancelled', value: leaveStats.cancelled, fill: LEAVE_STATUS_PIE_COLORS.Cancelled },
  ].filter((s) => s.value > 0), [leaveStats]);

  // ── Pie: leave type ──
  const leaveTypePie = useMemo(() => {
    return Object.entries(leaveStats.byType).map(([type, count]) => ({
      name: LEAVE_TYPE_LABEL[type] || type,
      value: count,
      fill: LEAVE_TYPE_COLOR_HEX[type] || COLORS.slate,
    }));
  }, [leaveStats]);

  // ── Area: cumulative attendance trend ──
  const cumulativeData = useMemo(() => {
    let cumulative = 0;
    return dailyChartData.map((d) => {
      cumulative += d.present;
      return { ...d, cumulative };
    });
  }, [dailyChartData]);

  // ── Radar: unit comparison ──
  const unitRadarData = useMemo(() => {
    const map = {};
    attendanceData.forEach((r) => {
      const d = r.date?.slice(0, 10);
      if (r.status === 'holiday' || isWeekendDateKey(d)) return;
      const unit = r.user?.unit || 'Unassigned';
      if (!map[unit]) map[unit] = { unit, present: 0, total: 0 };
      map[unit].total++;
      if (r.status === 'present') map[unit].present++;
    });
    return Object.values(map).map((d) => ({
      unit: d.unit,
      rate: d.total ? Math.round((d.present / d.total) * 100) : 0,
      count: d.present,
    }));
  }, [attendanceData]);

  // ── Stacked bar: unit by status ──
  const unitStackedData = useMemo(() => {
    const map = {};
    attendanceData.forEach((r) => {
      const d = r.date?.slice(0, 10);
      if (r.status === 'holiday' || isWeekendDateKey(d)) return;
      const unit = r.user?.unit || 'Unassigned';
      if (!map[unit]) map[unit] = { unit, present: 0, absent: 0, leave: 0, holiday: 0 };
      map[unit][r.status] = (map[unit][r.status] || 0) + 1;
    });
    return Object.values(map).sort((a, b) => (b.present + b.absent) - (a.present + a.absent));
  }, [attendanceData]);

  // ── Today's detailed list ──
  const todayRecords = useMemo(() => {
    const today = todayStr();
    return attendanceData.filter((r) => r.date?.slice(0, 10) === today);
  }, [attendanceData]);

  // ── Top users ──
  const topUsers = useMemo(() => {
    const map = {};
    attendanceData.forEach((r) => {
      const uid = r.userId;
      if (!map[uid]) map[uid] = { user: r.user, count: 0 };
      map[uid].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [attendanceData]);

  // ── Leave by user ──
  const leavesByUser = useMemo(() => {
    const map = {};
    leavesData.forEach((r) => {
      const uid = r.userId;
      if (!map[uid]) map[uid] = { user: r.user, requests: 0, days: 0 };
      map[uid].requests++;
      map[uid].days += r.totalDays || 0;
    });
    return Object.values(map).sort((a, b) => b.days - a.days).slice(0, 10);
  }, [leavesData]);

  // ── Leave trend (line) ──
  const leaveTrendData = useMemo(() => {
    const map = {};
    leavesData.forEach((r) => {
      const d = r.startDate?.slice(0, 10);
      if (!d) return;
      const month = d.slice(0, 7);
      if (!map[month]) map[month] = { month, casual: 0, medical: 0, emergency: 0, unpaid: 0 };
      map[month][r.leaveType] = (map[month][r.leaveType] || 0) + 1;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).map((d) => ({
      ...d,
      label: new Date(d.month + '-01').toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
    }));
  }, [leavesData]);

  // ── Export ──
  function handleExportCSV() {
    const headers = ['Date', 'Name', 'Employee ID', 'Unit', 'Status', 'Marked At'];
    const rows = attendanceData.map((r) => [
      r.date?.slice(0, 10), r.user?.fullName, r.user?.employeeId || '', r.user?.unit || '', r.status,
      r.markedAt ? new Date(r.markedAt).toLocaleString() : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `attendance-report-${dateRange.start}-to-${dateRange.end}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const isToday = preset === 'today';

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-military-pale/60">Administration</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-50">Reports &amp; Analytics</h2>
            <p className="mt-1 text-sm text-slate-400">
              {isToday ? "Today\u2019s daily report" : `${formatDate(dateRange.start)} \u2014 ${formatDate(dateRange.end)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={loading || attendanceData.length === 0}
              className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/50 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700/60 disabled:opacity-40"
            >
              <IconDownload className="h-4 w-4" /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'leaves') {
                  exportLeavesPDF(leavesData, dateRange);
                } else {
                  exportAttendancePDF(attendanceData, dateRange);
                }
              }}
              disabled={loading || (activeTab === 'leaves' ? leavesData.length === 0 : attendanceData.length === 0)}
              className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/50 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700/60 disabled:opacity-40"
            >
              <IconFileTypePdf className="h-4 w-4" /> Export PDF
            </button>
          </div>
        </div>

        {/* Quick presets + date range */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-slate-800/50 p-1">
            {[
              { key: 'today', label: 'Today', icon: IconSun },
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: '90d', label: '90 Days' },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                  preset === key ? 'bg-military-base text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />} {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <IconFilter className="h-4 w-4 text-slate-600" />
            <input type="date" value={dateRange.start} onChange={(e) => handleCustomDate('start', e.target.value)} className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-300 focus:border-military-base focus:outline-none" />
            <span className="text-slate-600">\u2014</span>
            <input type="date" value={dateRange.end} onChange={(e) => handleCustomDate('end', e.target.value)} className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-300 focus:border-military-base focus:outline-none" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-800/50 p-1 w-fit">
          {[
            { key: 'overview', label: 'Overview', icon: IconChartBar },
            { key: 'attendance', label: 'Attendance', icon: IconCalendarEvent },
            { key: 'leaves', label: 'Leaves', icon: IconCalendarStats },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                activeTab === key ? 'bg-military-base text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            <IconAlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-military-base border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500">Loading reports\u2026</p>
          </div>
        ) : (
          <>
            {/* =================== OVERVIEW =================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    { label: 'Att Records', value: attStats.total, color: 'text-slate-50', icon: IconCalendarEvent },
                    { label: 'Present', value: attStats.present, color: 'text-emerald-400', icon: IconCheck },
                    { label: 'Personnel', value: attStats.uniqueUsers, color: 'text-sky-400', icon: IconUsers },
                    { label: 'Leave Req', value: leaveStats.total, color: 'text-violet-400', icon: IconCalendarStats },
                    { label: 'Approved', value: leaveStats.approved, color: 'text-emerald-400', icon: IconCheck },
                    { label: 'Pending', value: leaveStats.pending, color: 'text-amber-400', icon: IconClock },
                  ].map((s) => (
                    <CardSpotlight key={s.label} className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <s.icon className="h-4 w-4 text-slate-600" strokeWidth={1.6} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{s.label}</p>
                      </div>
                      <p className={`mt-1 text-xl font-extrabold ${s.color}`}>{s.value}</p>
                    </CardSpotlight>
                  ))}
                </div>

                {/* Row 1: Bar chart + Pie chart */}
                <div className="grid gap-4 lg:grid-cols-3">
                  <CardSpotlight className="p-5 lg:col-span-2">
                    <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">
                      {isToday ? "Today\u2019s Attendance" : 'Daily Attendance'}
                    </h4>
                    <p className="mb-4 text-[11px] text-slate-600">{dailyChartData.length} day{dailyChartData.length !== 1 ? 's' : ''} in range</p>
                    {dailyChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={dailyChartData} barCategoryGap="20%">
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip {...chartTooltipStyle} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="present" name="Present" fill={COLORS.emerald} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="absent" name="Absent" fill={COLORS.rose} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="leave" name="Leave" fill={COLORS.amber} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="py-16 text-center text-xs text-slate-600">No attendance data for this range</p>
                    )}
                  </CardSpotlight>

                  <CardSpotlight className="flex flex-col p-5">
                    <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Leave Status</h4>
                    {leaveStatusPie.length > 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center">
                        <DonutChart data={leaveStatusPie} />
                        <PieLegend items={leaveStatusPie} />
                      </div>
                    ) : (
                      <p className="py-8 text-center text-xs text-slate-600">No leave data</p>
                    )}
                  </CardSpotlight>
                </div>

                {/* Row 2: Cumulative area + Radar */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <CardSpotlight className="p-5">
                    <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">Cumulative Attendance Trend</h4>
                    <p className="mb-4 text-[11px] text-slate-600">Running total of present marks</p>
                    {cumulativeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={cumulativeData}>
                          <defs>
                            <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                              <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip {...chartTooltipStyle} />
                          <Area type="monotone" dataKey="cumulative" name="Total Present" stroke={COLORS.emerald} fill="url(#gradArea)" strokeWidth={2} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="py-12 text-center text-xs text-slate-600">No data</p>
                    )}
                  </CardSpotlight>

                  <CardSpotlight className="p-5">
                    <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">Unit Performance Radar</h4>
                    <p className="mb-4 text-[11px] text-slate-600">Attendance rate by unit (%)</p>
                    {unitRadarData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={unitRadarData}>
                          <PolarGrid stroke="#1e293b" />
                          <PolarAngleAxis dataKey="unit" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <PolarRadiusAxis tick={{ fill: '#475569', fontSize: 9 }} domain={[0, 100]} />
                          <Radar name="Rate %" dataKey="rate" stroke={COLORS.military} fill={COLORS.military} fillOpacity={0.35} strokeWidth={2} />
                          <Tooltip {...chartTooltipStyle} />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="py-12 text-center text-xs text-slate-600">No data</p>
                    )}
                  </CardSpotlight>
                </div>

                {/* Row 3: Stacked unit bar */}
                {unitStackedData.length > 0 && (
                  <CardSpotlight className="p-5">
                    <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">Attendance by Unit (Stacked)</h4>
                    <p className="mb-4 text-[11px] text-slate-600">Status breakdown per unit</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={unitStackedData} layout="vertical" barCategoryGap="18%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <YAxis dataKey="unit" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                        <Tooltip {...chartTooltipStyle} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="present" name="Present" stackId="a" fill={COLORS.emerald} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="leave" name="Leave" stackId="a" fill={COLORS.amber} />
                        <Bar dataKey="absent" name="Absent" stackId="a" fill={COLORS.rose} />
                        <Bar dataKey="holiday" name="Holiday" stackId="a" fill={COLORS.sky} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardSpotlight>
                )}
              </div>
            )}

            {/* =================== ATTENDANCE TAB =================== */}
            {activeTab === 'attendance' && (
              <div className="space-y-6">
                {/* Line chart: daily present count */}
                <CardSpotlight className="p-5">
                  <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">Attendance Line Trend</h4>
                  <p className="mb-4 text-[11px] text-slate-600">Daily present count over time</p>
                  {dailyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip {...chartTooltipStyle} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="present" name="Present" stroke={COLORS.emerald} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.emerald }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="absent" name="Absent" stroke={COLORS.rose} strokeWidth={2} dot={{ r: 2.5, fill: COLORS.rose }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="py-12 text-center text-xs text-slate-600">No data</p>
                  )}
                </CardSpotlight>

                {/* Top attenders */}
                <CardSpotlight className="p-5">
                  <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Top Personnel by Attendance</h4>
                  {topUsers.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-600">No data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={Math.max(topUsers.length * 38, 100)}>
                      <BarChart data={topUsers.map((u) => ({ name: u.user?.fullName || '?', count: u.count }))} layout="vertical" barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                        <Tooltip {...chartTooltipStyle} />
                        <Bar dataKey="count" name="Days Present" fill={COLORS.emerald} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardSpotlight>

                {/* Today's list OR full table */}
                <CardSpotlight className="overflow-hidden">
                  <div className="border-b border-slate-800/40 px-5 py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        {isToday ? "Today\u2019s Attendance" : 'All Attendance Records'}
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        {isToday ? `${todayRecords.length} records for ${formatDate(todayStr())}` : `${attendanceData.length} records in selected range`}
                      </p>
                    </div>
                    {isToday && (
                      <div className="flex items-center gap-1.5 rounded-full bg-military-base/15 px-3 py-1">
                        <IconCalendarDue className="h-3.5 w-3.5 text-military-pale" />
                        <span className="text-[11px] font-bold text-military-pale">LIVE</span>
                      </div>
                    )}
                  </div>
                  <div className="max-h-[420px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm">
                        <tr className="border-b border-slate-800/40">
                          <th className="px-5 py-3 font-bold uppercase tracking-widest text-slate-600">Name</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-widest text-slate-600">Unit</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-widest text-slate-600">Date</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-widest text-slate-600">Time</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-widest text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/30">
                        {(isToday ? todayRecords : attendanceData).slice(0, 100).map((r) => (
                          <tr key={r.id} className="transition hover:bg-slate-800/20">
                            <td className="px-5 py-2.5 font-medium text-slate-200">{r.user?.fullName}</td>
                            <td className="px-4 py-2.5 text-slate-500">{r.user?.unit || '\u2014'}</td>
                            <td className="px-4 py-2.5 text-slate-400">{formatDate(r.date)}</td>
                            <td className="px-4 py-2.5 text-slate-500">{r.markedAt ? new Date(r.markedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '\u2014'}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ring-1 ${r.status === 'present' ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30' : 'bg-red-500/15 text-red-400 ring-red-500/30'}`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(isToday ? todayRecords : attendanceData).length === 0 && (
                      <p className="px-5 py-8 text-center text-xs text-slate-600">No records found.</p>
                    )}
                    {(isToday ? todayRecords : attendanceData).length > 100 && (
                      <p className="border-t border-slate-800/40 px-5 py-3 text-center text-[11px] text-slate-600">
                        Showing 100 of {(isToday ? todayRecords : attendanceData).length} records. Export CSV for full data.
                      </p>
                    )}
                  </div>
                </CardSpotlight>
              </div>
            )}

            {/* =================== LEAVES TAB =================== */}
            {activeTab === 'leaves' && (
              <div className="space-y-6">
                {/* Leave type stat cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {['casual', 'medical', 'emergency', 'unpaid'].map((type) => (
                    <CardSpotlight key={type} className="px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{LEAVE_TYPE_LABEL[type]}</p>
                      <p className="mt-0.5 text-xl font-extrabold" style={{ color: LEAVE_TYPE_COLOR_HEX[type] }}>{leaveStats.byType[type] || 0}</p>
                    </CardSpotlight>
                  ))}
                </div>

                {/* Row: Leave type pie + Leave trend line */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <CardSpotlight className="flex flex-col p-5">
                    <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Leave Type Distribution</h4>
                    {leaveTypePie.length > 0 ? (
                      <div className="flex flex-col items-center">
                        <DonutChart data={leaveTypePie} size={220} innerRadius={0} outerRadius={88} />
                        <PieLegend items={leaveTypePie} />
                      </div>
                    ) : (
                      <p className="py-12 text-center text-xs text-slate-600">No leave data</p>
                    )}
                  </CardSpotlight>

                  <CardSpotlight className="p-5">
                    <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">Leave Trend by Type</h4>
                    <p className="mb-4 text-[11px] text-slate-600">Monthly request count per type</p>
                    {leaveTrendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={leaveTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip {...chartTooltipStyle} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="casual" name="Casual" stroke={COLORS.sky} strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="medical" name="Medical" stroke={COLORS.rose} strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="emergency" name="Emergency" stroke={COLORS.amber} strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="unpaid" name="Unpaid" stroke={COLORS.slate} strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="py-12 text-center text-xs text-slate-600">No data</p>
                    )}
                  </CardSpotlight>
                </div>

                {/* Top leave usage bar */}
                <CardSpotlight className="p-5">
                  <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Top Leave Usage (by days)</h4>
                  {leavesByUser.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-600">No data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={Math.max(leavesByUser.length * 38, 100)}>
                      <BarChart data={leavesByUser.map((u) => ({ name: u.user?.fullName || '?', days: u.days, requests: u.requests }))} layout="vertical" barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                        <Tooltip {...chartTooltipStyle} />
                        <Bar dataKey="days" name="Days" fill={COLORS.violet} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardSpotlight>

                {/* Leave requests table */}
                <CardSpotlight className="overflow-hidden">
                  <div className="border-b border-slate-800/40 px-5 py-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">All Leave Requests</h4>
                    <p className="text-[11px] text-slate-600">{leavesData.length} requests in selected range</p>
                  </div>
                  <div className="max-h-[420px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm">
                        <tr className="border-b border-slate-800/40">
                          <th className="px-5 py-3 font-bold uppercase tracking-widest text-slate-600">Name</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-widest text-slate-600">Type</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-widest text-slate-600">Dates</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-widest text-slate-600">Days</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-widest text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/30">
                        {leavesData.slice(0, 100).map((r) => {
                          const statusConf = LEAVE_STATUS_CONFIG[r.status] || LEAVE_STATUS_CONFIG.pending;
                          return (
                            <tr key={r.id} className="transition hover:bg-slate-800/20">
                              <td className="px-5 py-2.5">
                                <p className="font-medium text-slate-200">{r.user?.fullName}</p>
                                <p className="text-[10px] text-slate-600">{r.user?.unit || '\u2014'}</p>
                              </td>
                              <td className="px-4 py-2.5 font-semibold" style={{ color: LEAVE_TYPE_COLOR_HEX[r.leaveType] || COLORS.slate }}>
                                {LEAVE_TYPE_LABEL[r.leaveType] || r.leaveType}
                              </td>
                              <td className="px-4 py-2.5 text-slate-400">
                                {formatDate(r.startDate)} \u2014 {formatDate(r.endDate)}
                              </td>
                              <td className="px-4 py-2.5 font-bold text-slate-300">{r.totalDays}</td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ring-1 ${statusConf.cls}`}>
                                  {statusConf.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {leavesData.length === 0 && (
                      <p className="px-5 py-8 text-center text-xs text-slate-600">No leave requests found.</p>
                    )}
                    {leavesData.length > 100 && (
                      <p className="border-t border-slate-800/40 px-5 py-3 text-center text-[11px] text-slate-600">
                        Showing 100 of {leavesData.length} requests.
                      </p>
                    )}
                  </div>
                </CardSpotlight>
              </div>
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
