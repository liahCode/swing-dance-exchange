'use client';

import React from 'react';
import { getBubbleImage } from '@/constants/colors';
import styles from './Bubble.module.css';

interface BubbleProps {
  label?: string;
  size?: number;
  bubbleNumber: number; // 1-12, which bubble PNG to use
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
  interactive?: boolean;
  animationVariant?: number; // 1-15, determines which float animation to use
  children?: React.ReactNode; // For custom content like hamburger icon
}

export default function Bubble({
  label,
  size = 40,
  bubbleNumber,
  onClick,
  isActive = false,
  className = '',
  interactive = true,
  animationVariant,
  children,
}: BubbleProps) {
  // Generate animation variant class name if provided
  // If className contains 'hero', use heroVariant, otherwise use variant
  const isHero = className.includes('hero');
  const variantClass = animationVariant
    ? (isHero ? styles[`heroVariant${animationVariant}`] : styles[`variant${animationVariant}`])
    : '';
  const bubbleImage = getBubbleImage(bubbleNumber);

  return (
    <div
      className={`${styles.bubbleWrapper} ${className} ${variantClass}`}
      onClick={onClick}
      style={{ cursor: interactive ? 'pointer' : 'default' }}
    >
      <div
        className={`${styles.bubble} ${isActive ? styles.active : ''}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={`/bubbles/${bubbleImage}`}
          alt=""
          className={styles.bubbleImage}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
          }}
        />
        {children && <div className={styles.bubbleContent}>{children}</div>}
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}

