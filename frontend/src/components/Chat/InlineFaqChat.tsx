'use client';

import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openBot } from '../../store/slices/chatSlice';
import faqApi from '../../api/faqApi';
import styles from './InlineFaqChat.module.css';

interface InlineFaqItem {
    id: string;
    question: string;
    answer: string;
    category?: string;
}

interface InlineFaqChatProps {
    context: 'HOTEL' | 'TOUR';
    className?: string;
}

const unwrapPayload = (response: { data?: { data?: unknown } | unknown }): unknown => {
    return (response as { data?: { data?: unknown } }).data?.data ?? (response as { data?: unknown }).data ?? response;
};

const InlineFaqChat = ({ context, className }: InlineFaqChatProps) => {
    const dispatch = useDispatch();
    const { isAuthenticated } = useSelector(
        (state: { auth: { isAuthenticated: boolean } }) => state.auth
    );

    const [faqs, setFaqs] = useState<InlineFaqItem[]>([]);
    const [openFaq, setOpenFaq] = useState<string | null>(null);
    const [aiQuestion, setAiQuestion] = useState('');
    const [aiAnswer, setAiAnswer] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const loadFaqs = useCallback(async () => {
        if (faqs.length > 0) return;
        try {
            const res = await faqApi.getFaqs(context);
            const data = unwrapPayload(res) as InlineFaqItem[];
            if (Array.isArray(data)) {
                setFaqs(data.slice(0, 5));
            }
        } catch {
            // silent fail — FAQ is supplementary
        }
    }, [context, faqs.length]);

    const handleOpenAi = () => {
        if (!isAuthenticated) return;
        void loadFaqs();
    };

    const handleAskAi = async () => {
        const question = aiQuestion.trim();
        if (!question) return;

        setAiLoading(true);
        setAiError(null);
        setAiAnswer(null);

        try {
            const res = await faqApi.askQuestion(question, context);
            const data = (unwrapPayload(res) as { data?: string })?.data;
            if (data) {
                setAiAnswer(data);
            } else {
                setAiError('Chưa có câu trả lời. Bạn thử hỏi cách khác nhé.');
            }
        } catch {
            setAiError('Có lỗi khi hỏi AI. Bạn thử lại sau.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleOpenBot = () => {
        dispatch(openBot());
    };

    return (
        <div className={`${styles.container} ${className || ''}`}>
            {/* FAQ List */}
            {faqs.length > 0 && (
                <div className={styles.faqList}>
                    <div className={styles.faqListHeader}>
                        <span>📋 Câu hỏi thường gặp</span>
                        {isAuthenticated && (
                            <button className={styles.chatWithOwnerBtn} onClick={handleOpenBot}>
                                💬 Chat với chủ {context === 'HOTEL' ? 'khách sạn' : 'tour'}
                            </button>
                        )}
                    </div>
                    {faqs.map((faq) => (
                        <div key={faq.id} className={styles.faqItem}>
                            <button
                                className={styles.faqQ}
                                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                            >
                                <span className={styles.faqQText}>{faq.question}</span>
                                <span className={`${styles.faqChevron} ${openFaq === faq.id ? styles.open : ''}`}>
                                    ▾
                                </span>
                            </button>
                            {openFaq === faq.id && (
                                <div className={styles.faqA}>{faq.answer}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* AI Chat Input */}
            {isAuthenticated && (
                <div className={styles.aiSection}>
                    <div className={styles.aiHeader}>
                        <span className={styles.aiIcon}>🤖</span>
                        <span>Tourista Studio AI — Hỏi bất cứ điều gì về {context === 'HOTEL' ? 'khách sạn này' : 'tour này'}</span>
                    </div>
                    <div className={styles.aiInputRow}>
                        <input
                            className={styles.aiInput}
                            type="text"
                            placeholder={`Hỏi về ${context === 'HOTEL' ? 'khách sạn' : 'tour'}...`}
                            value={aiQuestion}
                            onChange={(e) => setAiQuestion(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') void handleAskAi();
                            }}
                            disabled={aiLoading}
                        />
                        <button
                            className={styles.aiAskBtn}
                            onClick={() => void handleAskAi()}
                            disabled={aiLoading || !aiQuestion.trim()}
                        >
                            {aiLoading ? '...' : 'Hỏi AI'}
                        </button>
                    </div>
                    {aiError && <p className={styles.aiError}>{aiError}</p>}
                    {aiAnswer && (
                        <div className={styles.aiAnswer}>
                            <div className={styles.aiAnswerText}>
                                {aiAnswer.split('\n').map((line, i) => (
                                    <p key={i}>{line.startsWith('-') || line.startsWith('•') ? line : line}</p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!isAuthenticated && (
                <p className={styles.loginHint}>
                    💡{' '}
                    <button className={styles.loginLink} onClick={handleOpenBot}>
                        Đăng nhập
                    </button>{' '}
                    để hỏi AI hoặc chat trực tiếp với chủ {context === 'HOTEL' ? 'khách sạn' : 'tour'}
                </p>
            )}
        </div>
    );
};

export default InlineFaqChat;
