'use client';

import { useTranslations } from 'next-intl';

export default function Page() {
    const t = useTranslations('pages.travelinformation');
    return (
        <div className="page-container">
            <h1 className="page-title">{t('title')}</h1>
        </div>
    );
}

