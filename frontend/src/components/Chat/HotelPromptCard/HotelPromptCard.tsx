import React, { useState } from 'react';
import type { HotelPromptMetadata, HotelPromptChoice } from '../../../types/chat';
import styles from './HotelPromptCard.module.css';

interface HotelPromptCardProps {
    metadata: string | null | undefined;
    onChoice: (payload: string) => void;
}

const HotelPromptCard = ({ metadata, onChoice }: HotelPromptCardProps) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const data: HotelPromptMetadata | null = React.useMemo(() => {
        if (!metadata) return null;
        try {
            return typeof metadata === 'string' 
                ? (JSON.parse(metadata) as HotelPromptMetadata) 
                : (metadata as HotelPromptMetadata);
        } catch {
            console.error('Loi parse HotelPromptCard metadata:', metadata);
            return null;
        }
    }, [metadata]);

    if (!data || !data.choices || data.choices.length === 0) return null;

    const handleSelect = (choice: HotelPromptChoice) => {
        if (selectedId !== null) return;
        setSelectedId(choice.id);
        onChoice(choice.payload);
    };

    return (
        <div className={styles.cardContainer}>
            <div className={styles.header}>
                <div className={styles.question}>{data.question}</div>
                {data.subtitle && <div className={styles.subtitle}>{data.subtitle}</div>}
            </div>

            <div className={styles.grid}>
                {data.choices.map((choice) => {
                    const isSelected = selectedId === choice.id;
                    const isDisabled = selectedId !== null && !isSelected;

                    return (
                        <button
                            key={choice.id}
                            className={`${styles.choiceBtn} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`}
                            onClick={() => handleSelect(choice)}
                            disabled={selectedId !== null}
                        >
                            <span className={styles.emoji}>{choice.emoji}</span>
                            <span className={styles.label}>{choice.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default HotelPromptCard;
