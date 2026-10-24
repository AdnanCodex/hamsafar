'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { useLang } from '@/lib/lang';

export default function LoginPage() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const router = useRouter();

  async function signIn() {
    if (!supabaseConfigured || !supabase) {
      setMsg(t('login_demo_signin'));
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMsg(`❌ ${error.message}`); return; }
    // Successful login must actually take the user to their destination —
    // previously it only showed a message and stayed on the login page.
    const next = new URLSearchParams(window.location.search).get('next') || '/dashboard';
    router.push(next);
  }

  async function signUp() {
    if (!supabaseConfigured || !supabase) {
      setMsg(t('login_demo_signup'));
      return;
    }
    const { error } = await supabase.auth.signUp({ email, password });
    setMsg(error ? `❌ ${error.message}` : `✅ ${t('login_created')}`);
  }

  async function google() {
    if (!supabaseConfigured || !supabase) {
      setMsg(t('login_demo_google'));
      return;
    }
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  }

  return (
    <div className="container" style={{ paddingTop: 40, maxWidth: 480 }}>
      <div className="card">
        <h1>{t('login_title')}</h1>
        <p style={{ color: '#64748B', marginTop: 6 }}>{t('login_sub')}</p>
        <input className="input" style={{ marginTop: 16 }} placeholder={t('login_email_ph')} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" style={{ marginTop: 10 }} type="password" placeholder={t('login_pass_ph')} value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn" style={{ width: '100%', marginTop: 14 }} onClick={signIn}>{t('login_signin')}</button>
        <button className="btn outline" style={{ width: '100%', marginTop: 10 }} onClick={signUp}>{t('login_create')}</button>
        <button className="btn outline" style={{ width: '100%', marginTop: 10 }} onClick={google}>G&nbsp; {t('login_google')}</button>
        {msg && <p style={{ marginTop: 12, color: '#64748B', lineHeight: 1.5 }}>{msg}</p>}
        <p style={{ color: '#64748B', fontSize: 12, marginTop: 12 }}>{supabaseConfigured ? t('login_note_ok') : t('login_note_demo')}</p>
      </div>
    </div>
  );
}
