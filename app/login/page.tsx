'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { useLang } from '@/lib/lang';

type Mode = 'login' | 'forgot' | 'recovery' | 'magic';

export default function LoginPage() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg] = useState('');
  const [mode, setMode] = useState<Mode>('login');
  const router = useRouter();

  // Password-reset links land back here (redirectTo = origin + '/login').
  // Supabase emits PASSWORD_RECOVERY when it detects a valid recovery
  // session from the link. If no session appears within a few seconds,
  // the link was invalid or expired.
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (!hash.includes('type=recovery')) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) setMsg(`❌ ${t('login_recovery_expired')}`);
      });
    }, 4000);
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMsg('');
        setMode('recovery');
      }
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, [supabaseConfigured, t]);

  // Already-signed-in users who land on /login (e.g. via a magic link)
  // go straight to the dashboard — except recovery links, which must
  // stay here so the user can set a new password.
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push('/dashboard');
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') router.push('/dashboard');
    });
    return () => listener.subscription.unsubscribe();
  }, [supabaseConfigured, router]);

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
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setMsg(`❌ ${error.message}`); return; }
    // If email confirmation is off, signup already returns a session —
    // take the user straight to the dashboard instead of leaving them
    // on the login page. Otherwise they must confirm via email first.
    if (data.session) { router.push('/dashboard'); return; }
    setMsg(`✅ ${t('login_created')}`);
  }

  async function sendReset() {
    if (!supabaseConfigured || !supabase) {
      setMsg(t('login_demo_signin'));
      return;
    }
    if (!email.trim()) { setMsg(`❌ ${t('login_email_needed')}`); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setMsg(error ? `❌ ${error.message}` : `✅ ${t('login_reset_sent')}`);
  }

  async function sendMagicLink() {
    if (!supabaseConfigured || !supabase) {
      setMsg(t('login_demo_signin'));
      return;
    }
    if (!email.trim()) { setMsg(`❌ ${t('login_email_needed')}`); return; }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    setMsg(error ? `❌ ${error.message}` : `✅ ${t('login_magic_sent')}`);
  }

  async function updatePassword() {
    if (!supabaseConfigured || !supabase) return;
    if (!newPass) { setMsg(`❌ ${t('login_email_needed')}`); return; }
    if (newPass !== confirmPass) { setMsg(`❌ ${t('login_pass_mismatch')}`); return; }
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) { setMsg(`❌ ${error.message}`); return; }
    setMsg(`✅ ${t('login_pass_updated')}`);
    router.push('/dashboard');
  }

  return (
    <div className="container" style={{ paddingTop: 40, maxWidth: 480 }}>
      <div className="card">
        {mode === 'login' && (
          <>
            <h1>{t('login_title')}</h1>
            <p style={{ color: '#64748B', marginTop: 6 }}>{t('login_sub')}</p>
            <input className="input" style={{ marginTop: 16 }} placeholder={t('login_email_ph')} value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" style={{ marginTop: 10 }} type="password" placeholder={t('login_pass_ph')} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="btn" style={{ width: '100%', marginTop: 14 }} onClick={signIn}>{t('login_signin')}</button>
            <button className="btn outline" style={{ width: '100%', marginTop: 10 }} onClick={signUp}>{t('login_create')}</button>
            <button style={{ background: 'none', border: 'none', color: '#0C6B3F', cursor: 'pointer', marginTop: 14, fontSize: 14 }} onClick={() => { setMsg(''); setMode('forgot'); }}>{t('login_forgot')}</button>
            <button style={{ background: 'none', border: 'none', color: '#0C6B3F', cursor: 'pointer', marginTop: 8, fontSize: 14 }} onClick={() => { setMsg(''); setMode('magic'); }}>{t('login_magic')}</button>
          </>
        )}
        {mode === 'forgot' && (
          <>
            <h1>{t('login_forgot_title')}</h1>
            <p style={{ color: '#64748B', marginTop: 6 }}>{t('login_sub')}</p>
            <input className="input" style={{ marginTop: 16 }} placeholder={t('login_email_ph')} value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn" style={{ width: '100%', marginTop: 14 }} onClick={sendReset}>{t('login_send_reset')}</button>
            <button style={{ background: 'none', border: 'none', color: '#0C6B3F', cursor: 'pointer', marginTop: 14, fontSize: 14 }} onClick={() => { setMsg(''); setMode('login'); }}>{t('login_back')}</button>
          </>
        )}
        {mode === 'recovery' && (
          <>
            <h1>{t('login_forgot_title')}</h1>
            <p style={{ color: '#64748B', marginTop: 6 }}>{t('login_sub')}</p>
            <input className="input" style={{ marginTop: 16 }} type="password" placeholder={t('login_new_pass_ph')} value={newPass} onChange={(e) => setNewPass(e.target.value)} />
            <input className="input" style={{ marginTop: 10 }} type="password" placeholder={t('login_confirm_pass_ph')} value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
            <button className="btn" style={{ width: '100%', marginTop: 14 }} onClick={updatePassword}>{t('login_update_pass')}</button>
          </>
        )}
        {mode === 'magic' && (
          <>
            <h1>{t('login_magic_title')}</h1>
            <p style={{ color: '#64748B', marginTop: 6 }}>{t('login_sub')}</p>
            <input className="input" style={{ marginTop: 16 }} placeholder={t('login_email_ph')} value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn" style={{ width: '100%', marginTop: 14 }} onClick={sendMagicLink}>{t('login_send_magic')}</button>
            <button style={{ background: 'none', border: 'none', color: '#0C6B3F', cursor: 'pointer', marginTop: 14, fontSize: 14 }} onClick={() => { setMsg(''); setMode('login'); }}>{t('login_back')}</button>
          </>
        )}
        {msg && <p style={{ marginTop: 12, color: '#64748B', lineHeight: 1.5 }}>{msg}</p>}
        {mode === 'login' && (
          <p style={{ color: '#64748B', fontSize: 12, marginTop: 12 }}>{supabaseConfigured ? t('login_note_ok') : t('login_note_demo')}</p>
        )}
      </div>
    </div>
  );
}
