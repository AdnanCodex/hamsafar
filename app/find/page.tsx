'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLang } from '@/lib/lang';

interface Match {
  id: string;
  driver_name?: string;
  driver_rating?: number;
  from_area: string;
  to_area: string;
  ride_time: string;
  price_per_seat: number;
  seats_left: number;
  score: number;
  reasons: string[];
  trust: { score: number; label: string };
  source?: string; sourceUrl?: string;
  driver_verified?: boolean;
}

export default function FindPage() {
  const { t } = useLang();
  return (
    <Suspense fallback={<div className="container" style={{ paddingTop: 28 }}><h1>{t('find_title')}</h1><p>{t('find_loading')}</p></div>}>
      <FindInner />
    </Suspense>
  );
}

function FindInner() {
  const { t } = useLang();
  const params = useSearchParams();
  // Pakistan-wide: defaults are Hazara (Mansehra → Abbottabad); popular
  // routes on Home pass ?from=&to= for any route in the country.
  const [from, setFrom] = useState(params.get('from') || 'Mansehra');
  const [to, setTo] = useState(params.get('to') || 'Abbottabad');
  const [womenOnly, setWomenOnly] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function search() {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, womenOnly }),
      });
      const data = await res.json();
      setMatches(data.matches || []);
      setMsg(data.note || `${(data.matches || []).length} ${t('find_found')} (${t('find_sources')}: ${(data.sources || []).join(', ') || data.source})`);
    } catch {
      setMsg(t('find_fail'));
    }
    setBusy(false);
  }

  async function book(r: Match) {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ride_id: r.id, seats: 1, total_price: r.price_per_seat + (r.price_per_seat >= 1000 ? 50 : 20) }),
    });
    const data = await res.json();
    alert(data.ok ? `✅ ${t('find_book_ok')}` : `❌ ${data.error || t('find_book_fail')}`);
  }

  return (
    <div className="container" style={{ paddingTop: 28 }}>
      <h1>{t('find_title')}</h1>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="grid4">
          <input className="input" value={from} onChange={(e) => setFrom(e.target.value)} placeholder={t('find_from_ph')} />
          <input className="input" value={to} onChange={(e) => setTo(e.target.value)} placeholder={t('find_to_ph')} />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 700 }}>
            <input type="checkbox" checked={womenOnly} onChange={(e) => setWomenOnly(e.target.checked)} /> {t('find_women')}
          </label>
          <button className="btn" onClick={search} disabled={busy}>{busy ? t('find_searching') : t('find_match')}</button>
        </div>
        {msg && <p style={{ color: '#64748B', marginTop: 10 }}>{msg}</p>}
      </div>
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {matches.map((r) => (
          <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <b>{r.driver_name || t('find_driver')}</b> <span style={{ color: '#F59E0B' }}>★ {r.driver_rating}</span>{' '}
              {r.driver_verified === true
                ? <span style={{ background: '#DCFCE7', color: '#166534', borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>{t('find_verified')}</span>
                : r.driver_verified === false
                  ? <span style={{ background: '#FEF3C7', color: '#92400E', borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>{t('find_pending')}</span>
                  : null}
              <span className="badge">{t('find_match_lbl')} {r.score}%</span> <span className="badge">{r.trust.label} ({r.trust.score})</span>
              <p style={{ color: '#64748B', marginTop: 6 }}>{r.from_area} → {r.to_area} • {r.ride_time} • {r.seats_left} {t('find_seats_left')}</p>
              <p style={{ color: '#64748B', fontSize: 13 }}>{r.reasons.join(' • ')}</p>
              {r.source && <p style={{ fontSize: 13 }}>{t('find_source')} <b>{r.source}</b>{r.sourceUrl && <> • <a href={r.sourceUrl} target="_blank" rel="noreferrer">{t('find_view_orig')}</a></>}</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <b style={{ fontSize: 21, color: '#0C6B3F' }}>PKR {r.price_per_seat}</b><br />
              <small style={{ color: '#64748B' }}>{t('find_per_seat')}</small><br />
              <button className="btn" style={{ marginTop: 10 }} onClick={() => book(r)}>{t('find_book')}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
