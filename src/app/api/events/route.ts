import { NextResponse } from 'next/server';
import { CalendarViewType } from '@/types/event';
import { getEvents } from '@/app/actions';
import { startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

// Allow the static design mockup (opened from file://) to read this feed.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
};

/**
 * Public JSON feed of this month's events for the landing page.
 * Uses the same getEvents() server action + repeat expansion as the calendar,
 * scoped to the current calendar month (past days of the month included —
 * e.g. on Sep 15, Sep 1–14 events still show).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 10, 50);

  const now = new Date();

  // MONTH view gives us the whole current month, repeats expanded
  const result = await getEvents({
    date: now,
    view: CalendarViewType.MONTH,
    categories: [],
    colors: [],
    locations: [],
    repeatingTypes: [],
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? 'Failed to load events' },
      { status: 500 },
    );
  }

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthEvents = result.events
    .filter((event) => {
      const start = new Date(event.startDate);
      return start >= monthStart && start <= monthEnd;
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )
    .slice(0, limit)
    .map((event) => ({
      id: event.id,
      title: event.title,
      location: event.location,
      category: event.category,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
    }));

  return NextResponse.json(
    {
      events: monthEvents,
      month: monthStart.toISOString(),
      timestamp: new Date().toISOString(),
    },
    { headers: CORS_HEADERS },
  );
}
