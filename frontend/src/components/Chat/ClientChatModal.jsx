'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { FaComments, FaPaperPlane, FaTimes } from 'react-icons/fa';
import chatApi from '@/api/chatApi';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import {
  closeP2P,
  markConversationRead,
  setActiveP2PConversation,
  setMessages,
  setP2PModalOpen,
} from '@/store/slices/chatSlice';
import { p2pModalBus } from '@/utils/p2pModalBus';
import styles from './ClientChatModal.module.css';

// axiosClient interceptor returns response.data (parsed ApiResponse body = { success, data, timestamp })
// BUT, this file may have been using the full axios response in some scenarios, so we use triple fallbacks
// like InlineFaqChat: check axios response.data.data (deep), then response.data (api body), then response itself.
const unwrapPayload = (response) =>
    (response as { data?: { data?: unknown } })?.data?.data ??
    (response as { data?: unknown })?.data ??
    response ??
    null;
const unwrapPageContent = (response) =>
    (response as { data?: { content?: unknown } })?.data?.content ??
    (response as { content?: unknown })?.content ??
    response ?? [];
const extractErrorMessage = (error) => {
  if (!error) return 'Khong the ket noi chat luc nay.';
  if (typeof error === 'string') return error;

  // Log chi tiết lỗi để debug
  console.warn('[ChatModal] Error details:', error);

  // 401 - Unauthorized
  if (error?.response?.status === 401) {
    return 'Vui long dang nhap de su dung chat voi chu dich vu.';
  }
  // 403 - Forbidden
  if (error?.response?.status === 403) {
    return 'Ban khong co quyen chat voi dich vu nay.';
  }
  // 404 - Not found
  if (error?.response?.status === 404) {
    return 'Khong tim thay cuoc tro chuyen. Vui long thu lai.';
  }
  // 500 - Server error
  if (error?.response?.status === 500) {
    return 'Loi server khi mo cuoc tro chuyen. Vui long thu lai sau giay lat.';
  }

  return error?.message || error?.data?.message || 'Khong the ket noi chat luc nay.';
};

const MessageItem = ({ message, isOwn }) => {
  if (message?.contentType === 'SYSTEM_LOG') {
    return <div className={styles.systemMessage}>{message.content}</div>;
  }

  return (
    <div className={`${styles.messageRow} ${isOwn ? styles.messageOwn : styles.messageIncoming}`}>
      <div className={`${styles.messageBubble} ${isOwn ? styles.messageBubbleOwn : styles.messageBubbleIncoming}`}>
        <p>{message?.content || ''}</p>
        <span className={styles.messageTime}>
          {message?.createdAt
            ? new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : ''}
        </span>
      </div>
    </div>
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

    const handleEsc = (event) => {
      if (event.key === 'Escape') closeModal();
    };

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
      console.log('[ChatModal] initConversation called with seed:', conversationSeed);

      if (!conversationSeed?.type || !conversationSeed?.referenceId) {
        setError('Thong tin cuoc tro chuyen khong hop le.');
        return;
      }

      if (!conversationSeed?.partnerId) {
        console.warn('[ChatModal] Missing partnerId - hotel may not have owner:', conversationSeed);
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

        console.log('[ChatModal] Creating conversation with payload:', payload);

        let response;
        try {
          response = await chatApi.createConversation(payload);
        } catch (apiErr) {
          console.error('[ChatModal] createConversation API ERROR:', apiErr);
          console.error('[ChatModal] Error response:', apiErr?.response?.data);
          console.error('[ChatModal] Error status:', apiErr?.response?.status);
          throw apiErr;
        }

        const conversation = unwrapPayload(response);
        console.log('[ChatModal] createConversation RAW response:', JSON.stringify(response, null, 2));
        console.log('[ChatModal] Unwrapped conversation:', conversation);

        if (!conversation?.id) {
          throw new Error('Khong mo duoc cuoc tro chuyen.');
        }

        dispatch(setActiveP2PConversation(conversation.id));
        setHeaderTitle(conversation.partnerName || conversationSeed.title || 'Chat voi Chu');

        const historyResponse = await chatApi.getMessages(conversation.id);
        const history = unwrapPageContent(historyResponse);
        dispatch(setMessages({ conversationId: conversation.id, messages: history }));
        dispatch(markConversationRead(conversation.id));
        await chatApi.markAsRead(conversation.id);

        setTimeout(() => inputRef.current?.focus(), 80);
      } catch (initError) {
        console.error('[ChatModal] initConversation error:', initError);
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
        <header className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <span className={styles.headerIcon}><FaComments /></span>
            <div>
              <h3>{headerTitle}</h3>
              <p>Nhan tin truc tiep voi chu dich vu</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={closeModal} aria-label="Dong chat">
            <FaTimes />
          </button>
        </header>

        {!isAuthenticated ? (
          <div className={styles.emptyState}>
            <p>Ban can dang nhap de su dung chat truc tiep voi chu dich vu.</p>
            <Link href="/login" className={styles.ctaLink}>Dang nhap ngay</Link>
          </div>
        ) : loading ? (
          <div className={styles.emptyState}>
            <p>Dang ket noi cuoc tro chuyen...</p>
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className={styles.messages} ref={listRef}>
              {chatMessages.length === 0 ? (
                <div className={styles.systemMessage}>Bat dau tro chuyen voi chu dich vu ngay bay gio.</div>
              ) : (
                chatMessages.map((message) => {
                  const isOwn =
                    message?.senderId != null && user?.id != null
                      ? Number(message.senderId) === Number(user.id)
                      : false;

                  return <MessageItem key={message.id || `${message.createdAt}-${message.content}`} message={message} isOwn={isOwn} />;
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

            <form className={styles.composer} onSubmit={handleSubmit}>
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Nhap tin nhan cho chu dich vu..."
                rows={1}
                className={styles.input}
              />
              <button type="submit" className={styles.sendBtn} disabled={!draft.trim() || submitting}>
                <FaPaperPlane />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
