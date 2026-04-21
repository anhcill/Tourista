'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';
import styles from './HotelPageSearch.module.css';

export default function HotelPageSearch() {
    const router = useRouter();
    const [query, setQuery] = useState('');

    const handleSearch = () => {
        const dest = query.trim();
        if (!dest) return;
        router.push(`/hotels/search?destination=${encodeURIComponent(dest)}`);
    };

    return (
        <div className={styles.wrap}>
            <div className={styles.inner}>
                <FaSearch className={styles.icon} />
                <input
                    type="text"
                    className={styles.input}
                    placeholder="Tìm kiếm khách sạn theo tên, khu vực, điểm đến..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className={styles.btn} onClick={handleSearch}>
                    Tìm kiếm
                </button>
            </div>
        </div>
    );
}
