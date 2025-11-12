'use client';

import { useTranslations } from 'next-intl';

export default function Page() {
    const t = useTranslations('pages.schedule');

    return (
        <div className="schedule-page">
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
                    <li>{t('planningNotes.note3')}</li>
                    <li>{t('planningNotes.note4')}</li>
                </ul>
            </div>

            <div className="schedule-table-wrapper">
                <table className="schedule-table">
                    <thead>
                    <tr>
                        <th>{t('table.headers.start')}</th>
                        <th>{t('table.headers.end')}</th>
                        <th colSpan={2}>{t('table.headers.friday')}</th>
                        <th colSpan={2}>{t('table.headers.saturday')}</th>
                        <th colSpan={2}>{t('table.headers.sunday')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>10:00</td>
                        <td>11:00</td>
                        <td rowSpan={9} colSpan={2} className="event-cell event-aufbau">{t('table.events.aufbau')}</td>
                        <td rowSpan={2} className="event-cell event-workshop">{t('table.events.switchTaster')}</td>
                        <td rowSpan={2} className="event-cell event-social">{t('table.events.cafeCrawl')}</td>
                        <td rowSpan={2} className="event-cell event-brunch">{t('table.events.dragBrunch')}</td>
                        <td rowSpan={2} className="event-cell"></td>
                    </tr>
                    <tr>
                        <td>11:00</td>
                        <td>12:00</td>
                    </tr>
                    <tr>
                        <td>12:00</td>
                        <td>13:00</td>
                        <td rowSpan={2} className="event-cell event-workshop">{t('table.events.dragWorkshop')}</td>
                        <td rowSpan={2} className="event-cell event-tour">{t('table.events.switchMasterclass')}</td>
                        <td rowSpan={2} className="event-cell event-tour">{t('table.events.zhTourQueer')}</td>
                        <td rowSpan={5} className="event-cell event-quiet">(maybe quiet zone somewhere)</td>
                    </tr>
                    <tr>
                        <td>13:00</td>
                        <td>14:00</td>
                    </tr>
                    <tr>
                        <td>14:00</td>
                        <td>15:00</td>
                        <td rowSpan={4} className="event-cell event-pride">{t('table.events.pride')}</td>
                        <td rowSpan={2} className="event-cell event-tour">{t('table.events.zhTourQueer')}</td>
                        <td rowSpan={3} className="event-cell event-tour">{t('table.events.zhTourSwing')}
                        </td>
                    </tr>
                    <tr>
                        <td>15:00</td>
                        <td>16:00</td>
                    </tr>
                    <tr>
                        <td>16:00</td>
                        <td>17:00</td>
                        <td rowSpan={2} className="event-cell event-quiet">(maybe quiet zone at Regenbogenhaus)</td>
                    </tr>
                    <tr>
                        <td>17:00</td>
                        <td>18:00</td>
                        <td rowSpan={5} colSpan={2} className="event-cell event-party">{t('table.events.partyTopic3')}</td>
                    </tr>
                    <tr>
                        <td>18:00</td>
                        <td>19:00</td>
                        <td rowSpan={2} colSpan={2} className="event-cell event-swimming">{t('table.events.swimming')}</td>
                    </tr>
                    <tr>
                        <td>19:00</td>
                        <td>20:00</td>
                        <td colSpan={2} className="event-cell event-checkin">{t('table.events.checkIn')}</td>
                    </tr>
                    <tr>
                        <td>20:00</td>
                        <td>21:00</td>
                        <td className="event-cell event-crash">{t('table.events.crashKurs')}</td>
                        <td className="event-cell event-workshop">{t('table.events.choreoWorkshop')}</td>
                        <td colSpan={2} className="event-cell event-social">{t('table.events.somethingFun')}</td>
                    </tr>
                    <tr>
                        <td>21:00</td>
                        <td>22:00</td>
                        <td rowSpan={3} colSpan={2} className="event-cell event-party">{t('table.events.partyTopic1')}</td>
                        <td rowSpan={3} colSpan={2} className="event-cell event-party">{t('table.events.partyTopic2')}</td>
                    </tr>
                    <tr>
                        <td>22:00</td>
                        <td>23:00</td>
                        <td rowSpan={2} colSpan={2} className="event-cell event-afterparty">{t('table.events.afterparty')}
                        </td>
                    </tr>
                    <tr>
                        <td>23:00</td>
                        <td>00:00</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
