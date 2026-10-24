'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/lib/lang';

export default function SideMenu() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const LINKS = [
    { href: '/', label: t('nav_home') },
    { href: '/find', label: t('nav_find') },
    { href: '/offer', label: t('nav_offer') },
    { href: '/recommendations', label: t('nav_recommendations') },
    { href: '/safety', label: t('nav_safety') },
    { href: '/sos', label: t('nav_sos') },
    { href: '/dashboard', label: t('nav_dashboard') },
  ];
  return (
    <>
      <button className="hamburger" aria-label={t('menu_open')} onClick={() => setOpen(true)}>☰</button>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
      <div className={open ? 'drawer open' : 'drawer'} aria-hidden={!open}>
        <div className="dhead">
          <span><b style={{ color: '#0C6B3F', fontSize: 19 }}>Hamsafar</b></span>
          <button className="dclose" aria-label={t('menu_close')} onClick={() => setOpen(false)}>✕</button>
        </div>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="dlink" onClick={() => setOpen(false)}>{l.label}</Link>
        ))}
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          <Link href="/login" onClick={() => setOpen(false)}><button className="btn outline" style={{ width: '100%' }}>{t('nav_login')}</button></Link>
          <Link href="/login" onClick={() => setOpen(false)}><button className="btn" style={{ width: '100%' }}>{t('nav_signup')}</button></Link>
        </div>
      </div>
    </>
  );
}
