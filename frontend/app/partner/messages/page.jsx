'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaComments, FaPaperPlane, FaSearch } from 'react-icons/fa';
import chatApi from '@/api/chatApi';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { markConversationRead, setMessages } from '@/store/slices/chatSlice';
import styles from './page.module.css';

const formatClock = (value) => {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date);
};

const formatShortDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(date);
};

const MessageBubble = ({ message, own }) => {
  if (message?.contentType === 'SYSTEM_LOG') {
    return <div className={styles.systemMessage}>{message.content}</div>;
  }

  return (
    <div className={`${styles.messageRow} ${own ? styles.messageOwn : styles.messageIncoming}`}>
      <div className={`${styles.messageBubble} ${own ? styles.messageBubbleOwn : styles.messageBubbleIncoming}`}>
        <p>{message?.content || ''}</p>
        <span>{formatClock(message?.createdAt)}</span>
      </div>
    </div>
  );
};

export default function PartnerMessagesPage() {
  const dispatch = useDispatch();
  const { sendMessage } = useChatWebSocket();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { messages } = useSelector((state) => state.chat);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [draft, setDraft] = useState('');
  const [sendingIndicator, setSendingIndicator] = useState(false);

  const listRef = useRef(null);

  const activeConversation = useMemo(
    () => conversations.find((item) => Number(item.id) === Number(activeConversationId)) || null,
    [activeConversationId, conversations],
  );

  const activeMessages = useMemo(() => {
    if (!activeConversationId) return [];
    return messages[activeConversationId] || [];
  }, [activeConversationId, messages]);

  const filteredConversations = useMemo(() => {
    const keyword = String(search || '').trim().toLowerCase();
    if (!keyword) return conversations;

    return conversations.filter((item) => {
      const partner = String(item.partnerName || '').toLowerCase();
      const snippet = String(item.lastMessageSnippet || '').toLowerCase();
      const booking = String(item.bookingCode || '').toLowerCase();
      return partner.includes(keyword) || snippet.includes(keyword) || booking.includes(keyword);
    });
  }, [conversations, search]);

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
      setConversations(p2pOnly);

      if (p2pOnly.length > 0) {
        const firstId = p2pOnly[0].id;
        setActiveConversationId(firstId);
        await loadMessages(firstId);
        dispatch(markConversationRead(firstId));
        await chatApi.markAsRead(firstId);
      }
    } catch (loadError) {
      setError(loadError?.message || 'Khong the tai hop thu tin nhan luc nay.');
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

  useEffect(() => {
    if (!activeConversation) return;

    setConversations((prev) =>
      prev.map((item) => {
        if (Number(item.id) !== Number(activeConversation.id)) return item;
        const last = activeMessages[activeMessages.length - 1];
        if (!last) return item;
        return {
          ...item,
          lastMessageSnippet: last.content,
          lastMessageType: last.contentType,
          lastMessageAt: last.createdAt,
          unreadCount: Number(item.unreadCount || 0),
        };
      }),
    );
  }, [activeConversation, activeMessages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeMessages, sendingIndicator]);

  const openConversation = async (conversation) => {
    if (!conversation?.id) return;

    setActiveConversationId(conversation.id);

    if (!(messages[conversation.id] || []).length) {
      await loadMessages(conversation.id);
    }

    dispatch(markConversationRead(conversation.id));
    setConversations((prev) =>
      prev.map((item) =>
        Number(item.id) === Number(conversation.id)
          ? { ...item, unreadCount: 0 }
          : item,
      ),
    );
    await chatApi.markAsRead(conversation.id);
  };

  const handleSend = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !activeConversationId) return;

    sendMessage(activeConversationId, text);
    setDraft('');
    setSendingIndicator(true);
    setTimeout(() => setSendingIndicator(false), 1100);
  };

  if (!isAuthenticated) {
    return (
      <main className={styles.page}>
        <section className={styles.emptyState}>Vui long dang nhap de su dung hop thu tin nhan.</section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <section className={styles.emptyState}>Dang tai du lieu hop thu...</section>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.page}>
        <section className={styles.emptyState}>{error}</section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <aside className={styles.sidebar}>
          <header className={styles.sidebarHeader}>
            <h1><FaComments /> Partner Inbox</h1>
            <p>Trao doi truc tiep voi khach dang dat tour/khach san</p>
          </header>

          <div className={styles.searchBox}>
            <FaSearch />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tim theo ten, ma booking..."
            />
          </div>

          <div className={styles.conversationList}>
            {filteredConversations.length === 0 ? (
              <div className={styles.emptyMini}>Chua co cuoc tro chuyen nao.</div>
            ) : (
              filteredConversations.map((conversation) => (
                <button
                  type="button"
                  key={conversation.id}
                  className={`${styles.conversationItem} ${Number(conversation.id) === Number(activeConversationId) ? styles.conversationItemActive : ''}`}
                  onClick={() => openConversation(conversation)}
                >
                  <div className={styles.conversationTop}>
                    <strong>{conversation.partnerName || 'Khach hang'}</strong>
                    <span>{formatShortDate(conversation.lastMessageAt)}</span>
                  </div>
                  <p>{conversation.lastMessageSnippet || 'Chua co noi dung'}</p>
                  <div className={styles.conversationMeta}>
                    <span>{conversation.bookingCode || conversation.type}</span>
                    {Number(conversation.unreadCount || 0) > 0 ? (
                      <b>{conversation.unreadCount}</b>
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className={styles.chatPanel}>
          {activeConversation ? (
            <>
              <header className={styles.chatHeader}>
                <div>
                  <h2>{activeConversation.partnerName || 'Cuoc tro chuyen'}</h2>
                  <p>{activeConversation.bookingCode ? `Booking ${activeConversation.bookingCode}` : activeConversation.type}</p>
                </div>
              </header>

              <div className={styles.chatBody} ref={listRef}>
                {activeMessages.length === 0 ? (
                  <div className={styles.emptyMini}>Bat dau nhan tin voi khach hang.</div>
                ) : (
                  activeMessages.map((message) => {
                    const own =
                      message?.senderId != null && user?.id != null
                        ? Number(message.senderId) === Number(user.id)
                        : false;
                    return <MessageBubble key={message.id || `${message.createdAt}-${message.content}`} message={message} own={own} />;
                  })
                )}

                {sendingIndicator ? (
                  <div className={styles.typingRow}>
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <small>Dang gui...</small>
                  </div>
                ) : null}
              </div>

              <form className={styles.composer} onSubmit={handleSend}>
                <textarea
                  rows={1}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Nhap tin nhan..."
                />
                <button type="submit" disabled={!draft.trim()}>
                  <FaPaperPlane />
                </button>
              </form>
            </>
          ) : (
            <div className={styles.emptyState}>Chon mot cuoc tro chuyen de xem noi dung.</div>
          )}
        </section>
      </section>
    </main>
  );
}
