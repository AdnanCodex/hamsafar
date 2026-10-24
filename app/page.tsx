import Link from 'next/link';
import ChatBox from '@/components/ChatBox';

// Home — implemented exactly like the website prototype:
// hero + tabbed search card + trust badges + stats + Popular Routes.
export default function Home() {
  return (
    <>
      <section className="hero">
        <img className="bg" src="/hero.jpg" alt="Road in Pakistan" />
        <div className="tagline">Same Roads<br />Bigger Dreams</div>
        <div className="ov">
          <div className="inner">
            <p className="eyebrow">📍 PAKISTAN&apos;S TRUSTED RIDE SHARING PLATFORM</p>
            <h1>Your journey,<br /><span>shared with trust.</span></h1>
            <p className="sub">Find safe, affordable rides and carpooling options across Pakistan — from Hazara to Karachi. Save money, reduce traffic, and travel together with people you can trust.</p>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="searchcard">
          <div className="tabs"><button className="sel">🔍 Find a Ride</button><Link href="/offer" style={{ flex: 1, textDecoration: 'none' }}><button style={{ width: '100%' }}>🚗 Offer a Ride</button></Link></div>
          <div className="grid4">
            <div className="field"><label>From</label><input className="input" defaultValue="Mansehra" /></div>
            <div className="field"><label>To</label><input className="input" defaultValue="Abbottabad" /></div>
            <div className="field"><label>Date</label><input className="input" type="date" defaultValue="2026-10-25" /></div>
            <div className="field"><label>Passengers</label><select className="input"><option>1 passenger</option><option>2 passengers</option><option>3 passengers</option><option>4+ passengers</option></select></div>
          </div>
          <Link href="/find"><button className="btn" style={{ width: '100%', marginTop: 16, padding: 15 }}>🔍 Search Rides</button></Link>
        </div>

        <div className="trustrow">
          <div><span className="ic">🛡️</span><span>Verified Profiles<br /><small style={{ color: '#64748B', fontWeight: 500 }}>Real people, real profiles</small></span></div>
          <div><span className="ic">👩</span><span>Women-friendly<br /><small style={{ color: '#64748B', fontWeight: 500 }}>Safe &amp; comfortable</small></span></div>
          <div><span className="ic">💲</span><span>Transparent Fares<br /><small style={{ color: '#64748B', fontWeight: 500 }}>No hidden charges</small></span></div>
          <div><span className="ic">🎧</span><span>24/7 Support<br /><small style={{ color: '#64748B', fontWeight: 500 }}>We&apos;re always here</small></span></div>
        </div>

        <div className="stats">
          <div><b>2,400+</b><small>Rides shared</small></div>
          <div><b>4.9/5</b><small>Rider rating</small></div>
          <div><b>Safe &amp; Secure</b><small>Every journey</small></div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2>Popular Routes</h2><Link href="/find">View all routes →</Link></div>
          <p className="lede">Top routes with trusted drivers across Pakistan — Hazara, KPK, Punjab, Sindh and beyond. Fares are live on the Find page, never fixed here.</p>
          <div className="routes">
            {[
              { from: 'Mansehra', to: 'Abbottabad', img: '/hero.jpg', tag: 'Hazara, KPK' },
              { from: 'Abbottabad', to: 'Islamabad', img: '/route2.jpg', tag: 'Hazara → Capital' },
              { from: 'Peshawar', to: 'Islamabad', img: '/route3.jpg', tag: 'KPK → Capital' },
              { from: 'Lahore', to: 'Islamabad', img: '/route-lahore-islamabad.jpg', tag: 'Punjab → Capital' },
              { from: 'Karachi', to: 'Hyderabad', img: '/route-karachi-hyderabad.jpg', tag: 'Sindh' },
              { from: 'Islamabad', to: 'Murree', img: '/route-islamabad-murree.jpg', tag: 'Capital → Hills' },
            ].map((r) => (
              <div key={`${r.from}-${r.to}`} className="routecard"><img src={r.img} alt={`${r.from} to ${r.to}`} /><div className="rc"><div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{r.from} → {r.to}</b><b style={{ color: '#0C6B3F' }}>{r.tag}</b></div><small style={{ color: '#64748B' }}>Live rides, fares and ETAs on the Find page</small><br /><Link href={`/find?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`}><button className="btn" style={{ marginTop: 12, width: '100%' }}>View rides →</button></Link></div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2>AI Features in this build</h2>
          <div className="grid3" style={{ marginTop: 16 }}>
            <div className="card"><b>🧠 Smart Ride Matching</b><p style={{ color: '#64748B', marginTop: 8, lineHeight: 1.6 }}>Route, time, price, rating and seats scored — best rides first. API: <code>/api/match</code></p></div>
            <div className="card"><b>💲 AI Fare Estimator</b><p style={{ color: '#64748B', marginTop: 8, lineHeight: 1.6 }}>Fuel-cost sharing model with peak/demand adjustment and explanation. API: <code>/api/fare</code></p></div>
            <div className="card"><b>🤖 AI Assistant</b><p style={{ color: '#64748B', marginTop: 8, lineHeight: 1.6 }}>Chat in the bottom-right corner — with a Gemini key it uses LLM, otherwise smart rule-based answers. Greetings get a greeting back, never an unsolicited ride suggestion.</p></div>
          </div>
        </div>
      </section>
      <ChatBox />
    </>
  );
}
