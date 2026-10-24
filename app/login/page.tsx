'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, supabaseConfigured } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const router = useRouter();

  async function signIn() {
    if (!supabaseConfigured || !supabase) {
      setMsg('⚠️ Supabase is not configured yet — demo mode. Set env vars for live login (see README).');
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
      setMsg('⚠️ Supabase is not configured yet — demo mode.');
      return;
    }
    const { error } = await supabase.auth.signUp({ email, password });
    setMsg(error ? `❌ ${error.message}` : '✅ Account created! Check email confirmation (if enabled in Supabase).');
  }

  async function google() {
    if (!supabaseConfigured || !supabase) {
      setMsg('⚠️ For Google login, configure Supabase first and turn on the Google provider.');
      return;
    }
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  }

  return (
    <div className="container" style={{ paddingTop: 40, maxWidth: 480 }}>
      <div className="card">
        <h1>Welcome Back</h1>
        <p style={{ color: '#64748B', marginTop: 6 }}>Sign in to your account</p>
        <input className="input" style={{ marginTop: 16 }} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" style={{ marginTop: 10 }} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn" style={{ width: '100%', marginTop: 14 }} onClick={signIn}>Sign In →</button>
        <button className="btn outline" style={{ width: '100%', marginTop: 10 }} onClick={signUp}>Create Account</button>
        <button className="btn outline" style={{ width: '100%', marginTop: 10 }} onClick={google}>G&nbsp; Continue with Google</button>
        {msg && <p style={{ marginTop: 12, color: '#64748B', lineHeight: 1.5 }}>{msg}</p>}
        <p style={{ color: '#64748B', fontSize: 12, marginTop: 12 }}>{supabaseConfigured ? 'Email sign-in is ready in this build. For Google sign-in, enable the Google provider in Supabase Dashboard → Authentication → Providers. Phone OTP needs the Phone provider enabled there too.' : 'Email + Google sign-in will activate once Supabase is connected. Phone OTP needs the Phone provider in Supabase Dashboard → Authentication → Providers.'}</p>
      </div>
    </div>
  );
}
