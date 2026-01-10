'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import Bubble from './Bubble';
import { MAIN_MENU } from '@/constants/navigation';
import { getBubbleNumberForIndex } from '@/constants/colors';
import styles from './Navigation.module.css';

export default function Navigation() {
    const t = useTranslations();
    const [activeMenu, setActiveMenu] = useState<number | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState(false);

    const handleMainBubbleClick = (index: number) => {
        const menuItem = MAIN_MENU[index];

        // Do nothing for disabled menu entries
        if (menuItem.disabled) {
            return;
        }

        // If it has a direct href (like Contact), close mobile menu and navigate
        if (menuItem.href) {
            setMobileMenuOpen(false);
            return;
        }

        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

        // On mobile, show submenu in separate panel
        if (isMobile) {
            setActiveMenu(index);
            setMobileSubmenuOpen(true);
        } else {
            // Desktop: Toggle submenu
            const newActiveMenu = activeMenu === index ? null : index;
            setActiveMenu(newActiveMenu);
        }
    };

    const handleMobileBack = () => {
        setMobileSubmenuOpen(false);
        setActiveMenu(null);
        // Keep the mobile menu open when going back to main menu
        setMobileMenuOpen(true);
    };

    // Close mobile menu and desktop submenus when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const menuPanel = document.querySelector(`.${styles.mainBubbles}`);
            const hamburger = document.querySelector(`.${styles.mobileMenuToggle}`);

            // Close mobile menu when clicking outside
            if (mobileMenuOpen) {
                if (
                    menuPanel &&
                    hamburger &&
                    !menuPanel.contains(target) &&
                    !hamburger.contains(target)
                ) {
                    setMobileMenuOpen(false);
                }
            }

            // Close desktop submenu when clicking outside
            if (activeMenu !== null && !mobileMenuOpen) {
                const submenuCard = document.querySelector(`.${styles.submenuCard}`);

                if (
                    menuPanel &&
                    !menuPanel.contains(target) &&
                    (!submenuCard || !submenuCard.contains(target))
                ) {
                    setActiveMenu(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [mobileMenuOpen, activeMenu]);

    return (
        <nav className={styles.navigation}>
            {/* Hamburger Menu Button - Mobile Only */}
            <div className={styles.mobileMenuToggle}>
                <Bubble
                    label=""
                    size={50}
                    bubbleNumber={1}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    isActive={mobileMenuOpen}
                    animationVariant={1}
                >
                    <div className={styles.hamburgerIcon}>
                        <span
                            className={`${styles.hamburgerLine} ${mobileMenuOpen ? styles.hamburgerOpen : ''}`}></span>
                        <span
                            className={`${styles.hamburgerLine} ${mobileMenuOpen ? styles.hamburgerOpen : ''}`}></span>
                        <span
                            className={`${styles.hamburgerLine} ${mobileMenuOpen ? styles.hamburgerOpen : ''}`}></span>
                    </div>
                </Bubble>
            </div>

            {/* Main Menu Panel */}
            <div
                className={`${styles.mainBubbles} ${mobileMenuOpen && !mobileSubmenuOpen ? styles.mobileMenuOpen : ''}`}>
                {MAIN_MENU.map((item, index) => {
                    const bubbleNumber = getBubbleNumberForIndex(index);
                    const hasSubmenu = !!(item.submenu && item.submenu.length > 0);
                    const isActive = activeMenu === index;
                    const mainBubbleVariant = ((index * 3 + 1) % 15) + 1;
                    const isDisabled = !!item.disabled;

                    return (
                        <div key={index} className={styles.menuItem}>
                            {item.href ? (
                                <Link href={item.href} style={{ textDecoration: 'none' }}>
                                    <Bubble
                                        label={t(item.labelKey)}
                                        size={40}
                                        bubbleNumber={bubbleNumber}
                                        isActive={isActive}
                                        animationVariant={mainBubbleVariant}
                                        className={isDisabled ? styles.disabledBubble : ''}
                                        interactive={!isDisabled}
                                    />
                                </Link>
                            ) : (
                                <Bubble
                                    label={t(item.labelKey)}
                                    size={40}
                                    bubbleNumber={bubbleNumber}
                                    onClick={isDisabled ? undefined : () => handleMainBubbleClick(index)}
                                    isActive={isActive}
                                    animationVariant={mainBubbleVariant}
                                    className={isDisabled ? styles.disabledBubble : ''}
                                    interactive={!isDisabled}
                                />
                            )}

                            {/* Desktop Submenu (shown inline) */}
                            {hasSubmenu && !isDisabled && isActive && item.submenu && (
                                <div className={`${styles.submenuCard} ${styles.desktopOnly}`}>
                                    <div className={styles.submenu}>
                                        {item.submenu.map((subItem, subIndex) => {
                                            const subBubbleNumber = getBubbleNumberForIndex(index + subIndex + 1);
                                            const isLeftAligned = subIndex % 2 === 0;
                                            const submenuBubbleVariant = ((index * 5 + subIndex * 3 + 5) % 15) + 1;

                                            return (
                                                <Link
                                                    key={subIndex}
                                                    href={subItem.href}
                                                    style={{ textDecoration: 'none' }}
                                                    onClick={() => {
                                                        setActiveMenu(null);
                                                    }}
                                                >
                                                    <div
                                                        className={`${styles.submenuItem} ${
                                                            isLeftAligned ? styles.leftAligned : styles.rightAligned
                                                        }`}
                                                        style={{
                                                            animationDelay: `${subIndex * 50}ms`
                                                        }}
                                                    >
                                                        <Bubble
                                                            label={t(subItem.labelKey)}
                                                            size={34}
                                                            bubbleNumber={subBubbleNumber}
                                                            animationVariant={submenuBubbleVariant}
                                                        />
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Mobile Submenu Panel (separate slide-in panel) */}
            {activeMenu !== null && MAIN_MENU[activeMenu].submenu && (
                <div className={`${styles.mobileSubmenuPanel} ${mobileSubmenuOpen ? styles.mobileSubmenuOpen : ''}`}>
                    {/* Back Button */}
                    <div className={styles.mobileBackButton}>
                        <Bubble
                            label={t('navigation.back')}
                            size={40}
                            bubbleNumber={6}
                            onClick={handleMobileBack}
                            animationVariant={1}
                        >
                            <span className={styles.backArrow}>←</span>
                        </Bubble>
                    </div>

                    {/* Submenu Items */}
                    <div className={styles.mobileSubmenuItems}>
                        {MAIN_MENU[activeMenu].submenu?.map((subItem, subIndex) => {
                            const subBubbleNumber = getBubbleNumberForIndex(activeMenu + subIndex + 1);
                            const submenuBubbleVariant = ((activeMenu * 5 + subIndex * 3 + 5) % 15) + 1;

                            return (
                                <Link
                                    key={subIndex}
                                    href={subItem.href}
                                    style={{ textDecoration: 'none' }}
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        setMobileSubmenuOpen(false);
                                        setActiveMenu(null);
                                    }}
                                >
                                    <div
                                        className={styles.mobileSubmenuItem}
                                        style={{
                                            animationDelay: `${subIndex * 50 + 100}ms`
                                        }}
                                    >
                                        <Bubble
                                            label={t(subItem.labelKey)}
                                            size={40}
                                            bubbleNumber={subBubbleNumber}
                                            animationVariant={submenuBubbleVariant}
                                        />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </nav>
    );
}
