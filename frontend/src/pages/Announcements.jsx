import { useState, useEffect } from 'react';
import {
  IconSpeakerphone,
  IconPlus,
  IconTrash,
  IconX,
  IconAlertCircle,
  IconCalendar,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { listAnnouncements, createAnnouncement, deleteAnnouncement } from '../api/announcements';
import { useAuth } from '../hooks/useAuth';

const PRIORITY_STYLES = {
  normal: 'bg-slate-500/15 text-slate-400',
  urgent: 'bg-amber-500/15 text-amber-400',
  critical: 'bg-red-500/15 text-red-400',
};

const TARGET_UNITS = [
  { value: '', label: 'All' },
  { value: '802 Grp', label: '802' },
  { value: '803 Grp', label: '803' },
  { value: '804 Grp', label: '804' },
];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function contentPreview(content, maxLen = 120) {
  const text = (content || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

function NewAnnouncementModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'normal',
    targetUnit: '',
    expiresAt: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createAnnouncement({
        title: form.title.trim(),
        content: form.content.trim(),
        priority: form.priority,
        targetUnit: form.targetUnit || null,
        expiresAt: form.expiresAt || null,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create announcement');
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'w-full rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-sm text-slate-50 focus:border-military-base focus:outline-none focus:ring-1 focus:ring-military-base/40';
  const labelCls =
    'mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => onClose()}
    >
      <div
        className="relative mx-4 w-full max-w-lg rounded-2xl border border-slate-800/80 bg-slate-900 p-6 shadow-2xl ring-1 ring-slate-800/40"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onClose()}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
        >
          <IconX className="h-5 w-5" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-military-base/15">
            <IconSpeakerphone className="h-5 w-5 text-military-pale" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-50">
              New Announcement
            </h3>
            <p className="text-xs text-slate-500">Broadcast to personnel</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-xs text-red-200">
            <IconAlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className={inputCls}
              placeholder="Announcement title"
              required
            />
          </div>
          <div>
            <label className={labelCls}>Content</label>
            <textarea
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              className={`${inputCls} min-h-[120px] resize-y`}
              placeholder="Full announcement content…"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
                className={inputCls}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Target Unit</label>
              <select
                value={form.targetUnit}
                onChange={(e) => set('targetUnit', e.target.value)}
                className={inputCls}
              >
                {TARGET_UNITS.map(({ value, label }) => (
                  <option key={value || 'all'} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Expires At (optional)</label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => set('expiresAt', e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => onClose()}
              className="flex-1 rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800/70"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-military-base px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-military-light disabled:opacity-50"
            >
              {saving ? 'Posting…' : 'Post Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatFullDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function Announcements() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await listAnnouncements();
      setItems(res.items || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await deleteAnnouncement(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch (_e) {
      setError('Failed to delete announcement');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-military-pale/60">
              Command
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-50">
              Announcements
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Official notices and updates for personnel.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-xl bg-military-base px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-military-light"
            >
              <IconPlus className="h-4 w-4" />
              New Announcement
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            <IconAlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-military-base border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500">
              Loading announcements…
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <IconSpeakerphone className="h-14 w-14 text-slate-700" strokeWidth={1.2} />
            <p className="mt-4 text-base font-medium text-slate-400">
              No announcements
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {isAdmin
                ? 'Create an announcement to broadcast to personnel.'
                : 'No announcements at this time.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <CardSpotlight
                key={a.id}
                className="cursor-pointer overflow-hidden transition-transform hover:-translate-y-0.5"
                onClick={() => setSelectedAnnouncement(a)}
              >
                <div className="flex items-start gap-4 px-5 py-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-military-base/15">
                    <IconSpeakerphone
                      className="h-5 w-5 text-military-pale"
                      strokeWidth={1.6}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-100">{a.title}</h3>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          PRIORITY_STYLES[a.priority] || PRIORITY_STYLES.normal
                        }`}
                      >
                        {a.priority}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-400 line-clamp-2">
                      {contentPreview(a.content)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span>
                        By {a.postedBy?.fullName || 'Command'}
                      </span>
                      <span className="flex items-center gap-1">
                        <IconCalendar className="h-3.5 w-3.5" />
                        {formatDate(a.createdAt)}
                      </span>
                      {a.targetUnit && (
                        <span className="rounded bg-slate-800/60 px-1.5 py-0.5">
                          {a.targetUnit}
                        </span>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
                      disabled={deletingId === a.id}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-red-950/40 hover:text-red-400 disabled:opacity-50"
                      title="Delete announcement"
                    >
                      {deletingId === a.id ? (
                        <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
                      ) : (
                        <IconTrash className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </CardSpotlight>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NewAnnouncementModal
          onClose={() => setShowModal(false)}
          onCreated={() => load()}
        />
      )}

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            className="relative mx-4 flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="shrink-0 border-b border-slate-800/80 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    selectedAnnouncement.priority === 'critical' ? 'bg-red-500/15' :
                    selectedAnnouncement.priority === 'urgent' ? 'bg-amber-500/15' :
                    'bg-military-base/15'
                  }`}>
                    <IconSpeakerphone className={`h-6 w-6 ${
                      selectedAnnouncement.priority === 'critical' ? 'text-red-400' :
                      selectedAnnouncement.priority === 'urgent' ? 'text-amber-400' :
                      'text-military-pale'
                    }`} strokeWidth={1.6} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-slate-50">{selectedAnnouncement.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        PRIORITY_STYLES[selectedAnnouncement.priority] || PRIORITY_STYLES.normal
                      }`}>
                        {selectedAnnouncement.priority}
                      </span>
                      {selectedAnnouncement.targetUnit && (
                        <span className="rounded-md bg-slate-800/60 px-2.5 py-0.5 text-[10px] font-semibold text-slate-400">
                          {selectedAnnouncement.targetUnit}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                >
                  <IconX className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 sidebar-scroll">
              {/* Meta Info */}
              <div className="mb-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-800/30 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Posted By</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-300">
                    {selectedAnnouncement.postedBy?.fullName || 'Command'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Posted On</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-300">
                    {formatFullDate(selectedAnnouncement.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    {selectedAnnouncement.expiresAt ? 'Expires On' : 'Expiry'}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-slate-300">
                    {selectedAnnouncement.expiresAt ? formatDate(selectedAnnouncement.expiresAt) : 'No expiry'}
                  </p>
                </div>
              </div>

              {/* Full Content */}
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Content</p>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                  {selectedAnnouncement.content}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 flex items-center justify-end gap-3 border-t border-slate-800/80 px-6 py-4">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    handleDelete(selectedAnnouncement.id);
                    setSelectedAnnouncement(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-700/50 bg-red-950/30 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-900/40"
                >
                  <IconTrash className="h-4 w-4" /> Delete
                </button>
              )}
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="rounded-lg bg-slate-800/60 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-700/60"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
