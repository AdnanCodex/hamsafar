import Link from 'next/link';

export default function SafetyPage() {
  return (
    <div className="container" style={{ paddingTop: 28 }}>
      <h1>Your Safety, Our Priority</h1>
      <p style={{ color: '#64748B', marginTop: 8, maxWidth: 640, lineHeight: 1.6 }}>Every driver is CNIC-verified, every trip has live tracking and SOS, and ratings build a driver trust score.</p>
      <div className="grid4" style={{ marginTop: 16 }}>
        <div className="card"><b>🛡️ Verified Profiles</b><p style={{ color: '#64748B', marginTop: 8 }}>Identity &amp; phone verified for every user.</p></div>
        <div className="card"><b>⭐ Ratings &amp; Reviews</b><p style={{ color: '#64748B', marginTop: 8 }}>Real feedback from fellow travellers.</p></div>
        <div className="card"><b>📞 24/7 Support</b><p style={{ color: '#64748B', marginTop: 8 }}>We are always here when you need us.</p></div>
        <div className="card"><b>👩 Women-friendly</b><p style={{ color: '#64748B', marginTop: 8 }}>Safe options for women travellers.</p></div>
      </div>
      <div className="card" style={{ background: '#0C6B3F', color: '#fff', marginTop: 16 }}>
        <b style={{ color: '#fff' }}>Emergency?</b>
        <p style={{ opacity: 0.9, marginTop: 8 }}>On the SOS page, press the big red button — an alert goes out with your live location.</p>
        <Link href="/sos"><button className="btn" style={{ background: '#B91C1C', marginTop: 12 }}>🚨 Go to SOS →</button></Link>
      </div>
    </div>
  );
}
