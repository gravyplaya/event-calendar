import { getEvents } from '@/app/actions';
import { CalendarViewType } from '@/types/event';
import { startOfMonth, endOfMonth } from 'date-fns';
import Navbar from '@/components/navbar';
import { ScrollScene } from '@/components/landing/scroll-scene';
import {
  NewHero,
  NewMarquee,
  NewFloorsSection,
  NewEventsSection,
  NewFaqVisitSection,
  NewLoyaltySection,
  NewFooter,
} from '@/components/landing/new-landing';
import type { Events } from '@/types/event';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default async function IndexPage() {
  const now = new Date();

  const eventsResult = await getEvents({
    date: now,
    view: CalendarViewType.MONTH,
    categories: [],
    colors: [],
    locations: [],
    repeatingTypes: [],
  });

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthEvents: Events[] = eventsResult.success
    ? eventsResult.events
        .filter((event) => {
          const start = new Date(event.startDate);
          return start >= monthStart && start <= monthEnd;
        })
        .sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        )
    : [];

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const tonightCount = monthEvents.filter((event) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    return start < endOfToday && end > startOfToday;
  }).length;

  return (
    <div className="landing-dark relative min-h-screen bg-[#0b0b0f] text-[#f5f5f7]">
      <ScrollScene />
      <div className="grain-overlay" aria-hidden="true" />
      <Navbar />
      <main className="relative -mt-16">
        <NewHero tonightCount={tonightCount} />
        <NewMarquee />
        <NewFloorsSection />
        <NewEventsSection events={monthEvents} month={MONTHS[now.getMonth()]} />
        <NewFaqVisitSection />
        <NewLoyaltySection />
      </main>
      <NewFooter />
    </div>
  );
}
