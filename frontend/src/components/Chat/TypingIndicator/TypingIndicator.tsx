'use client';

import React from 'react';
import styles from './TypingIndicator.module.css';

interface TypingIndicatorProps {
  text?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ text = 'Tourista đang nhập...' }) => {
  return (
    <div className={`${styles.container} ${text ? styles.withText : ''}`}>
      <div className={styles.dot} />
      <div className={styles.dot} />
      <div className={styles.dot} />
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
};

export default TypingIndicator;
