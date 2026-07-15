import { getEvents } from '@/app/actions';
import { CalendarViewType } from '@/types/event';
import { startOfDay, endOfDay } from 'date-fns';
import Navbar from '@/components/navbar';
import { HeroSection } from '@/components/landing/hero-section';
import {
  TwoFloorsSection,
  WhatToExpectSection,
  FindUsSection,
  FAQSection,
  LandingFooter,
} from '@/components/landing/landing-sections';
import { LoyaltySignup } from '@/components/landing/loyalty-signup';

export default async function IndexPage() {
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);

  const eventsResult = await getEvents({
    date: today,
    view: CalendarViewType.DAY,
    categories: [],
    colors: [],
    locations: [],
    repeatingTypes: [],
  });

  const todayEvents = eventsResult.success
    ? eventsResult.events.filter((event) => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);

        return (
          (eventStart >= startOfToday && eventStart <= endOfToday) ||
          (eventEnd >= startOfToday && eventEnd <= endOfToday) ||
          (eventStart <= startOfToday && eventEnd >= endOfToday)
        );
      })
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection todayEvents={todayEvents} today={today} />
        <WhatToExpectSection />
        <section className="relative py-20 md:py-28">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-2">
              <FAQSection embedded />
              <LoyaltySignup embedded />
            </div>
          </div>
        </section>
        <FindUsSection />
        <TwoFloorsSection />
      </main>
      <LandingFooter />
    </div>
  );
}
