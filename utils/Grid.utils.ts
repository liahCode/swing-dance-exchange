export interface Event {
    startTime: string; // Format: "HH:MM"
    endTime: string; // Format: "HH:MM"
    column: number; // Column position (0 or 1 for multi-column layout)
    eventName: string;
    color: string; // CSS class name for the color
}

export interface GridSmallProps {
    events: Event[];
}

// Time slots (hourly intervals from 10:00 to 00:00)
export const timeSlots = [
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '12:00', end: '13:00' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
    { start: '17:00', end: '18:00' },
    { start: '18:00', end: '19:00' },
    { start: '19:00', end: '20:00' },
    { start: '20:00', end: '21:00' },
    { start: '21:00', end: '22:00' },
    { start: '22:00', end: '23:00' },
    { start: '23:00', end: '00:00' },
];
