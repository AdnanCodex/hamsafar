'use client';
import Link from 'next/link';
import ChatBox from '@/components/ChatBox';
import { useLang } from '@/lib/lang';

// Home — hero + tabbed search card + trust badges + stats + Popular Routes.
export default function Home() {
  const { lang, t } = useLang();
  const cityName = (c: string) =>
    ({ Mansehra: t('city_mansehra'), Abbottabad: t('city_abbottabad'), Peshawar: t('city_peshawar'), Islamabad: t('city_islamabad'), Lahore: t('city_lahore'), Karachi: t('city_karachi'), Hyderabad: t('city_hyderabad'), Murree: t('city_murree') } as Record<string, string>)[c] || c;
  const routes = [
    { from: 'Mansehra', to: 'Abbottabad', img: '/hero.jpg', tagKey: 'tag_hazara_kpk' },
    { from: 'Abbottabad', to: 'Islamabad', img: '/route2.jpg', tagKey: 'tag_hazara_cap' },
    { from: 'Peshawar', to: 'Islamabad', img: '/route3.jpg', tagKey: 'tag_kpk_cap' },
    { from: 'Lahore', to: 'Islamabad', img: '/route-lahore-islamabad.jpg', tagKey: 'tag_punjab_cap' },
    { from: 'Karachi', to: 'Hyderabad', img: '/route-karachi-hyderabad.jpg', tagKey: 'tag_sindh' },
    { from: 'Islamabad', to: 'Murree', img: '/route-islamabad-murree.jpg', tagKey: 'tag_cap_hills' },
  ] as const;
  return (
    <>
      <section className="hero">
        <img className="bg" src="/hero.jpg" alt="Road in Pakistan" />
        <div className="tagline">{t('home_tag1')}<br />{t('home_tag2')}</div>
        <div className="ov">
          <div className="inner">
            <p className="eyebrow">{t('home_eyebrow')}</p>
            <h1>{t('home_h1a')}<br /><span>{t('home_h1b')}</span></h1>
            <p className="sub">{t('home_sub')}</p>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="searchcard">
          <div className="tabs"><button className="sel">{t('home_tab_find')}</button><Link href="/offer" style={{ flex: 1, textDecoration: 'none' }}><button style={{ width: '100%' }}>{t('home_tab_offer')}</button></Link></div>
          <div className="grid4">
            <div className="field"><label>{t('home_from')}</label><input className="input" defaultValue="Mansehra" /></div>
            <div className="field"><label>{t('home_to')}</label><input className="input" defaultValue="Abbottabad" /></div>
            <div className="field"><label>{t('home_date')}</label><input className="input" type="date" defaultValue="2026-10-25" /></div>
            <div className="field"><label>{t('home_pass')}</label><select className="input"><option>{t('home_p1')}</option><option>{t('home_p2')}</option><option>{t('home_p3')}</option><option>{t('home_p4')}</option></select></div>
          </div>
          <Link href="/find"><button className="btn" style={{ width: '100%', marginTop: 16, padding: 15 }}>{t('home_search')}</button></Link>
        </div>

        <div className="trustrow">
          <div><span className="ic">🛡️</span><span>{t('trust1t')}<br /><small style={{ color: '#64748B', fontWeight: 500 }}>{t('trust1s')}</small></span></div>
          <div><span className="ic">👩</span><span>{t('trust2t')}<br /><small style={{ color: '#64748B', fontWeight: 500 }}>{t('trust2s')}</small></span></div>
          <div><span className="ic">💲</span><span>{t('trust3t')}<br /><small style={{ color: '#64748B', fontWeight: 500 }}>{t('trust3s')}</small></span></div>
          <div><span className="ic">🎧</span><span>{t('trust4t')}<br /><small style={{ color: '#64748B', fontWeight: 500 }}>{t('trust4s')}</small></span></div>
        </div>

        <div className="stats">
          <div><b>2,400+</b><small>{t('stat_rides')}</small></div>
          <div><b>4.9/5</b><small>{t('stat_rating')}</small></div>
          <div><b>{t('stat_safe')}</b><small>{t('stat_every')}</small></div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2>{t('pop_title')}</h2><Link href="/find">{t('pop_all')}</Link></div>
          <p className="lede">{t('pop_lede')}</p>
          <div className="routes">
            {routes.map((r) => (
              <div key={`${r.from}-${r.to}`} className="routecard"><img src={r.img} alt={`${r.from} to ${r.to}`} /><div className="rc"><div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{lang === 'ur' ? `${cityName(r.from)} سے ${cityName(r.to)} تک` : `${r.from} → ${r.to}`}</b><b style={{ color: '#0C6B3F' }}>{t(r.tagKey)}</b></div><small style={{ color: '#64748B' }}>{t('pop_live')}</small><br /><Link href={`/find?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`}><button className="btn" style={{ marginTop: 12, width: '100%' }}>{t('pop_view')}</button></Link></div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2>{t('ai_title')}</h2>
          <div className="grid3" style={{ marginTop: 16 }}>
            <div className="card"><b>{t('ai1t')}</b><p style={{ color: '#64748B', marginTop: 8, lineHeight: 1.6 }}>{t('ai1d')}</p></div>
            <div className="card"><b>{t('ai2t')}</b><p style={{ color: '#64748B', marginTop: 8, lineHeight: 1.6 }}>{t('ai2d')}</p></div>
            <div className="card"><b>{t('ai3t')}</b><p style={{ color: '#64748B', marginTop: 8, lineHeight: 1.6 }}>{t('ai3d')}</p></div>
          </div>
        </div>
      </section>
      <ChatBox />
    </>
  );
}
