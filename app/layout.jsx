import './globals.css';
import { Inter, Press_Start_2P, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const pressStart2P = Press_Start_2P({ weight: '400', subsets: ['latin'], variable: '--font-pixel' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata = {
  title: 'CIY — Create Minecraft Plugins Without Coding',
  description: 'Describe your plugin in plain English. CIY builds complete, production-ready code instantly using AI.',
  openGraph: {
    title: 'CIY — Create Minecraft Plugins Without Coding',
    description: 'Describe your plugin in plain English. CIY builds complete, production-ready code instantly using AI.',
    url: 'https://ciy.gg',
    siteName: 'CIY',
    images: [
      {
        url: 'https://ciy.gg/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

import { Toaster } from 'sonner';
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${pressStart2P.variable} ${jetBrainsMono.variable}`}>
      <body className="bg-background text-white min-h-screen flex flex-col antialiased">
        {children}
        <Toaster position="bottom-right" theme="dark" richColors />
        
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </body>
    </html>
  );
}
