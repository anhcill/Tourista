'use client';

import React from 'react';
import classNames from 'classnames';
import styles from './Loading.module.css';

const Loading = ({
    size = 'md',
    variant = 'spinner',
    fullScreen = false,
    text = null,
    className
}) => {
    if (fullScreen) {
        return (
            <div className={styles.fullScreen}>
                <div className={styles.content}>
                    <LoadingSpinner size={size} variant={variant} />
                    {text && <p className={styles.text}>{text}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className={classNames(styles.loading, className)}>
            <LoadingSpinner size={size} variant={variant} />
            {text && <p className={styles.text}>{text}</p>}
        </div>
    );
};

const LoadingSpinner = ({ size, variant }) => {
    if (variant === 'dots') {
        return (
            <div className={classNames(styles.dots, styles[size])}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
            </div>
        );
    }

    if (variant === 'pulse') {
        return (
            <div className={classNames(styles.pulse, styles[size])}></div>
        );
    }

    // Default: spinner
    return (
        <div className={classNames(styles.spinner, styles[size])}>
            <svg viewBox="0 0 50 50">
                <circle
                    className={styles.circle}
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    strokeWidth="4"
                />
            </svg>
        </div>
    );
};

export default Loading;
