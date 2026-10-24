'use client';
import Link from 'next/link';
import { useLang } from '@/lib/lang';

export default function SafetyPage() {
  const { t } = useLang();
  return (
    <div className="container" style={{ paddingTop: 28 }}>
      <h1>{t('safety_title')}</h1>
      <p style={{ color: '#64748B', marginTop: 8, maxWidth: 640, lineHeight: 1.6 }}>{t('safety_sub')}</p>
      <div className="grid4" style={{ marginTop: 16 }}>
        <div className="card"><b>{t('saf1t')}</b><p style={{ color: '#64748B', marginTop: 8 }}>{t('saf1d')}</p></div>
        <div className="card"><b>{t('saf2t')}</b><p style={{ color: '#64748B', marginTop: 8 }}>{t('saf2d')}</p></div>
        <div className="card"><b>{t('saf3t')}</b><p style={{ color: '#64748B', marginTop: 8 }}>{t('saf3d')}</p></div>
        <div className="card"><b>{t('saf4t')}</b><p style={{ color: '#64748B', marginTop: 8 }}>{t('saf4d')}</p></div>
      </div>
      <div className="card" style={{ background: '#0C6B3F', color: '#fff', marginTop: 16 }}>
        <b style={{ color: '#fff' }}>{t('saf_emg')}</b>
        <p style={{ opacity: 0.9, marginTop: 8 }}>{t('saf_emg_txt')}</p>
        <Link href="/sos"><button className="btn" style={{ background: '#B91C1C', marginTop: 12 }}>{t('saf_goto')}</button></Link>
      </div>
    </div>
  );
}
