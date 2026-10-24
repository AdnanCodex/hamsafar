import { redirect } from 'next/navigation';

// Login/signup removed from the website at the owner's request
// (2026-10-24). Any visit to /login now lands on the homepage instead
// of showing a login form. The full login page is preserved in git
// history (see commits before this change) and in the local backup
// backups/hamsafar-login-page-20261024.tsx, so it can be restored.
export default function LoginPage() {
  redirect('/');
}
