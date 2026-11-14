import './globals.css';
import { Plus_Jakarta_Sans, Space_Grotesk, Press_Start_2P, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { Suspense } from 'react';
import Analytics from '@/components/Analytics';

const bodyFont       = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body' });
const headerFont     = Space_Grotesk({ subsets: ['latin'], variable: '--font-header' });
const pressStart2P   = Press_Start_2P({ weight: '400', subsets: ['latin'], variable: '--font-pixel' });
const jetBrainsMono  = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://craftityourself.gg';
const TITLE    = 'Craft It Yourself — Make Minecraft Plugins Without Coding';
const DESC     = 'Describe your plugin in plain English. Craft It Yourself builds complete, production-ready Bukkit/Paper code instantly using AI.';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:  TITLE,
    template: '%s · Craft It Yourself',
  },
  description: DESC,
  applicationName: 'Craft It Yourself',
  keywords: [
    'minecraft plugin generator', 'ai minecraft plugin', 'bukkit plugin ai',
    'paper plugin generator', 'minecraft java plugin', 'spigot plugin generator',
    'no-code minecraft plugin', 'minecraft plugin ai',
  ],
  authors: [{ name: 'Craft It Yourself' }],
  creator: 'Craft It Yourself',
  publisher: 'Craft It Yourself',
  alternates: { canonical: '/' },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: SITE_URL,
    siteName: 'Craft It Yourself',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Craft It Yourself' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESC,
    images: ['/og-image.png'],
    creator: '@craftityourself',
  },
  icons: {
    icon:     [{ url: '/favicon.ico' }, { url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple:    [{ url: '/apple-icon.png', sizes: '180x180' }],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  category: 'technology',
};

export const viewport = {
  themeColor: '#22c55e',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Craft It Yourself',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free tier with 1 Normal plugin credit.',
  },
  description: DESC,
  url: SITE_URL,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${headerFont.variable} ${pressStart2P.variable} ${jetBrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
      </head>
      <body className="bg-background text-white min-h-screen flex flex-col antialiased">
        {children}
        <Toaster position="bottom-right" theme="dark" richColors />
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}
