'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { FaComments, FaPaperPlane, FaSearch, FaArrowLeft, FaCircle } from 'react-icons/fa';
import { IoEllipsisVertical } from 'react-icons/io5';
import chatApi from '@/api/chatApi';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { addMessage, markConversationRead, setConversations, setMessages } from '@/store/slices/chatSlice';
import styles from './page.module.css';

const formatClock = (v) => {
  if (!v) return '--:--';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '--:--';
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(d);
};

const formatShortDate = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(d);
};

const formatDateLabel = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isToday) return 'Hôm nay';
  if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const MessageBubble = ({ message, isOwn }) => {
  if (message?.contentType === 'SYSTEM_LOG') {
    return <div className={styles.systemMessage}>{message.content}</div>;
  }

  return (
    <div className={`${styles.messageRow} ${isOwn ? styles.messageOwn : styles.messageIncoming}`}>
      <div className={`${styles.messageBubble} ${isOwn ? styles.messageBubbleOwn : styles.messageBubbleIncoming}`}>
        {!isOwn && message?.senderName && (
          <span className={styles.senderName}>{message.senderName}</span>
        )}
        <p>{message?.content || ''}</p>
        <div className={styles.messageFooter}>
          <span>{formatClock(message?.createdAt)}</span>
          {isOwn && <span className={styles.readStatus}>✓✓</span>}
        </div>
      </div>
    </div>
  );
};

