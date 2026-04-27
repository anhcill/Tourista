'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { FaComments, FaPaperPlane, FaTimes, FaCircle } from 'react-icons/fa';
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
  if (!error) return 'Không thể kết nối chat lúc này.';
  if (typeof error === 'string') return error;
  if (error?.response?.status === 401) return 'Vui lòng đăng nhập để sử dụng chat.';
  if (error?.response?.status === 403) return 'Bạn không có quyền chat với dịch vụ này.';
  if (error?.response?.status === 404) return 'Không tìm thấy cuộc trò chuyện. Vui lòng thử lại.';
  if (error?.response?.status === 500) return 'Lỗi server. Vui lòng thử lại sau giây lát.';
  return error?.message || error?.data?.message || 'Không thể kết nối chat lúc này.';
};

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatClock(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
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

const MessageBubble = ({ message, isOwn, showDate }) => {
  if (message?.contentType === 'SYSTEM_LOG') {
    return (
      <>
        {showDate && (
          <div className={styles.dateSeparator}>
            <span>{formatDateLabel(message.createdAt)}</span>
          </div>
        )}
        <div className={styles.systemMessage}>{message.content}</div>
      </>
    );
  }

  return (
    <>
      {showDate && (
        <div className={styles.dateSeparator}>
          <span>{formatDateLabel(message.createdAt)}</span>
        </div>
      )}
      <div className={`${styles.messageRow} ${isOwn ? styles.messageOwn : styles.messageIncoming}`}>
        <div className={`${styles.messageBubble} ${isOwn ? styles.messageBubbleOwn : styles.messageBubbleIncoming}`}>
          {!isOwn && message?.senderName && (
            <span className={styles.senderName}>{message.senderName}</span>
          )}
          <p>{message?.content || ''}</p>
          <div className={styles.messageFooter}>
            <span className={styles.messageTime}>{formatClock(message?.createdAt)}</span>
            {isOwn && (
              <span className={styles.readReceipt}>✓✓</span>
            )}
          </div>
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
  const [headerTitle, setHeaderTitle] = useState('Chat với Chủ dịch vụ');
  const [sendingIndicator, setSendingIndicator] = useState(false);
  const [partnerAvatar, setPartnerAvatar] = useState('');

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
        setError('Thông tin cuộc trò chuyện không hợp lệ.');
        return;
      }
      if (!conversationSeed?.partnerId) {
        setError('Dịch vụ này chưa có thông tin chủ sở hữu. Vui lòng liên hệ hỗ trợ.');
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

        const response = await chatApi.createConversation(payload);
        const conversation = unwrapPayload(response);
        if (!conversation?.id) throw new Error('Không mở được cuộc trò chuyện.');

        dispatch(setActiveP2PConversation(conversation.id));
        setHeaderTitle(conversation.partnerName || conversationSeed.title || 'Chat với Chủ dịch vụ');
        setPartnerAvatar(conversation.partnerAvatar || '');

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
    event?.preventDefault?.();
    const trimmed = draft.trim();
    if (!trimmed || !activeP2PConversationId || submitting) return;

    // Optimistic update
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeP2PConversationId,
      senderId: user?.id,
      senderName: user?.fullName || user?.name || 'Bạn',
      contentType: 'TEXT',
      content: trimmed,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    dispatch(addMessage(optimisticMessage));

    setDraft('');
    setSubmitting(true);
    setSendingIndicator(true);

    const sent = sendMessage(activeP2PConversationId, trimmed);
    if (!sent) {
      setError('Mất kết nối chat. Vui lòng thử lại sau giây lát.');
    }

    setSubmitting(false);
    setTimeout(() => setSendingIndicator(false), 1200);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <section className={styles.modal} onClick={(event) => event.stopPropagation()}>

        {/* ── Header ── */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatarCircle}>
                {partnerAvatar ? (
                  <img src={partnerAvatar} alt="" className={styles.avatarImg} />
                ) : (
                  getInitials(headerTitle)
                )}
              </div>
              <span className={styles.onlineDot} />
            </div>
            <div className={styles.headerText}>
              <h3>{headerTitle}</h3>
              <div className={styles.headerStatus}>
                <FaCircle style={{ fontSize: 8, color: '#22c55e' }} />
                <span>Đang hoạt động</span>
              </div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <button type="button" className={styles.iconBtn} aria-label="Tùy chọn">
              <IoEllipsisVertical size={16} />
            </button>
            <button type="button" className={styles.closeBtn} onClick={closeModal} aria-label="Đóng chat">
              <FaTimes size={16} />
            </button>
          </div>
        </header>

        {/* ── Body ── */}
        <div className={styles.body}>
          {!isAuthenticated ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><FaComments /></div>
              <h4>Chat với Chủ dịch vụ</h4>
              <p>Đăng nhập để nhắn tin trực tiếp với chủ dịch vụ du lịch.</p>
              <Link href="/login" className={styles.ctaLink} onClick={closeModal}>
                Đăng nhập ngay
              </Link>
            </div>
          ) : loading ? (
            <div className={styles.emptyState}>
              <div className={styles.spinner} />
              <h4>Đang kết nối...</h4>
              <p>Thiết lập cuộc trò chuyện với chủ dịch vụ.</p>
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
                  <div className={styles.emptyChat}>
                    <p>Bắt đầu cuộc trò chuyện với chủ dịch vụ</p>
                    <small>Hỏi về phòng, giá, dịch vụ...</small>
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
                    <div className={`${styles.messageBubble} ${styles.messageBubbleIncoming}`}>
                      <div className={styles.typingRow}>
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Composer ── */}
              <form className={styles.composer} onSubmit={handleSubmit}>
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhắn tin cho chủ dịch vụ..."
                  className={styles.input}
                  rows={1}
                />
                <button
                  type="submit"
                  className={styles.sendBtn}
                  disabled={!draft.trim() || submitting}
                  aria-label="Gửi tin nhắn"
                >
                  <FaPaperPlane size={15} />
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function MessageItem({ message, isOwn, showDate }) {
  if (message?.contentType === 'SYSTEM_LOG') {
    return (
      <>
        {showDate && (
          <div className={styles.dateSeparator}>
            <span>{formatDateLabel(message.createdAt)}</span>
          </div>
        )}
        <div className={styles.systemMessage}>{message.content}</div>
      </>
    );
  }

  return (
    <>
      {showDate && (
        <div className={styles.dateSeparator}>
          <span>{formatDateLabel(message.createdAt)}</span>
        </div>
      )}
      <div className={`${styles.messageRow} ${isOwn ? styles.messageOwn : styles.messageIncoming}`}>
        <div className={`${styles.messageBubble} ${isOwn ? styles.messageBubbleOwn : styles.messageBubbleIncoming}`}>
          {!isOwn && message?.senderName && (
            <span className={styles.senderName}>{message.senderName}</span>
          )}
          <p>{message?.content || ''}</p>
          <div className={styles.messageFooter}>
            <span className={styles.messageTime}>{formatClock(message?.createdAt)}</span>
            {isOwn && <span className={styles.readReceipt}>✓✓</span>}
          </div>
        </div>
      </div>
    </>
  );
}
