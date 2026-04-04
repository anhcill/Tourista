'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import Link from 'next/link';
import { FaGlobe } from 'react-icons/fa';
import styles from './Header.module.css';

const Header = () => {
    return (
        <header className={styles.header}>
            <div className={styles.container}>
                {/* Logo Section */}
                <div className={styles.logoSection}>
                    <Link href="/" className={styles.logo}>
                        <img src="/images/logo.png" alt="EasySet24" className={styles.logoImg} />
                        <span className={styles.logoText}>EasySet 24</span>
                    </Link>
                    
                    <div className={styles.utilities}>
                        <button className={styles.utilityBtn}>
                            <FaGlobe />
                        </button>
                        <button className={styles.utilityBtn}>
                            <img src="/images/flags/uk.png" alt="English" className={styles.flagIcon} />
                        </button>
                    </div>
                </div>

                {/* Search Bar - Middle */}
                <div className={styles.searchSection}>
                    <div className={styles.searchBox}>
                        <input 
                            type="text" 
                            placeholder="Search" 
                            className={styles.searchInput}
                        />
                        <button className={styles.searchBtn}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Auth Buttons */}
                <div className={styles.authSection}>
                    <Link href="/login" className={styles.signInBtn}>
                        Sing in
                    </Link>
                    <Link href="/register" className={styles.registerBtn}>
                        Register
                    </Link>
                </div>
            </div>

            {/* Navigation Tabs */}
            <nav className={styles.navbar}>
                <div className={styles.container}>
                    <div className={styles.navTabs}>
                        <button className={styles.navTab}>Trip</button>
                        <button className={styles.navTab}>%Deals</button>
                        <button className={`${styles.navTab} ${styles.active}`}>Hotel</button>
                        <button className={styles.navTab}>Flight</button>
                        <button className={styles.navTab}>Apartment</button>
                        <button className={styles.navTab}>Camper</button>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;
