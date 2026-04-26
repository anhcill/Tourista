'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { FaComments, FaPaperPlane, FaSearch, FaHotel, FaPlaneDeparture, FaRobot } from 'react-icons/fa';
import adminChatApi from '@/api/adminChatApi';
import styles from './page.module.css';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAccessToken } from '@/utils/authStorage';
import { API_BASE_URL } from '@/utils/constants';

/* ─── Helpers ─── */
const fmtTime = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d)) return '';
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(d);
};

const fmtAgo = (v) => {
  if (!v) return '';
  const diff = Date.now() - new Date(v).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Vừa xong';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
};

const STATUS_LABELS = {
  CONFIRMED: 'Đã xác nhận',
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  PAYMENT_PENDING: 'Chờ thanh toán',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn thành',
  REFUNDED: 'Đã hoàn tiền',
  FAILED: 'Thất bại',
  CHECKED_IN: 'Đã nhận phòng',
};

const STATUS_CLS = {
  CONFIRMED: styles.statusConfirmed,
  PENDING:   styles.statusPending,
  PAID:      styles.statusPaid,
  PAYMENT_PENDING: styles.statusPaymentPending,
  CANCELLED: styles.statusCancelled,
  COMPLETED: styles.statusCompleted,
  REFUNDED:  styles.statusCancelled,
  FAILED:    styles.statusFailed,
  CHECKED_IN: styles.statusCompleted,
};

/* ─── Type Badge ─── */
const TypeBadge = ({ type }) => {
  if (type === 'P2P_HOTEL') return <span className={`${styles.typeBadge} ${styles.typeBadgeHotel}`}><FaHotel style={{marginRight:3}}/> Khách sạn</span>;
  if (type === 'P2P_TOUR')  return <span className={`${styles.typeBadge} ${styles.typeBadgeTour}`}><FaPlaneDeparture style={{marginRight:3}}/> Tour</span>;
  return <span className={`${styles.typeBadge} ${styles.typeBadgeBot}`}><FaRobot style={{marginRight:3}}/> Bot</span>;
};

/* ─── Booking Card (from conversation metadata) ─── */
const BookingCard = ({ conv }) => {
  if (!conv.bookingCode) return null;

  const statusCls = conv.bookingStatus ? (STATUS_CLS[conv.bookingStatus] || styles.statusDefault) : '';
  const statusLabel = conv.bookingStatus ? (STATUS_LABELS[conv.bookingStatus] || conv.bookingStatus) : '';
  const isTour = conv.type === 'P2P_TOUR';
  const borderCls = isTour ? styles.bookingCardTour : styles.bookingCardHotel;

  return (
    <div className={`${styles.bookingCard} ${borderCls}`}>
      <div className={styles.bookingCardInfo}>
        <span className={styles.bookingCardCode}>{conv.bookingCode}</span>
        {conv.serviceName && (
          <span className={styles.bookingCardService}>{conv.serviceName}</span>
        )}
        {conv.guestName && (
          <span className={styles.bookingCardGuest}>👤 {conv.guestName}</span>
        )}
        {conv.bookingDates && (
          <span className={styles.bookingCardDates}>📅 {conv.bookingDates}</span>
        )}
      </div>
      {statusLabel && (
        <span className={`${styles.bookingStatusBadge} ${statusCls}`}>{statusLabel}</span>
      )}
    </div>
  );
};

