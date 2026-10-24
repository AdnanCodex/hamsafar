'use client';
import Link from 'next/link';
import { useLang } from '@/lib/lang';

export default function Footer() {
  const { t } = useLang();
  return (
    <footer>
      <div className="foot">
        <div><b style={{ fontSize: 20 }}>Hamsafar</b><p style={{ marginTop: 8, maxWidth: 300, lineHeight: 1.6 }}>{t('foot_desc1')}<br />{t('foot_desc2')}</p></div>
        <div><b>{t('foot_explore')}</b><p style={{ marginTop: 10, lineHeight: 1.9 }}><Link href="/find" style={{ color: '#CDE8D8' }}>{t('nav_find')}</Link><br /><Link href="/safety" style={{ color: '#CDE8D8' }}>{t('nav_safety')}</Link></p></div>
        <div><b>{t('foot_support')}</b><p style={{ marginTop: 10, lineHeight: 1.9 }}>support@hamsafar.pk<br />{t('foot_help')}</p></div>
      </div>
    </footer>
  );
}
