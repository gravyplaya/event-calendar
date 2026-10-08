import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { isSameDay } from 'date-fns';
import { ArrowLeft, Calendar, Clock, MapPin, Repeat } from 'lucide-react';
import { advanceByRepeatType } from '@/lib/event';
import Navbar from '@/components/navbar';
import { NewFooter } from '@/components/landing/new-landing';
import { getEventById } from '@/app/actions';
import { ScrollScene } from '@/components/landing/scroll-scene';

export const dynamic = 'force-dynamic';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

const LOCATION_LABELS: Record<string, string> = {
  'Restaurant/Bar': 'Main Floor',
  'Basement Speakeasy': 'Speakeasy',
  Both: 'Both Floors',
};

const REPEAT_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getEventById(id);

  if (!result.success || !result.event) return { title: 'Event not found' };

  return {
    title: result.event.title,
    description:
      result.event.description.slice(0, 160) ||
      `${result.event.title} at The Nest Muskegon`,
  };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { id } = await params;
  const result = await getEventById(id);

  if (!result.success || !result.event) notFound();

  const event = result.event;

  // Virtual occurrences of a repeating series carry a synthetic id
  // (`<uuid>__repeat_<n>`). The DB row is the series' original date, so
  // when an occurrence is requested, shift the displayed dates by the
  // same offset the expansion logic applies.
  const repeatMatch = id.match(/__repeat_(\d+)$/);
  let startDate = new Date(event.startDate);
  let endDate = new Date(event.endDate);

  if (repeatMatch && event.isRepeating && event.repeatingType) {
    const occurrenceNum = Number(repeatMatch[1]);
    if (occurrenceNum > 0) {
      const shift = (n: number) => {
        let d = new Date(event.startDate);
        for (let i = 0; i < n; i++) {
          d = advanceByRepeatType(d, event.repeatingType);
        }
        return d;
      };
      const durationMs = endDate.getTime() - startDate.getTime();
      startDate = shift(occurrenceNum);
      endDate = new Date(startDate.getTime() + durationMs);
    }
  }

  const isMultiDay = !isSameDay(startDate, endDate);

  return (
    <div className="landing-dark relative min-h-screen bg-[#0b0b0f] text-[#f5f5f7]">
      <ScrollScene />
      <div className="grain-overlay" aria-hidden="true" />
      <Navbar />
      <main className="landing-section relative pt-32 pb-24">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/#events"
            className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to events
          </Link>

          {/* Flyer */}
          {event.flyerUrl ? (
            <div className="landing-calendar-card overflow-hidden">
              <img
                src={event.flyerUrl}
                alt={`${event.title} flyer`}
                className="max-h-[32rem] w-full object-contain"
              />
            </div>
          ) : null}

          {/* Title */}
          <div className="mt-10 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h1 className="landing-h2">{event.title}</h1>
            <span className="landing-pill landing-pill-live">
              {LOCATION_LABELS[event.location] ?? event.location}
            </span>
          </div>

          {/* Key details */}
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            <div>
              <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                <Calendar className="h-4 w-4" /> Date
              </div>
              <p className="mt-2 text-base font-semibold">
                {isMultiDay
                  ? `${startDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })} – ${endDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}`
                  : startDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
              </p>
            </div>
            <div>
              <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                <Clock className="h-4 w-4" /> Time
              </div>
              <p className="mt-2 text-base font-semibold">
                {event.startTime} – {event.endTime}
              </p>
            </div>
            <div>
              <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                <MapPin className="h-4 w-4" /> Space
              </div>
              <p className="mt-2 text-base font-semibold">
                {LOCATION_LABELS[event.location] ?? event.location}
              </p>
            </div>
          </div>

          {event.isRepeating && event.repeatingType && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/60">
              <Repeat className="h-4 w-4" />
              {REPEAT_LABELS[event.repeatingType] ?? event.repeatingType}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="mt-12">
              <div className="text-muted-foreground text-xs font-medium tracking-[0.25em] uppercase">
                About this event
              </div>
              <p className="mt-4 text-lg leading-relaxed font-light whitespace-pre-wrap text-white/80">
                {event.description}
              </p>
            </div>
          )}

          <div className="mt-16 flex flex-wrap gap-4">
            <Link
              href="/#visit"
              className="landing-pill-btn landing-pill-btn-solid"
            >
              Plan your visit →
            </Link>
            <Link href="/menu" className="landing-pill-btn">
              See the menu
            </Link>
          </div>
        </div>
      </main>
      <NewFooter />
    </div>
  );
}
