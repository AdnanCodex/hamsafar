import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LanguageProvider } from '@/lib/lang';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hamsafar — Your journey, shared with trust.',
  description: 'Safe rides and carpools across Pakistan. Ride Together. Go Further.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
