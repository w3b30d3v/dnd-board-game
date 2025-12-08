import type { Metadata } from 'next';
import { Cinzel, Roboto } from 'next/font/google';
import './globals.css';

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'D&D Digital Board Game',
  description: 'A cinematic, multiplayer, AI-powered D&D 5e digital board game platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cinzel.variable} ${roboto.variable}`}>
      <body className="bg-bg-dark text-text-primary font-roboto min-h-screen">
        {children}
      </body>
    </html>
  );
}
