import React, { useState } from 'react';
import type { ScenarioChoiceMetadata, ScenarioChoice } from '../../../types/chat';
import styles from './ScenarioChoiceCard.module.css';

interface ScenarioChoiceCardProps {
    metadata: string | null | undefined;
    onChoice: (payload: string) => void;
}

const ScenarioChoiceCard = ({ metadata, onChoice }: ScenarioChoiceCardProps) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const data: ScenarioChoiceMetadata | null = React.useMemo(() => {
        if (!metadata) return null;
        try {
            return typeof metadata === 'string' ? (JSON.parse(metadata) as ScenarioChoiceMetadata) : (metadata as ScenarioChoiceMetadata);
        } catch {
            console.error('Loi parse ScenarioChoiceCard metadata:', metadata);
            return null;
        }
    }, [metadata]);

    if (!data || !data.choices || data.choices.length === 0) return null;

    const handleSelect = (choice: ScenarioChoice) => {
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

export default ScenarioChoiceCard;
