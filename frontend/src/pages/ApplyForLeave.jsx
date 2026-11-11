import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  IconSend,
  IconAlertCircle,
  IconCalendarEvent,
  IconArrowRight,
  IconInfoCircle,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { applyLeave } from '../api/leaves';

const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual', desc: 'Short personal leave' },
  { value: 'medical', label: 'Medical', desc: 'Health-related absence' },
  { value: 'emergency', label: 'Emergency', desc: 'Urgent unforeseen leave' },
  { value: 'unpaid', label: 'Unpaid', desc: 'Without pay deduction' },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(start, end) {
  if (!start || !end) return 0;
  const ms = new Date(end) - new Date(start);
  return ms >= 0 ? Math.floor(ms / 86400000) + 1 : 0;
}

export function ApplyForLeave() {
  const navigate = useNavigate();
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!startDate || !endDate) {
      setError('Start date and end date are required.');
      return;
    }
    setLoading(true);
    try {
      await applyLeave({ leaveType, startDate, endDate, reason: reason.trim() || undefined });
      navigate('/leaves/my-requests', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit leave request.');
    } finally {
      setLoading(false);
    }
  }

  const minDate = todayISO();
  const totalDays = daysBetween(startDate, endDate);

  return (
    <SidebarLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-military-pale/60">Request Channel</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-50">Apply for Leave</h2>
            <p className="mt-1 text-sm text-slate-400">
              Submit a leave request. It routes through G-2 \u2192 G-1 \u2192 Comdt.
            </p>
          </div>
          <Link
            to="/leaves/my-requests"
            className="group flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-military-base/50 hover:text-military-pale"
          >
            My Requests
            <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Leave type selector */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LEAVE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setLeaveType(t.value)}
              className={`rounded-xl border p-3.5 text-left transition-all ${
                leaveType === t.value
                  ? 'border-military-base bg-military-base/15 ring-1 ring-military-base/40 shadow-lg shadow-military-dark/20'
                  : 'border-slate-800/60 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <p className={`text-sm font-semibold ${leaveType === t.value ? 'text-military-pale' : 'text-slate-200'}`}>
                {t.label}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">{t.desc}</p>
            </button>
          ))}
        </div>

        {/* Form */}
        <CardSpotlight className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                <IconAlertCircle className="h-5 w-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  min={minDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-3 text-slate-50 focus:border-military-base focus:outline-none focus:ring-2 focus:ring-military-base/40"
                  required
                />
              </div>
              <div>
                <label htmlFor="endDate" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  min={startDate || minDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-3 text-slate-50 focus:border-military-base focus:outline-none focus:ring-2 focus:ring-military-base/40"
                  required
                />
              </div>
            </div>

            {totalDays > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-military-base/30 bg-military-base/10 px-4 py-3">
                <IconInfoCircle className="h-5 w-5 text-military-pale/70" />
                <p className="text-sm text-military-pale">
                  Duration: <span className="font-bold">{totalDays} day{totalDays > 1 ? 's' : ''}</span>
                </p>
              </div>
            )}

            <div>
              <label htmlFor="reason" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Reason <span className="normal-case tracking-normal text-slate-600">(optional)</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Brief justification for your leave request\u2026"
                className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:border-military-base focus:outline-none focus:ring-2 focus:ring-military-base/40"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2.5 rounded-xl bg-military-base px-7 py-3.5 font-semibold text-white shadow-lg shadow-military-dark/40 transition hover:bg-military-dark focus:ring-2 focus:ring-military-light focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
              >
                <IconSend className="h-5 w-5" />
                {loading ? 'Submitting\u2026' : 'Submit Request'}
              </button>
              <Link
                to="/leaves/my-requests"
                className="inline-flex items-center rounded-xl border border-slate-700/80 bg-slate-800/50 px-7 py-3.5 font-medium text-slate-300 transition hover:bg-slate-700/60"
              >
                Cancel
              </Link>
            </div>
          </form>
        </CardSpotlight>
      </div>
    </SidebarLayout>
  );
}
