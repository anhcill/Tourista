'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { FaComments, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { IoEllipsisVertical } from 'react-icons/io5';
import chatApi from '@/api/chatApi';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import {
  addMessage,
  closeP2P,
  markConversationRead,
  setActiveP2PConversation,
  setMessages,
  setP2PModalOpen,
} from '@/store/slices/chatSlice';
import { p2pModalBus } from '@/utils/p2pModalBus';
import styles from './ClientChatModal.module.css';

// axiosClient interceptor returns response.data (parsed ApiResponse body = { success, data, timestamp })
const unwrapPayload = (response) =>
    response?.data?.data ??
    response?.data ??
    response ??
    null;
const unwrapPageContent = (response) =>
    response?.data?.content ??
    response?.content ??
    response ?? [];
const extractErrorMessage = (error) => {
  if (!error) return 'Khong the ket noi chat luc nay.';
  if (typeof error === 'string') return error;
  if (error?.response?.status === 401) return 'Vui long dang nhap de su dung chat voi chu dich vu.';
  if (error?.response?.status === 403) return 'Ban khong co quyen chat voi dich vu nay.';
  if (error?.response?.status === 404) return 'Khong tim thay cuoc tro chuyen. Vui long thu lai.';
  if (error?.response?.status === 500) return 'Loi server khi mo cuoc tro chuyen. Vui long thu lai sau giay lat.';
  return error?.message || error?.data?.message || 'Khong the ket noi chat luc nay.';
};

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isToday) return 'Hôm nay';
  if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const MessageItem = ({ message, isOwn, showDate }) => {
  const timeStr = message?.createdAt
    ? new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <>
      {showDate && (
        <div className={styles.dateSeparator}>
          <span className={styles.dateSeparatorLine} />
          <span>{formatDateLabel(message.createdAt)}</span>
          <span className={styles.dateSeparatorLine} />
        </div>
      )}
      <div className={`${styles.messageRow} ${isOwn ? styles.messageOwn : styles.messageIncoming}`}>
        <div className={`${styles.messageBubble} ${isOwn ? styles.messageBubbleOwn : styles.messageBubbleIncoming}`}>
          {message?.contentType === 'SYSTEM_LOG' ? (
            <span style={{ fontSize: '11px', fontStyle: 'italic', opacity: 0.7 }}>{message.content}</span>
          ) : (
            <>
              <p>{message?.content || ''}</p>
              <div className={styles.messageFooter}>
                <span className={styles.messageTime}>{timeStr}</span>
                {isOwn && (
                  <span className={styles.readReceipt}>
                    {/* simple double-check icon via unicode */}
                    ✓
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default function ClientChatModal({ isOpen, onClose, conversationSeed }) {
  const dispatch = useDispatch();
  const { sendMessage } = useChatWebSocket();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { activeP2PConversationId, messages } = useSelector((state) => state.chat);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [headerTitle, setHeaderTitle] = useState('Chat với Chủ');
  const [sendingIndicator, setSendingIndicator] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  const chatMessages = useMemo(() => {
    if (!activeP2PConversationId) return [];
    return messages[activeP2PConversationId] || [];
  }, [activeP2PConversationId, messages]);

  const closeModal = useCallback(() => {
    dispatch(closeP2P());
    setDraft('');
    setError('');
    onClose?.();
  }, [dispatch, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event) => { if (event.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeModal]);

  useEffect(() => {
    if (isOpen) {
      dispatch(setP2PModalOpen(true));
      p2pModalBus.publish(true);
    } else {
      dispatch(setP2PModalOpen(false));
      p2pModalBus.publish(false);
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    const initConversation = async () => {
      if (!conversationSeed?.type || !conversationSeed?.referenceId) {
        setError('Thong tin cuoc tro chuyen khong hop le.');
        return;
      }
      if (!conversationSeed?.partnerId) {
        setError('Dich vu nay chua co thong tin chu so huu de mo chat truc tiep. Vui long lien he ho tro 24/7.');
        return;
      }

      try {
        setLoading(true);
        setError('');

        const payload = {
          type: conversationSeed.type,
          partnerId: Number(conversationSeed.partnerId),
          referenceId: Number(conversationSeed.referenceId),
          bookingId: conversationSeed.bookingId ? Number(conversationSeed.bookingId) : undefined,
        };

        let response;
        try {
          response = await chatApi.createConversation(payload);
        } catch (apiErr) {
          throw apiErr;
        }

        const conversation = unwrapPayload(response);
        if (!conversation?.id) throw new Error('Khong mo duoc cuoc tro chuyen.');

        dispatch(setActiveP2PConversation(conversation.id));
        setHeaderTitle(conversation.partnerName || conversationSeed.title || 'Chat voi Chu');

        const historyResponse = await chatApi.getMessages(conversation.id);
        const history = unwrapPageContent(historyResponse);
        dispatch(setMessages({ conversationId: conversation.id, messages: history }));
        dispatch(markConversationRead(conversation.id));
        await chatApi.markAsRead(conversation.id);

        setTimeout(() => inputRef.current?.focus(), 80);
      } catch (initError) {
        setError(extractErrorMessage(initError));
      } finally {
        setLoading(false);
      }
    };

    initConversation();
  }, [conversationSeed, dispatch, isAuthenticated, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages, isOpen, sendingIndicator]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || !activeP2PConversationId || submitting) return;

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeP2PConversationId,
      senderId: user?.id,
      senderName: user?.name || user?.fullName || 'Bạn',
      contentType: 'TEXT',
      content: trimmed,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    dispatch(addMessage(optimisticMessage));
    dispatch(setMessages({
      conversationId: activeP2PConversationId,
      messages: [...(messages[activeP2PConversationId] || []), optimisticMessage],
    }));

    try {
      setSubmitting(true);
      setSendingIndicator(true);
      const sent = sendMessage(activeP2PConversationId, trimmed);
      if (!sent) {
        setError('Mat ket noi chat thoi gian thuc. Vui long thu lai sau it giay.');
        return;
      }
      setDraft('');
      setError('');
    } finally {
      setSubmitting(false);
      setTimeout(() => setSendingIndicator(false), 1200);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <section className={styles.modal} onClick={(event) => event.stopPropagation()}>

        {/* ── Header ── */}
        <header className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.avatar}>
              <div className={styles.avatarCircle}>{getInitials(headerTitle)}</div>
              <span className={styles.statusDot} />
            </div>
            <div className={styles.headerText}>
              <h3>{headerTitle}</h3>
              <div className={styles.headerMeta}>
                <span>Online</span>
                <span className={styles.headerMetaDot} />
                <span>Phản hồi nhanh</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button type="button" className={styles.closeBtn} onClick={closeModal} aria-label="Dong chat">
              <IoEllipsisVertical size={15} />
            </button>
            <button type="button" className={styles.closeBtn} onClick={closeModal} aria-label="Dong chat">
              <FaTimes size={15} />
            </button>
          </div>
        </header>

        {/* ── Body ── */}
        {!isAuthenticated ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><FaComments /></div>
            <h4>Chat với Chủ dịch vụ</h4>
            <p>Đăng nhập để nhắn tin trực tiếp với chủ dịch vụ du lịch và đặt phòng ngay hôm nay.</p>
            <Link href="/login" className={styles.ctaLink}>Đăng nhập ngay</Link>
          </div>
        ) : loading ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><FaComments /></div>
            <h4>Đang kết nối...</h4>
            <p>Đang thiết lập cuộc trò chuyện với chủ dịch vụ.</p>
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)', color: '#dc2626' }}>
              <FaTimes />
            </div>
            <h4>Không thể kết nối</h4>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className={styles.messages} ref={listRef}>
              {chatMessages.length === 0 ? (
                <div className={styles.systemMessage}>
                  Bắt đầu cuộc trò chuyện với chủ dịch vụ ngay bây giờ
                </div>
              ) : (
                chatMessages.map((message, idx) => {
                  const isOwn =
                    message?.senderId != null && user?.id != null
                      ? Number(message.senderId) === Number(user.id)
                      : false;

                  const prev = chatMessages[idx - 1];
                  const showDate = !prev || formatDateLabel(message.createdAt) !== formatDateLabel(prev.createdAt);

                  return (
                    <MessageItem
                      key={message.id || `${message.createdAt}-${message.content}`}
                      message={message}
                      isOwn={isOwn}
                      showDate={showDate}
                    />
                  );
                })
              )}

              {sendingIndicator && (
                <div className={`${styles.messageRow} ${styles.messageIncoming}`}>
                  <div className={`${styles.messageBubble} ${styles.messageBubbleIncoming}`} style={{ gap: 0 }}>
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

            {/* ── Composer ── */}
            <form className={styles.composer} onSubmit={handleSubmit}>
              <div className={styles.inputWrap}>
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Nhắn tin cho chủ dịch vụ..."
                  className={styles.input}
                  rows={1}
                />
              </div>
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={!draft.trim() || submitting}
                aria-label="Gui tin nhan"
              >
                <FaPaperPlane size={15} />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
