import Link from 'next/link';

// Dashboard — middleware only opens this page when logged in.
// HONEST STATE: stats and upcoming rides come from real activity only.
// Previously this page showed hardcoded numbers (12 rides, PKR 2,850
// savings, a demo upcoming ride) — invented data on a real user's page.
// Until live rides/bookings exist, it shows empty states, not fake totals.
export default function DashboardPage() {
  return (
    <div className="container" style={{ paddingTop: 28 }}>
      <h1>Welcome back! 👋</h1>
      <p style={{ color: '#64748B', marginTop: 6 }}>Your ride activity and quick actions.</p>
      <div className="grid4" style={{ marginTop: 16 }}>
        <div className="card"><b style={{ fontSize: 26, color: '#0C6B3F' }}>0</b><br /><small style={{ color: '#64748B' }}>Total Rides</small></div>
        <div className="card"><b style={{ fontSize: 26, color: '#0C6B3F' }}>—</b><br /><small style={{ color: '#64748B' }}>Average Rating</small></div>
        <div className="card"><b style={{ fontSize: 26, color: '#0C6B3F' }}>PKR 0</b><br /><small style={{ color: '#64748B' }}>Total Savings</small></div>
        <div className="card"><b style={{ fontSize: 26, color: '#0C6B3F' }}>—</b><br /><small style={{ color: '#64748B' }}>Safe Rides</small></div>
      </div>
      <p style={{ color: '#64748B', marginTop: 10 }}>No ride activity yet — your totals will appear here after your first completed rides and bookings.</p>
      <div className="grid3" style={{ marginTop: 16 }}>
        <div className="card"><b>Quick Actions</b>
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            <Link href="/find"><button className="btn outline" style={{ width: '100%' }}>🔍 Find a Ride</button></Link>
            <Link href="/recommendations"><button className="btn outline" style={{ width: '100%' }}>🎯 Recommendations</button></Link>
            <Link href="/offer"><button className="btn outline" style={{ width: '100%' }}>🚗 Offer a Ride</button></Link>
            <Link href="/sos"><button className="btn outline" style={{ width: '100%', color: '#B91C1C', borderColor: '#FECACA' }}>🚨 SOS / Safety</button></Link>
          </div>
        </div>
        <div className="card"><b>Upcoming Ride</b><p style={{ color: '#64748B', marginTop: 8 }}>No upcoming rides yet.</p><Link href="/find"><button className="btn" style={{ marginTop: 10 }}>Find a Ride →</button></Link></div>
        <div className="card"><b>Verification Status</b><p style={{ color: '#64748B', marginTop: 8 }}>Your rides appear in listings after CNIC verification. Check your status on the Onboarding page.</p><Link href="/onboarding"><button className="btn" style={{ marginTop: 10 }}>Onboarding →</button></Link></div>
      </div>
    </div>
  );
}
