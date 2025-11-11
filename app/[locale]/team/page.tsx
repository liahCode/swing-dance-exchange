'use client';

import { useTranslations } from 'next-intl';

export default function Page() {
    const t = useTranslations('pages.team');
    return (
        <div className="page-container">
            <h1 className="page-title">{t('title')}</h1>
        </div>
    );
}