/* ─── Message Bubble ─── */
const MsgBubble = ({ msg, isOwn }) => {
  if (msg?.contentType === 'SYSTEM_LOG') {
    return <div className={styles.systemMsg}>{msg.content}</div>;
  }
  return (
    <div className={`${styles.msgRow} ${isOwn ? styles.msgRowOwn : styles.msgRowOther}`}>
      <div className={`${styles.msgBubble} ${isOwn ? styles.msgBubbleOwn : styles.msgBubbleOther}`}>
        {!isOwn && msg?.senderName && (
          <span className={styles.msgSender}>{msg.senderName}</span>
        )}
        <p className={styles.msgContent}>{msg?.content || ''}</p>
        <span className={styles.msgTime}>{fmtTime(msg?.createdAt)}</span>
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
export default function AdminMessagesPage() {
  const { user } = useSelector(s => s.auth);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('ALL');
  const [convs, setConvs] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeMsgs, setActiveMsgs] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const msgListRef = useRef(null);
  const lastMsgCountRef = useRef(0);
  const activeIdRef = useRef(null);

  /* Keep ref in sync with state */
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  /* Reload conversation list */
  const reloadConvs = useCallback(async () => {
    try {
      const res = await adminChatApi.getConversations();
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setConvs(list);
    } catch { /* silent fail */ }
  }, []);

  /* Reload active messages (for fallback polling) */
  const reloadActiveMsgs = useCallback(async () => {
    const currentId = activeIdRef.current;
    if (!currentId) return;
    try {
      const res = await adminChatApi.getMessages(currentId);
      const items = res?.data?.data?.content || [];
      if (items.length !== lastMsgCountRef.current) {
        lastMsgCountRef.current = items.length;
        setActiveMsgs(items);
      }
    } catch { /* silent fail */ }
  }, []);

  /* WebSocket subscription for admin — receives all new messages */
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const wsUrl = `${new URL(API_BASE_URL, window.location.origin).origin}/ws`;
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        client.subscribe('/user/queue/messages', (frame) => {
          try {
            const msg = JSON.parse(frame.body);
            const currentId = activeIdRef.current;
            if (msg.conversationId === currentId) {
              setActiveMsgs(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
              setTimeout(() => {
                msgListRef.current?.scrollTo({ top: msgListRef.current.scrollHeight, behavior: 'smooth' });
              }, 50);
            }
            void reloadConvs();
          } catch { /* ignore */ }
        });
      },
    });

    client.activate();
    return () => { client.deactivate(); };
  }, [reloadConvs]);

  /* Load conversations */
  const loadConvs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminChatApi.getConversations();
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setConvs(list);
      if (list.length > 0 && !activeId) {
        openConv(list[0]);
      }
    } catch {
      setError('Không thể tải hội thoại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadConvs(); }, [loadConvs]);

  /* Open conversation → load messages */
  const openConv = async (conv) => {
    if (!conv?.id) return;
    setActiveId(conv.id);
    setDraft('');
    setActiveMsgs([]);
    setLoadingMsgs(true);
    lastMsgCountRef.current = 0;

    try {
      const res = await adminChatApi.getMessages(conv.id);
      const items = res?.data?.data?.content || [];
      setActiveMsgs(items);
      await adminChatApi.markAsRead(conv.id).catch(() => {});
    } catch {
      // non-critical
    } finally {
      setLoadingMsgs(false);
    }

    setTimeout(() => {
      msgListRef.current?.scrollTo({ top: msgListRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  /* Auto-scroll on new messages */
  useEffect(() => {
    msgListRef.current?.scrollTo({ top: msgListRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeMsgs, activeId]);

  /* Send message */
  const handleSend = async (e) => {
    e?.preventDefault?.();
    const text = draft.trim();
    if (!text || !activeId) return;

    setSending(true);
    try {
      const res = await adminChatApi.sendMessage(activeId, text);
      const newMsg = res?.data?.data;
      if (newMsg) {
        setActiveMsgs(prev => [...prev, newMsg]);
      }
      setDraft('');
    } catch {
      // non-critical
    } finally {
      setSending(false);
    }
  };

  /* Filter + search */
  const filtered = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();
    let list = convs;
    if (tab === 'HOTEL') list = list.filter(c => c.type === 'P2P_HOTEL');
    else if (tab === 'TOUR') list = list.filter(c => c.type === 'P2P_TOUR');
    else if (tab === 'BOT') list = list.filter(c => c.type === 'BOT');
    if (!q) return list;
    return list.filter(
      c =>
        (c.partnerName || '').toLowerCase().includes(q) ||
        (c.bookingCode || '').toLowerCase().includes(q) ||
        (c.lastMessageSnippet || '').toLowerCase().includes(q),
    );
  }, [convs, search, tab]);

  const activeConv = useMemo(
    () => convs.find(c => c.id === activeId) || null,
    [convs, activeId],
  );

  return (
    <div className={styles.shell}>
      {/* ── LEFT: Inbox ── */}
      <div className={styles.inboxPanel}>
        <div className={styles.inboxHeader}>
          <h2><FaComments /> Tin nhắn</h2>
          <p>Quản lý hội thoại với khách hàng</p>
        </div>

        <div className={styles.inboxTabs}>
          {['ALL','HOTEL','TOUR','BOT'].map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'ALL' ? 'Tất cả' : t === 'HOTEL' ? 'Khách sạn' : t === 'TOUR' ? 'Tour' : 'Bot'}
            </button>
          ))}
        </div>

        <div className={styles.searchRow}>
          <FaSearch />
          <input
            type="text"
            placeholder="Tìm theo tên, mã booking…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className={styles.stateBox}>
            <div className={styles.spinner} />
            <span>Đang tải…</span>
          </div>
        ) : error ? (
          <div className={styles.stateBox}><span>{error}</span></div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyInbox}>
            <FaComments />
            <span>Chưa có hội thoại nào.</span>
          </div>
        ) : (
          <div className={styles.convList}>
            {filtered.map(c => (
              <button
                key={c.id}
                type="button"
                className={`${styles.convItem} ${c.id === activeId ? styles.convItemActive : ''}`}
                onClick={() => openConv(c)}
              >
                <div className={styles.convTop}>
                  <span className={styles.partnerName}>
                    {c.partnerName || c.type === 'BOT' ? 'Hỗ trợ Tourista' : 'Khách hàng'}
                  </span>
                  <div className={styles.convMeta}>
                    <TypeBadge type={c.type} />
                    {c.unreadCount > 0 && (
                      <span className={styles.unreadDot}>{c.unreadCount > 99 ? '99+' : c.unreadCount}</span>
                    )}
                  </div>
                </div>
                {c.bookingCode && (
                  <span className={styles.bookingCode}>📋 {c.bookingCode}</span>
                )}
                {c.lastMessageSnippet && (
                  <span className={styles.convSnippet}>{c.lastMessageSnippet}</span>
                )}
                {c.lastMessageAt && (
                  <span className={styles.convTime}>{fmtAgo(c.lastMessageAt)}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT: Chat ── */}
      <div className={styles.chatPanel}>
        {!activeConv ? (
          <div className={styles.chatPanelEmpty}>
            <FaComments />
            <p>Chọn một hội thoại để xem chi tiết</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <h3>
                  {activeConv.type === 'BOT'
                    ? <><FaRobot /> Hỗ trợ Tourista</>
                    : <>{activeConv.partnerName || 'Khách hàng'}</>
                  }
                </h3>
                {activeConv.bookingCode && (
                  <p>Booking: {activeConv.bookingCode} · {activeConv.type === 'P2P_HOTEL' ? 'Khách sạn' : 'Tour'}</p>
                )}
              </div>
              <TypeBadge type={activeConv.type} />
            </div>

            {/* Booking info card */}
            <BookingCard conv={activeConv} />

            {/* Messages */}
            <div className={styles.msgList} ref={msgListRef}>
              {loadingMsgs ? (
                <div className={styles.stateBox}>
                  <div className={styles.spinner} />
                  <span>Đang tải tin nhắn…</span>
                </div>
              ) : activeMsgs.length === 0 ? (
                <div className={styles.stateBox}>
                  <span>Chưa có tin nhắn nào.</span>
                </div>
              ) : (
                activeMsgs.map(m => {
                  const isOwn = m?.senderId != null && user?.id != null && Number(m.senderId) === Number(user.id);
                  return <MsgBubble key={m.id || `${m.createdAt}-${m.content}`} msg={m} isOwn={isOwn} />;
                })
              )}
              {sending && (
                <div className={styles.typingIndicator}>
                  <span className={styles.dotAnim} />
                  <span className={styles.dotAnim} />
                  <span className={styles.dotAnim} />
                  <small style={{marginLeft:4, fontSize:11, color:'#64748b'}}>Đang gửi…</small>
                </div>
              )}
            </div>

            {/* Composer */}
            <form className={styles.composer} onSubmit={handleSend}>
              <textarea
                rows={1}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Nhập tin nhắn trả lời… (Enter để gửi, Shift+Enter xuống dòng)"
              />
              <button type="submit" className={styles.sendBtn} disabled={!draft.trim() || sending}>
                <FaPaperPlane />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
