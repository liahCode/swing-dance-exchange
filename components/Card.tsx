'use client';

import React, { useState } from 'react';
import styles from './Card.module.css';
import GridSmall from './GridSmall';

interface CardEvent {
    startTime: string; // Format: "HH:MM"
    endTime: string; // Format: "HH:MM"
    column: number; // Column position (0 or 1 for multi-column layout)
    eventName: string;
    color: string; // CSS class name for the color
}

interface CardProps {
    day: 'Friday' | 'Saturday' | 'Sunday';
    events: CardEvent[];
}

export default function Card({ day, events }: CardProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const toggleCollapse = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={styles.dayCard}>
            <div className={styles.dayHeader} onClick={toggleCollapse}>
                {day}
            </div>
            {isExpanded && (
                <div className={styles.dayContent}>
                    <GridSmall events={events} />
                </div>
            )}
        </div>
    );
}

