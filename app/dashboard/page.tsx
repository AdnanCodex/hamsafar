'use client';
import Link from 'next/link';
import { useLang } from '@/lib/lang';

// Dashboard — middleware only opens this page when logged in.
// HONEST STATE: stats and upcoming rides come from real activity only.
// Previously this page showed hardcoded numbers (12 rides, PKR 2,850
// savings, a demo upcoming ride) — invented data on a real user's page.
// Until live rides/bookings exist, it shows empty states, not fake totals.
export default function DashboardPage() {
  const { lang, t } = useLang();
  return (
    <div className="container" style={{ paddingTop: 28 }}>
      <h1>{t('dash_title')}</h1>
      <p style={{ color: '#64748B', marginTop: 6 }}>{t('dash_sub')}</p>
      <div className="grid4" style={{ marginTop: 16 }}>
        <div className="card"><b style={{ fontSize: 26, color: '#0C6B3F' }}>0</b><br /><small style={{ color: '#64748B' }}>{t('dash_total_rides')}</small></div>
        <div className="card"><b style={{ fontSize: 26, color: '#0C6B3F' }}>—</b><br /><small style={{ color: '#64748B' }}>{t('dash_avg_rating')}</small></div>
        <div className="card"><b style={{ fontSize: 26, color: '#0C6B3F' }}>PKR 0</b><br /><small style={{ color: '#64748B' }}>{t('dash_savings')}</small></div>
        <div className="card"><b style={{ fontSize: 26, color: '#0C6B3F' }}>—</b><br /><small style={{ color: '#64748B' }}>{t('dash_safe_rides')}</small></div>
      </div>
      <p style={{ color: '#64748B', marginTop: 10 }}>{t('dash_no_activity')}</p>
      <div className="grid3" style={{ marginTop: 16 }}>
        <div className="card"><b>{t('dash_quick')}</b>
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            <Link href="/find"><button className="btn outline" style={{ width: '100%' }}>🔍 {t('nav_find')}</button></Link>
            <Link href="/recommendations"><button className="btn outline" style={{ width: '100%' }}>🎯 {t('nav_recommendations')}</button></Link>
            <Link href="/offer"><button className="btn outline" style={{ width: '100%' }}>🚗 {t('nav_offer')}</button></Link>
            <Link href="/sos"><button className="btn outline" style={{ width: '100%', color: '#B91C1C', borderColor: '#FECACA' }}>🚨 {t('nav_sos')} / {t('nav_safety')}</button></Link>
          </div>
        </div>
        <div className="card"><b>{t('dash_upcoming')}</b><p style={{ color: '#64748B', marginTop: 8 }}>{t('dash_no_upcoming')}</p><Link href="/find"><button className="btn" style={{ marginTop: 10 }}>{t('nav_find')} {lang === 'ur' ? '←' : '→'}</button></Link></div>
        <div className="card"><b>{t('dash_verif')}</b><p style={{ color: '#64748B', marginTop: 8 }}>{t('dash_verif_txt')}</p><Link href="/onboarding"><button className="btn" style={{ marginTop: 10 }}>{t('dash_onboarding')}</button></Link></div>
      </div>
    </div>
  );
}
