import { useState, useEffect, useMemo } from 'react';
import {
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { useAuth } from '../hooks/useAuth';
import { listHolidays, createHoliday, deleteHoliday } from '../api/holidays';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDaysInMonth(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = last.getDate();
  const startDow = (first.getDay() + 6) % 7; // Mon=0
  return { days, startDow };
}

function MonthGrid({ year, month, holidaysSet }) {
  const { days, startDow } = getDaysInMonth(year, month);
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push({ key: `pad-${i}`, pad: true });
  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ key: d, day: d, dateStr, isHoliday: holidaysSet.has(dateStr) });
  }
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2">
      <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-military-pale/80">
        {MONTHS[month]}
      </p>
      <div className="grid grid-cols-7 gap-0.5 text-[10px]">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-0.5 text-center font-semibold text-slate-600">
            {w[0]}
          </div>
        ))}
        {cells.map((c) =>
          c.pad ? (
            <div key={c.key} className="aspect-square" />
          ) : (
            <div
              key={c.key}
              className={`flex aspect-square items-center justify-center rounded ${
                c.isHoliday ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/50' : 'text-slate-500'
              }`}
              title={c.isHoliday ? `Holiday: ${c.dateStr}` : ''}
            >
              {c.day}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export function Holidays() {
  const { isSuperAdmin } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ date: '', name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const holidaysSet = useMemo(() => {
    const set = new Set();
    holidays.forEach((h) => {
      const d = new Date(h.date);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      set.add(str);
    });
    return set;
  }, [holidays]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await listHolidays(year);
      setHolidays(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [year]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.date || !form.name) return;
    setSubmitting(true);
    try {
      await createHoliday({ date: form.date, name: form.name, description: form.description || null });
      setForm({ date: '', name: '', description: '' });
      setModalOpen(false);
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create holiday');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this holiday?')) return;
    try {
      await deleteHoliday(id);
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to delete holiday');
    }
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-military-pale/60">Administration</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-50">Holidays</h2>
            <p className="mt-1 text-sm text-slate-400">Calendar view for {year}</p>
          </div>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-military-base/60 bg-military-base/20 px-4 py-2.5 text-sm font-semibold text-military-pale transition hover:bg-military-base/40"
            >
              <IconPlus className="h-4 w-4" /> Add Holiday
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-military-base border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500">Loading holidays…</p>
          </div>
        ) : (
          <>
            {/* Year selector */}
            <CardSpotlight className="flex items-center justify-between gap-4 px-4 py-3">
              <button
                type="button"
                onClick={() => setYear((y) => y - 1)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800/60 hover:text-military-pale"
              >
                <IconChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-lg font-bold text-slate-50">{year}</span>
              <button
                type="button"
                onClick={() => setYear((y) => y + 1)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800/60 hover:text-military-pale"
              >
                <IconChevronRight className="h-5 w-5" />
              </button>
            </CardSpotlight>

            {/* 12-month calendar grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {MONTHS.map((_, month) => (
                <MonthGrid key={month} year={year} month={month} holidaysSet={holidaysSet} />
              ))}
            </div>

            {/* Holiday list */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-military-pale/80">
                Holiday List
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {holidays.length === 0 ? (
                  <CardSpotlight className="p-6 text-center text-slate-500">
                    <IconCalendarEvent className="mx-auto h-10 w-10 text-slate-600" />
                    <p className="mt-2 text-sm">No holidays for {year}</p>
                  </CardSpotlight>
                ) : (
                  holidays.map((h) => (
                    <CardSpotlight key={h.id} className="relative p-4">
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDelete(h.id)}
                          className="absolute right-2 top-2 rounded p-1.5 text-slate-500 transition hover:bg-red-500/20 hover:text-red-400"
                          title="Delete"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      )}
                      <p className="text-xs font-semibold uppercase tracking-wider text-military-pale/80">
                        {formatDate(h.date)}
                      </p>
                      <p className="mt-1 font-semibold text-slate-50">{h.name}</p>
                      {h.description && (
                        <p className="mt-1 text-sm text-slate-400 line-clamp-2">{h.description}</p>
                      )}
                    </CardSpotlight>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Holiday Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <CardSpotlight className="w-full max-w-md p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-50">Add Holiday</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded p-2 text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 focus:border-military-base focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="e.g. Independence Day"
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-military-base focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Description (optional)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Brief description"
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-military-base focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-700/60 px-4 py-2 text-sm font-semibold text-slate-400 transition hover:bg-slate-800/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-military-base px-4 py-2 text-sm font-semibold text-white transition hover:bg-military-light disabled:opacity-50"
                >
                  {submitting ? 'Adding…' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </CardSpotlight>
        </div>
      )}
    </SidebarLayout>
  );
}
