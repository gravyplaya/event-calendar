import { AdminEventCalendar } from '@/components/event-calendar/admin-event-calendar';
import { getEvents } from '@/app/actions';
import { SearchParams } from 'nuqs';
import { searchParamsCache } from '@/lib/searchParams';
import { CalendarViewType } from '@/types/event';
import { Suspense } from 'react';
import { ModeToggle } from '@/components/mode-toggel';
import { Button } from '@/components/ui/button';
import { LogOut, Users } from 'lucide-react';
import { destroyAdminSession, requireAdminAuth } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface AdminPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminPage(props: AdminPageProps) {
  // Require admin authentication
  await requireAdminAuth();

  const searchParams = await props.searchParams;
  const search = searchParamsCache.parse(searchParams);

  // Ensure the date defaults to today when not specified in the URL
  const today = new Date();
  const effectiveDate = search.date ?? today;

  console.log('📋 [AdminPage] Search params:', {
    ...search,
    date: effectiveDate,
  });

  const eventsResponse = await getEvents({
    date: effectiveDate,
    view: search.view as CalendarViewType,
    daysCount: Number(search.daysCount),
    categories: search.categories,
    title: search.title,
    colors: search.colors,
    locations: search.locations,
    isRepeating: search.isRepeating,
    repeatingTypes: search.repeatingTypes,
  });

  console.log('📊 [AdminPage] Events response:', {
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

  async function handleLogout() {
    'use server';
    await destroyAdminSession();
    redirect('/admin/login');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight">
              The Nest - Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/subscribers">
              <Button variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Subscribers
              </Button>
            </Link>
            <ModeToggle />
            <form action={handleLogout}>
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 py-6">
        <div className="container">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Admin Calendar Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage all events and calendar settings. All controls are enabled
              for administrators.
            </p>
          </div>
          <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
            <Suspense
              fallback={
                <div className="flex h-[700px] items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
                    <p className="text-muted-foreground text-sm">
                      Loading admin calendar...
                    </p>
                  </div>
                </div>
              }
            >
              <AdminEventCalendar
                events={eventsResponse.events}
                initialDate={effectiveDate}
              />
            </Suspense>
          </div>
        </div>
      </main>
      <footer className="border-t py-4">
        <div className="container">
          <p className="text-muted-foreground text-center text-sm">
            Admin panel for The Nest Restaurant and Nightclub event management
          </p>
        </div>
      </footer>
    </div>
  );
}
