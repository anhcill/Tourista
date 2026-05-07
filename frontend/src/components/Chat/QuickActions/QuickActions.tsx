'use client';

import React from 'react';
import styles from './QuickActions.module.css';

export interface QuickAction {
  id: string;
  emoji: string;
  label: string;
  payload: string;
}

interface QuickActionsProps {
  actions?: QuickAction[];
  onAction?: (payload: string) => void;
  sticky?: boolean;
}

const DEFAULT_ACTIONS: QuickAction[] = [
  { id: 'tour', emoji: '🗺️', label: 'Gợi ý tour', payload: 'gợi ý tour' },
  { id: 'hotel', emoji: '🏨', label: 'Tìm khách sạn', payload: 'tìm khách sạn' },
  { id: 'hot', emoji: '🔥', label: 'Tour hot', payload: 'tour hot' },
  { id: 'lookup', emoji: '🔍', label: 'Tra cứu booking', payload: 'tra cứu booking' },
  { id: 'help', emoji: '❓', label: 'Cần hỗ trợ', payload: 'cần hỗ trợ' },
];

const QuickActions: React.FC<QuickActionsProps> = ({ 
  actions = DEFAULT_ACTIONS, 
  onAction,
  sticky = false 
}) => {
  return (
    <div className={`${styles.container} ${sticky ? styles.sticky : ''}`}>
      {actions.map((action) => (
        <button
          key={action.id}
          className={styles.actionBtn}
          onClick={() => onAction?.(action.payload)}
        >
          <span className={styles.emoji}>{action.emoji}</span>
          <span className={styles.label}>{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
