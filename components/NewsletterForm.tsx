'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { subscribeToNewsletter } from '@/app/[locale]/actions/newsletter';
import styles from './NewsletterForm.module.css';

export default function NewsletterForm() {
  const t = useTranslations('newsletter');
  const [state, formAction, isPending] = useActionState(subscribeToNewsletter, null);

  return (
    <div className={styles.container}>
      {state?.success ? (
        // Success state - show confirmation message
        <div className={styles.success} role="status">
          <p className={styles.successTitle}>✓ {t('successTitle')}</p>
          <p className={styles.successMessage}>{t('successMessage')}</p>
        </div>
      ) : (
        // Default state - show form
        <form action={formAction} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              name="email"
              placeholder={t('placeholder')}
              required
              disabled={isPending}
              className={styles.input}
              aria-label={t('ariaLabel')}
              aria-invalid={state?.error ? 'true' : 'false'}
              aria-describedby={state?.error ? 'newsletter-error' : undefined}
            />
            <button
              type="submit"
              disabled={isPending}
              className={styles.button}
            >
              {isPending ? t('subscribing') : t('subscribe')}
            </button>
          </div>

          {state?.error && (
            <p id="newsletter-error" className={styles.error} role="alert">
              {state.error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
