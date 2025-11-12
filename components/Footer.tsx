'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import styles from './Footer.module.css';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <Link href="/privacy" className={styles.footerLink}>
          {t('privacy')}
        </Link>
        <span className={styles.separator}>•</span>
        <Link href="/impressum" className={styles.footerLink}>
          {t('impressum')}
        </Link>
      </div>
    </footer>
  );
}
