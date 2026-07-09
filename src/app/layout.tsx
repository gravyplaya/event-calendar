import '../styles/globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Plus_Jakarta_Sans } from 'next/font/google';
import type { Metadata } from 'next';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: {
    default: 'The Nest Restaurant & Bar',
    template: '%s | The Nest',
  },
  description:
    'Events, live music, and special occasions at The Nest Restaurant & Bar in Muskegon',
  keywords: [
    'The Nest',
    'The Nest Muskegon',
    'Restaurant & Bar',
    'Event Calendar',
    'Live Music Muskegon',
    'Muskegon Events',
  ],
  authors: [
    {
      name: 'Tavonni',
      url: 'https://tavonni.com/',
    },
  ],
  openGraph: {
    title: 'The Nest Restaurant & Bar',
    description: 'Events, live music, and special occasions in Muskegon',
    url: 'https://spaces.tavonni.com',
    siteName: 'The Nest Restaurant & Bar',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Nest Restaurant & Bar',
    description: 'Events, live music, and special occasions in Muskegon',
    images: ['/twitter-image.png'],
  },
  metadataBase: new URL('https://spaces.tavonni.com'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={` ${jakarta.variable} font-jakarta antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster expand={true} richColors position="top-center" />
          <NuqsAdapter>{children}</NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
