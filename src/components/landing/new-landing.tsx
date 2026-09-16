'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Events } from '@/types/event';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const LOCATION_LABELS: Record<string, string> = {
  'Restaurant/Bar': 'Main Floor',
  'Basement Speakeasy': 'Speakeasy',
  Both: 'Both Floors',
};

function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return m ? `${hr}:${String(m).padStart(2, '0')} ${ampm}` : `${hr} ${ampm}`;
}

// ── Reveal wrapper ──
function Reveal({
  children,
  delay = 0,
  y = 40,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Hero ──
export function NewHero({ tonightCount }: { tonightCount: number }) {
  const lines = [
    { text: 'COME AS', outline: false },
    { text: 'YOU ARE.', outline: true },
    { text: 'STAY FOR', outline: false },
    { text: 'THE VIBE.', outline: true },
  ];

  return (
    <div className="landing-dark px-4vw relative flex min-h-svh flex-col justify-center py-24">
      <div className="flex items-center gap-4 text-xs tracking-[0.2em] text-white/50 uppercase">
        <span className="h-px w-10 bg-white/50" />
        333 W. Western Ave · Downtown Muskegon
      </div>
      <h1 className="landing-hero-h1 mt-6">
        {lines.map((line, i) => (
          <span key={i} className="block overflow-hidden">
            <motion.span
              className={`block ${line.outline ? 'text-outline' : ''}`}
              initial={{ y: '110%' }}
              animate={{ y: 0 }}
              transition={{
                duration: 1,
                ease: [0.16, 1, 0.3, 1],
                delay: i * 0.1,
              }}
            >
              {line.text}
            </motion.span>
          </span>
        ))}
      </h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="mt-8 max-w-prose text-lg font-light text-white/70"
      >
        An urban, all-inclusive gathering place. Good food, cold drinks, live
        entertainment — dinner upstairs, the night downstairs.
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="mt-10 flex flex-wrap gap-4"
      >
        <Link
          href="#events"
          className="landing-pill-btn landing-pill-btn-solid"
        >
          View events →
        </Link>
        <Link href="/menu" className="landing-pill-btn">
          See the menu
        </Link>
      </motion.div>
      {tonightCount >= 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="left-4vw absolute bottom-8"
        >
          <Link href="#events" className="landing-live-badge">
            <span className="landing-pulse-dot" />
            {tonightCount > 0
              ? `${tonightCount} event${tonightCount > 1 ? 's' : ''} happening tonight`
              : 'See what\u2019s on this month'}
          </Link>
        </motion.div>
      )}
    </div>
  );
}

// ── Marquee ──
export function NewMarquee() {
  const words = ['DINNER', 'DRINKS', 'LIVE MUSIC', 'DJ NIGHTS', 'SPEAKEASY'];
  const list = [...words, ...words];
  return (
    <div className="landing-marquee">
      <div className="landing-marquee-inner">
        {list.map((word, i) => (
          <span
            key={i}
            className={i % 2 === 1 ? 'landing-marquee-solid' : undefined}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Section heading ──
function SectionHeading({
  num,
  title,
  accent,
}: {
  num: string;
  title: string;
  accent?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <div ref={ref} className="mb-10 flex items-baseline gap-6">
      <span className="text-xs tracking-[0.2em] text-white/30">{num}</span>
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="landing-h2"
      >
        {title}
        {accent && (
          <>
            <br />
            <em className="text-outline-italic">{accent}</em>
          </>
        )}
      </motion.h2>
    </div>
  );
}

// ── Two floors ──
export function NewFloorsSection() {
  const floors = [
    {
      num: '01',
      tag: 'Main Floor',
      title: 'The Restaurant & Bar',
      body: 'Full kitchen, full bar, and a room that opens up to the street. Pull up a chair for dinner, grab a drink at the bar, or host your next get-together.',
    },
    {
      num: '02',
      tag: 'Downstairs',
      title: 'The Basement Speakeasy',
      body: 'A hidden room below the restaurant. Intimate, dimly lit, and made for private events, live music, and late nights. Bring the right people.',
    },
  ];
  return (
    <section id="floors" className="landing-section landing-dark">
      <Reveal>
        <SectionHeading num="01" title="Two floors." accent="Two vibes." />
      </Reveal>
      <div className="grid gap-0.5 md:grid-cols-2">
        {floors.map((floor, i) => (
          <Reveal key={floor.num} delay={i * 0.15} className="h-full">
            <div className="landing-floor-card group">
              <div className="text-outline-faint text-7xl leading-none font-extrabold">
                {floor.num}
              </div>
              <div>
                <div className="text-xs tracking-[0.25em] text-white/40 uppercase">
                  {floor.tag}
                </div>
                <h3 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
                  {floor.title}
                </h3>
                <p className="landing-body mt-4">{floor.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ── Events ──
export function NewEventsSection({
  events,
  month,
}: {
  events: Events[];
  month: string;
}) {
  return (
    <section id="events" className="landing-section landing-dark">
      <Reveal>
        <SectionHeading num="02" title="What's on" accent={`${month}.`} />
      </Reveal>
      <Reveal>
        <div>
          {events.length === 0 ? (
            <div className="landing-event-row">
              <div className="text-2xl font-extrabold">—</div>
              <div>
                <div className="text-lg font-semibold">
                  Nothing on the books right now
                </div>
                <div className="landing-event-meta">
                  Check back soon — new events land here first.
                </div>
              </div>
            </div>
          ) : (
            events.map((event) => {
              const d = new Date(event.startDate);
              const isToday = d.toDateString() === new Date().toDateString();
              const loc =
                LOCATION_LABELS[event.location] ?? (event.location as string);
              return (
                <Link
                  key={event.id}
                  href="/calendar"
                  className="landing-event-row group"
                >
                  <div className="text-xl font-extrabold tracking-tight md:text-2xl">
                    {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    <small className="block text-xs font-normal tracking-[0.15em] text-white/40 uppercase">
                      {MONTHS[d.getMonth()]} {d.getDate()}
                    </small>
                  </div>
                  <div>
                    <div className="text-base font-semibold md:text-lg">
                      {event.title}
                    </div>
                    <div className="landing-event-meta">
                      {loc} · {fmtTime(event.startTime)} –{' '}
                      {fmtTime(event.endTime)}
                    </div>
                  </div>
                  <span
                    className={`landing-pill ${isToday ? 'landing-pill-live' : ''}`}
                  >
                    {isToday ? 'Tonight' : 'View'}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mt-8 text-sm text-white/40">
          <Link href="/calendar" className="text-white/60 hover:text-white">
            See all events on the calendar →
          </Link>
        </p>
      </Reveal>
    </section>
  );
}

// ── FAQ + Visit ──
const FAQS = [
  {
    q: 'Do I need a reservation?',
    a: 'Walk-ins are always welcome. For larger groups or busy nights — weekends, live music, events — reach out ahead so we can save you a spot.',
  },
  {
    q: 'Is The Nest a gay bar?',
    a: 'The Nest is an all-inclusive restaurant and nightclub — which means everyone is welcome, and we mean it. The vibe is inclusive, the drinks are good, and the kitchen is open.',
  },
  {
    q: 'Can I book The Nest for a private event?',
    a: "Absolutely. Submit an event through the calendar with your date and details and we'll reach out to plan it with you.",
  },
  {
    q: 'Is there parking nearby?',
    a: 'Street parking on Western Ave and surrounding streets, plus public lots within a short walk.',
  },
];

export function NewFaqVisitSection() {
  return (
    <section id="visit" className="landing-section landing-dark">
      <Reveal>
        <SectionHeading num="03" title="Before you" accent="walk in." />
      </Reveal>
      <div className="grid gap-12 md:grid-cols-2">
        <Reveal>
          <div>
            {FAQS.map((faq) => (
              <details key={faq.q} className="landing-faq-item">
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div>
            <div className="text-xs tracking-[0.25em] text-white/40 uppercase">
              Find us
            </div>
            <h3 className="mt-4 text-2xl font-bold tracking-tight">
              333 W. Western Ave, Suite B
              <br />
              Muskegon, MI 49440
            </h3>
            <div className="mt-8">
              {[
                ['Wednesday – Thursday', '3 PM – 10 PM'],
                ['Friday', '3 PM – 12 AM'],
                ['Saturday', '1 PM – 12 AM'],
                ['Sunday', '1 PM – 10 PM'],
                ['Monday – Tuesday', 'Closed'],
              ].map(([day, hours]) => (
                <div key={day} className="landing-hours-row">
                  <span>{day}</span>
                  <b>{hours}</b>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Footer ──
export function NewFooter() {
  return (
    <footer className="landing-dark landing-footer">
      <div className="flex flex-wrap items-center justify-between gap-12">
        <div className="landing-foot-big">
          THE <em className="text-outline-italic">NEST</em>
        </div>
        <Link href="/" aria-label="The Nest home" className="landing-foot-logo">
          <Image
            src="/new-logo.jpg"
            alt="The Nest logo"
            width={160}
            height={160}
            className="h-full w-full object-cover"
          />
        </Link>
      </div>
      <div className="mt-10 flex flex-wrap justify-between gap-4 text-sm text-white/40">
        <span>© 2025 The Nest Restaurant &amp; Nightclub</span>
        <span>
          <a
            href="https://www.instagram.com/thenestmkg"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/70"
          >
            Instagram
          </a>{' '}
          ·{' '}
          <a
            href="https://www.facebook.com/profile.php?id=61572132644613"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/70"
          >
            Facebook
          </a>
        </span>
        <span>Muskegon, MI</span>
      </div>
    </footer>
  );
}
