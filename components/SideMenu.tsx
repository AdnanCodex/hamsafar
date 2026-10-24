'use client';
import { useState } from 'react';
import Link from 'next/link';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/find', label: 'Find a Ride' },
  { href: '/offer', label: 'Offer a Ride' },
  { href: '/recommendations', label: 'Recommendations' },
  { href: '/safety', label: 'Safety' },
  { href: '/sos', label: 'SOS' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function SideMenu() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="hamburger" aria-label="Open menu" onClick={() => setOpen(true)}>☰</button>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
      <div className={open ? 'drawer open' : 'drawer'} aria-hidden={!open}>
        <div className="dhead">
          <span><b style={{ color: '#0C6B3F', fontSize: 19 }}>Hamsafar</b></span>
          <button className="dclose" aria-label="Close menu" onClick={() => setOpen(false)}>✕</button>
        </div>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="dlink" onClick={() => setOpen(false)}>{l.label}</Link>
        ))}
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          <Link href="/login" onClick={() => setOpen(false)}><button className="btn outline" style={{ width: '100%' }}>Login</button></Link>
          <Link href="/login" onClick={() => setOpen(false)}><button className="btn" style={{ width: '100%' }}>Sign Up</button></Link>
        </div>
      </div>
    </>
  );
}
