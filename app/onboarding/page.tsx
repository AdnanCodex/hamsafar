'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang, type DictKey } from '@/lib/lang';

// Rider onboarding — COMPLETE verification dataset, then list.
// Rule: nobody is listed on a half-filled form. Once all data + documents
// are submitted, the rider appears in listings with a 'Verification pending'
// badge; the badge becomes 'Verified' only after admin approval.
// Full CNIC is never stored in plaintext (server stores hash + last4 only).
const TEXT_FIELDS: { k: string; labelKey: DictKey; type?: string }[] = [
  { k: 'full_name', labelKey: 'f_full_name' },
  { k: 'phone', labelKey: 'f_phone' },
  { k: 'cnic', labelKey: 'f_cnic' },
  { k: 'dob', labelKey: 'f_dob', type: 'date' },
  { k: 'address', labelKey: 'f_address' },
  { k: 'city', labelKey: 'f_city' },
  { k: 'emergency_contact_name', labelKey: 'f_emg_name' },
  { k: 'emergency_contact_phone', labelKey: 'f_emg_phone' },
];
const DRIVER_FIELDS: { k: string; labelKey: DictKey }[] = [
  { k: 'licence_number', labelKey: 'f_lic_no' },
  { k: 'vehicle_make', labelKey: 'f_veh_make' },
  { k: 'vehicle_model', labelKey: 'f_veh_model' },
  { k: 'vehicle_year', labelKey: 'f_veh_year' },
  { k: 'vehicle_plate', labelKey: 'f_veh_plate' },
];
const COMMON_DOCS: { k: string; labelKey: DictKey }[] = [
  { k: 'cnic_front', labelKey: 'd_cnic_front' },
  { k: 'cnic_back', labelKey: 'd_cnic_back' },
  { k: 'selfie', labelKey: 'd_selfie' },
];
const DRIVER_DOCS: { k: string; labelKey: DictKey }[] = [
  { k: 'licence', labelKey: 'd_lic' },
  { k: 'vehicle_registration', labelKey: 'd_veh_reg' },
];

export default function OnboardingPage() {
  const { t } = useLang();
  const [form, setForm] = useState<Record<string, string>>({ role: 'rider' });
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [msg, setMsg] = useState('');
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isDriver = form.role === 'driver' || form.role === 'both';
  const docs = isDriver ? [...COMMON_DOCS, ...DRIVER_DOCS] : COMMON_DOCS;

  async function submit() {
    setMsg(t('onb_saving'));
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
    else setMsg(`✅ ${data.profile?.full_name || 'Profile'} ${t('onb_success_a')}`);
  }

  const field = (f: { k: string; labelKey: DictKey; type?: string }) => (
    <input key={f.k} className="input" style={{ marginTop: 10 }} type={f.type || 'text'} placeholder={t(f.labelKey)}
      value={form[f.k] || ''} onChange={(e) => set(f.k, e.target.value)} />
  );

  return (
    <div className="container" style={{ paddingTop: 28, maxWidth: 640 }}>
      <h1>{t('onb_title')}</h1>
      <p style={{ color: '#64748B', marginTop: 6 }}>{t('onb_intro')}</p>
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ margin: 0 }}>{t('onb_personal')}</h3>
        {TEXT_FIELDS.map(field)}
        <select className="input" style={{ marginTop: 10 }} value={form.role} onChange={(e) => set('role', e.target.value)}>
          <option value="rider">{t('onb_rider_opt')}</option>
          <option value="driver">{t('onb_driver_opt')}</option>
          <option value="both">{t('onb_both_opt')}</option>
        </select>
        {isDriver && (
          <>
            <h3 style={{ margin: '18px 0 0' }}>{t('onb_driver_title')}</h3>
            {DRIVER_FIELDS.map(field)}
          </>
        )}
        <h3 style={{ margin: '18px 0 0' }}>{t('onb_docs_title')}</h3>
        <p style={{ color: '#64748B', fontSize: 13, margin: '4px 0 0' }}>{t('onb_docs_note')}</p>
        {docs.map((d) => (
          <label key={d.k} style={{ display: 'block', marginTop: 10, color: '#334155', fontSize: 14 }}>
            {t(d.labelKey)}
            <input className="input" style={{ marginTop: 4 }} type="file" accept="image/*"
              onChange={(e) => setFiles((f) => ({ ...f, [d.k]: e.target.files?.[0] || null }))} />
          </label>
        ))}
        <button className="btn" style={{ width: '100%', marginTop: 16 }} onClick={submit}>{t('onb_submit')}</button>
        {msg && <p style={{ marginTop: 12, color: '#64748B', lineHeight: 1.6 }}>{msg}</p>}
      </div>
    </div>
  );
}
