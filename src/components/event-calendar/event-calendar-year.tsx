'use client';

import { useMemo, useCallback } from 'react';
import {
  eachMonthOfInterval,
  endOfYear,
  format,
  getMonth,
  startOfYear,
} from 'date-fns';
import { useEventCalendarStore } from '@/hooks/use-event';
import { useShallow } from 'zustand/shallow';
import { CalendarViewType, Events } from '@/types/event';
import { MonthCard } from './ui/month-card';
import { parseAsIsoDate, useQueryState } from 'nuqs';
import { groupEventsByDayInRange } from '@/lib/event';

interface CalendarYearProps {
  events: Events[];
  currentDate: Date;
}

export function EventCalendarYear({ events, currentDate }: CalendarYearProps) {
  const {
    openQuickAddDialog,
    openEventDialog,
    openDayEventsDialog,
    setView,
    viewSettings,
    firstDayOfWeek,
  } = useEventCalendarStore(
    useShallow((state) => ({
      openQuickAddDialog: state.openQuickAddDialog,
      openEventDialog: state.openEventDialog,
      openDayEventsDialog: state.openDayEventsDialog,
      setView: state.setView,
      viewSettings: state.viewSettings.year,
      firstDayOfWeek: state.firstDayOfWeek,
    })),
  );

  const [, setDate] = useQueryState(
    'date',
    parseAsIsoDate.withDefault(new Date()).withOptions({
      shallow: false,
    }),
  );

  const monthsInYear = useMemo(() => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    return eachMonthOfInterval({ start: yearStart, end: yearEnd });
  }, [currentDate]);

  // Group events per calendar day across the whole year, expanding
  // multi-day events into per-day occurrences so a Jul 17 → Jul 20 event
  // surfaces in all four month cards its days fall in, not just the start
  // month. The month count tally below also benefits: a 30-day event
  // contributes to every month it touches, not just the start month.
  const { eventsByDate, eventCountByMonth } = useMemo(() => {
    const groupedEvents: Record<string, Events[]> = {};
    const counts = new Array(12).fill(0);

    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const expanded = groupEventsByDayInRange(events, yearStart, yearEnd);

    for (const [dateKey, list] of Object.entries(expanded)) {
      const [, mm] = dateKey.split('-');
      const monthIndex = Number(mm) - 1; // 0-based

      // Each occurrence is the underlying event identity, not a per-day
      // clone. Day cells in MonthCard only need the title/color/etc., so
      // dropping the extra `_instanceDate` flag is fine here.
      groupedEvents[dateKey] = list as unknown as Events[];

      // Bump the month counter for each occurrence so a multi-day event
      // running across months contributes to each one.
      counts[monthIndex] += 1;
    }

    return { eventsByDate: groupedEvents, eventCountByMonth: counts };
  }, [events, currentDate]);

  const handleMonthClick = useCallback(
    (month: Date) => {
      setView(CalendarViewType.MONTH);
      const newDate = new Date(
        month.getFullYear(),
        month.getMonth(),
        currentDate.getDate(),
      );
      setDate(newDate);
    },
    [setDate, setView, currentDate],
  );

  const handleDateClick = useCallback(
    (date: Date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const eventsOnDate = eventsByDate[dateKey] || [];
      if (eventsOnDate.length > 0) {
        openDayEventsDialog(date, eventsOnDate);
      } else {
        openQuickAddDialog({ date });
      }
    },
    [eventsByDate, openDayEventsDialog, openQuickAddDialog],
  );

  const handleQuickAdd = useCallback(
    (date: Date) => openQuickAddDialog({ date }),
    [openQuickAddDialog],
  );

  return (
    <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {monthsInYear.map((month) => (
        <MonthCard
          key={getMonth(month)}
          month={month}
          eventsByDate={eventsByDate}
          eventCount={eventCountByMonth[getMonth(month)]}
          yearViewConfig={viewSettings}
          firstDayOfWeek={firstDayOfWeek}
          onMonthClick={handleMonthClick}
          onEventClick={openEventDialog}
          onDateClick={handleDateClick}
          onQuickAdd={handleQuickAdd}
        />
      ))}
    </div>
  );
}
