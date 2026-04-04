'use client';

import React, { useState } from 'react';
import classNames from 'classnames';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import styles from './Rating.module.css';

const Rating = ({
    value = 0,
    max = 5,
    size = 'md',
    readonly = false,
    showValue = false,
    onChange,
    className,
}) => {
    const [hoverValue, setHoverValue] = useState(null);

    const handleClick = (rating) => {
        if (!readonly && onChange) {
            onChange(rating);
        }
    };

    const handleMouseEnter = (rating) => {
        if (!readonly) {
            setHoverValue(rating);
        }
    };

    const handleMouseLeave = () => {
        if (!readonly) {
            setHoverValue(null);
        }
    };

    const renderStar = (index) => {
        const rating = index + 1;
        const currentValue = hoverValue !== null ? hoverValue : value;

        let StarIcon;
        if (currentValue >= rating) {
            StarIcon = FaStar;
        } else if (currentValue >= rating - 0.5) {
            StarIcon = FaStarHalfAlt;
        } else {
            StarIcon = FaRegStar;
        }

        return (
            <span
                key={index}
                className={classNames(styles.star, {
                    [styles.filled]: currentValue >= rating,
                    [styles.half]: currentValue >= rating - 0.5 && currentValue < rating,
                    [styles.interactive]: !readonly,
                })}
                onClick={() => handleClick(rating)}
                onMouseEnter={() => handleMouseEnter(rating)}
                onMouseLeave={handleMouseLeave}
            >
                <StarIcon />
            </span>
        );
    };

    return (
        <div className={classNames(styles.rating, styles[size], className)}>
            <div className={styles.stars}>
                {Array.from({ length: max }, (_, index) => renderStar(index))}
            </div>
            {showValue && (
                <span className={styles.value}>
                    {value.toFixed(1)} / {max}
                </span>
            )}
        </div>
    );
};

export default Rating;
