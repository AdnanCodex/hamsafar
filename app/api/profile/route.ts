import { NextResponse } from 'next/server';
import { supabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { getAuthedUser, unauthorizedResponse } from '@/lib/auth';
import { isValidCnic, hashCnic, cnicLast4, formatCnic, isValidPhonePK, sanitizeText } from '@/lib/validation';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

// POST /api/profile — a new rider submits their COMPLETE verification dataset.
// LISTING RULE: a rider is listed only after this full submission. The rider
// then appears with 'Verification pending' until an admin approves, when the
// badge becomes 'Verified'. Nobody is listed on a half-filled form.
// Accepts multipart FormData (file uploads) or JSON (document attestation).
// Full CNIC is NEVER stored — only SHA-256 hash + last4 + masked display.
// Live mode uploads document files to the private Supabase Storage bucket
// 'verification-documents'; demo mode records the document types only.

const COMMON_DOCS = ['cnic_front', 'cnic_back', 'selfie'];
const DRIVER_DOCS = ['licence', 'vehicle_registration'];

function isValidDob(dob: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false;
  const d = new Date(dob + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dob && d <= new Date();
}

export async function POST(req: Request) {
  const rl = rateLimit(req, 'write');
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  const contentType = req.headers.get('content-type') || '';
  let fields: Record<string, string> = {};
  let fileDocs: Record<string, File> = {};
  let attestedDocs: string[] = [];
  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    form.forEach((v, k) => {
      if (v instanceof File) fileDocs[k] = v;
      else fields[k] = String(v);
    });
  } else {
    const body = await req.json().catch(() => ({}));
    Object.entries(body || {}).forEach(([k, v]) => { fields[k] = String(v ?? ''); });
    if (Array.isArray((body as any).documents_submitted)) attestedDocs = (body as any).documents_submitted.map(String);
  }

  const fullName = sanitizeText(fields.full_name, 100);
  const phone = (fields.phone || '').trim();
  const cnic = fields.cnic || '';
  const dob = fields.dob || '';
  const address = sanitizeText(fields.address, 200);
  const city = sanitizeText(fields.city, 100);
  const ecName = sanitizeText(fields.emergency_contact_name, 100);
  const ecPhone = (fields.emergency_contact_phone || '').trim();
  const role = fields.role === 'driver' || fields.role === 'both' ? fields.role : 'rider';
  const isDriver = role !== 'rider';
  const licence = sanitizeText(fields.licence_number, 50);
  const vMake = sanitizeText(fields.vehicle_make, 50);
  const vModel = sanitizeText(fields.vehicle_model, 50);
  const vYear = fields.vehicle_year || '';
  const vPlate = sanitizeText(fields.vehicle_plate, 20);
  const currentYear = new Date().getFullYear();
  const submittedDocs = Array.from(new Set([
    ...Object.keys(fileDocs).filter((k) => k !== 'photo'),
    ...attestedDocs,
  ]));

  const missing: string[] = [];
  if (!fullName) missing.push('full_name');
  if (!isValidPhonePK(phone)) missing.push('phone (03XX-XXXXXXX)');
  if (!isValidCnic(cnic)) missing.push('cnic (13 digits)');
  if (!isValidDob(dob)) missing.push('dob (YYYY-MM-DD, past date)');
  if (!address) missing.push('address');
  if (!city) missing.push('city');
  if (!ecName) missing.push('emergency_contact_name');
  if (!isValidPhonePK(ecPhone)) missing.push('emergency_contact_phone (03XX-XXXXXXX)');
  if (isDriver) {
    if (!licence) missing.push('licence_number');
    if (!vMake) missing.push('vehicle_make');
    if (!vModel) missing.push('vehicle_model');
    if (!/^\d{4}$/.test(vYear) || Number(vYear) < 1980 || Number(vYear) > currentYear + 1) missing.push('vehicle_year (1980-' + (currentYear + 1) + ')');
    if (!vPlate) missing.push('vehicle_plate');
  }
  const requiredDocs = isDriver ? [...COMMON_DOCS, ...DRIVER_DOCS] : COMMON_DOCS;
  const missingDocs = requiredDocs.filter((d) => !submittedDocs.includes(d));
  if (missingDocs.length) missing.push('documents: ' + missingDocs.join(', '));
  if (missing.length) {
    return NextResponse.json({ error: 'Complete verification data is required before listing. Missing: ' + missing.join(', ') }, { status: 400 });
  }

  const profileData = {
    full_name: fullName,
    phone,
    role,
    cnic_hash: hashCnic(cnic),
    cnic_last4: cnicLast4(cnic),
    cnic_display: formatCnic(cnic).replace(/^\d{5}-\d{4}/, '*****-****'),
    dob,
    address,
    city,
    emergency_contact_name: ecName,
    emergency_contact_phone: ecPhone,
    licence_number: isDriver ? licence : null,
    vehicle_make: isDriver ? vMake : null,
    vehicle_model: isDriver ? vModel : null,
    vehicle_year: isDriver ? Number(vYear) : null,
    vehicle_plate: isDriver ? vPlate : null,
    documents_submitted: submittedDocs,
    verification_status: 'pending',
    cnic_verified: false,
  };
  const publicProfile = { ...profileData, cnic_hash: '[hidden]' };

  if (!supabaseConfigured) {
    return NextResponse.json({
      ok: true,
      source: 'demo',
      profile: publicProfile,
      submission: { status: 'pending', documents: submittedDocs, note: 'Demo mode: document files are not stored without Supabase Storage.' },
      next: 'Your data is submitted for verification. You will appear in listings with a "Verification pending" badge; the badge becomes "Verified" after admin approval.',
    });
  }
  const user = await getAuthedUser(req);
  if (!user) return unauthorizedResponse();
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server config missing' }, { status: 500 });

  // Upload document files to the private bucket (best effort: bucket missing
  // must not block the submission — paths are recorded only on success).
  const uploaded: string[] = [];
  const bucket = admin.storage.from('verification-documents');
  await admin.storage.createBucket('verification-documents', { public: false }).catch(() => undefined);
  for (const [field, file] of Object.entries(fileDocs)) {
    if (!file.size) continue;
    const path = `${user.id}/${field}-${Date.now()}`;
    const { error } = await bucket.upload(path, file, { upsert: true });
    if (!error) uploaded.push(path);
  }
  const { data, error } = await admin
    .from('profiles')
    .upsert({ id: user.id, ...profileData })
    .select('id, full_name, phone, role, cnic_last4, verification_status, cnic_verified')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const submission = await admin
    .from('verification_submissions')
    .insert({ user_id: user.id, data: { ...publicProfile, cnic_hash: '[hidden]' }, documents: uploaded.length ? uploaded : submittedDocs, status: 'pending' })
    .select('id, status, submitted_at')
    .single();
  return NextResponse.json({
    ok: true,
    profile: data,
    source: 'supabase',
    submission: submission.data || { status: 'pending', documents: submittedDocs },
    next: 'Your data is submitted for verification. You will appear in listings with a "Verification pending" badge; the badge becomes "Verified" after admin approval.',
  });
}
