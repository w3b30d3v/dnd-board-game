import type { Metadata } from 'next';
import { Cinzel, Inter } from 'next/font/google';
import './globals.css';

// Force dynamic rendering for all pages - no static generation
export const dynamic = 'force-dynamic';

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'D&D Digital Board Game',
  description: 'A cinematic, multiplayer D&D 5e digital board game platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="bg-bg-primary text-text-primary font-body min-h-screen antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
