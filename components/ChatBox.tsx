'use client';
import { useState } from 'react';
import { useLang } from '@/lib/lang';

// AI Assistant chat widget — /api/chat se jawab lata hai
// (Gemini key ho to LLM, warna rule-based AI).
export default function ChatBox() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMsgs((m) => [...m, { role: 'user', text }]);
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, { role: 'ai', text: data.text || t('chat_no_answer') }]);
    } catch {
      setMsgs((m) => [...m, { role: 'ai', text: t('chat_conn_fail') }]);
    }
    setBusy(false);
  }

  if (!open) {
    return (
      <button className="btn" style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 1000, borderRadius: 999 }} onClick={() => setOpen(true)}>
        {t('chat_open')}
      </button>
    );
  }
  return (
    <div className="card" style={{ position: 'fixed', right: 20, bottom: 20, width: 340, maxWidth: '90vw', zIndex: 1000, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b>{t('chat_title')}</b>
        <button className="btn outline" style={{ padding: '6px 12px' }} onClick={() => setOpen(false)}>✕</button>
      </div>
      <div style={{ height: 260, overflowY: 'auto', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ alignSelf: 'flex-start', background: '#F1F5F1', padding: '9px 12px', borderRadius: 12, maxWidth: '85%', fontSize: 14, lineHeight: 1.5 }}>{t('chat_greet')}</div>
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? '#DCFCE7' : '#F1F5F1', padding: '9px 12px', borderRadius: 12, maxWidth: '85%', fontSize: 14, lineHeight: 1.5 }}>{m.text}</div>
        ))}
        {busy && <div style={{ fontSize: 13, color: '#64748B' }}>{t('chat_thinking')}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={t('chat_placeholder')} />
        <button className="btn" onClick={send}>➤</button>
      </div>
    </div>
  );
}
