import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'PLUTON | Polar Lunar Utilities, Topography & Orbital Navigator',
  description:
    'NASA JPL / CSA Lunar South Pole Mission Planning, Grazing Solar Lighting, and Direct-to-Earth (DTE) Communication Trade-Off Analyzer',
  icons: {
    icon: [
      { url: '/pluton-logo.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: '/pluton-logo.png',
    shortcut: '/pluton-logo.png',
  },
  openGraph: {
    title: 'PLUTON | Polar Lunar Utilities, Topography & Orbital Navigator',
    description: 'NASA Artemis III Lunar South Pole Mission Control System',
    images: [
      {
        url: '/pluton-logo.png',
        width: 1024,
        height: 1024,
        alt: 'PLUTON Mission Profile',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;0,900;1,400&family=Roboto+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#060913] text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}

