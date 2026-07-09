import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
  UtensilsCrossed,
  Wine,
  Music,
  Heart,
  Users,
  Sparkles,
  Phone,
  Instagram,
  Facebook,
} from 'lucide-react';
import { FeatureCard } from '@/components/feature-card';
import dynamic from 'next/dynamic';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getEvents } from '@/app/actions';
import { CalendarViewType } from '@/types/event';
import { startOfDay, endOfDay } from 'date-fns';
import Navbar from '@/components/navbar';

const CalendarDay = dynamic(
  () =>
    import('@/components/event-calendar/calendar-day-with-scroll').then(
      (mod) => ({
        default: mod.CalendarDayWithScroll,
      }),
    ),
  {
    ssr: true,
    loading: () => (
      <div className="bg-muted/30 flex h-[400px] w-full items-center justify-center rounded-lg">
        <Calendar className="h-8 w-8 animate-pulse opacity-50" />
      </div>
    ),
  },
);

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
        {/* Hero Section */}
        <section className="relative flex min-h-[600px] items-center overflow-hidden py-20 sm:py-32">
          <Image
            src="/inside.jpg"
            alt="The Nest Restaurant & Bar interior"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
          <div className="relative container">
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
              <div className="flex flex-col items-start text-left">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/80">
                  <MapPin className="h-4 w-4" />
                  333 W. Western Ave, Downtown Muskegon
                </div>
                <h1 className="font-clash-display text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                  The Nest Restaurant &amp; Bar
                </h1>
                <p className="mt-6 text-lg text-white/90">
                  Come as you are. Stay for the vibe.
                </p>
                <p className="mt-4 max-w-prose text-lg text-white/80">
                  An urban, gay-friendly gathering place in the heart of
                  downtown Muskegon. Good food, cold drinks, and a room that
                  feels like home — whether you&apos;re here for dinner, a night
                  out, or something happening downstairs.
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <Button size="lg" asChild>
                    <Link href="/calendar" className="gap-2">
                      View Events
                      <ArrowRight size={16} />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    <Link href="/menu" className="gap-2">
                      <UtensilsCrossed size={16} />
                      See the Menu
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="border-border relative h-[400px] w-full overflow-hidden rounded-lg border shadow-xl">
                <div className="from-primary/20 to-background/10 absolute inset-0 rounded-lg bg-gradient-to-br backdrop-blur-sm" />
                <div className="relative flex h-full w-full items-center justify-center p-4">
                  <div className="h-full w-full overflow-hidden rounded-md shadow-lg">
                    <CalendarDay events={todayEvents} currentDate={today} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Two Experiences Section */}
        <section className="bg-muted/30 py-16 md:py-24">
          <div className="container">
            <div className="mb-12 flex flex-col items-center text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Two Floors. Two Vibes.
              </h2>
              <p className="text-muted-foreground mt-4 max-w-2xl">
                One building, two distinct experiences. Come for dinner
                upstairs, stay for the night downstairs.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-background flex flex-col rounded-xl border p-8 shadow-sm">
                <div className="text-primary bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
                  <UtensilsCrossed className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-semibold">
                  The Restaurant &amp; Bar
                </h3>
                <p className="text-muted-foreground mt-2 text-sm font-medium">
                  Main Floor
                </p>
                <p className="text-muted-foreground mt-4">
                  Full kitchen, full bar, and a room that opens up to the
                  street. Pull up a chair for dinner, grab a drink at the bar,
                  or host your next get-together. Casual, comfortable, and
                  always welcoming.
                </p>
              </div>
              <div className="bg-background flex flex-col rounded-xl border p-8 shadow-sm">
                <div className="text-primary bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
                  <Wine className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-semibold">
                  The Basement Speakeasy
                </h3>
                <p className="text-muted-foreground mt-2 text-sm font-medium">
                  Downstairs
                </p>
                <p className="text-muted-foreground mt-4">
                  A hidden room below the restaurant. Intimate, dimly lit, and
                  made for private events, live music, and late nights. The kind
                  of place you whisper about and bring the right people to.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What to Expect Section */}
        <section className="py-16 md:py-24">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
            <div className="mb-12 flex flex-col items-center text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                What to Expect
              </h2>
              <p className="text-muted-foreground mt-4 max-w-2xl">
                Everything you need to know before you walk through the door
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={Heart}
                title="Come As You Are"
                description="No dress code, no attitude. The Nest is a space where everyone belongs — queer, straight, whoever you are. Just be kind."
              />
              <FeatureCard
                icon={UtensilsCrossed}
                title="Full Kitchen"
                description="Comfort food done right. From shareable plates to late-night bites, the kitchen stays open late to keep you fed."
              />
              <FeatureCard
                icon={Music}
                title="Live Music & Events"
                description="Live performances, DJ nights, drag shows, and special events on both floors. Check the calendar and grab a spot."
              />
              <FeatureCard
                icon={Users}
                title="Private Events"
                description="Hosting something? The Basement Speakeasy is yours to book. Birthdays, celebrations, corporate things — we'll make it work."
              />
              <FeatureCard
                icon={Sparkles}
                title="Crafted Cocktails"
                description="A bar program that takes the classics seriously and isn't afraid to experiment. Ask for the bartender's pick."
              />
              <FeatureCard
                icon={Calendar}
                title="Easy Event Signup"
                description="See something on the calendar you want to attend? Submit your info and we'll get back to you to confirm your spot."
              />
            </div>
          </div>
        </section>

        {/* Hours & Location Section */}
        <section className="bg-muted/30 py-16 md:py-24">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Find Us</h2>
                <div className="text-muted-foreground mt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">
                        The Nest Restaurant &amp; Bar
                      </p>
                      <p>333 W. Western Ave</p>
                      <p>Muskegon, MI 49440</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                    <p>Reservations &amp; inquiries welcome</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Hours</h2>
                <div className="text-muted-foreground mt-6 space-y-2">
                  <div className="flex items-center justify-between border-b py-2">
                    <span className="text-foreground font-medium">
                      Sunday - Tuesday
                    </span>
                    <span>Closed</span>
                  </div>
                  <div className="flex items-center justify-between border-b py-2">
                    <span className="text-foreground font-medium">
                      Wednesday – Saturday
                    </span>
                    <span>5:00 PM – 12:00 AM</span>
                  </div>
                </div>
                <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  Kitchen closes one hour before bar close.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-muted/30 py-16 md:py-24">
          <div className="container">
            <div className="mb-12 flex flex-col items-center text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground mt-4 max-w-2xl">
                Quick answers to the things people ask us most
              </p>
            </div>

            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Do I need a reservation?</AccordionTrigger>
                  <AccordionContent>
                    Walk-ins are always welcome. For larger groups or busy
                    nights (weekends, live music, events), we recommend reaching
                    out ahead of time so we can save you a spot.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>Is The Nest a gay bar?</AccordionTrigger>
                  <AccordionContent>
                    The Nest is a gay-friendly restaurant and bar — which means
                    everyone is welcome, and we mean it. It&apos;s a space where
                    you can be yourself, whoever you are, whoever you&apos;re
                    with. The vibe is inclusive, the drinks are good, and the
                    kitchen is open.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    How do I sign up for an event on the calendar?
                  </AccordionTrigger>
                  <AccordionContent>
                    Head to the{' '}
                    <Link
                      href="/calendar"
                      className="text-primary font-medium hover:underline"
                    >
                      events calendar
                    </Link>
                    , find what interests you, and submit your info through the
                    event form. We&apos;ll get back to you to confirm your spot
                    and share any details you need.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>
                    Can I book the Basement Speakeasy for a private event?
                  </AccordionTrigger>
                  <AccordionContent>
                    Absolutely. The speakeasy is perfect for birthdays,
                    celebrations, private parties, and corporate gatherings.
                    Submit an event through the calendar with your date and
                    details, and we&apos;ll reach out to plan it with you.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>Do you serve food late?</AccordionTrigger>
                  <AccordionContent>
                    Yes. The kitchen stays open until one hour before close, so
                    you can grab a bite well into the night. Late-night menu is
                    available with a selection of crowd favorites.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger>Is there parking nearby?</AccordionTrigger>
                  <AccordionContent>
                    Street parking is available on Western Ave and surrounding
                    streets. There are also public lots within a short walk of
                    the building.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-10">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground h-5 w-5" />
            <p className="text-muted-foreground text-sm">
              &copy; 2025 The Nest Restaurant &amp; Bar. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/calendar"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Events
            </Link>
            <Link
              href="/menu"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Menu
            </Link>
            <a
              href="https://tavonni.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Tavonni
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