export default function PartnerMessagesPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { sendMessage } = useChatWebSocket();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { messages: wsMessages, conversations } = useSelector((state) => state.chat);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [convs, setConvs] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [draft, setDraft] = useState('');
  const [sendingIndicator, setSendingIndicator] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const listRef = useRef(null);

  const activeConversation = useMemo(
    () => convs.find((item) => Number(item.id) === Number(activeConversationId)) || null,
    [activeConversationId, convs],
  );

  // Merge API messages + WebSocket messages from Redux store
  const activeMessages = useMemo(() => {
    if (!activeConversationId) return [];
    const apiMsgs = wsMessages[activeConversationId] || [];
    return apiMsgs;
  }, [activeConversationId, wsMessages]);

  const filteredConversations = useMemo(() => {
    const keyword = String(search || '').trim().toLowerCase();
    if (!keyword) return convs;
    return convs.filter((item) => {
      const partner = String(item.partnerName || '').toLowerCase();
      const snippet = String(item.lastMessageSnippet || '').toLowerCase();
      const booking = String(item.bookingCode || '').toLowerCase();
      return partner.includes(keyword) || snippet.includes(keyword) || booking.includes(keyword);
    });
  }, [convs, search]);

  const loadMessages = useCallback(
    async (conversationId) => {
      const response = await chatApi.getMessages(conversationId);
      const items = response?.data?.content || [];
      dispatch(setMessages({ conversationId, messages: items }));
    },
    [dispatch],
  );

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await chatApi.getConversations();
      const list = Array.isArray(response?.data) ? response.data : [];
      const p2pOnly = list.filter((item) => item.type !== 'BOT');
      setConvs(p2pOnly);
      dispatch(setConversations(p2pOnly));

      if (p2pOnly.length > 0) {
        const firstId = p2pOnly[0].id;
        setActiveConversationId(firstId);
        await loadMessages(firstId);
        dispatch(markConversationRead(firstId));
        await chatApi.markAsRead(firstId);
      }
    } catch (loadError) {
      setError(loadError?.message || 'Không thể tải hội thoại lúc này.');
    } finally {
      setLoading(false);
    }
  }, [dispatch, loadMessages]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadConversations();
  }, [isAuthenticated, loadConversations]);

  // Reload conversations when WS messages come in (for unread badge update)
  useEffect(() => {
    // Nothing needed here - Redux store is already updated by WS hook
  }, [wsMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeMessages, sendingIndicator]);

  const openConversation = async (conversation) => {
    if (!conversation?.id) return;

    setActiveConversationId(conversation.id);

    if (!(wsMessages[conversation.id] || []).length) {
      await loadMessages(conversation.id);
    }

    dispatch(markConversationRead(conversation.id));
    setConvs((prev) =>
      prev.map((item) =>
        Number(item.id) === Number(conversation.id)
          ? { ...item, unreadCount: 0 }
          : item,
      ),
    );
    await chatApi.markAsRead(conversation.id);

    setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (event) => {
    event?.preventDefault?.();
    const text = draft.trim();
    if (!text || !activeConversationId || submitting) return;

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversationId,
      senderId: user?.id,
      senderName: user?.fullName || user?.name || 'Partner',
      contentType: 'TEXT',
      content: text,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    // Add optimistic message immediately
    dispatch(addMessage(optimisticMessage));
    setDraft('');
    setSendingIndicator(true);

    const sent = sendMessage(activeConversationId, text);
    if (!sent) {
      setError('Mất kết nối chat. Vui lòng thử lại.');
    }

    setTimeout(() => setSendingIndicator(false), 1200);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className={styles.page}>
        <section className={styles.emptyState}>
          Vui lòng đăng nhập để sử dụng hộp thư tin nhắn.
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <button className={styles.backBtn} onClick={() => router.push('/partner')}>
        <FaArrowLeft /> Quay về trang Partner
      </button>

      <section className={styles.shell}>
        {/* ── LEFT: Conversation List ── */}
        <aside className={styles.sidebar}>
          <header className={styles.sidebarHeader}>
            <h1><FaComments /> Tin nhắn Partner</h1>
            <p>Nhắn tin với khách đang đặt dịch vụ của bạn</p>
          </header>

          <div className={styles.searchBox}>
            <FaSearch />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên, mã booking..."
            />
          </div>

          <div className={styles.conversationList}>
            {loading ? (
              <div className={styles.stateBox}>
                <div className={styles.spinner} />
                <span>Đang tải...</span>
              </div>
            ) : error ? (
              <div className={styles.stateBox}>
                <span>{error}</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className={styles.emptyInbox}>
                <FaComments />
                <span>Chưa có cuộc trò chuyện nào</span>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const isActive = Number(conversation.id) === Number(activeConversationId);
                const unread = Number(conversation.unreadCount || 0);
                return (
                  <button
                    type="button"
                    key={conversation.id}
                    className={`${styles.convItem} ${isActive ? styles.convItemActive : ''}`}
                    onClick={() => openConversation(conversation)}
                  >
                    <div className={styles.convItemLeft}>
                      <div className={styles.convAvatar}>
                        {conversation.partnerAvatar ? (
                          <img src={conversation.partnerAvatar} alt="" />
                        ) : (
                          <span>{getInitials(conversation.partnerName || 'K')}</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.convItemContent}>
                      <div className={styles.convTop}>
                        <span className={styles.convName}>
                          {conversation.partnerName || 'Khách hàng'}
                        </span>
                        <span className={styles.convTime}>
                          {formatShortDate(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <div className={styles.convBottom}>
                        <span className={styles.convSnippet}>
                          {conversation.lastMessageSnippet || 'Chưa có tin nhắn'}
                        </span>
                        {unread > 0 && (
                          <span className={styles.unreadBadge}>{unread > 99 ? '99+' : unread}</span>
                        )}
                      </div>
                      {conversation.bookingCode && (
                        <span className={styles.convBooking}>
                          📋 {conversation.bookingCode}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── RIGHT: Chat Panel ── */}
        <section className={styles.chatPanel}>
          {!activeConversation ? (
            <div className={styles.chatPanelEmpty}>
              <FaComments />
              <p>Chọn một cuộc trò chuyện để xem</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <header className={styles.chatHeader}>
                <div className={styles.chatHeaderLeft}>
                  <div className={styles.chatAvatar}>
                    {activeConversation.partnerAvatar ? (
                      <img src={activeConversation.partnerAvatar} alt="" />
                    ) : (
                      <span>{getInitials(activeConversation.partnerName || 'K')}</span>
                    )}
                    <span className={styles.onlineDot} />
                  </div>
                  <div className={styles.chatHeaderInfo}>
                    <h2>{activeConversation.partnerName || 'Khách hàng'}</h2>
                    <p>
                      <FaCircle style={{ fontSize: 8, color: '#22c55e' }} />
                      Đang hoạt động
                      {activeConversation.bookingCode && ` · Booking ${activeConversation.bookingCode}`}
                    </p>
                  </div>
                </div>
                <button className={styles.moreBtn}>
                  <IoEllipsisVertical />
                </button>
              </header>

              {/* Messages */}
              <div className={styles.chatBody} ref={listRef}>
                {activeMessages.length === 0 ? (
                  <div className={styles.emptyChat}>
                    Bắt đầu nhắn tin với khách hàng
                  </div>
                ) : (
                  activeMessages.map((message, idx) => {
                    const isOwn =
                      message?.senderId != null && user?.id != null
                        ? Number(message.senderId) === Number(user.id)
                        : false;

                    const prev = activeMessages[idx - 1];
                    const showDate = !prev || formatDateLabel(message.createdAt) !== formatDateLabel(prev.createdAt);

                    return (
                      <div key={message.id || `${message.createdAt}-${message.content}`}>
                        {showDate && (
                          <div className={styles.dateSeparator}>
                            <span>{formatDateLabel(message.createdAt)}</span>
                          </div>
                        )}
                        <MessageBubble message={message} isOwn={isOwn} />
                      </div>
                    );
                  })
                )}

                {sendingIndicator && (
                  <div className={styles.messageRow}>
                    <div className={styles.messageBubbleIncoming} style={{ opacity: 0.7 }}>
                      <div className={styles.typingRow}>
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                        <small>Đang gửi...</small>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Composer */}
              <form className={styles.composer} onSubmit={handleSend}>
                <textarea
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhắn tin cho khách hàng..."
                  className={styles.composerInput}
                />
                <button
                  type="submit"
                  className={styles.sendBtn}
                  disabled={!draft.trim() || submitting}
                >
                  <FaPaperPlane />
                </button>
              </form>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
