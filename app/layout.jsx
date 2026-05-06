import './globals.css';

export const metadata = {
  title: 'Transtide — Sistema de Gestión',
  description: 'Sistema interno de gestión logística e importaciones.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="app-container">

          {/* ── Sidebar ── */}
          <aside className="sidebar">
            <div className="sidebar-logo">
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 900,
                fontSize: '1.2rem',
                letterSpacing: '0.06em',
                color: '#0f172a',
                lineHeight: 1,
              }}>
                TRANSTIDE<span style={{ color: '#ea580c' }}>.</span>
              </span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <p className="nav-section-label" style={{ marginTop: 0 }}>Principal</p>

              <a href="/" className="nav-item">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
                Dashboard
              </a>
              <a href="/operations" className="nav-item">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 6 12 2 21 6 21 16 12 20 3 16 3 6"/>
                  <line x1="12" y1="22" x2="12" y2="12"/>
                  <line x1="21" y1="6" x2="12" y2="12"/>
                  <line x1="3" y1="6" x2="12" y2="12"/>
                </svg>
                Operaciones
              </a>
              <a href="/tracking" className="nav-item">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Tracking
              </a>

              <p className="nav-section-label">Gestión</p>

              <a href="/clients" className="nav-item">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Clientes
              </a>
              <a href="/financials" className="nav-item">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Rentabilidad
              </a>
              <a href="/cotizador" className="nav-item">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                Cotizador
              </a>

              <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                <a href="/settings" className="nav-item">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                  Ajustes
                </a>
              </div>
            </nav>
          </aside>

          {/* ── Main ── */}
          <main className="main-content">
            <header className="top-header">
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Bienvenido, Brandon</h1>
                <p className="muted">Administrador del Sistema</p>
              </div>

              <div className="search-bar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" placeholder="Buscar BL, Contenedor, Cliente..." />
              </div>

              <div className="user-profile">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <div className="avatar">B</div>
              </div>
            </header>

            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
