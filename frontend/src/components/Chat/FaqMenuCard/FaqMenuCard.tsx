'use client';

import React, { useState } from 'react';
import type { FaqMenuMetadata, FaqMenuItem } from '../../../types/chat';
import styles from './FaqMenuCard.module.css';

interface FaqMenuCardProps {
    metadata: string | null | undefined;
    onSelect: (payload: string) => void;
}

const FaqMenuCard = ({ metadata, onSelect }: FaqMenuCardProps) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [customText, setCustomText] = useState('');
    const [showInput, setShowInput] = useState(false);

    const data: FaqMenuMetadata | null = React.useMemo(() => {
        if (!metadata) return null;
        try {
            return typeof metadata === 'string' ? (JSON.parse(metadata) as FaqMenuMetadata) : (metadata as FaqMenuMetadata);
        } catch {
            console.error('Loi parse FaqMenuCard metadata:', metadata);
            return null;
        }
    }, [metadata]);

    const handleSelect = (item: FaqMenuItem) => {
        if (selectedId !== null) return;
        setSelectedId(item.id);
        onSelect(item.payload);
    };

    const handleSendCustom = () => {
        const text = customText.trim();
        if (!text) return;
        setCustomText('');
        setShowInput(false);
        onSelect(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSendCustom();
        }
    };

    if (!data || !data.items || data.items.length === 0) return null;

    return (
        <div className={styles.cardContainer}>
            <div className={styles.header}>
                <div className={styles.question}>{data.title || '🤔 Ban can minh giup gi?'}</div>
                {data.subtitle && <div className={styles.subtitle}>{data.subtitle}</div>}
            </div>

            <div className={styles.grid}>
                {data.items.map((item) => {
                    const isSelected = selectedId === item.id;
                    const isDisabled = selectedId !== null && !isSelected;

                    return (
                        <button
                            key={item.id}
                            className={`${styles.choiceBtn} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`}
                            onClick={() => handleSelect(item)}
                            disabled={selectedId !== null}
                        >
                            <span className={styles.emoji}>{item.emoji}</span>
                            <span className={styles.label}>{item.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Custom text input */}
            <div className={styles.inputSection}>
                {!showInput ? (
                    <button
                        className={styles.showInputBtn}
                        onClick={() => setShowInput(true)}
                    >
                        ✏️ Hoặc nhập câu hỏi khác...
                    </button>
                ) : (
                    <div className={styles.inputRow}>
                        <textarea
                            className={styles.input}
                            placeholder="Nhập câu hỏi của bạn..."
                            value={customText}
                            onChange={(e) => setCustomText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={2}
                            autoFocus
                        />
                        <button
                            className={styles.sendBtn}
                            onClick={() => void handleSendCustom()}
                            disabled={!customText.trim()}
                        >
                            ✈
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FaqMenuCard;
