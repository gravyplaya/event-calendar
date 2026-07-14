'use client';

import { motion } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  UtensilsCrossed,
  Wine,
  Heart,
  Music,
  Users,
  Sparkles,
  Calendar,
  MapPin,
  Phone,
  Clock,
  Instagram,
  Facebook,
} from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';

// ── Reveal wrapper: fades in children as they enter the viewport ──
function Reveal({
  children,
  delay = 0,
  y = 40,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}

// ── 3D tilt card that responds to mouse position ──
function TiltCard({
  children,
  className = '',
  glowColor = 'rgba(0, 77, 255, 0.15)',
}: {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(4px)`;
    el.style.setProperty('--glow-x', `${(x + 0.5) * 100}%`);
    el.style.setProperty('--glow-y', `${(y + 0.5) * 100}%`);
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform =
      'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative transition-transform duration-300 ease-out ${className}`}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Glow that follows cursor */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(300px circle at var(--glow-x, 50%) var(--glow-y, 50%), ${glowColor}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}

// ── Section heading with rainbow accent ──
function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-12 flex flex-col items-center text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-3xl font-bold tracking-tight md:text-4xl"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="text-muted-foreground mt-4 max-w-2xl"
      >
        {subtitle}
      </motion.p>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mt-6 h-[2px] w-24 origin-center rounded-full"
        style={{
          background:
            'linear-gradient(90deg, #E40303, #FF8C00, #FFED00, #008026, #004DFF, #732982)',
        }}
      />
    </div>
  );
}

// ── Feature data ──
const FEATURES = [
  {
    icon: Heart,
    title: 'Come As You Are',
    description:
      'No dress code, no attitude. The Nest is a space where everyone belongs — queer, straight, whoever you are. Just be kind.',
    glow: 'rgba(228, 3, 3, 0.15)',
  },
  {
    icon: UtensilsCrossed,
    title: 'Full Kitchen',
    description:
      'Comfort food done right. From shareable plates to late-night bites, the kitchen stays open late to keep you fed.',
    glow: 'rgba(255, 140, 0, 0.15)',
  },
  {
    icon: Music,
    title: 'Live Music & Events',
    description:
      'Live performances, DJ nights, drag shows, and special events on both floors. Check the calendar and grab a spot.',
    glow: 'rgba(255, 237, 0, 0.12)',
  },
  {
    icon: Users,
    title: 'Private Events',
    description:
      "Hosting something? The Basement Speakeasy is yours to book. Birthdays, celebrations, corporate things — we'll make it work.",
    glow: 'rgba(0, 128, 38, 0.15)',
  },
  {
    icon: Sparkles,
    title: 'Crafted Cocktails',
    description:
      "A bar program that takes the classics seriously and isn't afraid to experiment. Ask for the bartender's pick.",
    glow: 'rgba(0, 77, 255, 0.15)',
  },
  {
    icon: Calendar,
    title: 'Easy Event Signup',
    description:
      "See something on the calendar you want to attend? Submit your info and we'll get back to you to confirm your spot.",
    glow: 'rgba(115, 41, 130, 0.18)',
  },
];

// ── Two Floors section ──
export function TwoFloorsSection() {
  return (
    <section className="relative py-20 md:py-28">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at 30% 50%, rgba(228,3,3,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(0,77,255,0.08) 0%, transparent 50%)',
        }}
      />
      <div className="relative container">
        <SectionHeading
          title="Two Floors. Two Vibes."
          subtitle="One building, two distinct experiences. Come for dinner upstairs, stay for the night downstairs."
        />
        <div className="grid gap-6 md:grid-cols-2">
          {/* Restaurant & Bar */}
          <Reveal>
            <TiltCard
              glowColor="rgba(255, 140, 0, 0.2)"
              className="glass-strong border-rainbow h-full rounded-2xl"
            >
              <div className="relative z-10 flex flex-col p-8">
                <div
                  className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,140,0,0.2), rgba(228,3,3,0.15))',
                    boxShadow: '0 0 30px rgba(255,140,0,0.2)',
                  }}
                >
                  <UtensilsCrossed className="h-7 w-7 text-orange-400" />
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
            </TiltCard>
          </Reveal>

          {/* Speakeasy */}
          <Reveal delay={0.15}>
            <TiltCard
              glowColor="rgba(115, 41, 130, 0.25)"
              className="glass-strong border-rainbow h-full rounded-2xl"
            >
              <div className="relative z-10 flex flex-col p-8">
                <div
                  className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(115,41,130,0.3), rgba(0,77,255,0.2))',
                    boxShadow: '0 0 30px rgba(115,41,130,0.3)',
                  }}
                >
                  <Wine className="h-7 w-7 text-purple-400" />
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
            </TiltCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── What to Expect section ──
