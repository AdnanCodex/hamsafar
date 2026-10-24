'use client';
import { useState } from 'react';
import { useLang } from '@/lib/lang';

export default function OfferPage() {
  const { t } = useLang();
  const [form, setForm] = useState({ from_area: '', to_area: '', ride_date: '2026-10-25', ride_time: '08:30', seats_total: 3, price_per_seat: 350 });
  const [msg, setMsg] = useState('');
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setMsg(t('offer_posting'));
    const res = await fetch('/api/rides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setMsg(data.ok ? `✅ ${t('offer_posted')} (${data.source} ${t('offer_mode')})` : `❌ ${data.error}`);
  }

  return (
    <div className="container" style={{ paddingTop: 28, maxWidth: 820 }}>
      <h1>{t('offer_title')}</h1>
      <p style={{ color: '#64748B', marginTop: 6 }}>{t('offer_sub')}</p>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="grid4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <input className="input" placeholder={t('offer_from_ph')} value={form.from_area} onChange={(e) => set('from_area', e.target.value)} />
          <input className="input" placeholder={t('offer_to_ph')} value={form.to_area} onChange={(e) => set('to_area', e.target.value)} />
          <input className="input" type="date" value={form.ride_date} onChange={(e) => set('ride_date', e.target.value)} />
          <input className="input" type="time" value={form.ride_time} onChange={(e) => set('ride_time', e.target.value)} />
          <input className="input" type="number" value={form.seats_total} onChange={(e) => set('seats_total', Number(e.target.value))} placeholder={t('offer_seats_ph')} />
          <input className="input" type="number" value={form.price_per_seat} onChange={(e) => set('price_per_seat', Number(e.target.value))} placeholder={t('offer_price_ph')} />
        </div>
        <button className="btn" style={{ width: '100%', marginTop: 16 }} onClick={submit}>{t('offer_post')}</button>
        {msg && <p style={{ marginTop: 12, color: '#64748B' }}>{msg}</p>}
      </div>
    </div>
  );
}
