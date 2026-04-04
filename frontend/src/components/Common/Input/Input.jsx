'use client';

import React, { forwardRef } from 'react';
import classNames from 'classnames';
import styles from './Input.module.css';

const Input = forwardRef(({
    type = 'text',
    label,
    placeholder,
    value,
    onChange,
    onBlur,
    onFocus,
    error,
    helperText,
    disabled = false,
    required = false,
    fullWidth = false,
    icon = null,
    iconPosition = 'left',
    className,
    ...props
}, ref) => {
    const inputWrapperClass = classNames(
        styles.inputWrapper,
        {
            [styles.fullWidth]: fullWidth,
            [styles.hasError]: error,
            [styles.disabled]: disabled,
            [styles.hasIcon]: icon,
            [styles.iconLeft]: icon && iconPosition === 'left',
            [styles.iconRight]: icon && iconPosition === 'right',
        },
        className
    );

    return (
        <div className={inputWrapperClass}>
            {label && (
                <label className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            )}

            <div className={styles.inputContainer}>
                {icon && iconPosition === 'left' && (
                    <span className={styles.icon}>{icon}</span>
                )}

                <input
                    ref={ref}
                    type={type}
                    className={styles.input}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    onFocus={onFocus}
                    disabled={disabled}
                    required={required}
                    {...props}
                />

                {icon && iconPosition === 'right' && (
                    <span className={styles.icon}>{icon}</span>
                )}
            </div>

            {(error || helperText) && (
                <span className={classNames(styles.helperText, { [styles.errorText]: error })}>
                    {error || helperText}
                </span>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
