'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Contact { name: string; phone: string; relation: string; }

// SOS page — bara red SOS button + emergency contacts (browser me save hote hain,
// live mode me Supabase emergency_contacts table me jayenge).
export default function SosPage() {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try { return JSON.parse(localStorage.getItem('hamsafar-contacts') || '[]'); } catch { return []; }
  });
  const [form, setForm] = useState({ name: '', phone: '', relation: '' });
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [liveSync, setLiveSync] = useState(false);

  // Live mode (logged in): contacts come from Supabase so SOS alerts can
  // notify them. Otherwise they stay in this browser's storage.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const res = await fetch('/api/contacts', { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (res.ok && Array.isArray(json.contacts)) { setContacts(json.contacts); setLiveSync(true); }
      } catch { /* browser storage fallback */ }
    })();
  }, []);

  async function addContact() {
    if (!form.name.trim() || !form.phone.trim()) { setStatus('⚠️ Both name and phone are required.'); return; }
    if (liveSync) {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        const res = await fetch('/api/contacts', {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (!res.ok) { setStatus(`❌ ${json.error || 'Could not save contact.'}`); return; }
        setContacts((c) => [...c, json.contact]);
        setForm({ name: '', phone: '', relation: '' });
        setStatus('✅ Emergency contact saved to your account.');
        return;
      } catch { /* fall through to browser storage */ }
    }
    const next = [...contacts, form];
    setContacts(next);
    try { localStorage.setItem('hamsafar-contacts', JSON.stringify(next)); } catch { /* ignore */ }
    setForm({ name: '', phone: '', relation: '' });
    setStatus('✅ Emergency contact saved in this browser.');
  }

  async function sendSos() {
    if (!confirm('Send SOS? An emergency alert will go out with your live location.')) return;
    setSending(true);
    setStatus('🚨 Sending SOS…');
    let lat: number | null = null, lng: number | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }));
      lat = pos.coords.latitude; lng = pos.coords.longitude;
    } catch { /* location ke baghair bhi alert jayega */ }
    const res = await fetch('/api/sos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng, message: 'Emergency! I need help on my Hamsafar trip.' }),
    });
    const data = await res.json();
    setSending(false);
    setStatus(data.ok
      ? `🚨 SOS alert sent! Alert ID: ${data.alert?.id || '—'}${lat ? ` • Location: ${lat.toFixed(4)}, ${lng?.toFixed(4)}` : ' • Location not available (allow location permission to include it)'}. ${contacts.length ? `Contacts: ${contacts.map((c) => c.name).join(', ')}` : 'No emergency contact saved — add one above.'} ${data.note || ''}`
      : `❌ SOS failed: ${data.error || 'please try again'}`);
  }

  return (
    <div className="container" style={{ paddingTop: 28, maxWidth: 720 }}>
      <h1>🚨 SOS — Emergency</h1>
      <p style={{ color: '#64748B', marginTop: 6 }}>Press SOS in an emergency — an alert is saved with your live location, and in live mode your emergency contacts are notified.</p>
      <div className="card" style={{ textAlign: 'center', marginTop: 16, background: '#FEF2F2' }}>
        <button
          onClick={sendSos} disabled={sending}
          style={{ width: 160, height: 160, borderRadius: '50%', border: '6px solid #FECACA', background: '#DC2626', color: '#fff', fontSize: 32, fontWeight: 900, cursor: 'pointer' }}>
          {sending ? '…' : 'SOS'}
        </button>
        <p style={{ marginTop: 12, fontWeight: 700 }}>Tap to send emergency alert</p>
        {status && <p style={{ marginTop: 10, lineHeight: 1.6, color: '#33473B' }}>{status}</p>}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 20 }}>Emergency Contacts {liveSync ? '(saved to your account)' : '(saved in this browser)'}</h2>
        {contacts.length === 0 && <p style={{ color: '#64748B', marginTop: 8 }}>No contacts yet — add one below.</p>}
        {contacts.map((c, i) => (
          <p key={i} style={{ marginTop: 8 }}>👤 <b>{c.name}</b> — {c.phone}{c.relation ? ` (${c.relation})` : ''}</p>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <input className="input" style={{ flex: 1, minWidth: 140 }} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" style={{ flex: 1, minWidth: 140 }} placeholder="Phone 03XX-XXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" style={{ flex: 1, minWidth: 120 }} placeholder="Relation (optional)" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} />
          <button className="btn" onClick={addContact}>Add Contact</button>
        </div>
      </div>
    </div>
  );
}