export function WhatToExpectSection() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
        <SectionHeading
          title="What to Expect"
          subtitle="Everything you need to know before you walk through the door"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={i * 0.08}>
                <TiltCard
                  glowColor={feature.glow}
                  className="glass h-full rounded-2xl border border-white/5"
                >
                  <div className="relative z-10 p-6">
                    <div
                      className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <Icon className="text-primary h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground mt-3 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Find Us / Hours section ──
export function FindUsSection() {
  return (
    <section className="relative py-20 md:py-28">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(0,77,255,0.1) 0%, transparent 60%)',
        }}
      />
      <div className="relative container">
        <SectionHeading
          title="Find Us"
          subtitle="Where the night finds you in downtown Muskegon"
        />
        <div className="grid gap-8 md:grid-cols-2">
          <Reveal>
            <div className="glass-strong rounded-2xl p-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      The Nest Restaurant and Nightclub
                    </p>
                    <p className="text-muted-foreground">
                      333 W. Western Ave. Suite B
                    </p>
                    <p className="text-muted-foreground">Muskegon, MI 49440</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                  <a
                    href="tel:+12317478114"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    (231) 747-8114
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.instagram.com/thenestmkg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass text-muted-foreground hover:text-primary flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=61572132644613"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass text-muted-foreground hover:text-primary flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="glass-strong rounded-2xl p-8">
              <h3 className="mb-6 text-xl font-semibold">Hours</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-white/5 py-3">
                  <span className="font-medium">Sunday - Tuesday</span>
                  <span className="text-muted-foreground">Closed</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 py-3">
                  <span className="font-medium">Wednesday – Saturday</span>
                  <span className="text-primary">5:00 PM – 12:00 AM</span>
                </div>
              </div>
              <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                Kitchen closes one hour before bar close.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── FAQ section ──
export function FAQSection() {
  const faqs = [
    {
      q: 'Do I need a reservation?',
      a: 'Walk-ins are always welcome. For larger groups or busy nights (weekends, live music, events), we recommend reaching out ahead of time so we can save you a spot.',
    },
    {
      q: 'Is The Nest a gay bar?',
      a: "The Nest is an all inclusive restaurant and nightclub — which means everyone is welcome, and we mean it. It's a space where you can be yourself, whoever you are, whoever you're with. The vibe is inclusive, the drinks are good, and the kitchen is open.",
    },
    {
      q: 'How do I sign up for an event on the calendar?',
      a: "Head to the events calendar, find what interests you, and submit your info through the event form. We'll get back to you to confirm your spot and share any details you need.",
    },
    {
      q: 'Can I book The Nest for a private event?',
      a: "Absolutely. The Nest is perfect for birthdays, celebrations, private parties, and corporate gatherings. Submit an event through the calendar with your date and details, and we'll reach out to plan it with you.",
    },
    {
      q: 'Do you serve food late?',
      a: 'Yes. The kitchen stays open until 10pm, so you can grab a bite well into the night. Late-night menu is available with a selection of crowd favorites.',
    },
    {
      q: 'Is there parking nearby?',
      a: 'Street parking is available on Western Ave and surrounding streets. There are also public lots within a short walk of the building.',
    },
  ];

  return (
    <section className="relative py-20 md:py-28">
      <div className="relative container">
        <SectionHeading
          title="Frequently Asked Questions"
          subtitle="Quick answers to the things people ask us most"
        />
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <div className="glass-strong rounded-2xl p-6 md:p-8">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="hover:text-primary text-left">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a.includes('events calendar') ? (
                        <>
                          Head to the{' '}
                          <Link
                            href="/calendar"
                            className="text-primary font-medium hover:underline"
                          >
                            events calendar
                          </Link>
                          , find what interests you, and submit your info
                          through the event form. We&apos;ll get back to you to
                          confirm your spot and share any details you need.
                        </>
                      ) : (
                        faq.a
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Footer ──
export function LandingFooter() {
  return (
    <footer className="relative border-t border-white/5 py-10">
      <div
        className="absolute inset-x-0 top-0 h-[1px]"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(228,3,3,0.3), rgba(255,140,0,0.3), rgba(255,237,0,0.2), rgba(0,128,38,0.3), rgba(0,77,255,0.3), rgba(115,41,130,0.3), transparent)',
        }}
      />
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-3">
          <NextImage
            src="/the-nest-logo-transparent.png"
            alt="The Nest Muskegon"
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <p className="text-muted-foreground text-sm">
            &copy; 2025 The Nest Restaurant and Nightclub. All rights reserved.
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
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Tavonni
          </a>
        </div>
      </div>
    </footer>
  );
}
