'use client';

import React, { useState } from 'react';
import styles from './Card.module.css';
import GridSmall from './GridSmall';
import { Event } from '@/utils/Grid.utils';

interface CardProps {
    day: 'Friday' | 'Saturday' | 'Sunday';
    events: Event[];
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

