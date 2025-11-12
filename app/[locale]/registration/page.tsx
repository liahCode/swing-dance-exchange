'use client';

import { useTranslations } from 'next-intl';

export default function FallbackPage() {
    const t = useTranslations('pages.registration');
    return (
        <div className="page-container">
            <h1 className="page-title">{t('title')}</h1>

            {/* Planning Notes - Internal */}
            <div style={{
                background: '#fff3cd',
                border: '2px solid #ffc107',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '2rem'
            }}>
                <h3 style={{ marginTop: 0, color: '#856404' }}>📝 {t('planningNotes.title')}</h3>
                <ul style={{ color: '#856404', lineHeight: '1.8' }}>
                    <li>{t('planningNotes.note1')}</li>
                    <li>{t('planningNotes.note2')}</li>
                </ul>
            </div>
        </div>
    );
}
