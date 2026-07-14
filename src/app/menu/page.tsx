import { MapPin, UtensilsCrossed, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menu',
  description:
    'Food and drinks at The Nest Restaurant and Nightclub in Muskegon',
};

export default function MenuPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <UtensilsCrossed className="text-primary h-5 w-5" />
            <span className="text-xl font-semibold tracking-tight">
              The Nest
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Home
            </Link>
            <Link
              href="/calendar"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Events
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-12 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="mb-12 text-center">
              <h1 className="font-clash-display text-4xl font-bold tracking-tight">
                Menu
              </h1>
              <p className="text-muted-foreground mt-4 text-lg">
                A work in progress — just like the rest of this place.
              </p>
              <div className="text-muted-foreground mt-4 flex items-center justify-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                333 W. Western Ave, Suite B, Muskegon, MI 49440
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl border p-8 text-center md:p-12">
              <UtensilsCrossed className="text-primary mx-auto mb-4 h-10 w-10" />
              <h2 className="text-xl font-semibold">Full menu coming soon</h2>
              <p className="text-muted-foreground mt-2">
                We&apos;re putting the finishing touches on the menu. In the
                meantime, here&apos;s what we can tell you:
              </p>
              <ul className="text-muted-foreground mt-6 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Shareable plates and comfort food, made fresh
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Full bar with cocktails, beer, and wine
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Late-night menu available until one hour before close
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Daily specials — ask your server or check Instagram
                </li>
              </ul>
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground">
                Want to know what&apos;s happening tonight?
              </p>
              <Button size="lg" asChild className="mt-4">
                <Link href="/calendar" className="gap-2">
                  View Events
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container text-center">
          <p className="text-muted-foreground text-sm">
            &copy; 2025 The Nest Restaurant and Nightclub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
