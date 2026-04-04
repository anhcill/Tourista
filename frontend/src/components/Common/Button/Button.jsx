'use client';

import React from 'react';
import classNames from 'classnames';
import styles from './Button.module.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    loading = false,
    icon = null,
    iconPosition = 'left',
    onClick,
    type = 'button',
    className,
    ...props
}) => {
    const buttonClass = classNames(
        styles.button,
        styles[variant],
        styles[size],
        {
            [styles.fullWidth]: fullWidth,
            [styles.disabled]: disabled || loading,
            [styles.loading]: loading,
            [styles.iconOnly]: !children && icon,
        },
        className
    );

    return (
        <button
            type={type}
            className={buttonClass}
            onClick={onClick}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <span className={styles.spinner}>
                    <svg className={styles.spinnerIcon} viewBox="0 0 24 24">
                        <circle
                            className={styles.spinnerCircle}
                            cx="12"
                            cy="12"
                            r="10"
                            fill="none"
                            strokeWidth="3"
                        />
                    </svg>
                </span>
            )}

            {!loading && icon && iconPosition === 'left' && (
                <span className={styles.icon}>{icon}</span>
            )}

            {children && <span className={styles.text}>{children}</span>}

            {!loading && icon && iconPosition === 'right' && (
                <span className={styles.icon}>{icon}</span>
            )}
        </button>
    );
};

export default Button;
