// Input validation + CNIC handling (data security).
// Pakistan CNIC format: 5 digits - 7 digits - 1 digit, total 13 digits.
// Full CNIC kabhi plaintext store nahi hota — sirf SHA-256 hash + last 4 digits.
import { createHash } from 'crypto';

export function cleanCnic(input: string): string {
  return (input || '').replace(/\D/g, '');
}

export function isValidCnic(input: string): boolean {
  const digits = cleanCnic(input);
  if (!/^\d{13}$/.test(digits)) return false;
  // Pehla digit 0 nahi ho sakta (province code 1–9). Checksum NADRA public nahi,
  // is liye format + document verification (admin) asal verification hai.
  if (digits[0] === '0') return false;
  return true;
}

export function formatCnic(input: string): string {
  const d = cleanCnic(input);
  if (d.length !== 13) return input;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

export function hashCnic(input: string): string {
  const salt = process.env.CNIC_HASH_SALT || 'hamsafar-dev-salt-change-in-production';
  return createHash('sha256').update(`${salt}:${cleanCnic(input)}`).digest('hex');
}

export function cnicLast4(input: string): string {
  return cleanCnic(input).slice(-4);
}

export function isValidPhonePK(input: string): boolean {
  const d = (input || '').replace(/[\s-]/g, '');
  return /^03\d{9}$/.test(d) || /^\+923\d{9}$/.test(d);
}

export function sanitizeText(input: unknown, maxLen = 500): string {
  return String(input ?? '').replace(/[<>]/g, '').trim().slice(0, maxLen);
}
