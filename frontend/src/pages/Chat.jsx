import { useState, useEffect, useRef, useCallback } from 'react';
import {
  IconSend,
  IconPaperclip,
  IconSearch,
  IconArrowLeft,
  IconCheck,
  IconChecks,
  IconX,
  IconPhoto,
  IconFile,
  IconDownload,
  IconMessageCircle,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useChatStore } from '../store/chatStore';
import {
  getConversations,
  createConversation,
  getMessages,
  uploadChatAttachment,
  searchChatUsers,
} from '../api/chat';

const API_BASE = import.meta.env.VITE_API_URL || '';

const EMPTY_MESSAGES = [];
const EMPTY_TYPING = {};

function timeAgo(date) {
  if (!date) return '';
  const now = Date.now();
  const d = new Date(date).getTime();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

function Avatar({ user, size = 'h-10 w-10', textSize = 'text-sm', showOnline = false }) {
  const store = useChatStore();
  const presence = store.onlineUsers[user?.id];
  const online = presence?.isOnline ?? user?.isOnline;
  return (
    <div className="relative shrink-0">
      {user?.profilePicture ? (
        <img src={`${user.profilePicture}`} alt={user.fullName} className={`${size} rounded-full object-cover ring-2 ring-slate-700`} />
      ) : (
        <div className={`${size} rounded-full bg-gradient-to-br from-military-base to-military-light flex items-center justify-center ${textSize} font-semibold text-military-pale ring-2 ring-slate-700`}>
          {user?.fullName?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      {showOnline && (
        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 ${online ? 'bg-green-500' : 'bg-slate-500'}`} />
      )}
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === 'seen') return <IconChecks className="h-4 w-4 text-blue-400" />;
  if (status === 'delivered') return <IconChecks className="h-4 w-4 text-slate-400" />;
  return <IconCheck className="h-4 w-4 text-slate-500" />;
}

function TypingIndicator({ typingUsers, currentUserId }) {
  const users = Object.entries(typingUsers || {})
    .filter(([id]) => id !== currentUserId)
    .map(([, info]) => info);
  if (!users.length) return null;
  const info = users[0];
  const name = typeof info === 'object' ? info.fullName : 'Someone';
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-1.5 rounded-2xl bg-slate-800/80 px-4 py-2.5">
        <span className="text-xs text-slate-400">{name} is typing</span>
        <span className="flex gap-0.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
        </span>
      </div>
    </div>
  );
}

function AttachmentPreview({ attachment }) {
  const isImage = attachment.fileType?.startsWith('image/');
  const src = `${API_BASE}${attachment.filePath}`;
  if (isImage) {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" className="block">
        <img src={src} alt={attachment.fileName} className="max-h-48 max-w-[240px] rounded-lg object-cover" />
      </a>
    );
  }
  return (
    <a href={src} download={attachment.fileName} className="flex items-center gap-2 rounded-lg bg-slate-700/50 px-3 py-2 text-sm hover:bg-slate-700">
      <IconFile className="h-5 w-5 text-slate-400" />
      <span className="truncate max-w-[160px] text-slate-300">{attachment.fileName}</span>
      <IconDownload className="h-4 w-4 text-slate-400" />
    </a>
  );
}

function ConversationList({ onSelect, activeId, onNewChat }) {
  const conversations = useChatStore((s) => s.conversations);
  const unreadCounts = useChatStore((s) => s.unreadCounts);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      const users = await searchChatUsers(q);
      setSearchResults(users);
    } catch { setSearchResults([]); }
    setSearching(false);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(val), 300);
  };

  const handleUserClick = async (user) => {
    setSearch('');
    setSearchResults(null);
    onNewChat(user);
  };

  return (
    <div className="flex h-full flex-col border-r border-slate-800/80">
      <div className="border-b border-slate-800/80 p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-50">Messages</h2>
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={handleSearchChange}
            className="w-full rounded-xl border border-slate-700/80 bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-military-base/60 focus:ring-1 focus:ring-military-base/30"
          />
          {search && (
            <button onClick={() => { setSearch(''); setSearchResults(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <IconX className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto sidebar-scroll">
        {searchResults !== null ? (
          searching ? (
            <div className="p-4 text-center text-sm text-slate-500">Searching...</div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">No users found</div>
          ) : (
            searchResults.map((user) => (
              <button key={user.id} onClick={() => handleUserClick(user)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-800/60">
                <Avatar user={user} showOnline />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">{user.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{user.designation || user.rank || ''}</p>
                </div>
              </button>
            ))
          )
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <IconMessageCircle className="h-12 w-12 text-slate-700 mb-3" />
            <p className="text-sm text-slate-500">No conversations yet</p>
            <p className="text-xs text-slate-600 mt-1">Search for a user to start chatting</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const unread = unreadCounts[conv.id] || 0;
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-800/60 ${activeId === conv.id ? 'bg-slate-800/80 border-r-2 border-military-base' : ''}`}
              >
                <Avatar user={conv.otherUser} showOnline />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-slate-200">{conv.otherUser?.fullName}</p>
                    {conv.lastMessage && (
                      <span className="shrink-0 text-[10px] text-slate-500">{timeAgo(conv.lastMessage.createdAt)}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="truncate text-xs text-slate-500 max-w-[180px]">
                      {conv.lastMessage?.content || 'Start a conversation'}
                    </p>
                    {unread > 0 && (
                      <span className="ml-2 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-military-base px-1.5 text-[10px] font-bold text-white">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function ChatWindow({ conversationId, otherUser, onBack, joinConversation, emit }) {
  const { user } = useAuth();
  const messages = useChatStore((s) => s.messages[conversationId] ?? EMPTY_MESSAGES);
  const typingUsers = useChatStore((s) => s.typingUsers[conversationId] ?? EMPTY_TYPING);
  const store = useChatStore();
  const presence = store.onlineUsers[otherUser?.id];
  const isOnline = presence?.isOnline ?? otherUser?.isOnline;
  const lastSeen = presence?.lastSeen ?? otherUser?.lastSeen;

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);
  const isTyping = useRef(false);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!conversationId) return;
    joinConversation?.(conversationId);
    initialLoadDone.current = false;
    setLoading(true);
    getMessages(conversationId)
      .then((data) => {
        store.setMessages(conversationId, data.messages);
        setHasMore(data.hasMore);
        initialLoadDone.current = true;
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    store.clearUnread(conversationId);
    emit('mark_seen', { conversationId });
  }, [conversationId, joinConversation]);

  useEffect(() => {
    if (initialLoadDone.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || !messages.length) return;
    setLoadingMore(true);
    const container = messagesContainerRef.current;
    const prevHeight = container?.scrollHeight || 0;
    try {
      const data = await getMessages(conversationId, messages[0].createdAt);
      store.setMessages(conversationId, [...data.messages, ...messages]);
      setHasMore(data.hasMore);
      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - prevHeight;
      });
    } catch (e) { console.error(e); }
    setLoadingMore(false);
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container && container.scrollTop < 50 && hasMore && !loadingMore) {
      loadMore();
    }
  };

  const sendMessage = () => {
    const content = text.trim();
    if (!content || !conversationId) return;
    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      conversationId,
      senderId: user.id,
      content,
      status: 'sending',
      createdAt: new Date().toISOString(),
      sender: { id: user.id, fullName: user.fullName, profilePicture: user.profilePicture },
      attachments: [],
    };
    store.appendMessage(conversationId, tempMsg);
    setText('');
    stopTyping();

    emit('send_message', { conversationId, content, tempId }, (response) => {
      if (response?.error) {
        console.error(response.error);
        store.removeMessage(conversationId, tempId);
        return;
      }
      const real = response.message;
      store.replaceMessage(conversationId, tempId, real);
      store.updateConversationOrder(conversationId, {
        id: real.id,
        senderId: real.senderId,
        content: real.content.length > 80 ? real.content.slice(0, 80) + '...' : real.content,
        status: real.status,
        createdAt: real.createdAt,
      });
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startTyping = () => {
    if (!isTyping.current) {
      isTyping.current = true;
      emit('typing_start', { conversationId });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => stopTyping(), 2000);
  };

  const stopTyping = () => {
    if (isTyping.current) {
      isTyping.current = false;
      emit('typing_stop', { conversationId });
    }
    clearTimeout(typingTimeout.current);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    startTyping();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const msg = await uploadChatAttachment(conversationId, file);
      store.appendMessage(conversationId, msg);
      store.updateConversationOrder(conversationId, {
        id: msg.id,
        senderId: msg.senderId,
        content: msg.content?.length > 80 ? msg.content.slice(0, 80) + '...' : (msg.content || '[attachment]'),
        status: msg.status,
        createdAt: msg.createdAt,
      });
    } catch (err) { console.error('Upload failed:', err); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const groupedMessages = [];
  let lastDate = '';
  for (const msg of messages) {
    const dateLabel = formatDateLabel(msg.createdAt);
    if (dateLabel !== lastDate) {
      groupedMessages.push({ type: 'date', label: dateLabel });
      lastDate = dateLabel;
    }
    groupedMessages.push({ type: 'message', data: msg });
  }

  if (!conversationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <IconMessageCircle className="h-16 w-16 text-slate-700 mb-4" />
        <h3 className="text-lg font-medium text-slate-400">Select a conversation</h3>
        <p className="mt-1 text-sm text-slate-600">Choose from your existing conversations or search for a user to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800/80 px-4 py-3">
        <button onClick={onBack} className="mr-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:hidden">
          <IconArrowLeft className="h-5 w-5" />
        </button>
        <Avatar user={otherUser} showOnline />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-100">{otherUser?.fullName}</p>
          <p className="text-xs text-slate-500">
            {isOnline ? (
              <span className="text-green-400">Online</span>
            ) : lastSeen ? (
              `Last seen ${timeAgo(lastSeen)}`
            ) : (
              'Offline'
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 sidebar-scroll">
        {loadingMore && (
          <div className="py-2 text-center text-xs text-slate-500">Loading older messages...</div>
        )}
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-military-base" />
          </div>
        ) : groupedMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-slate-500">No messages yet. Say hello!</p>
          </div>
        ) : (
          groupedMessages.map((item, idx) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${idx}`} className="my-4 flex items-center justify-center">
                  <span className="rounded-full bg-slate-800/80 px-4 py-1 text-[11px] font-medium text-slate-400">{item.label}</span>
                </div>
              );
            }
            const msg = item.data;
            const isOwn = msg.senderId === user.id;
            return (
              <div key={msg.id} className={`mb-2 flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {!isOwn && (
                  <div className="mr-2 mt-auto">
                    <Avatar user={msg.sender} size="h-7 w-7" textSize="text-[10px]" />
                  </div>
                )}
                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  {msg.attachments?.length > 0 && (
                    <div className="mb-1">
                      {msg.attachments.map((a) => (
                        <AttachmentPreview key={a.id} attachment={a} />
                      ))}
                    </div>
                  )}
                  {msg.content && msg.content !== '[attachment]' && (
                    <div className={`rounded-2xl px-4 py-2.5 ${isOwn ? 'bg-military-base/80 text-white rounded-br-md' : 'bg-slate-800/80 text-slate-200 rounded-bl-md'}`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                  )}
                  <div className={`mt-0.5 flex items-center gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-slate-600">{formatTime(msg.createdAt)}</span>
                    {isOwn && msg.status !== 'sending' && <StatusIcon status={msg.status} />}
                    {isOwn && msg.status === 'sending' && (
                      <div className="h-3 w-3 animate-spin rounded-full border border-slate-600 border-t-slate-400" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <TypingIndicator typingUsers={typingUsers} currentUserId={user?.id} />
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-800/80 px-4 py-3">
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
          >
            {uploading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-military-base" />
            ) : (
              <IconPaperclip className="h-5 w-5" />
            )}
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
          <div className="flex-1">
            <textarea
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="sidebar-scroll w-full resize-none overflow-y-auto rounded-xl border border-slate-700/80 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-military-base/60 focus:ring-1 focus:ring-military-base/30"
              style={{ maxHeight: '120px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            className="rounded-xl bg-military-base/80 p-2.5 text-white transition hover:bg-military-base disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <IconSend className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Chat() {
  const { user } = useAuth();
  const { socket, emit, joinConversation, connected } = useSocket();
  const store = useChatStore();
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    store.setCurrentUserId(user?.id);
    loadConversations();
  }, [user?.id]);

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      store.setConversations(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!socket || !connected) return;

    const handleNewMessage = (msg) => {
      store.appendMessage(msg.conversationId, msg);
      store.updateConversationOrder(msg.conversationId, {
        id: msg.id,
        senderId: msg.senderId,
        content: msg.content?.length > 80 ? msg.content.slice(0, 80) + '...' : msg.content,
        status: msg.status,
        createdAt: msg.createdAt,
      });

      if (msg.senderId !== user?.id) {
        const activeId = useChatStore.getState().activeConversationId;
        if (msg.conversationId !== activeId) {
          store.incrementUnread(msg.conversationId);
        } else {
          store.clearUnread(msg.conversationId);
          emit('mark_seen', { conversationId: msg.conversationId });
        }
      }
    };

    const handleStatusUpdate = (data) => {
      store.updateMessageStatus(data);
    };

    const handleTyping = (data) => {
      if (data.userId === user?.id) return;
      store.setTyping(data.conversationId, data.userId, true, {
        fullName: data.fullName,
        profilePicture: data.profilePicture,
      });
    };

    const handleStopTyping = (data) => {
      if (data.userId === user?.id) return;
      store.setTyping(data.conversationId, data.userId, false);
    };

    const handlePresence = (data) => {
      store.updatePresence(data.userId, data.isOnline, data.lastSeen);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_status_update', handleStatusUpdate);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);
    socket.on('presence_update', handlePresence);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_status_update', handleStatusUpdate);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
      socket.off('presence_update', handlePresence);
    };
  }, [socket, connected, user?.id, emit]);

  const handleSelectConversation = (convId) => {
    setSelectedConvId(convId);
    setShowMobileChat(true);
    store.setActiveConversation(convId);
    store.clearUnread(convId);
    joinConversation(convId);
    emit('mark_seen', { conversationId: convId });
  };

  const handleNewChat = async (otherUser) => {
    try {
      const conv = await createConversation(otherUser.id);
      store.upsertConversation(conv);
      setSelectedConvId(conv.id);
      setShowMobileChat(true);
      store.setActiveConversation(conv.id);
      joinConversation(conv.id);
    } catch (e) { console.error(e); }
  };

  const handleBack = () => {
    setShowMobileChat(false);
    store.setActiveConversation(null);
  };

  const selectedConv = store.conversations.find((c) => c.id === selectedConvId);

  return (
    <SidebarLayout>
      <div className="flex h-[calc(100vh-10rem)] overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm">
        {/* Left panel */}
        <div className={`w-full flex-shrink-0 lg:w-80 xl:w-96 ${showMobileChat ? 'hidden lg:block' : 'block'}`}>
          <ConversationList
            onSelect={handleSelectConversation}
            activeId={selectedConvId}
            onNewChat={handleNewChat}
          />
        </div>
        {/* Right panel */}
        <div className={`flex-1 ${showMobileChat ? 'block' : 'hidden lg:block'}`}>
          <ChatWindow
            conversationId={selectedConvId}
            otherUser={selectedConv?.otherUser}
            onBack={handleBack}
            joinConversation={joinConversation}
            emit={emit}
          />
        </div>
      </div>
    </SidebarLayout>
  );
}
