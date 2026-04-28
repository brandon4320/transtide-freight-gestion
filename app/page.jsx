export default function Home() {
  return (
    <>
      <div className="dashboard-grid">
        {/* Stats Column */}
        <div className="stats-column">
          <div className="card">
            <p className="muted">Operaciones Activas</p>
            <p className="stat-value">245</p>
            <span className="badge success">+4 Nuevas</span>
          </div>
          
          <div className="card">
            <p className="muted">Entregas a Tiempo</p>
            <p className="stat-value">94.2%</p>
            <span className="badge success">↑ 2.1%</span>
          </div>
          
          <div className="card">
            <p className="muted">Rentabilidad Mes</p>
            <p className="stat-value">$1.28M</p>
            <span className="badge warning">Pendiente cobros</span>
          </div>
        </div>
        
        {/* Map / Main Viz */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="map-placeholder">
            <div className="map-overlay">
              <span style={{ background: '#fff', padding: '0.5rem 1rem', borderRadius: '50px', boxShadow: 'var(--shadow-sm)', fontWeight: 600, color: 'var(--primary)' }}>
                Mapa Satelital en Construcción
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="card">
          <h3>Operaciones Recientes</h3>
          <table>
            <thead>
              <tr>
                <th>Tracking ID</th>
                <th>Cliente</th>
                <th>Destino</th>
                <th>Estado</th>
                <th>ETA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 500 }}>TRN-13143</td>
                <td>Global Tech</td>
                <td>Buenos Aires</td>
                <td><span className="badge success">Liberada</span></td>
                <td>14 Oct</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 500 }}>TRN-13136</td>
                <td>Agro Export</td>
                <td>Santos</td>
                <td><span className="badge warning">En Tránsito</span></td>
                <td>16 Oct</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 500 }}>TRN-13145</td>
                <td>Med Supply</td>
                <td>Miami</td>
                <td><span className="badge danger">Demorada</span></td>
                <td>20 Oct</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="card">
          <h3>Volumen Semanal</h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '2rem', height: '150px' }}>
            {/* Pseudo-chart bars */}
            <div style={{ background: 'var(--primary)', width: '30px', height: '40%', borderRadius: '4px' }}></div>
            <div style={{ background: 'var(--primary)', width: '30px', height: '60%', borderRadius: '4px' }}></div>
            <div style={{ background: 'var(--primary)', width: '30px', height: '80%', borderRadius: '4px' }}></div>
            <div style={{ background: 'var(--primary)', width: '30px', height: '100%', borderRadius: '4px' }}></div>
            <div style={{ background: 'var(--primary)', width: '30px', height: '70%', borderRadius: '4px' }}></div>
          </div>
        </div>
      </div>
    </>
  );
}
