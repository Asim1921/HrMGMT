import { useState, useEffect, useRef, useCallback } from 'react';
import { IconMessageCircle, IconSend, IconCornerDownRight } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useSocket, ensureSocket, subscribeSocketEvent, onSocketConnect } from '../hooks/useSocket';
import { getLeaveComments, addLeaveComment } from '../api/leaves';

const LEVEL_LABEL = { 1: 'G-2 (Offr)', 2: 'G-1', 3: 'Comdt' };

function authorLabel(user) {
  if (!user) return 'User';
  const level = user.approvalLevel ?? (user.role === 'super_admin' ? 3 : null);
  if (level != null) return LEVEL_LABEL[level] || user.fullName;
  if (user.designation) return user.designation;
  return user.fullName;
}

function formatWhen(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildCommentTree(comments) {
  const map = new Map();
  const roots = [];
  comments.forEach((c) => map.set(c.id, { ...c, replies: [] }));
  comments.forEach((c) => {
    const node = map.get(c.id);
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId).replies.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function CommentItem({ comment, currentUserId, onReply, replyToId, replyText, setReplyText, onSubmitReply, submitting, readOnly }) {
  const isMine = comment.userId === currentUserId;
  const isReplying = replyToId === comment.id;

  return (
    <div className={`${comment.parentId ? 'ml-6 border-l-2 border-slate-700/40 pl-4' : ''}`}>
      <div className={`rounded-xl px-3 py-2.5 ${isMine ? 'bg-military-base/15 ring-1 ring-military-base/25' : 'bg-slate-800/40'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">{comment.user?.fullName}</span>
            <span className="rounded-md bg-slate-900/50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-military-pale/80">
              {authorLabel(comment.user)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">{formatWhen(comment.createdAt)}</span>
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{comment.message}</p>
        {!isReplying && !readOnly && (
          <button
            type="button"
            onClick={() => onReply(comment.id)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-military-pale/80 transition hover:text-military-pale"
          >
            <IconCornerDownRight className="h-3 w-3" />
            Reply
          </button>
        )}
      </div>

      {isReplying && !readOnly && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply…"
            className="flex-1 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-600 focus:border-military-base/50 focus:outline-none focus:ring-1 focus:ring-military-base/30"
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSubmitReply()}
          />
          <button
            type="button"
            onClick={onSubmitReply}
            disabled={submitting || !replyText.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-military-base px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            <IconSend className="h-3.5 w-3.5" />
            Reply
          </button>
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              replyToId={replyToId}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={onSubmitReply}
              submitting={submitting}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function LeaveRequestComments({ leaveRequestId, compact = false, readOnly = false }) {
  const { user } = useAuth();
  useSocket(); // ensure singleton socket is initialized
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef(null);
  const leaveRequestIdRef = useRef(leaveRequestId);

  leaveRequestIdRef.current = leaveRequestId;

  const mergeComment = useCallback((comment) => {
    if (!comment?.id || comment.leaveRequestId !== leaveRequestIdRef.current) return;
    setComments((prev) => (prev.some((c) => c.id === comment.id) ? prev : [...prev, comment]));
    setLoading(false);
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await getLeaveComments(leaveRequestIdRef.current);
      setComments(res.items || []);
    } catch (e) {
      if (!silent) setError(e.response?.data?.error || 'Failed to load comments');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load();
  }, [leaveRequestId, load]);

  // Real-time: join leave room on connect/reconnect + listen for broadcasts
  useEffect(() => {
    if (!leaveRequestId) return undefined;

    const joinRoom = () => {
      ensureSocket()?.emit('join_leave_request', { leaveRequestId });
    };

    const unsubConnect = onSocketConnect(joinRoom);
    const unsubEvent = subscribeSocketEvent('leave_comment', mergeComment);

    return () => {
      ensureSocket()?.emit('leave_leave_request', { leaveRequestId });
      unsubConnect();
      unsubEvent();
    };
  }, [leaveRequestId, mergeComment]);

  // Fallback poll while tab is visible (covers edge cases if socket drops)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') load(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (comments.length) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments.length]);

  async function handlePost(message, parentId = null) {
    if (!message.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const created = await addLeaveComment(leaveRequestId, message.trim(), parentId);
      mergeComment(created);
      if (parentId) {
        setReplyToId(null);
        setReplyText('');
      } else {
        setNewComment('');
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  const tree = buildCommentTree(comments);

  return (
    <div className={`rounded-xl border border-slate-800/60 bg-slate-900/30 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="mb-3 flex items-center gap-2">
        <IconMessageCircle className="h-4 w-4 text-slate-500" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Discussion ({comments.length})
        </p>
      </div>

      {error && (
        <p className="mb-3 text-xs text-red-400">{error}</p>
      )}

      {loading ? (
        <p className="py-4 text-center text-xs text-slate-500">Loading comments…</p>
      ) : tree.length === 0 ? (
        <p className="py-3 text-center text-xs text-slate-500">
          No comments yet. Approvers can leave guidance; applicants can reply here.
        </p>
      ) : (
        <div className="max-h-64 space-y-3 overflow-y-auto sidebar-scroll pr-1">
          {tree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              onReply={(id) => {
                setReplyToId(id);
                setReplyText('');
              }}
              replyToId={replyToId}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={() => handlePost(replyText, replyToId)}
              submitting={submitting}
              readOnly={readOnly}
            />
          ))}
          <div ref={commentsEndRef} />
        </div>
      )}

      {!readOnly ? (
        <div className="mt-3 flex gap-2 border-t border-slate-800/60 pt-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-600 focus:border-military-base/50 focus:outline-none focus:ring-1 focus:ring-military-base/30"
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePost(newComment)}
          />
          <button
            type="button"
            onClick={() => handlePost(newComment)}
            disabled={submitting || !newComment.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-military-base px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            <IconSend className="h-3.5 w-3.5" />
            Post
          </button>
        </div>
      ) : (
        <p className="mt-3 border-t border-slate-800/60 pt-3 text-center text-[11px] text-slate-600">
          Discussion closed — request is no longer pending.
        </p>
      )}
    </div>
  );
}
