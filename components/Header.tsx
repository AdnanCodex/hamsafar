'use client';
import { useState } from 'react';
import Link from 'next/link';
import SideMenu from '@/components/SideMenu';
import { useLang } from '@/lib/lang';

export default function Header() {
  const { lang, setLang, t } = useLang();
  const [langOpen, setLangOpen] = useState(false);
  return (
    <header>
      <div className="nav">
        <SideMenu />
        <Link href="/" className="brand">
          <img src="/logo.png" alt="Hamsafar" style={{ height: 42, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
          <span><b>Hamsafar</b><small>{t('brand_tag')}</small></span>
        </Link>
        <nav className="navlinks">
          <Link href="/">{t('nav_home')}</Link>
          <Link href="/find">{t('nav_find')}</Link>
          <Link href="/safety">{t('nav_safety')}</Link>
        </nav>
        <div className="navright">
          <div className="langwrap">
            <button className="pill" onClick={() => setLangOpen((o) => !o)} aria-label="Language">
              {lang === 'ur' ? 'اردو ▾' : 'EN ▾'}
            </button>
            {langOpen && (
              <>
                <div className="langbackdrop" onClick={() => setLangOpen(false)} />
                <div className="langmenu">
                  <button className={lang === 'en' ? 'sel' : ''} onClick={() => { setLang('en'); setLangOpen(false); }}>
                    {lang === 'ur' ? '✓ ' : ''}English
                  </button>
                  <button className={lang === 'ur' ? 'sel' : ''} onClick={() => { setLang('ur'); setLangOpen(false); }}>
                    {lang === 'ur' ? '✓ ' : ''}اردو
                  </button>
                </div>
              </>
            )}
          </div>
          <Link href="/dashboard"><div className="avatar">A</div></Link>
        </div>
      </div>
    </header>
  );
}
