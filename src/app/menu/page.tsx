import { MapPin, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/navbar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menu — The Nest',
  description:
    'Food and drinks at The Nest Restaurant and Nightclub in Muskegon',
};

// ── Menu data ──────────────────────────────────────────────────────────

type MenuItem = {
  name: string;
  price?: string;
  note?: string;
  subItems?: { name: string; price?: string; note?: string }[];
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const leftColumn: MenuSection[] = [
  {
    title: 'Happitizers',
    items: [
      { name: 'Veggie Rolls', price: '$14', note: '(3)' },
      { name: 'Shrimp Mac & Cheese Rolls', price: '$15', note: '(3)' },
      { name: 'Chicken Tenders', price: '$15', note: '(5)' },
      { name: 'Jerk Chicken Rolls', price: '$15', note: '(3)' },
      { name: 'Deviled Eggs', price: '$13', note: '(3)' },
      { name: 'Balsamic Glazed Brussels Sprouts', price: '$15' },
      {
        name: 'Nachos',
        price: '$21',
        note: 'pick one protein',
        subItems: [{ name: 'Chicken' }, { name: 'Shrimp' }, { name: 'Beef' }],
      },
    ],
  },
  {
    title: 'Wings',
    items: [
      { name: '1 lb — with fries', price: '$15' },
      { name: '2 lbs — with fries', price: '$24' },
      {
        name: 'Sauces',
        note: 'house, jerk, lemon pepper, BBQ, sweet chili, buffalo',
      },
    ],
  },
  {
    title: 'Dinners',
    items: [
      {
        name: 'Louis',
        note: '3 pc catfish & 1 bowl gumbo or red beans and rice',
        subItems: [
          { name: 'Seafood', price: '$30' },
          { name: 'Chicken and Sausage', price: '$27' },
          { name: 'Red Beans and Rice', price: '$21' },
        ],
      },
      {
        name: 'Maria',
        note: '2 pc catfish, bowl mac & cheese',
        price: '$21',
      },
      { name: 'Shrimp and Grits', price: '$27' },
      { name: 'Catfish and Grits', price: '$25' },
      {
        name: 'Gumbo with Corn Bread',
        subItems: [
          { name: 'Seafood', price: '$29 bowl / $19 cup' },
          { name: 'Chicken and Sausage', price: '$21 bowl / $14 cup' },
          { name: 'Veggie', price: '$17 bowl / $11 cup' },
        ],
      },
    ],
  },
];

const rightColumn: MenuSection[] = [
  {
    title: 'Sandos',
    items: [
      {
        name: 'Burgers & Sandwiches',
        price: '$17',
        note: 'with fries',
        subItems: [
          {
            name: 'Toppings',
            note: 'cheddar, American, Swiss, blue cheese, green olives, lettuce, tomato, onion, pickle, slaw',
          },
          {
            name: 'Add Bacon or Candied Bacon',
            price: '$2',
          },
        ],
      },
      { name: 'Chicken Sandwich', note: 'with fries' },
      { name: 'Catfish Sandwich', note: 'with fries' },
      {
        name: "Po' Boys",
        price: '$21',
        note: 'with fries',
        subItems: [
          { name: 'Catfish' },
          { name: 'Shrimp' },
          { name: 'Chicken' },
        ],
      },
      {
        name: 'Sliders',
        price: '$17',
        note: 'with fries',
        subItems: [
          { name: 'Catfish' },
          { name: 'Burger' },
          { name: 'Philly Cheese' },
        ],
      },
    ],
  },
  {
    title: 'Pasta',
    items: [
      { name: 'Spaghetti', price: '$13' },
      { name: 'Angel Hair', price: '$13' },
      {
        name: 'Mac & Cheese',
        price: '$12',
        subItems: [
          { name: 'Add Shrimp', price: '$8' },
          { name: 'Add Chicken', price: '$7' },
        ],
      },
    ],
  },
  {
    title: 'Salads',
    items: [
      { name: 'House', price: '$14' },
      { name: 'Caesar', price: '$16' },
      { name: 'Pasta', price: '$11' },
      { name: 'Add Chicken, Shrimp, or Steak', price: '$9' },
    ],
  },
  {
    title: 'Sides',
    items: [
      { name: 'Fries', price: '$6' },
      { name: 'Fried Okra', price: '$7' },
      { name: 'Fried Green Tomatoes', price: '$9' },
      { name: 'Collard Greens', price: '$7' },
      { name: 'Fried Mushrooms', price: '$7' },
      { name: 'Yams', price: '$7' },
    ],
  },
  {
    title: 'Dessert',
    items: [
      { name: "Mom's Goodies", price: '$13' },
      { name: 'Posset of the Month', price: '$5' },
      // TODO: two items obscured in photo — fill in from Geo
      // { name: '???', price: '$10' },
      // { name: '???', price: '$15' },
    ],
  },
];

// ── Components ─────────────────────────────────────────────────────────

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <li className="space-y-1">
      <div className="flex items-baseline gap-2">
        <span className="font-medium">{item.name}</span>
        {item.note && (
          <span className="text-muted-foreground text-sm">— {item.note}</span>
        )}
        {item.price && (
          <>
            <span className="text-muted-foreground flex-1 truncate border-b border-dotted border-white/15" />
            <span className="text-primary font-semibold whitespace-nowrap">
              {item.price}
            </span>
          </>
        )}
      </div>
      {item.subItems && (
        <ul className="text-muted-foreground ml-4 flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
          {item.subItems.map((sub, i) => (
            <li key={i}>
              <span className={sub.note ? 'font-medium' : undefined}>
                {sub.name}
              </span>
              {sub.note && <span> — {sub.note}</span>}
              {sub.price && (
                <span className="text-primary/80"> — {sub.price}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function MenuCard({ section }: { section: MenuSection }) {
  return (
    <div className="glass-strong border-rainbow rounded-2xl p-6 md:p-8">
      <h3 className="text-rainbow mb-5 text-2xl font-bold tracking-tight">
        {section.title}
      </h3>
      <ul className="space-y-3">
        {section.items.map((item, i) => (
          <MenuRow key={i} item={item} />
        ))}
      </ul>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function MenuPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-12 md:py-20">
        <div className="container">
          {/* Header */}
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <h1 className="font-clash-display text-5xl font-bold tracking-tight">
              <span className="text-rainbow">Menu</span>
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">
              Southern comfort food, fresh-made, served late.
            </p>
            <div className="text-muted-foreground mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                333 W. Western Ave, Suite B, Muskegon, MI 49440
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Late-night menu until 1 hr before close
              </span>
            </div>
          </div>

          {/* Menu grid — two columns on desktop */}
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
            {leftColumn.map((section, i) => (
              <MenuCard key={`left-${i}`} section={section} />
            ))}
            {rightColumn.map((section, i) => (
              <MenuCard key={`right-${i}`} section={section} />
            ))}
          </div>

          {/* Tax note */}
          <p className="mt-8 text-center text-sm font-medium tracking-wide">
            All tax included.
          </p>

          {/* Reference photo */}
          <div className="mx-auto mt-12 max-w-md">
            <p className="text-muted-foreground mb-3 text-center text-xs">
              The original, for reference:
            </p>
            <div className="glass-strong border-rainbow overflow-hidden rounded-2xl">
              <Image
                src="/menu.jpg"
                alt="The Nest original menu"
                width={600}
                height={800}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
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
      </main>

      <footer className="border-t border-white/5 py-8">
        <div className="container text-center">
          <p className="text-muted-foreground text-sm">
            &copy; 2025 The Nest Restaurant and Nightclub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
