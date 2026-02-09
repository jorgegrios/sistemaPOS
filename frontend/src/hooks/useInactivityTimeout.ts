/**
 * Inactivity Timeout Hook
 * Detects user inactivity and triggers callbacks for warning and timeout
 */

import { useEffect, useRef, useState } from 'react';

interface UseInactivityTimeoutOptions {
    timeoutMinutes: number;
    warningSeconds: number;
    onWarning: () => void;
    onTimeout: () => void;
}

export const useInactivityTimeout = ({
    timeoutMinutes,
    warningSeconds,
    onWarning,
    onTimeout
}: UseInactivityTimeoutOptions) => {
    const [isWarning, setIsWarning] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = () => {
        // Clear existing timers
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);
        setIsWarning(false);

        // Set warning timer (triggers before final timeout)
        warningRef.current = setTimeout(() => {
            setIsWarning(true);
            onWarning();

            // Set final timeout after warning period
            timeoutRef.current = setTimeout(() => {
                onTimeout();
            }, warningSeconds * 1000);
        }, timeoutMinutes * 60 * 1000);
    };

    useEffect(() => {
        // Events to track for user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        // Reset timer on any activity
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Start initial timer
        resetTimer();

        // Cleanup on unmount
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningRef.current) clearTimeout(warningRef.current);
        };
    }, [timeoutMinutes, warningSeconds]);

    return { isWarning, resetTimer };
};
