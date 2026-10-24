import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hamsafar — Your journey, shared with trust.',
  description: 'Safe rides and carpools across Pakistan. Ride Together. Go Further.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <div className="nav">
            <Link href="/" className="brand">
              <img src="/logo.png" alt="Hamsafar" style={{ height: 42, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
              <span><b>Hamsafar</b><small>Safe Rides • Shared Journeys</small></span>
            </Link>
            <nav className="navlinks">
              <Link href="/">Home</Link>
              <Link href="/find">Find a Ride</Link>
              <Link href="/offer">Offer a Ride</Link>
              <Link href="/safety">Safety</Link>
              <Link href="/dashboard">Dashboard</Link>
            </nav>
            <div className="navright">
              <button className="pill">EN ▾</button>
              <Link href="/login"><button className="btn outline">Login</button></Link>
              <Link href="/login"><button className="btn">Sign Up</button></Link>
              <Link href="/dashboard"><div className="avatar">A</div></Link>
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer>
          <div className="foot">
            <div><b style={{ fontSize: 20 }}>Hamsafar</b><p style={{ marginTop: 8, maxWidth: 300, lineHeight: 1.6 }}>Safe Rides • Shared Journeys<br />Ride Together. Go Further.</p></div>
            <div><b>Explore</b><p style={{ marginTop: 10, lineHeight: 1.9 }}><Link href="/find" style={{ color: '#CDE8D8' }}>Find a Ride</Link><br /><Link href="/offer" style={{ color: '#CDE8D8' }}>Offer a Ride</Link><br /><Link href="/safety" style={{ color: '#CDE8D8' }}>Safety</Link></p></div>
            <div><b>Support</b><p style={{ marginTop: 10, lineHeight: 1.9 }}>support@hamsafar.pk<br />24/7 Help Center</p></div>
          </div>
        </footer>
      </body>
    </html>
  );
}
