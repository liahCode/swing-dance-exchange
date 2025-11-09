'use client';

import React from 'react';
import styles from './Grid.module.css';

interface Event {
    startTime: string; // Format: "HH:MM"
    endTime: string; // Format: "HH:MM"
    column: number; // Column position (0 or 1 for multi-column layout)
    eventName: string;
    color: string; // CSS class name for the color
}

interface GridProps {
    eventsByDay: Map<'Friday' | 'Saturday' | 'Sunday', Event[]>;
}

// Time slots (hourly intervals from 10:00 to 00:00)
const timeSlots = [
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

// Helper to convert time string to row index
const timeToRowIndex = (time: string): number => {
    return timeSlots.findIndex(slot => slot.start === time);
};

// Helper to calculate row span
const calculateRowSpan = (startTime: string, endTime: string): number => {
    const startIndex = timeToRowIndex(startTime);
    const endIndex = timeToRowIndex(endTime);
    if (endIndex === -1) {
        // If endTime is "00:00", it's the end of the last slot
        return timeSlots.length - startIndex;
    }
    return endIndex - startIndex;
};

export default function Grid({ eventsByDay }: GridProps) {
    // Get the days from the Map keys
    const days = Array.from(eventsByDay.keys());

    // Group events by day and column for processing
    const eventsByDayAndColumn: { [key: string]: Array<Event & { startRow: number; rowSpan: number }> } = {};

    // Initialize for each day and column combination
    days.forEach(day => {
        eventsByDayAndColumn[`${day}-0`] = [];
        eventsByDayAndColumn[`${day}-1`] = [];
    });

    // Process events and calculate their grid positions
    eventsByDay.forEach((events, day) => {
        events.forEach(event => {
            const startRow = timeToRowIndex(event.startTime);
            const rowSpan = calculateRowSpan(event.startTime, event.endTime);

            if (startRow !== -1 && rowSpan > 0) {
                const key = `${day}-${event.column}`;
                eventsByDayAndColumn[key].push({
                    ...event,
                    startRow,
                    rowSpan,
                });
            }
        });
    });

    // Create a grid to track which cells are occupied (day-column-row)
    const grid: { [key: string]: boolean } = {};

    // Helper function to mark cells as occupied
    const markOccupied = (day: string, column: number, row: number, rowSpan: number) => {
        for (let i = 0; i < rowSpan; i++) {
            grid[`${day}-${column}-${row + i}`] = true;
        }
    };

    // Helper function to check if a cell is occupied
    const isOccupied = (day: string, column: number, row: number) => {
        return grid[`${day}-${column}-${row}`] || false;
    };

    return (
        <div className={styles.scheduleTableWrapper}>
            <table className={styles.scheduleTable}>
                <thead>
                    <tr>
                        <th>Time</th>
                        {days.map(day => (
                            <th key={day} colSpan={2}>{day}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {timeSlots.map((slot, rowIndex) => {
                        // Track which events to render in this row for each day and column
                        const rowEvents: { [key: string]: any[] } = {};

                        // Initialize for each day and column
                        days.forEach(day => {
                            rowEvents[`${day}-0`] = [];
                            rowEvents[`${day}-1`] = [];
                        });

                        // Find events that start at this row for each day and column
                        days.forEach(day => {
                            [0, 1].forEach(col => {
                                const key = `${day}-${col}`;
                                eventsByDayAndColumn[key].forEach(event => {
                                    if (event.startRow === rowIndex) {
                                        rowEvents[key].push(event);
                                        // Mark cells as occupied
                                        markOccupied(day, col, event.startRow, event.rowSpan);
                                    }
                                });
                            });
                        });

                        return (
                            <tr key={rowIndex}>
                                <td>{slot.start}</td>

                                {days.map(day => {
                                    // Render both columns for each day
                                    const cells: React.ReactElement[] = [];

                                    [0, 1].forEach(col => {
                                        const key = `${day}-${col}`;

                                        // If cell is occupied by a previous rowspan, skip it (don't add to cells array)
                                        if (isOccupied(day, col, rowIndex) && rowEvents[key].length === 0) {
                                            return;
                                        }

                                        // If there are events starting in this row, render them
                                        if (rowEvents[key].length > 0) {
                                            rowEvents[key].forEach((event, idx) => {
                                                cells.push(
                                                    <td
                                                        key={`${key}-${idx}`}
                                                        rowSpan={event.rowSpan}
                                                        className={`${styles.eventCell} ${styles[event.color]}`}
                                                    >
                                                        {event.eventName.split('\n').map((line: string, i: number) => (
                                                            <span key={i}>
                                                                {line}
                                                                {i < event.eventName.split('\n').length - 1 && <br />}
                                                            </span>
                                                        ))}
                                                    </td>
                                                );
                                            });
                                        } else {
                                            // Empty cell
                                            cells.push(<td key={key} className={styles.eventCell}></td>);
                                        }
                                    });

                                    return cells;
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

