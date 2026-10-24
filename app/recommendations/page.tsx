'use client';
import { useState } from 'react';
import { useLang } from '@/lib/lang';

interface Rec {
  id: string; driver_name?: string; driver_rating?: number;
  from_area: string; to_area: string; ride_time: string;
  price_per_seat: number; seats_left: number; score: number; reasons: string[];
  classification?: string; probability?: number; source?: string; sourceUrl?: string; driver_verified?: boolean;
}

// Recommendations page — multi-source AI recommendations UI.
// Classification comes from the trained model; source is shown per ride.
// Demo data is always labelled — never presented as real rides.
export default function RecommendationsPage() {
  const { lang, t } = useLang();
  const [from, setFrom] = useState('Mansehra');
  const [to, setTo] = useState('Abbottabad');
  const [womenOnly, setWomenOnly] = useState(false);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [model, setModel] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  // In-app booking for external rides — the rider never gets redirected away.
  const [bookingRide, setBookingRide] = useState<Rec | null>(null);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [bookingReq, setBookingReq] = useState<{ id: string; status: string; total_price: number } | null>(null);
  const [bookingMsg, setBookingMsg] = useState('');

  async function load() {
    setBusy(true); setMsg('');
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, womenOnly, limit: 10 }),
      });
      const data = await res.json();
      setRecs(data.matches || []);
      setSources(data.sources || []);
      setModel(data.model || '');
      setNote(data.note || '');
      setMsg(`${(data.matches || []).length} ${t('rec_count')} • ${t('rec_sources')} ${(data.sources || []).join(', ') || '—'} • ${t('rec_model')} ${data.model || '—'}`);
    } catch { setMsg(t('rec_fail')); }
    setBusy(false);
  }

  async function requestExternalBooking() {
    if (!bookingRide) return;
    setBookingMsg(t('rec_sending_req'));
    const res = await fetch('/api/bookings/external', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request', ride: bookingRide, seats: bookingSeats }),
    });
    const data = await res.json();
    if (data.ok) { setBookingReq(data.request); setBookingMsg(data.note || t('rec_req_ok')); }
    else setBookingMsg(data.error || t('rec_req_fail'));
  }

  async function confirmExternalBooking() {
    if (!bookingReq) return;
    const res = await fetch('/api/bookings/external', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', requestId: bookingReq.id }),
    });
    const data = await res.json();
    if (data.ok) { setBookingReq(data.request); setBookingMsg(t('rec_booking_confirmed_msg')); }
    else setBookingMsg(data.error || t('rec_confirm_fail'));
  }

  async function feedback(r: Rec, outcome: 'booked' | 'dismissed') {
    const res = await fetch('/api/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rideId: r.id, source: r.source, outcome }),
    });
    const data = await res.json();
    setMsg(data.stored ? t('rec_feedback_thanks') : (data.reason || t('rec_feedback_noted')));
  }

  return (
    <div className="container" style={{ paddingTop: 28 }}>
      <h1>{t('rec_title')}</h1>
      <p style={{ color: '#64748B', marginTop: 6 }}>{t('rec_sub')}</p>
      {note && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: '#FEF3C7', fontWeight: 700, fontSize: 14 }}>
          {note}
        </div>
      )}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="grid4">
          <input className="input" value={from} onChange={(e) => setFrom(e.target.value)} placeholder={t('rec_from_ph')} />
          <input className="input" value={to} onChange={(e) => setTo(e.target.value)} placeholder={t('rec_to_ph')} />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 700 }}>
            <input type="checkbox" checked={womenOnly} onChange={(e) => setWomenOnly(e.target.checked)} /> {t('rec_women')}
          </label>
          <button className="btn" onClick={load} disabled={busy}>{busy ? t('rec_loading') : t('rec_get')}</button>
        </div>
        {msg && <p style={{ color: '#64748B', marginTop: 10 }}>{msg}</p>}
      </div>
      {bookingRide && (
        <div className="card" style={{ marginTop: 18, border: '2px solid #0C6B3F' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <h2 style={{ fontSize: 20 }}>{t('rec_book_panel')} {bookingRide.from_area} → {bookingRide.to_area}</h2>
            <button className="btn outline" style={{ padding: '8px 14px' }} onClick={() => { setBookingRide(null); setBookingReq(null); setBookingMsg(''); }}>{t('rec_close')}</button>
          </div>
          {!bookingReq ? (
            <>
              <p style={{ color: '#64748B', marginTop: 8 }}>
                {bookingRide.ride_time} • PKR {bookingRide.price_per_seat} {t('find_per_seat')} • {t('find_source')} {bookingRide.source} •
                Hamsafar fee: <b>PKR 0</b> {t('rec_fee_note')}
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ fontWeight: 700 }}>{t('rec_seats')}
                  <select className="input" style={{ width: 90, marginLeft: 8 }} value={bookingSeats} onChange={(e) => setBookingSeats(Number(e.target.value))}>
                    {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <b style={{ fontSize: 18 }}>{t('rec_total')} {bookingRide.price_per_seat * bookingSeats}</b>
                <button className="btn" onClick={requestExternalBooking}>{t('rec_request')}</button>
              </div>
            </>
          ) : bookingReq.status === 'pending_driver_confirmation' ? (
            <>
              <p style={{ marginTop: 10 }}><b>{t('rec_step1')}</b> {t('rec_step1_txt')} {bookingReq.id}).</p>
              <p style={{ marginTop: 6 }}><b>{t('rec_step2')}</b> {t('rec_step2_txt')}</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {bookingRide.sourceUrl && <a href={bookingRide.sourceUrl} target="_blank" rel="noreferrer"><button className="btn outline">{lang === 'ur' ? `${bookingRide.source} ${t('rec_contact_driver')} ↗` : `${t('rec_contact_driver')} ${bookingRide.source} ↗`}</button></a>}
                <button className="btn" onClick={confirmExternalBooking}>{t('rec_driver_confirmed')}</button>
              </div>
            </>
          ) : (
            <p style={{ marginTop: 10, fontWeight: 700, color: '#0C6B3F' }}>✓ {t('rec_confirmed_full')} {bookingReq.id}). {t('rec_total')} {bookingReq.total_price} {t('rec_confirmed_pay')}</p>
          )}
          {bookingMsg && <p style={{ color: '#64748B', marginTop: 10 }}>{bookingMsg}</p>}
        </div>
      )}
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {recs.map((r, i) => (
          <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <b>#{i + 1} {r.driver_name || t('find_driver')}</b> <span style={{ color: '#F59E0B' }}>★ {r.driver_rating}</span>{' '}
              {r.driver_verified === true
                ? <span style={{ background: '#DCFCE7', color: '#166534', borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>{t('find_verified')}</span>
                : r.driver_verified === false
                  ? <span style={{ background: '#FEF3C7', color: '#92400E', borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>{t('find_pending')}</span>
                  : null}
              <span className="badge">{t('rec_score')} {r.score}%</span>{' '}
              {r.classification && <span className="badge" style={{ background: r.classification === 'Recommended' ? '#DCFCE7' : '#FEE2E2', color: r.classification === 'Recommended' ? '#166534' : '#991B1B' }}>{r.classification === 'Recommended' ? t('rec_recommended') : r.classification} ({r.probability})</span>}
              <p style={{ color: '#64748B', marginTop: 6 }}>{r.from_area} → {r.to_area} • {r.ride_time} • {r.seats_left} {t('find_seats_left')}</p>
              <p style={{ color: '#64748B', fontSize: 13 }}>{r.reasons.join(' • ')}</p>
              <p style={{ fontSize: 13 }}>{t('find_source')} <b>{r.source || sources.join(', ')}</b>{r.sourceUrl && <> • <a href={r.sourceUrl} target="_blank" rel="noreferrer">{t('rec_view_orig')}</a></>}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {r.sourceUrl && <button className="btn" style={{ padding: '8px 14px' }} onClick={() => { setBookingRide(r); setBookingReq(null); setBookingMsg(''); setBookingSeats(1); }}>{t('rec_book_in')}</button>}
                <button className="btn outline" style={{ padding: '8px 14px' }} onClick={() => feedback(r, 'booked')}>{t('rec_booked_good')}</button>
                <button className="btn outline" style={{ padding: '8px 14px' }} onClick={() => feedback(r, 'dismissed')}>{t('rec_not_relevant')}</button>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <b style={{ fontSize: 21, color: '#0C6B3F' }}>PKR {r.price_per_seat}</b><br />
              <small style={{ color: '#64748B' }}>{t('find_per_seat')} • {t('rec_model')} {model}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
