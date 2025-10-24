export default function Home() {
  const container = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #eef2ff 0%, #f0f9ff 50%, #ecfeff 100%)'
  };
  const card = {
    width: '100%',
    maxWidth: '900px',
    padding: '48px 32px',
    borderRadius: '20px',
    background: 'rgba(255,255,255,0.85)',
    boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)',
    backdropFilter: 'blur(6px)',
    textAlign: 'center'
  };
  const title = {
    fontSize: 'clamp(32px, 5vw, 56px)',
    fontWeight: 800,
    margin: '0 0 12px',
    color: '#0f172a',
    letterSpacing: '-0.02em',
    animation: 'fadeUp .7s ease-out both'
  };
  const subtitle = {
    fontSize: 'clamp(14px, 2.4vw, 18px)',
    color: '#475569',
    margin: '0 auto 30px',
    maxWidth: '720px',
    lineHeight: 1.6,
    animation: 'fadeUp .8s ease-out .12s both'
  };
  const links = { display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeUp .8s ease-out .18s both' };
  const btn = {
    padding: '14px 20px',
    borderRadius: '14px',
    textDecoration: 'none',
    fontWeight: 700,
    letterSpacing: '0.2px',
    boxShadow: '0 10px 30px rgba(37, 99, 235, 0.2)',
    transition: 'transform .15s ease, box-shadow .15s ease, filter .2s ease'
  };
  const primary = {
    ...btn,
    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    color: '#fff'
  };
  const secondary = {
    ...btn,
    background: 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 100%)',
    color: '#0b1220'
  };

  const glow = {
    position: 'absolute',
    width: '60vmax',
    height: '60vmax',
    background: 'radial-gradient(closest-side, rgba(59,130,246,.25), rgba(59,130,246,0))',
    filter: 'blur(40px)',
    borderRadius: '50%',
    top: '-10vmax',
    right: '-10vmax',
    pointerEvents: 'none'
  };
  const glow2 = { ...glow, top: 'auto', bottom: '-15vmax', left: '-10vmax', right: 'auto', background: 'radial-gradient(closest-side, rgba(14,165,233,.22), rgba(14,165,233,0))' };

  return (
    <main style={container}>
      <div style={glow} />
      <div style={glow2} />
      <section style={card}>
        <h1 style={title}>Campus Problem Reporter</h1>
        <p style={subtitle}>
          Welcome! Report campus issues quickly and track their resolution. Choose a portal to begin.
        </p>
        <div style={links}>
          <a href="/student.html" style={primary} className="btn">
            Student Portal
          </a>
          <a href="/admin.html" style={secondary} className="btn alt">
            Admin Portal
          </a>
        </div>
      </section>
      <style jsx global>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        a.btn:hover { transform: translateY(-2px) scale(1.01); box-shadow: 0 16px 40px rgba(37,99,235,.28); filter: brightness(1.02); }
        a.btn.alt:hover { box-shadow: 0 16px 40px rgba(14,165,233,.28); }
        @media (max-width: 480px) {
          section { padding: 32px 20px !important; }
        }
      `}</style>
    </main>
  );
}
