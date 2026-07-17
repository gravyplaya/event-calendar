'use client';

import { useMemo, useRef, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { useEventCalendarStore } from '@/hooks/use-event';
import { useShallow } from 'zustand/shallow';
import { DayCell } from './ui/day-cell';
import { WeekDayHeaders } from './ui/week-days-header';
import {
  getLocaleFromCode,
  groupEventsByDayInRange,
  useWeekDays,
} from '@/lib/event';
import { formatDate } from '@/lib/date';
import { Events } from '@/types/event';

const DAYS_IN_WEEK = 7;
interface CalendarMonthProps {
  events: Events[];
  baseDate: Date;
}

export function EventCalendarMonth({ events, baseDate }: CalendarMonthProps) {
  const {
    timeFormat,
    firstDayOfWeek,
    locale,
    weekStartDay,
    viewSettings,
    openDayEventsDialog,
    openEventDialog,
    openQuickAddDialog,
  } = useEventCalendarStore(
    useShallow((state) => ({
      timeFormat: state.timeFormat,
      firstDayOfWeek: state.firstDayOfWeek,
      viewSettings: state.viewSettings.month,
      locale: state.locale,
      weekStartDay: state.firstDayOfWeek,
      openDayEventsDialog: state.openDayEventsDialog,
      openEventDialog: state.openEventDialog,
      openQuickAddDialog: state.openQuickAddDialog,
    })),
  );
  const daysContainerRef = useRef<HTMLDivElement>(null);
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  const localeObj = getLocaleFromCode(locale);

  const { weekNumber, weekDays } = useWeekDays(
    baseDate,
    DAYS_IN_WEEK,
    localeObj,
    firstDayOfWeek,
  );

  // Calculate visible days in month
  const visibleDays = useMemo(() => {
    const monthStart = startOfMonth(baseDate);
    const monthEnd = endOfMonth(baseDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: weekStartDay });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: weekStartDay });

    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [baseDate, weekStartDay]);

  // Groups events by their *calendar day*, expanding multi-day events into
  // a synthetic occurrence for every day they touch within the visible grid.
  // Single-day events have one entry in their start-date bucket; multi-day
  // events show up in every bucket from startDate through endDate inclusive.
  // This is what makes a Jul 17 → Jul 20 event visible on the 17th, 18th,
  // 19th, and 20th cells of the month grid.
  const eventsGroupedByDate = useMemo(() => {
    const gridStart = visibleDays[0];
    const gridEnd = visibleDays[visibleDays.length - 1];
    const expanded = groupEventsByDayInRange(events, gridStart, gridEnd);

    // Pre-fill every visible day with an empty bucket so DayCell always
    // finds an entry (preserves the original contract — `eventsByDate[key]
    // || []` no longer needed everywhere).
    const result: Record<string, Events[]> = {};
    visibleDays.forEach((day) => {
      result[format(day, 'yyyy-MM-dd')] = [];
    });
    // Splice the expanded occurrences in. The helper's keys use the same
    // `yyyy-MM-dd` format so we just merge. DayCell only reads the same
    // fields a single-day event has, so the extra `_instanceDate` flag
    // is harmless.
    for (const [key, list] of Object.entries(expanded)) {
      if (result[key]) {
        result[key] = list as unknown as Events[];
      } else {
        // Defensive: range clipping in the helper should already align keys
        // to visible days, but if a multi-day event somehow produced a key
        // outside the grid (e.g. an event spanning the visible-month edges
        // exactly) we drop it rather than show a phantom chip.
        continue;
      }
    }
    return result;
  }, [events, visibleDays]);

  const handleShowDayEvents = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    openDayEventsDialog(date, eventsGroupedByDate[dateKey] || []);
  };

  return (
    <div className="flex flex-col border py-2">
      <WeekDayHeaders
        weekNumber={weekNumber}
        daysInWeek={weekDays}
        formatDate={formatDate}
        locale={localeObj}
        firstDayOfWeek={firstDayOfWeek}
      />
      <div
        ref={daysContainerRef}
        className="grid grid-cols-7 gap-1 p-2 sm:gap-2"
        role="grid"
        aria-label="Month calendar grid"
      >
        {visibleDays.map((date, index) => (
          <DayCell
            key={`day-cell-${index}`}
            date={date}
            baseDate={baseDate}
            eventsByDate={eventsGroupedByDate}
            locale={localeObj}
            timeFormat={timeFormat}
            monthViewConfig={viewSettings}
            focusedDate={focusedDate}
            onQuickAdd={(date) => openQuickAddDialog({ date })}
            onFocusDate={setFocusedDate}
            onShowDayEvents={handleShowDayEvents}
            onOpenEvent={openEventDialog}
          />
        ))}
      </div>
    </div>
  );
}
