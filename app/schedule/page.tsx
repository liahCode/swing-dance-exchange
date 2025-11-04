import Grid, { Event } from '@/components/Grid';
import Card from '@/components/Card';
import styles from './schedule.module.css';

export const metadata: { title: string } = {
    title: 'Schedule'
};

// Event definitions using Map with day as key
const eventsByDay = new Map<'Friday' | 'Saturday' | 'Sunday', Event[]>([
    ['Friday', [
        { startTime: '10:00', endTime: '19:00', column: 0, eventName: 'Aufbau', color: 'eventAufbau' },
        { startTime: '18:00', endTime: '20:00', column: 0, eventName: 'SWIMMING', color: 'eventSwimming' },
    ]],
    ['Saturday', [
        { startTime: '10:00', endTime: '12:00', column: 0, eventName: 'Switch Taster', color: 'eventWorkshop' },
        { startTime: '10:00', endTime: '12:00', column: 1, eventName: 'Café Crawl\n(mit talk)', color: 'eventSocial' },
        { startTime: '12:00', endTime: '14:00', column: 0, eventName: 'Drag Workshop', color: 'eventWorkshop' },
        { startTime: '12:00', endTime: '14:00', column: 1, eventName: 'Switch Masterclass', color: 'eventTour' },
        { startTime: '14:00', endTime: '18:00', column: 0, eventName: 'Pride', color: 'eventPride' },
        { startTime: '14:00', endTime: '16:00', column: 1, eventName: 'ZH Tour\n(Queer)', color: 'eventTour' },
        { startTime: '16:00', endTime: '18:00', column: 1, eventName: '(maybe quiet zone at Regenbogenhaus)', color: 'eventQuiet' },
        { startTime: '19:00', endTime: '20:00', column: 0, eventName: 'Check-In', color: 'eventCheckin' },
        { startTime: '20:00', endTime: '21:00', column: 0, eventName: 'Crash-Kurs for non-dancers', color: 'eventCrash' },
        { startTime: '20:00', endTime: '21:00', column: 1, eventName: 'Choreo Workshop', color: 'eventWorkshop' },
        { startTime: '21:00', endTime: '00:00', column: 0, eventName: 'Party\n(Topic 1)', color: 'eventParty' },
    ]],
    ['Sunday', [
        { startTime: '10:00', endTime: '12:00', column: 0, eventName: 'Drag Brunch', color: 'eventBrunch' },
        { startTime: '12:00', endTime: '14:00', column: 0, eventName: 'ZH Tour\n(Queer)', color: 'eventTour' },
        { startTime: '12:00', endTime: '17:00', column: 1, eventName: '(maybe quiet zone somewhere)', color: 'eventQuiet' },
        { startTime: '14:00', endTime: '17:00', column: 0, eventName: 'ZH Tour\n(Swing Scene) (with dancing stops?)', color: 'eventTour' },
        { startTime: '17:00', endTime: '22:00', column: 0, eventName: 'Party\n(Topic 3)', color: 'eventParty' },
        { startTime: '20:00', endTime: '21:00', column: 0, eventName: 'something fun :)', color: 'eventSocial' },
        { startTime: '21:00', endTime: '00:00', column: 0, eventName: 'Party\n(Topic 2)', color: 'eventParty' },
        { startTime: '22:00', endTime: '00:00', column: 0, eventName: 'Afterparty\n(Ask a Queer for hosting on Sunday evening)', color: 'eventAfterparty' },
    ]],
]);

export default async function Page() {
    return (
        <div className={styles.schedulePage}>
            <h1 className="page-title">Schedule</h1>

            {/* Desktop Grid View */}
            <div className={styles.desktopView}>
                <Grid eventsByDay={eventsByDay} />
            </div>

            {/* Mobile Card View */}
            <div className={styles.mobileView}>
                {Array.from(eventsByDay.entries()).map(([day, dayEvents]) => (
                    <Card
                        key={day}
                        day={day}
                        events={dayEvents}
                    />
                ))}
            </div>
        </div>
    );
}
