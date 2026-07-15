'use client';

import { useEffect, useRef, useState } from 'react';
import { EventCalendarDay } from './event-calendar-day';
import { Events } from '@/types/event';
import { cn } from '@/lib/utils';

interface CalendarDayWithScrollProps {
  events: Events[];
  currentDate: Date;
  className?: string;
}

export function CalendarDayWithScroll({
  events,
  currentDate,
  className,
}: CalendarDayWithScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    if (hasScrolled) return;

    const timer = setTimeout(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const hourHeight = 64;
      const currentTimePosition =
        currentHour * hourHeight + (currentMinute / 60) * hourHeight;

      // Find the ScrollArea viewport *within this component's subtree*
      // so we don't grab an unrelated ScrollArea elsewhere on the page.
      const scrollViewport = containerRef.current?.querySelector(
        '[data-slot="scroll-area-viewport"]',
      ) as HTMLElement | null;

      if (!scrollViewport) return;

      // Measure the actual visible viewport height instead of hardcoding
      const viewportHeight = scrollViewport.clientHeight;
      const scrollPosition = Math.max(
        0,
        currentTimePosition - viewportHeight / 2,
      );

      scrollViewport.scrollTop = scrollPosition;
      setHasScrolled(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [hasScrolled]);

  return (
    <div ref={containerRef} className={cn('h-full w-full', className)}>
      <EventCalendarDay
        events={events}
        currentDate={currentDate}
        className="h-full"
      />
    </div>
  );
}
