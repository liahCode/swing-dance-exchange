'use client';

import React from 'react';
import styles from './GridSmall.module.css';
import { Event, GridSmallProps, timeSlots, timeToRowIndex, calculateRowSpan } from '@/utils/Grid.utils';

export default function GridSmall({ events }: GridSmallProps) {
    // Group events by column for processing
    const eventsByColumn: { [key: string]: Array<Event & { startRow: number; rowSpan: number }> } = {
        '0': [],
        '1': [],
    };

    // Process events and calculate their grid positions
    events.forEach(event => {
        const startRow = timeToRowIndex(event.startTime);
        const rowSpan = calculateRowSpan(event.startTime, event.endTime);

        if (startRow !== -1 && rowSpan > 0) {
            eventsByColumn[event.column.toString()].push({
                ...event,
                startRow,
                rowSpan,
            });
        }
    });

    // Create a grid to track which cells are occupied (column-row)
    const grid: { [key: string]: boolean } = {};

    // Helper function to mark cells as occupied
    const markOccupied = (column: number, row: number, rowSpan: number) => {
        for (let i = 0; i < rowSpan; i++) {
            grid[`${column}-${row + i}`] = true;
        }
    };

    // Helper function to check if a cell is occupied
    const isOccupied = (column: number, row: number) => {
        return grid[`${column}-${row}`] || false;
    };

    return (
        <div className={styles.scheduleTableWrapper}>
            <table className={styles.scheduleTable}>
                <colgroup>
                    <col style={{ width: '80px' }} />
                    <col style={{ width: 'calc((100% - 80px) / 2)' }} />
                    <col style={{ width: 'calc((100% - 80px) / 2)' }} />
                </colgroup>
                <tbody>
                    {timeSlots.map((slot, rowIndex) => {
                        // Track which events to render in this row for each column
                        const rowEvents: { [key: string]: any[] } = {
                            '0': [],
                            '1': [],
                        };

                        // Find events that start at this row for each column
                        [0, 1].forEach(col => {
                            const key = col.toString();
                            eventsByColumn[key].forEach(event => {
                                if (event.startRow === rowIndex) {
                                    rowEvents[key].push(event);
                                    // Mark cells as occupied
                                    markOccupied(col, event.startRow, event.rowSpan);
                                }
                            });
                        });

                        return (
                            <tr key={rowIndex}>
                                <td className={styles.timeCell}>{slot.start}</td>

                                {[0, 1].map(col => {
                                    const cells: React.ReactElement[] = [];
                                    const key = col.toString();

                                    // If cell is occupied by a previous rowspan, skip it
                                    if (isOccupied(col, rowIndex) && rowEvents[key].length === 0) {
                                        return null;
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

