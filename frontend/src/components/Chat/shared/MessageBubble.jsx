'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import TourResultCard from '../TourResultCard/TourResultCard';
import BookingItineraryCard from '../BookingItineraryCard/BookingItineraryCard';
import FaqMenuCard from '../FaqMenuCard/FaqMenuCard';
import { formatClock, parseSafeMarkdown, isOwnMessage } from '../../utils/chat/formatters';
import styles from './MessageBubble.module.css';

/**
 * Shared message bubble component used by both BotChatWidget and ClientChatModal.
 */
const MessageBubble = React.memo(({ msg, showDateLabel, onFaqSelect }) => {
    const { user } = useSelector(state => state.auth);

    const isOwn = isOwnMessage(msg, user?.id);
    const isSystem = msg.contentType === 'SYSTEM_LOG';

    // System message
    if (isSystem) {
        return (
            <>
                {showDateLabel && (
                    <div className={styles.dateSeparator}>
                        <span>{showDateLabel}</span>
                    </div>
                )}
                <div className={styles.systemMsg}>
                    <span>{msg.content}</span>
                </div>
            </>
        );
    }

    // Booking details card
    if (msg.contentType === 'BOOKING_DETAILS') {
        return (
            <>
                {showDateLabel && (
                    <div className={styles.dateSeparator}>
                        <span>{showDateLabel}</span>
                    </div>
                )}
                <div className={`${styles.bubble} ${styles.bubbleBot}`}>
                    {!isOwn && <div className={styles.botAvatar}>🌴</div>}
                    <div className={`${styles.bubbleContent} ${styles.bubbleContentBot}`}>
                        {msg.content && (
                            <div className={styles.bubbleText}>
                                {(msg.content || '').split('\n').map((line, i) => (
                                    <p key={i}>{parseSafeMarkdown(line)}</p>
                                ))}
                            </div>
                        )}
                        <BookingItineraryCard metadata={msg.metadata} />
                        <span className={styles.bubbleTime}>{formatClock(msg.createdAt)}</span>
                    </div>
                </div>
            </>
        );
    }

    // Tour cards
    if (msg.contentType === 'TOUR_CARDS') {
        return (
            <>
                {showDateLabel && (
                    <div className={styles.dateSeparator}>
                        <span>{showDateLabel}</span>
                    </div>
                )}
                <div className={`${styles.bubble} ${styles.bubbleBot}`}>
                    {!isOwn && <div className={styles.botAvatar}>🌴</div>}
                    <div className={`${styles.bubbleContent} ${styles.bubbleContentBot}`}>
                        {msg.content && (
                            <div className={styles.bubbleText}>
                                {(msg.content || '').split('\n').map((line, i) => (
                                    <p key={i}>{parseSafeMarkdown(line)}</p>
                                ))}
                            </div>
                        )}
                        <TourResultCard metadata={msg.metadata} />
                        <span className={styles.bubbleTime}>{formatClock(msg.createdAt)}</span>
                    </div>
                </div>
            </>
        );
    }

    // FAQ menu card
    if (msg.contentType === 'FAQ_MENU' || msg.contentType === 'SCENARIO_CHOICE') {
        return (
            <>
                {showDateLabel && (
                    <div className={styles.dateSeparator}>
                        <span>{showDateLabel}</span>
                    </div>
                )}
                <div className={`${styles.bubble} ${styles.bubbleBot}`}>
                    {!isOwn && <div className={styles.botAvatar}>🌴</div>}
                    <div className={`${styles.bubbleContent} ${styles.bubbleContentBot}`}>
                        {msg.content && (
                            <div className={styles.bubbleText}>
                                {(msg.content || '').split('\n').map((line, i) => (
                                    <p key={i}>{parseSafeMarkdown(line)}</p>
                                ))}
                            </div>
                        )}
                        <FaqMenuCard
                            metadata={msg.metadata}
                            onSelect={onFaqSelect || (() => {})}
                        />
                        <span className={styles.bubbleTime}>{formatClock(msg.createdAt)}</span>
                    </div>
                </div>
            </>
        );
    }

    // Plain text / AI text message
    return (
        <>
            {showDateLabel && (
                <div className={styles.dateSeparator}>
                    <span>{showDateLabel}</span>
                </div>
            )}
            <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleBot}`}>
                {!isOwn && <div className={styles.botAvatar}>🌴</div>}
                <div className={`${styles.bubbleContent} ${isOwn ? styles.bubbleContentOwn : styles.bubbleContentBot}`}>
                    <div className={styles.bubbleText}>
                        {(msg.content || '').split('\n').map((line, i) => (
                            <p key={i}>{parseSafeMarkdown(line)}</p>
                        ))}
                    </div>
                    <span className={styles.bubbleTime}>{formatClock(msg.createdAt)}</span>
                </div>
            </div>
        </>
    );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
