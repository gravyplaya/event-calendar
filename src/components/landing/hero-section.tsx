'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, UtensilsCrossed, Calendar } from 'lucide-react';
import type { Events } from '@/types/event';

// Dynamically import the calendar day view (same as original)
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
      <div className="flex h-[400px] w-full items-center justify-center rounded-lg">
        <Calendar className="h-8 w-8 animate-pulse opacity-50" />
      </div>
    ),
  },
);

/**
 * Hero section with:
 * - Parallax scroll on the interior background image
 * - Staggered text animations on mount
 * - Live daily calendar view (replaces the 3D scene)
 * - Glassmorphism styling
 */
export function HeroSection({
  todayEvents,
  today,
}: {
  todayEvents: Events[];
  today: Date;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-[600px] items-center overflow-hidden pt-6 pb-12"
    >
      {/* Parallax background — interior photo, darkened */}
      <motion.div
        className="absolute inset-0"
        style={{ y: bgY, scale: bgScale }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/inside.jpg)',
            filter: 'brightness(0.35) contrast(1.1) saturate(0.8)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-black/80" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 20% 30%, rgba(228,3,3,0.15) 0%, transparent 40%), radial-gradient(ellipse at 80% 70%, rgba(0,77,255,0.15) 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, rgba(115,41,130,0.1) 0%, transparent 60%)',
          }}
        />
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 container"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 lg:gap-12">
          {/* Left: Text content */}
          <div className="flex flex-col items-start text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="mb-4 flex items-center gap-2 text-sm font-medium text-white/70"
            >
              <MapPin className="h-4 w-4" />
              333 W. Western Ave, Downtown Muskegon
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
              className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl"
            >
              The Nest{' '}
              <span className="text-rainbow">Restaurant and Nightclub</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
              className="mt-6 text-xl font-light text-white/90"
            >
              Come as you are. Stay for the vibe.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.45 }}
              className="mt-4 max-w-prose text-base text-white/70"
            >
              An urban, all-inclusive gathering place in the heart of downtown
              Muskegon. Good food, cold drinks, live entertainment and a room
              that feels like home — whether you&apos;re here for dinner, a
              night out, or something happening downstairs.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.6 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Button
                size="lg"
                asChild
                className="glow-primary bg-primary hover:bg-primary/90 border-0 text-white"
              >
                <Link href="/calendar" className="gap-2">
                  <Calendar size={16} />
                  View Events
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="glass-strong border-white/20 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/menu" className="gap-2">
                  <UtensilsCrossed size={16} />
                  See the Menu
                </Link>
              </Button>
            </motion.div>

            {/* Today's events badge */}
            {todayEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="glass mt-8 flex items-center gap-3 rounded-full px-4 py-2"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
                <span className="text-sm text-white/80">
                  {todayEvents.length} event
                  {todayEvents.length > 1 ? 's' : ''} happening today
                </span>
              </motion.div>
            )}
          </div>

          {/* Right: Daily calendar view */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            className="relative h-[360px] w-full overflow-hidden rounded-2xl md:h-[440px]"
          >
            {/* Gradient backdrop behind calendar */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background:
                  'linear-gradient(135deg, rgba(0,77,255,0.12), rgba(115,41,130,0.08))',
                backdropFilter: 'blur(4px)',
              }}
            />
            {/* Rainbow border */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                padding: '1px',
                background:
                  'linear-gradient(135deg, rgba(228,3,3,0.4), rgba(255,140,0,0.3), rgba(255,237,0,0.2), rgba(0,128,38,0.3), rgba(0,77,255,0.4), rgba(115,41,130,0.5))',
                WebkitMask:
                  'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />
            <div className="relative flex h-full w-full items-center justify-center p-4">
              <div className="h-full w-full overflow-hidden rounded-lg shadow-2xl">
                <CalendarDay events={todayEvents} currentDate={today} />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
