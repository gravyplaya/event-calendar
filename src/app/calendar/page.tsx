import { EventCalendar } from '@/components/event-calendar/event-calendar';
import { getEvents } from '../actions';
import { SearchParams } from 'nuqs';
import { searchParamsCache } from '@/lib/searchParams';
import { CalendarViewType } from '@/types/event';
import { Suspense } from 'react';
import Navbar from '@/components/navbar';
import { ScrollScene } from '@/components/landing/scroll-scene';
import { NewFooter } from '@/components/landing/new-landing';
import { isAdminAuthenticated } from '@/lib/admin-auth';

interface DemoPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function DemoPage(props: DemoPageProps) {
  const searchParams = await props.searchParams;
  const search = searchParamsCache.parse(searchParams);

  const isAdmin = await isAdminAuthenticated();

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

  return (
    <div className="landing-dark relative min-h-screen bg-[#0b0b0f] text-[#f5f5f7]">
      <ScrollScene />
      <div className="grain-overlay" aria-hidden="true" />
      <Navbar />

      <main className="landing-section relative">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-10">
            <h1 className="landing-h2">
              Event <span className="text-outline-italic">Calendar</span>
            </h1>
            <p className="landing-body mt-4">
              Check out all our scheduled events.
            </p>
          </div>

          {/* Calendar */}
          <div className="landing-calendar-card">
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

      <NewFooter />
    </div>
  );
}
