'use client';

import { useEffect, useState } from 'react';
import { EventCalendarDay } from './event-calendar-day';
import { Events } from '@/types/event';

interface CalendarDayWithScrollProps {
  events: Events[];
  currentDate: Date;
}

export function CalendarDayWithScroll({
  events,
  currentDate,
}: CalendarDayWithScrollProps) {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    // Only scroll once when component mounts
    if (hasScrolled) return;

    // Small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      // Get current time
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Calculate scroll position based on time
      // Each hour is 64px high, so current time position is:
      // (currentHour * 64) + (currentMinute / 60 * 64)
      const hourHeight = 64;
      const currentTimePosition =
        currentHour * hourHeight + (currentMinute / 60) * hourHeight;

      // Scroll to show current time in the middle of the viewport
      // Subtract half the viewport height to center the current time
      const viewportHeight = 400; // Approximate height of the calendar container
      const scrollPosition = Math.max(
        0,
        currentTimePosition - viewportHeight / 2,
      );

      // Find the ScrollArea viewport and scroll to position
      const scrollViewport = document.querySelector(
        '[data-slot="scroll-area-viewport"]',
      );
      if (scrollViewport) {
        (scrollViewport as HTMLElement).scrollTop = scrollPosition;
        setHasScrolled(true);
      }
    }, 100); // Small delay to ensure rendering is complete

    return () => clearTimeout(timer);
  }, [hasScrolled]);

  return <EventCalendarDay events={events} currentDate={currentDate} />;
}
