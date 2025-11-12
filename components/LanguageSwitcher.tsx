'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useState } from 'react';
import styles from './LanguageSwitcher.module.css';

export default function LanguageSwitcher() {
  const t = useTranslations('languageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const switchLanguage = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
  };

  return (
    <div className={styles.languageSwitcher}>
      <button
        className={styles.currentLanguage}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('label')}
      >
        {locale.toUpperCase()}
      </button>

      {isOpen && (
        <div className={styles.languageMenu}>
          <button
            className={`${styles.languageOption} ${locale === 'en' ? styles.active : ''}`}
            onClick={() => switchLanguage('en')}
          >
            EN - {t('english')}
          </button>
          <button
            className={`${styles.languageOption} ${locale === 'de' ? styles.active : ''}`}
            onClick={() => switchLanguage('de')}
          >
            DE - {t('german')}
          </button>
        </div>
      )}
    </div>
  );
}
