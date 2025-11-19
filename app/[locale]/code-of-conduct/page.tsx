'use client';

import { useTranslations } from 'next-intl';
import styles from './page.module.css';

export default function Page() {
    const t = useTranslations('pages.codeOfConduct');
    const points = t.raw('points') as string[];

    return (
        <div className="page-container">
            <div className={styles.content}>
                <h1 className={styles.title}>{t('title')}</h1>
                <ul className={styles.list}>
                    {points.map((point, index) => (
                        <li key={index}>{point}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

