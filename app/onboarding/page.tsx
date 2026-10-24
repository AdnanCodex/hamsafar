'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

// Rider onboarding — COMPLETE verification dataset, then list.
// Rule: nobody is listed on a half-filled form. Once all data + documents
// are submitted, the rider appears in listings with a 'Verification pending'
// badge; the badge becomes 'Verified' only after admin approval.
// Full CNIC is never stored in plaintext (server stores hash + last4 only).
const TEXT_FIELDS = [
  { k: 'full_name', label: 'Full Name' },
  { k: 'phone', label: 'Phone (03XX-XXXXXXX)' },
  { k: 'cnic', label: 'CNIC (XXXXX-XXXXXXX-X)' },
  { k: 'dob', label: 'Date of Birth', type: 'date' },
  { k: 'address', label: 'Home Address' },
  { k: 'city', label: 'City' },
  { k: 'emergency_contact_name', label: 'Emergency Contact Name' },
  { k: 'emergency_contact_phone', label: 'Emergency Contact Phone (03XX-XXXXXXX)' },
];
const DRIVER_FIELDS = [
  { k: 'licence_number', label: 'Driving Licence Number' },
  { k: 'vehicle_make', label: 'Vehicle Make (e.g. Toyota)' },
  { k: 'vehicle_model', label: 'Vehicle Model (e.g. Corolla)' },
  { k: 'vehicle_year', label: 'Vehicle Year (e.g. 2020)' },
  { k: 'vehicle_plate', label: 'Vehicle Number Plate' },
];
const COMMON_DOCS = [
  { k: 'cnic_front', label: 'CNIC Front Photo' },
  { k: 'cnic_back', label: 'CNIC Back Photo' },
  { k: 'selfie', label: 'Selfie (face photo)' },
];
const DRIVER_DOCS = [
  { k: 'licence', label: 'Driving Licence Photo' },
  { k: 'vehicle_registration', label: 'Vehicle Registration Photo' },
];

export default function OnboardingPage() {
  const [form, setForm] = useState<Record<string, string>>({ role: 'rider' });
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [msg, setMsg] = useState('');
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isDriver = form.role === 'driver' || form.role === 'both';
  const docs = isDriver ? [...COMMON_DOCS, ...DRIVER_DOCS] : COMMON_DOCS;

  async function submit() {
    setMsg('Saving…');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    for (const d of docs) if (files[d.k]) fd.append(d.k, files[d.k] as File);
    const headers: Record<string, string> = {};
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
    } catch { /* demo mode */ }
    const res = await fetch('/api/profile', { method: 'POST', headers, body: fd });
    const data = await res.json();
    if (!res.ok) setMsg(`❌ ${data.error}`);
    else setMsg(`✅ ${data.profile?.full_name || 'Profile'} submitted for verification! You will appear in listings with a "Verification pending" badge — it becomes "Verified" after admin approval.`);
  }

  const field = (f: { k: string; label: string; type?: string }) => (
    <input key={f.k} className="input" style={{ marginTop: 10 }} type={f.type || 'text'} placeholder={f.label}
      value={form[f.k] || ''} onChange={(e) => set(f.k, e.target.value)} />
  );

  return (
    <div className="container" style={{ paddingTop: 28, maxWidth: 640 }}>
      <h1>Rider Onboarding — Complete Verification Data</h1>
      <p style={{ color: '#64748B', marginTop: 6 }}>
        All fields and documents below are required. Once submitted, you appear in the rides list with a
        <b> “Verification pending”</b> badge — the badge becomes <b>“Verified”</b> only after admin approval.
        Your full CNIC is never stored in plaintext.
      </p>
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ margin: 0 }}>Personal Details</h3>
        {TEXT_FIELDS.map(field)}
        <select className="input" style={{ marginTop: 10 }} value={form.role} onChange={(e) => set('role', e.target.value)}>
          <option value="rider">Rider (find rides)</option>
          <option value="driver">Driver (offer rides)</option>
          <option value="both">Both</option>
        </select>
        {isDriver && (
          <>
            <h3 style={{ margin: '18px 0 0' }}>Driver & Vehicle Details</h3>
            {DRIVER_FIELDS.map(field)}
          </>
        )}
        <h3 style={{ margin: '18px 0 0' }}>Verification Documents</h3>
        <p style={{ color: '#64748B', fontSize: 13, margin: '4px 0 0' }}>Photos are uploaded to secure private storage in live mode.</p>
        {docs.map((d) => (
          <label key={d.k} style={{ display: 'block', marginTop: 10, color: '#334155', fontSize: 14 }}>
            {d.label}
            <input className="input" style={{ marginTop: 4 }} type="file" accept="image/*"
              onChange={(e) => setFiles((f) => ({ ...f, [d.k]: e.target.files?.[0] || null }))} />
          </label>
        ))}
        <button className="btn" style={{ width: '100%', marginTop: 16 }} onClick={submit}>Submit Complete Data for Verification →</button>
        {msg && <p style={{ marginTop: 12, color: '#64748B', lineHeight: 1.6 }}>{msg}</p>}
      </div>
    </div>
  );
}
