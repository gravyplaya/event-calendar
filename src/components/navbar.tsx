'use client';
import Image from 'next/image';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { ModeToggle } from './mode-toggel';
import { usePathname } from 'next/navigation';
import { docsConfig } from '@/configs/docs';

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="bg-background/70 sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl">
      {/* Rainbow accent line at the very top */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, #E40303, #FF8C00, #FFED00, #008026, #004DFF, #732982)',
          opacity: 0.6,
        }}
      />
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/the-nest-logo-transparent.png"
            alt="The Nest Muskegon"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full"
            priority
          />
          <span className="text-xl font-semibold tracking-tight">
            The Nest
          </span>
        </Link>
        <nav className="hidden md:flex md:items-center md:gap-6">
          {docsConfig.mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.title}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/admin/login">
            <Button variant="ghost" size="sm" className="gap-2">
              <Lock className="h-4 w-4" />
              Admin
            </Button>
          </Link>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
