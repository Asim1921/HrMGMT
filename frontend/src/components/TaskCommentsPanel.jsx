import { useState, useRef, useEffect } from 'react';
import {
  IconMessageCircle,
  IconSend,
  IconPaperclip,
  IconFile,
  IconDownload,
  IconX,
} from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { addTaskComment } from '../api/tasks';

const API_BASE = import.meta.env.VITE_API_URL || '';
const ACCEPT_FILES =
  '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*,application/pdf';

function formatWhen(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function roleBadge(userId, task) {
  if (userId === task.assignedToId) return 'Assignee';
  if (userId === task.assignedById) return 'Assigned By';
  return 'Admin';
}

function CommentAvatar({ user }) {
  if (user?.profilePicture) {
    return (
      <img
        src={user.profilePicture}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-700/60"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-military-base to-military-light text-xs font-semibold text-military-pale ring-1 ring-slate-700/60">
      {user?.fullName?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

function AttachmentDisplay({ attachment, onImageClick }) {
  const isImage = attachment.fileType?.startsWith('image/');
  const src = `${API_BASE}${attachment.filePath}`;

  if (isImage) {
    return (
      <button
        type="button"
        onClick={() => onImageClick(src)}
        className="mt-2 block overflow-hidden rounded-lg ring-1 ring-slate-700/40 transition hover:ring-military-base/40"
      >
        <img
          src={src}
          alt={attachment.fileName}
          className="max-h-48 max-w-full object-cover"
        />
      </button>
    );
  }

  return (
    <a
      href={src}
      download={attachment.fileName}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-2 text-sm ring-1 ring-slate-700/40 transition hover:bg-slate-800/80"
    >
      <IconFile className="h-5 w-5 shrink-0 text-slate-400" />
      <span className="min-w-0 flex-1 truncate text-slate-300">{attachment.fileName}</span>
      <span className="shrink-0 text-[10px] text-slate-500">{formatFileSize(attachment.fileSize)}</span>
      <IconDownload className="h-4 w-4 shrink-0 text-slate-400" />
    </a>
  );
}

function CommentEntry({ comment, task, currentUserId, onImageClick }) {
  const isMine = comment.userId === currentUserId;

  return (
    <div
      className={`rounded-xl border-l-2 px-4 py-3 ${
        isMine
          ? 'border-military-base bg-military-base/10 ring-1 ring-military-base/20'
          : 'border-slate-600 bg-slate-800/40 ring-1 ring-slate-700/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <CommentAvatar user={comment.user} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-200">{comment.user?.fullName}</span>
              {isMine && (
                <span className="rounded-md bg-military-base/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-military-pale">
                  You
                </span>
              )}
              <span className="rounded-md bg-slate-900/50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {roleBadge(comment.userId, task)}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">{formatWhen(comment.createdAt)}</span>
          </div>

          {comment.message && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {comment.message}
            </p>
          )}

          {comment.attachments?.map((att) => (
            <AttachmentDisplay key={att.id} attachment={att} onImageClick={onImageClick} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TaskCommentsPanel({ task, onCommentAdded, onError, fullHeight = false }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const endRef = useRef(null);

  const comments = task?.comments ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const grouped = [];
  let lastDate = '';
  for (const c of comments) {
    const label = formatDateLabel(c.createdAt);
    if (label !== lastDate) {
      grouped.push({ type: 'date', label });
      lastDate = label;
    }
    grouped.push({ type: 'comment', data: c });
  }

  const canSend = (text.trim() || pendingFile) && !sending;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSend || !task) return;
    setSending(true);
    try {
      await addTaskComment(task.id, { message: text.trim(), file: pendingFile });
      setText('');
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onCommentAdded?.();
    } catch (err) {
      onError?.(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setSending(false);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
  }

  function removePendingFile() {
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className={`flex flex-col ${fullHeight ? 'min-h-0 flex-1' : 'border-t border-slate-800/80'}`}>
      <div className="shrink-0 px-6 pt-4">
        <div className="flex items-center gap-2">
          <IconMessageCircle className="h-4 w-4 text-military-pale/70" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Discussion ({comments.length})
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={`overflow-y-auto px-6 py-4 sidebar-scroll ${
          fullHeight ? 'min-h-0 flex-1' : 'min-h-[220px] max-h-[320px] flex-1'
        }`}
      >
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <IconMessageCircle className="mb-3 h-10 w-10 text-slate-700" />
            <p className="text-sm font-medium text-slate-500">No discussion yet</p>
            <p className="mt-1 text-xs text-slate-600">
              Post updates, questions, or attach files below.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map((item, i) =>
              item.type === 'date' ? (
                <div key={`date-${i}`} className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-slate-700/40" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {item.label}
                  </span>
                  <div className="h-px flex-1 bg-slate-700/40" />
                </div>
              ) : (
                <CommentEntry
                  key={item.data.id}
                  comment={item.data}
                  task={task}
                  currentUserId={user?.id}
                  onImageClick={setPreviewImage}
                />
              ),
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] rounded-lg"
          />
        </div>
      )}

      <div className="shrink-0 border-t border-slate-800/80 px-6 py-4">
        {pendingFile && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-2 ring-1 ring-slate-700/40">
            <IconFile className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="min-w-0 flex-1 truncate text-xs text-slate-300">{pendingFile.name}</span>
            <span className="text-[10px] text-slate-500">{formatFileSize(pendingFile.size)}</span>
            <button
              type="button"
              onClick={removePendingFile}
              className="rounded p-0.5 text-slate-500 transition hover:bg-slate-700 hover:text-slate-300"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-800/60 hover:text-slate-200 disabled:opacity-50"
            title="Attach file"
          >
            <IconPaperclip className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ACCEPT_FILES}
            onChange={handleFileSelect}
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment or attach a file…"
            rows={1}
            disabled={sending}
            className="flex-1 resize-none rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-military-base focus:ring-1 focus:ring-military-base/30 disabled:opacity-50"
            style={{ maxHeight: '100px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (canSend) handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!canSend}
            className="flex items-center gap-1.5 rounded-xl bg-military-base px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-military-dark disabled:opacity-50"
          >
            <IconSend className="h-4 w-4" />
            {sending ? 'Sending…' : 'Send'}
          </button>
        </form>
        <p className="mt-2 text-[10px] text-slate-600">
          Images, PDF, Word, Excel, PowerPoint — max 10 MB
        </p>
      </div>
    </div>
  );
}
