import { EventCalendar } from '@/components/event-calendar/event-calendar';
import { getEvents } from '../actions';
import { SearchParams } from 'nuqs';
import { searchParamsCache } from '@/lib/searchParams';
import { CalendarViewType } from '@/types/event';
import { Suspense } from 'react';
import Navbar from '@/components/navbar';
import { LandingFooter } from '@/components/landing/landing-sections';
import { isAdminAuthenticated } from '@/lib/admin-auth';

interface DemoPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function DemoPage(props: DemoPageProps) {
  const searchParams = await props.searchParams;
  const search = searchParamsCache.parse(searchParams);

  const isAdmin = await isAdminAuthenticated();

  console.log('📋 [DemoPage] Search params:', search);

  const eventsResponse = await getEvents({
    date: search.date,
    view: search.view as CalendarViewType,
    daysCount: Number(search.daysCount),
    categories: search.categories,
    title: search.title,
    colors: search.colors,
    locations: search.locations,
    isRepeating: search.isRepeating,
    repeatingTypes: search.repeatingTypes,
  });

  console.log('📊 [DemoPage] Events response:', {
    success: eventsResponse.success,
    eventCount: eventsResponse.events.length,
    firstEvent: eventsResponse.events[0]
      ? {
          id: eventsResponse.events[0].id,
          title: eventsResponse.events[0].title,
          startDate: eventsResponse.events[0].startDate,
          endDate: eventsResponse.events[0].endDate,
        }
      : 'No events',
    error: eventsResponse.error,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 py-6">
        <div className="container">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Event Calendar</h1>
            <p className="text-muted-foreground mt-2">
              Check out all our scheduled events.
            </p>
          </div>
          <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
            <Suspense
              fallback={
                <div className="flex h-[700px] items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
                    <p className="text-muted-foreground text-sm">
                      Loading calendar...
                    </p>
                  </div>
                </div>
              }
            >
              <EventCalendar
                events={eventsResponse.events}
                initialDate={search.date}
                isAdmin={isAdmin}
              />
            </Suspense>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
