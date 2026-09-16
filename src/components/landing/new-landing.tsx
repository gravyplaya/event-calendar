'use client';

import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Phone, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { subscribe } from '@/app/subscriber-actions';
import { subscribeSchema, type SubscribeInput } from '@/lib/validations';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const lines = [
    { text: 'COME AS', outline: false },
    { text: 'YOU ARE.', outline: true },
    { text: 'STAY FOR', outline: false },
    { text: 'THE VIBE.', outline: true },
  ];

  return (
    <div
      ref={containerRef}
      className="landing-dark px-4vw relative flex min-h-svh flex-col justify-center overflow-hidden py-16 md:py-20"
    >
      {/* Background: interior photo (from the previous design), parallax +
          darkened so the Three.js scene and type stay legible */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: bgY, opacity: bgOpacity }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/inside.jpg)',
            filter: 'brightness(0.3) contrast(1.1) saturate(0.6)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-black/80" />
      </motion.div>

      <div className="relative z-10 flex items-center gap-4 text-xs tracking-[0.2em] text-white/50 uppercase">
        <span className="h-px w-10 bg-white/50" />
        333 W. Western Ave · Downtown Muskegon
      </div>
      <h1 className="landing-hero-h1 relative z-10 mt-6">
        {lines.map((line, i) => (
          <span key={i} className="block overflow-hidden">
            <span className={`block ${line.outline ? 'text-outline' : ''}`}>
              {line.text}
            </span>
          </span>
        ))}
      </h1>
      <p className="relative z-10 mt-8 max-w-prose text-lg font-light text-white/70">
        An urban, all-inclusive gathering place. Good food, cold drinks, live
        entertainment — dinner upstairs, the night downstairs.
      </p>
      <div className="relative z-10 mt-10 flex flex-wrap gap-4">
        <Link
          href="#events"
          className="landing-pill-btn landing-pill-btn-solid"
        >
          View events →
        </Link>
        <Link href="/menu" className="landing-pill-btn">
          See the menu
        </Link>
      </div>
      {tonightCount >= 0 && (
        <div className="left-4vw absolute bottom-8 z-10">
          <Link href="#events" className="landing-live-badge">
            <span className="landing-pulse-dot" />
            {tonightCount > 0
              ? `${tonightCount} event${tonightCount > 1 ? 's' : ''} happening tonight`
              : 'See what\u2019s on this month'}
          </Link>
        </div>
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
    <div ref={ref} className="mb-10">
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
  const floors: {
    num: string;
    tag: string;
    title: string;
    body: string;
    comingSoon?: boolean;
  }[] = [
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
      comingSoon: true,
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
                  {floor.comingSoon && (
                    <span className="text-gold ml-3 align-middle text-sm font-semibold tracking-[0.15em] uppercase">
                      (Coming Soon)
                    </span>
                  )}
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

// ── Loyalty signup ──
export function NewLoyaltySection() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SubscribeInput>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: { smsOptIn: false },
  });

  const smsOptIn = watch('smsOptIn');

  const onSubmit = async (data: SubscribeInput) => {
    setIsLoading(true);
    try {
      const result = await subscribe(data);
      if (result.success) {
        toast.success(result.message || 'Welcome to The Nest Loyalty Program!');
        reset();
      } else if (result.error === 'already_subscribed') {
        toast.info(
          result.message ||
            'You are already subscribed to The Nest loyalty program.',
        );
      } else {
        toast.error(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="rewards" className="landing-section landing-dark">
      <Reveal>
        <SectionHeading num="04" title="Join the" accent="rewards." />
      </Reveal>
      <div className="grid items-stretch gap-12 md:grid-cols-2">
        <Reveal className="h-full">
          <div className="landing-body flex h-full flex-col justify-start pt-10">
            <p className="text-lg font-light text-white/80">
              Earn points for every visit. Get food and drink discounts.
            </p>
            <p className="mt-4 text-white/50">
              It&apos;s free to join — and you&apos;ll get{' '}
              <span className="text-gold font-semibold">100 bonus points</span>{' '}
              just for signing up.
            </p>
            <ul className="mt-8 space-y-4 text-sm text-white/50">
              {[
                'Points for every dollar you spend',
                'Member-only food and drink specials',
                'Early word on events before they land on the calendar',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="bg-gold mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.15} className="h-full">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="landing-form h-full space-y-5"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="loyalty-firstName" className="landing-label">
                  First Name
                </label>
                <Input
                  id="loyalty-firstName"
                  placeholder="John"
                  className="landing-input"
                  {...register('firstName')}
                  disabled={isLoading}
                  aria-invalid={!!errors.firstName}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-400">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="loyalty-lastName" className="landing-label">
                  Last Name
                </label>
                <Input
                  id="loyalty-lastName"
                  placeholder="Doe"
                  className="landing-input"
                  {...register('lastName')}
                  disabled={isLoading}
                  aria-invalid={!!errors.lastName}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-400">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="loyalty-email" className="landing-label">
                Email Address
              </label>
              <div className="relative">
                <Mail className="text-gold/50 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="loyalty-email"
                  type="email"
                  placeholder="john@example.com"
                  className="landing-input pl-10"
                  {...register('email')}
                  disabled={isLoading}
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="loyalty-phone" className="landing-label">
                Phone Number{' '}
                <span className="font-normal text-white/40">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="text-gold/50 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="loyalty-phone"
                  type="tel"
                  placeholder="(231) 555-0123"
                  className="landing-input pl-10"
                  {...register('phone')}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="landing-form-checkbox-row">
              <Checkbox
                id="loyalty-smsOptIn"
                checked={smsOptIn}
                onCheckedChange={(checked) => {
                  setValue('smsOptIn', checked === true);
                }}
                disabled={isLoading}
                className="landing-checkbox"
              />
              <div>
                <label
                  htmlFor="loyalty-smsOptIn"
                  className="cursor-pointer text-sm font-medium"
                >
                  Send me text messages about events and specials
                </label>
                <p className="mt-0.5 text-xs text-white/40">
                  Message rates may apply. Unsubscribe anytime.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="landing-submit-btn w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <Gift className="mr-2 h-4 w-4" />
                  Join The Nest Rewards
                </>
              )}
            </Button>

            <p className="text-center text-xs text-white/40">
              By signing up, you agree to receive emails from The Nest. You can
              unsubscribe at any time with one click.
            </p>
          </form>
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
