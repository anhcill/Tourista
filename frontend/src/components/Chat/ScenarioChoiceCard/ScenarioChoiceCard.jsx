import React, { useState } from 'react';
import styles from './ScenarioChoiceCard.module.css';

const ScenarioChoiceCard = ({ metadata, onChoice }) => {
    const [selectedId, setSelectedId] = useState(null);

    // metadata là 1 JSON string từ backend
    let data;
    try {
        data = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    } catch (e) {
        console.error("Lỗi parse ScenarioChoiceCard metadata:", e);
        return null;
    }

    if (!data || !data.choices) return null;

    const handleSelect = (choice) => {
        if (selectedId) return; // Chỉ cho chọn 1 lần
        setSelectedId(choice.id);
        if (onChoice) {
            onChoice(choice.payload);
        }
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
