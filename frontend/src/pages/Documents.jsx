import { useState, useEffect, useCallback } from 'react';
import {
  IconFileUpload,
  IconFileText,
  IconPhoto,
  IconCheck,
  IconX,
  IconTrash,
  IconAlertCircle,
  IconFile,
  IconFileSpreadsheet,
  IconPresentation,
  IconEye,
  IconDownload,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { useAuth } from '../hooks/useAuth';
import {
  uploadDocument,
  listMyDocuments,
  listAllDocuments,
  deleteDocument,
} from '../api/documents';

const DOC_TYPES = [
  'CNIC',
  'Certificate',
  'Appointment Letter',
  'NOC',
  'Medical Record',
  'Other',
];

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

function resolveDocUrl(filePath) {
  if (!filePath) return '';
  if (filePath.startsWith('http')) return filePath;
  const base = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || '';
  return `${base}${filePath}`;
}

function getFileExt(filePath = '') {
  return filePath.split('.').pop()?.toLowerCase() || '';
}

function getViewHref(doc) {
  const url = resolveDocUrl(doc?.filePath);
  const ext = getFileExt(doc?.filePath);
  const lowerMime = (doc?.mimeType || '').toLowerCase();

  // PDFs should open in the browser in a new tab
  if (lowerMime.includes('pdf') || ext === 'pdf') return url;

  // For Office files, opening via ms-* protocol often triggers Windows "Restricted Sites" blocking.
  // Opening the URL in a new tab will download, then the user can open locally in Office.
  return url;
}

function getFileIcon(mimeType) {
  if (!mimeType) return { Icon: IconFile, cls: 'text-slate-400' };
  if (mimeType.includes('pdf')) return { Icon: IconFileText, cls: 'text-red-400' };
  if (mimeType.includes('image')) return { Icon: IconPhoto, cls: 'text-blue-400' };
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv') || mimeType.includes('excel'))
    return { Icon: IconFileSpreadsheet, cls: 'text-emerald-400' };
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
    return { Icon: IconPresentation, cls: 'text-orange-400' };
  if (mimeType.includes('word') || mimeType.includes('document') || mimeType.includes('msword'))
    return { Icon: IconFileText, cls: 'text-sky-400' };
  return { Icon: IconFile, cls: 'text-slate-400' };
}

export function Documents() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdmin ? 'all' : 'my');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Upload form
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('CNIC');
  const [title, setTitle] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = activeTab === 'all' ? await listAllDocuments() : await listMyDocuments();
      setItems(data.items ?? data ?? []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load documents');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) setFile(f);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  async function handleUpload() {
    if (!file || !title.trim()) {
      setError('Please select a file and enter a title');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', docType);
      formData.append('title', title.trim());
      await uploadDocument(formData);
      setFile(null);
      setTitle('');
      setDocType('CNIC');
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this document?')) return;
    setError('');
    setDeletingId(id);
    try {
      await deleteDocument(id);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-military-pale/60">Documents</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-50">Document Management</h2>
            <p className="mt-1 text-sm text-slate-400">Upload and manage your documents.</p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1 rounded-xl bg-slate-800/50 p-1">
              {[
                { key: 'my', label: 'My Documents' },
                { key: 'all', label: 'All Documents' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                    activeTab === key ? 'bg-military-base text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upload section */}
        <CardSpotlight className="p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Upload Document</h4>
            <p className="text-[11px] text-slate-600">
              PDF, images, Word, Excel, PowerPoint — max 10 MB
            </p>
          </div>

          <div className="space-y-5">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex min-h-[140px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 transition ${
                dragOver
                  ? 'border-military-base bg-military-base/10'
                  : file
                    ? 'border-military-base/50 bg-military-base/5'
                    : 'border-slate-700/60 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/40'
              }`}
              onClick={() => document.getElementById('doc-file-input')?.click()}
            >
              <input
                id="doc-file-input"
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.odt,.ods,.odp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="rounded-lg bg-military-base/20 p-3 text-military-pale">
                    <IconFileUpload className="h-7 w-7" />
                  </div>
                  <p className="max-w-md truncate text-sm font-semibold text-slate-100">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatBytes(file.size)} · Click to replace</p>
                </div>
              ) : (
                <>
                  <IconFileUpload className="h-9 w-9 text-slate-500" />
                  <p className="mt-2 text-sm font-medium text-slate-300">Drop file here or click to browse</p>
                  <p className="mt-1 text-xs text-slate-600">Select one file to upload</p>
                </>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-12 sm:items-end">
              <div className="sm:col-span-3">
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 focus:border-military-base focus:outline-none focus:ring-1 focus:ring-military-base/30"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-6">
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a descriptive title"
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-military-base focus:outline-none focus:ring-1 focus:ring-military-base/30"
                  onKeyDown={(e) => e.key === 'Enter' && handleUpload()}
                />
              </div>
              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || !file || !title.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-military-base px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-military-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <IconFileUpload className="h-4 w-4" />
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </CardSpotlight>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            <IconAlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-military-base border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500">Loading documents…</p>
          </div>
        ) : items.length === 0 ? (
          <CardSpotlight className="flex flex-col items-center justify-center p-12 text-center">
            <IconFile className="h-14 w-14 text-slate-600" strokeWidth={1.2} />
            <p className="mt-4 text-base font-medium text-slate-400">No documents yet</p>
            <p className="mt-1 text-sm text-slate-600">Upload a document above to get started.</p>
          </CardSpotlight>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((doc) => {
              const { Icon: FileIcon, cls: iconCls } = getFileIcon(doc.mimeType);
              const isOwn = activeTab === 'my' || doc.userId === user?.id;

              return (
                <CardSpotlight key={doc.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg bg-slate-800/60 p-2.5 ${iconCls}`}>
                      <FileIcon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-50">{doc.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          {doc.type}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        {formatDate(doc.uploadedAt)} · {formatBytes(doc.fileSize)}
                      </p>
                      {isAdmin && activeTab === 'all' && doc.user && (
                        <p className="mt-1 text-[11px] text-military-pale/80">{doc.user.fullName}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={getViewHref(doc)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-sky-700/50 bg-sky-950/30 px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-900/40"
                      title="PDF opens in browser; Office files open in installed app when possible"
                    >
                      <IconEye className="h-3.5 w-3.5" /> View
                    </a>
                    <a
                      href={resolveDocUrl(doc.filePath)}
                      download
                      className="inline-flex items-center gap-1 rounded-lg border border-violet-700/50 bg-violet-950/30 px-3 py-1.5 text-xs font-semibold text-violet-300 transition hover:bg-violet-900/40"
                    >
                      <IconDownload className="h-3.5 w-3.5" /> Download
                    </a>
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-600/50 bg-slate-800/50 px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-700/50 hover:text-slate-300 disabled:opacity-50"
                      >
                        <IconTrash className="h-3.5 w-3.5" /> {deletingId === doc.id ? 'Deleting…' : 'Delete'}
                      </button>
                    )}
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
