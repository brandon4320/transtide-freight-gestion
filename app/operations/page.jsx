'use client';
import { useState, useMemo } from 'react';

// ─── helpers ─────────────────────────────────────────────────────────────────
const n    = (v) => parseFloat(v) || 0;
const fmtP = (v) => v == null || isNaN(v) ? '—' : '$ ' + Math.round(v).toLocaleString('es-AR');
const fmtU = (v) => v == null || isNaN(v) ? '—' : 'USD ' + (Math.round(v * 100) / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct  = (v) => isNaN(v) ? '—' : (v * 100).toFixed(2) + '%';

// ─── styles ───────────────────────────────────────────────────────────────────
const CARD = { background: '#fff', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' };
const LBL  = { display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' };
const INP  = { width: '100%', padding: '0.42rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '0.82rem', color: '#1e293b', background: '#fff', outline: 'none' };
const TH   = { fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.45rem 0.6rem', textAlign: 'left' };
const TD   = { fontSize: '0.82rem', color: '#374151', padding: '0.38rem 0.6rem', borderBottom: '1px solid #f8fafc' };

// ─── row calculations ─────────────────────────────────────────────────────────
const rowPesos = (r) => n(r.usd) > 0 && n(r.tc) > 0 ? n(r.usd) * n(r.tc) : n(r.pesos);
const rowUSD   = (r) => n(r.usd) > 0 && n(r.tc) === 0 ? n(r.usd) : 0;
const catTot   = (rows) => ({ pesos: rows.reduce((s, r) => s + rowPesos(r), 0), usd: rows.reduce((s, r) => s + rowUSD(r), 0) });
const newRow   = () => ({ id: Date.now() + Math.random(), desc: '', factura: '', usd: '', tc: '', pesos: '' });
const newProv  = () => ({ id: Date.now() + Math.random(), nombre: '', tipo: 'Cliente', m3: '', fobUSD: '', gastosOrigenUSD: '', tributosUSD: '', tributosTC: '' });

// ─── mock operations list ─────────────────────────────────────────────────────
const MOCK_OPS = [
  { id: 'franco-modulos', nombre: 'Franco Modulos 2 + varios', contenedor: '40HQ', m3: 38.14, proveedores: 3, estado: 'Liquidada', fecha: '15/03/2024', color: '#10b981' },
  { id: 'agro-export',    nombre: 'Agro Export — Fertilizantes',   contenedor: '20 Pies', m3: 22.5,  proveedores: 1, estado: 'En curso',  fecha: '02/04/2024', color: '#f59e0b' },
  { id: 'med-supply',     nombre: 'Med Supply — Insumos Médicos',  contenedor: '40HQ',   m3: 55.0,  proveedores: 2, estado: 'Pendiente', fecha: '20/04/2024', color: '#ef4444' },
];

// ─── initial data (Franco Modulos) ───────────────────────────────────────────
const FRANCO = {
  naviera:    [
    { id: 1, desc: 'MAERSK', factura: '7546833339', usd: 791, tc: 1479, pesos: '' },
    { id: 2, desc: 'MAERSK', factura: '7547097709', usd: 57,  tc: 1478, pesos: '' },
  ],
  terminal:   [{ id: 1, desc: 'TERMINAL 4', factura: '747512', usd: '', tc: '', pesos: 2278971.82 }],
  aduana:     [{ id: 1, desc: 'VEP / Tributos Aduaneros', factura: '', usd: '', tc: '', pesos: 12500000 }],
  transporte: [{ id: 1, desc: 'Flete BsAs → Bahía Blanca', factura: '4149', usd: '', tc: '', pesos: 4235000 }],
  despachante:[],
  admin:      [],
  fleteIntl:  [],
  proveedores:[
    { id: 1, nombre: 'karting',     tipo: 'Cliente', m3: 20.34, fobUSD: 25314, gastosOrigenUSD: '',  tributosUSD: 3991.87, tributosTC: 1390 },
    { id: 2, nombre: 'gimnasio',    tipo: 'Cliente', m3: 13,    fobUSD: 5500,  gastosOrigenUSD: '',  tributosUSD: 2746.04, tributosTC: 1390 },
    { id: 3, nombre: 'generadores', tipo: 'Propio',  m3: 4.8,   fobUSD: 16000, gastosOrigenUSD: 350, tributosUSD: 1176.05, tributosTC: 1390 },
  ],
  cobrar:[
    { tc: 1425, honorarios: false, despAdic: 8000 },
    { tc: 1425, honorarios: false, despAdic: 1670 },
    { tc: 1425, honorarios: false, despAdic: 920  },
  ],
};

// ─── InvoiceTable ─────────────────────────────────────────────────────────────
function InvoiceTable({ rows, onUpdate, onAdd, onRemove, accentColor = '#2563eb' }) {
  const tot = catTot(rows);
  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ ...TH, width: '35%' }}>Descripción</th>
              <th style={{ ...TH, width: '15%' }}>N° Factura</th>
              <th style={{ ...TH, width: '12%', textAlign: 'right' }}>USD</th>
              <th style={{ ...TH, width: '10%', textAlign: 'right' }}>T.C.</th>
              <th style={{ ...TH, width: '20%', textAlign: 'right' }}>PESOS</th>
              <th style={{ ...TH, width: '8%' }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const calcPesos = n(row.usd) > 0 && n(row.tc) > 0;
              return (
                <tr key={row.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={TD}><input value={row.desc} onChange={e => onUpdate(i,'desc',e.target.value)} style={{ ...INP, fontSize: '0.8rem' }} placeholder="Descripción" /></td>
                  <td style={TD}><input value={row.factura} onChange={e => onUpdate(i,'factura',e.target.value)} style={{ ...INP, fontSize: '0.8rem' }} placeholder="—" /></td>
                  <td style={TD}>
                    <input type="number" step="any" value={row.usd} onChange={e => onUpdate(i,'usd',e.target.value)}
                      style={{ ...INP, textAlign: 'right', color: '#2563eb', fontWeight: 600 }} placeholder="0" />
                  </td>
                  <td style={TD}>
                    <input type="number" step="any" value={row.tc} onChange={e => onUpdate(i,'tc',e.target.value)}
                      style={{ ...INP, textAlign: 'right', color: '#2563eb', fontWeight: 600 }} placeholder="—" />
                  </td>
                  <td style={TD}>
                    {calcPesos
                      ? <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#059669' }}>{fmtP(n(row.usd) * n(row.tc))}</span>
                      : <input type="number" step="any" value={row.pesos} onChange={e => onUpdate(i,'pesos',e.target.value)}
                          style={{ ...INP, textAlign: 'right', color: '#2563eb', fontWeight: 600 }} placeholder="0" />
                    }
                  </td>
                  <td style={TD}>
                    <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '1rem', padding: '0 0.25rem' }}>×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <button onClick={onAdd} style={{ background: 'none', border: `1px dashed ${accentColor}`, borderRadius: '7px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, color: accentColor, cursor: 'pointer' }}>
          + Agregar línea
        </button>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {tot.usd > 0 && <span style={{ fontSize: '0.78rem', color: '#64748b' }}>USD {fmtU(tot.usd)}</span>}
          <div style={{ background: '#f0f7ff', borderRadius: '8px', padding: '0.35rem 0.85rem' }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginRight: '0.5rem' }}>Subtotal</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: accentColor }}>{fmtP(tot.pesos)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── OperationsList ───────────────────────────────────────────────────────────
function OperationsList({ onSelect }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.2rem' }}>Operaciones</h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Seleccioná una operación para ver el detalle de costos</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.1rem', borderRadius: '50px', border: 'none', cursor: 'pointer', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: '0.82rem' }}>
          + Nueva operación
        </button>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {MOCK_OPS.map(op => (
          <div key={op.id} onClick={() => op.id === 'franco-modulos' && onSelect(op)}
            style={{ ...CARD, display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr auto', alignItems: 'center', gap: '1.5rem', cursor: op.id === 'franco-modulos' ? 'pointer' : 'default', opacity: op.id !== 'franco-modulos' ? 0.55 : 1, transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => op.id === 'franco-modulos' && (e.currentTarget.style.boxShadow = '0 8px 30px rgba(37,99,235,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = CARD.boxShadow)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: op.color, flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>{op.nombre}</p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{op.fecha}</p>
              </div>
            </div>
            <div><p style={LBL}>Contenedor</p><p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>{op.contenedor}</p></div>
            <div><p style={LBL}>M³ Total</p><p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>{op.m3} m³</p></div>
            <div><p style={LBL}>Proveedores</p><p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>{op.proveedores}</p></div>
            <div>
              <span style={{ display: 'inline-flex', padding: '0.2rem 0.65rem', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 700, background: op.color + '20', color: op.color }}>
                {op.estado}
              </span>
            </div>
            {op.id === 'franco-modulos'
              ? <button style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: 'none', background: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>Ver →</button>
              : <div style={{ width: '60px' }} />
            }
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── OperationDetail ──────────────────────────────────────────────────────────
function OperationDetail({ op, onBack }) {
  // default tab is 'proveedores' — user enters providers first
  const [mainTab,   setMainTab]   = useState('proveedores');
  const [gastoTab,  setGastoTab]  = useState('naviera');

  // ── gastos state ──
  const init = (arr) => arr.length ? arr.map((r, i) => ({ ...r, id: i + 1 })) : [newRow()];
  const [naviera,    setNaviera]    = useState(init(FRANCO.naviera));
  const [terminal,   setTerminal]   = useState(init(FRANCO.terminal));
  const [aduana,     setAduana]     = useState(init(FRANCO.aduana));
  const [transporte, setTransporte] = useState(init(FRANCO.transporte));
  const [despachante,setDespachante]= useState(init(FRANCO.despachante));
  const [admin,      setAdmin]      = useState(init(FRANCO.admin));
  const [fleteIntl,  setFleteIntl]  = useState(init(FRANCO.fleteIntl));

  // ── proveedores + a cobrar ──
  const [proveedores, setProveedores] = useState([...FRANCO.proveedores, newProv()]);
  const [cobrar,      setCobrar]      = useState([...FRANCO.cobrar, { tc: '', honorarios: true, despAdic: '' }]);

  // ── row helpers ──
  const upd = (setter) => (i, f, v) => setter(p => p.map((r, j) => j === i ? { ...r, [f]: v } : r));
  const add = (setter) => () => setter(p => [...p, newRow()]);
  const rem = (setter) => (i) => setter(p => p.filter((_, j) => j !== i));
  const updP = (i, f, v) => setProveedores(p => p.map((r, j) => j === i ? { ...r, [f]: v } : r));
  const updC = (i, f, v) => setCobrar(p => p.map((r, j) => j === i ? { ...r, [f]: v } : r));

  // ── calculations ──
  const calc = useMemo(() => {
    const tNav  = catTot(naviera);
    const tTerm = catTot(terminal);
    const tAdu  = catTot(aduana);
    const tTra  = catTot(transporte);
    const tDes  = catTot(despachante);
    const tAdm  = catTot(admin);
    const tFlt  = catTot(fleteIntl);

    const enBlancoPesos = tNav.pesos + tTerm.pesos + tAdu.pesos + tTra.pesos + tDes.pesos + tAdm.pesos;
    const enBlancoUSD   = tNav.usd   + tTerm.usd   + tAdu.usd   + tTra.usd   + tDes.usd   + tAdm.usd;
    const cashPesos     = tFlt.pesos;
    const prorBase      = enBlancoPesos - tAdu.pesos + cashPesos; // excluye VEP aduana

    const totalM3 = proveedores.reduce((s, p) => s + n(p.m3), 0);

    const perProv = proveedores
      .filter(p => p.nombre !== '')
      .map((p, i) => {
        const ratio        = totalM3 > 0 ? n(p.m3) / totalM3 : 0;
        const prorPesos    = Math.round(ratio * prorBase);
        const tributoPesos = Math.round(n(p.tributosUSD) * n(p.tributosTC));
        const costoFinal   = prorPesos + tributoPesos;
        const cb           = cobrar[i] || { tc: 0, honorarios: false, despAdic: 0 };
        const gastosUSD    = n(cb.tc) > 0 ? Math.round((costoFinal / n(cb.tc)) * 100) / 100 : 0;
        const origenUSD    = n(p.gastosOrigenUSD);
        const fobPlus      = n(p.fobUSD) + gastosUSD + origenUSD;
        const honorarios   = cb.honorarios ? Math.round(fobPlus * 0.04 * 100) / 100 : 0;
        const totalUSD     = Math.round((gastosUSD + origenUSD + honorarios + n(cb.despAdic)) * 100) / 100;
        return { nombre: p.nombre, tipo: p.tipo || 'Cliente', m3: n(p.m3), fobUSD: n(p.fobUSD), origenUSD, ratio, prorPesos, tributoPesos, costoFinal, gastosUSD, fobPlus, honorarios, totalUSD, cb };
      });

    return {
      tNav, tTerm, tAdu, tTra, tDes, tAdm, tFlt,
      enBlancoPesos, enBlancoUSD, cashPesos,
      totalGeneral: enBlancoPesos + cashPesos,
      prorBase, totalM3, perProv,
      totalCostoFinal: perProv.reduce((s, p) => s + p.costoFinal, 0),
      totalACobrar:    perProv.reduce((s, p) => s + p.totalUSD, 0),
    };
  }, [naviera, terminal, aduana, transporte, despachante, admin, fleteIntl, proveedores, cobrar]);

  // ── gasto categories config ──
  const GASTOS = [
    { id: 'naviera',    label: 'Naviera',         color: '#2563eb', rows: naviera,    setter: setNaviera    },
    { id: 'terminal',   label: 'Terminal',         color: '#7c3aed', rows: terminal,   setter: setTerminal   },
    { id: 'aduana',     label: 'VEP Aduana',       color: '#dc2626', rows: aduana,     setter: setAduana     },
    { id: 'transporte', label: 'Transporte',       color: '#d97706', rows: transporte, setter: setTransporte },
    { id: 'despachante',label: 'Despachante',      color: '#059669', rows: despachante,setter: setDespachante},
    { id: 'admin',      label: 'Gastos Admin',     color: '#64748b', rows: admin,      setter: setAdmin      },
    { id: 'fleteIntl',  label: 'Flete Internacional (Cash)', color: '#374151', rows: fleteIntl, setter: setFleteIntl },
  ];

  const catTotMap = {
    naviera: calc.tNav, terminal: calc.tTerm, aduana: calc.tAdu,
    transporte: calc.tTra, despachante: calc.tDes, admin: calc.tAdm, fleteIntl: calc.tFlt,
  };
  const activeCat = GASTOS.find(g => g.id === gastoTab);

  // ── proveedores activos ──
  const provActivos = proveedores.filter(p => p.nombre !== '');

  // ── tipo toggle colors ──
  const tipoStyle = (tipo) => tipo === 'Propio'
    ? { background: '#f0fdf4', color: '#059669', border: '1.5px solid #bbf7d0' }
    : { background: '#eff6ff', color: '#2563eb', border: '1.5px solid #bfdbfe' };

  return (
    <div style={{ paddingBottom: '3rem' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', borderRadius: '50px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
          ← Operaciones
        </button>
        <div style={{ height: '20px', width: '1px', background: '#e2e8f0' }} />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.15rem' }}>{op.nombre}</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[['Contenedor', op.contenedor], ['M³ total', `${calc.totalM3.toFixed(2)} m³`], ['Proveedores', provActivos.length], ['Fecha', op.fecha]].map(([k, v]) => (
              <span key={k} style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{k}: <strong style={{ color: '#475569' }}>{v}</strong></span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ textAlign: 'right', background: '#f0fdf4', borderRadius: '10px', padding: '0.5rem 1rem' }}>
            <p style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Total General</p>
            <p style={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>{fmtP(calc.totalGeneral)}</p>
          </div>
          <div style={{ textAlign: 'right', background: '#eff6ff', borderRadius: '10px', padding: '0.5rem 1rem' }}>
            <p style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>A Cobrar</p>
            <p style={{ fontSize: '1rem', fontWeight: 800, color: '#2563eb' }}>{fmtU(calc.totalACobrar)}</p>
          </div>
        </div>
      </div>

      {/* MAIN TABS — Proveedores first */}
      <div style={{ display: 'flex', background: '#fff', borderRadius: '12px', padding: '4px', border: '1px solid #e2e8f0', gap: '3px', marginBottom: '1.25rem', width: 'fit-content' }}>
        {[['proveedores','Proveedores & Carga'],['gastos','Gastos'],['acobrar','A Cobrar (USD)']].map(([id, lbl]) => (
          <button key={id} onClick={() => setMainTab(id)} style={{ padding: '0.55rem 1.2rem', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, background: mainTab === id ? '#2563eb' : 'transparent', color: mainTab === id ? '#fff' : '#94a3b8', transition: 'all 0.15s' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ══ TAB: PROVEEDORES ════════════════════════════════════════════════ */}
      {mainTab === 'proveedores' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* provider input table */}
          <div style={CARD}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Proveedores — Carga, m³ y FOB</p>
              <span style={{ fontSize: '0.65rem', background: '#fff7ed', color: '#d97706', padding: '0.15rem 0.6rem', borderRadius: '50px', fontWeight: 700, border: '1px solid #fde68a' }}>
                Comenzá por acá
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fff7ed' }}>
                    <th style={{ ...TH, color: '#92400e', background: 'none', width: '22%' }}>Proveedor</th>
                    <th style={{ ...TH, color: '#92400e', background: 'none', width: '12%' }}>Tipo</th>
                    <th style={{ ...TH, color: '#92400e', background: 'none', width: '10%' }}>m³ (CBM)</th>
                    <th style={{ ...TH, color: '#92400e', background: 'none', width: '13%' }}>FOB USD</th>
                    <th style={{ ...TH, color: '#92400e', background: 'none', width: '14%' }}>Gs. Origen USD</th>
                    <th style={{ ...TH, color: '#92400e', background: 'none', width: '11%' }}>% Ocupación</th>
                    <th style={{ width: '7%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {proveedores.map((p, i) => {
                    const ratioVal = calc.totalM3 > 0 ? n(p.m3) / calc.totalM3 : 0;
                    return (
                      <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td style={TD}><input value={p.nombre} onChange={e => updP(i,'nombre',e.target.value)} style={{ ...INP, fontWeight: 600, color: '#2563eb' }} placeholder="Nombre del proveedor" /></td>
                        <td style={TD}>
                          {p.nombre ? (
                            <button
                              onClick={() => updP(i,'tipo', p.tipo === 'Cliente' ? 'Propio' : 'Cliente')}
                              style={{ ...tipoStyle(p.tipo || 'Cliente'), borderRadius: '50px', padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              {(p.tipo || 'Cliente') === 'Cliente' ? '🤝' : '📦'} {p.tipo || 'Cliente'}
                            </button>
                          ) : <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>}
                        </td>
                        <td style={TD}><input type="number" step="any" value={p.m3} onChange={e => updP(i,'m3',e.target.value)} style={{ ...INP, color: '#2563eb', fontWeight: 600, textAlign: 'right' }} placeholder="0" /></td>
                        <td style={TD}><input type="number" step="any" value={p.fobUSD} onChange={e => updP(i,'fobUSD',e.target.value)} style={{ ...INP, color: '#2563eb', fontWeight: 600, textAlign: 'right' }} placeholder="0" /></td>
                        <td style={TD}>
                          <input type="number" step="any" value={p.gastosOrigenUSD} onChange={e => updP(i,'gastosOrigenUSD',e.target.value)}
                            style={{ ...INP, color: n(p.gastosOrigenUSD) > 0 ? '#d97706' : '#94a3b8', fontWeight: n(p.gastosOrigenUSD) > 0 ? 700 : 400, textAlign: 'right' }} placeholder="0" />
                        </td>
                        <td style={TD}>
                          {p.nombre ? (
                            <div style={{ background: '#fff7ed', borderRadius: '6px', padding: '0.3rem 0.6rem', textAlign: 'right' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#d97706' }}>{pct(ratioVal)}</span>
                            </div>
                          ) : <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>}
                        </td>
                        <td style={TD}>
                          {p.nombre && <button onClick={() => { setProveedores(pr => pr.filter((_, j) => j !== i)); setCobrar(c => c.filter((_, j) => j !== i)); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1' }}>×</button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f1f5f9' }}>
                    <td style={{ ...TD, fontWeight: 700 }}>TOTAL</td>
                    <td style={TD} />
                    <td style={{ ...TD, fontWeight: 700, textAlign: 'right' }}>{calc.totalM3.toFixed(2)} m³</td>
                    <td style={{ ...TD, fontWeight: 700, textAlign: 'right' }}>{fmtU(proveedores.reduce((s, p) => s + n(p.fobUSD), 0))}</td>
                    <td style={{ ...TD, fontWeight: 700, textAlign: 'right', color: '#d97706' }}>{fmtU(proveedores.reduce((s, p) => s + n(p.gastosOrigenUSD), 0))}</td>
                    <td style={{ ...TD, fontWeight: 700 }}>100%</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <button onClick={() => { setProveedores(p => [...p, newProv()]); setCobrar(c => [...c, { tc: '', honorarios: true, despAdic: '' }]); }}
              style={{ marginTop: '0.6rem', background: 'none', border: '1px dashed #d97706', borderRadius: '7px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, color: '#d97706', cursor: 'pointer' }}>
              + Agregar proveedor
            </button>
          </div>

          {/* VEP per provider + proration results side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

            {/* VEP Aduana por proveedor */}
            <div style={CARD}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>VEP Aduana por proveedor</p>
                <span style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#dc2626', padding: '0.15rem 0.5rem', borderRadius: '50px', fontWeight: 700 }}>Asignación manual</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fff5f5' }}>
                    {['Proveedor', 'USD Tributos', 'T.C.', 'PESOS'].map(h => <th key={h} style={{ ...TH, color: '#dc2626' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {proveedores.filter(p => p.nombre !== '').map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ ...TD, fontWeight: 600, color: '#374151' }}>{p.nombre}</td>
                      <td style={TD}><input type="number" step="any" value={p.tributosUSD} onChange={e => updP(proveedores.indexOf(p),'tributosUSD',e.target.value)} style={{ ...INP, color: '#2563eb', fontWeight: 600, textAlign: 'right' }} placeholder="0" /></td>
                      <td style={TD}><input type="number" step="any" value={p.tributosTC} onChange={e => updP(proveedores.indexOf(p),'tributosTC',e.target.value)} style={{ ...INP, color: '#2563eb', fontWeight: 600, textAlign: 'right' }} placeholder="—" /></td>
                      <td style={{ ...TD, fontWeight: 700, color: '#dc2626', textAlign: 'right' }}>
                        {n(p.tributosUSD) > 0 && n(p.tributosTC) > 0 ? fmtP(n(p.tributosUSD) * n(p.tributosTC)) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#fee2e2' }}>
                    <td style={{ ...TD, fontWeight: 700 }}>TOTAL</td>
                    <td style={{ ...TD, fontWeight: 700, textAlign: 'right' }}>{fmtU(proveedores.filter(p=>p.nombre!=='').reduce((s,p)=>s+n(p.tributosUSD),0))}</td>
                    <td />
                    <td style={{ ...TD, fontWeight: 700, textAlign: 'right', color: '#dc2626' }}>{fmtP(calc.perProv.reduce((s,p)=>s+p.tributoPesos,0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Costo Final por proveedor */}
            <div style={CARD}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Costo final asignado</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f0fdf4' }}>
                    {['Proveedor', 'Sin VEP (prorr.)', 'VEP', 'TOTAL PESOS'].map(h => <th key={h} style={{ ...TH, color: '#059669' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {calc.perProv.map((p, i) => (
                    <tr key={p.nombre} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ ...TD, fontWeight: 600 }}>{p.nombre}</td>
                      <td style={{ ...TD, textAlign: 'right', color: '#64748b' }}>{fmtP(p.prorPesos)}</td>
                      <td style={{ ...TD, textAlign: 'right', color: '#dc2626' }}>{fmtP(p.tributoPesos)}</td>
                      <td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: '#059669' }}>{fmtP(p.costoFinal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#dcfce7' }}>
                    <td style={{ ...TD, fontWeight: 700 }}>TOTAL</td>
                    <td style={{ ...TD, fontWeight: 700, textAlign: 'right' }}>{fmtP(calc.perProv.reduce((s,p)=>s+p.prorPesos,0))}</td>
                    <td style={{ ...TD, fontWeight: 700, textAlign: 'right', color: '#dc2626' }}>{fmtP(calc.perProv.reduce((s,p)=>s+p.tributoPesos,0))}</td>
                    <td style={{ ...TD, fontWeight: 800, textAlign: 'right', color: '#059669' }}>{fmtP(calc.totalCostoFinal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Gastos avance mini-panel */}
          <div style={{ ...CARD, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div>
                <p style={LBL}>Base de prorrateo</p>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{fmtP(calc.prorBase)}</p>
                <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>En blanco − VEP + Cash</p>
              </div>
              <div>
                <p style={LBL}>Total General gastos</p>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>{fmtP(calc.totalGeneral)}</p>
              </div>
              <div>
                <p style={LBL}>Costo total asignado</p>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: '#2563eb' }}>{fmtP(calc.totalCostoFinal)}</p>
              </div>
            </div>
            <button onClick={() => setMainTab('gastos')} style={{ padding: '0.55rem 1.1rem', borderRadius: '50px', border: '1px solid #e2e8f0', background: '#fff', color: '#2563eb', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
              Cargar gastos →
            </button>
          </div>
        </div>
      )}

      {/* ══ TAB: GASTOS ══════════════════════════════════════════════════════ */}
      {mainTab === 'gastos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' }}>

          {/* left: input area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {/* category pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {GASTOS.map(g => {
                const tot = catTotMap[g.id];
                const active = gastoTab === g.id;
                return (
                  <button key={g.id} onClick={() => setGastoTab(g.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.5rem 0.85rem', borderRadius: '10px', border: active ? `2px solid ${g.color}` : '1px solid #e2e8f0', cursor: 'pointer', background: active ? g.color + '10' : '#fff', transition: 'all 0.15s', minWidth: '110px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: active ? g.color : '#94a3b8' }}>{g.label}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: active ? g.color : (tot.pesos > 0 ? '#1e293b' : '#cbd5e1') }}>
                      {tot.pesos > 0 ? fmtP(tot.pesos) : '—'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* active category table */}
            {activeCat && (
              <div style={CARD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeCat.color }} />
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>{activeCat.label}</p>
                  {activeCat.id === 'aduana' && (
                    <span style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#dc2626', padding: '0.15rem 0.5rem', borderRadius: '50px', fontWeight: 700 }}>
                      No se proratea — se asigna por proveedor
                    </span>
                  )}
                  {activeCat.id === 'fleteIntl' && (
                    <span style={{ fontSize: '0.65rem', background: '#f1f5f9', color: '#64748b', padding: '0.15rem 0.5rem', borderRadius: '50px', fontWeight: 700 }}>
                      CASH — se proratea por m³
                    </span>
                  )}
                </div>
                <InvoiceTable
                  rows={activeCat.rows}
                  accentColor={activeCat.color}
                  onUpdate={upd(activeCat.setter)}
                  onAdd={add(activeCat.setter)}
                  onRemove={rem(activeCat.setter)}
                />
              </div>
            )}

            {/* base de prorrateo explanation */}
            <div style={{ ...CARD, background: '#fffbeb', border: '1px solid #fde68a', padding: '0.85rem 1rem' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e', marginBottom: '0.5rem' }}>Base de prorrateo por m³</p>
              <p style={{ fontSize: '0.78rem', color: '#78350f' }}>
                Total en Blanco <strong>{fmtP(calc.enBlancoPesos)}</strong>
                &nbsp;− VEP Aduana <strong>{fmtP(calc.tAdu.pesos)}</strong>
                &nbsp;+ Cash <strong>{fmtP(calc.cashPesos)}</strong>
                &nbsp;= <strong>{fmtP(calc.prorBase)}</strong>
              </p>
            </div>
          </div>

          {/* right: totals summary (sticky) */}
          <div style={{ position: 'sticky', top: '1rem' }}>
            <div style={CARD}>
              <p style={{ ...LBL, marginBottom: '0.85rem' }}>Resumen de gastos</p>
              {GASTOS.map(g => {
                const tot = catTotMap[g.id];
                return (
                  <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: tot.pesos > 0 ? g.color : '#e2e8f0' }} />
                      <span style={{ fontSize: '0.78rem', color: '#475569' }}>{g.label}</span>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: tot.pesos > 0 ? '#1e293b' : '#cbd5e1' }}>{fmtP(tot.pesos)}</span>
                  </div>
                );
              })}

              <div style={{ marginTop: '0.85rem', borderTop: '2px solid #e2e8f0', paddingTop: '0.85rem' }}>
                {[
                  ['Total en Blanco (vía banco)', calc.enBlancoPesos, '#1F4E79'],
                  ['Total Cash (flete intl.)',     calc.cashPesos,     '#375623'],
                ].map(([lbl, val, c]) => (
                  <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.8rem', fontWeight: 600 }}>
                    <span style={{ color: '#64748b' }}>{lbl}</span>
                    <span style={{ color: val > 0 ? '#1e293b' : '#cbd5e1' }}>{fmtP(val)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: '#1e293b', borderRadius: '10px', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8' }}>TOTAL GENERAL</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>{fmtP(calc.totalGeneral)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: A COBRAR ════════════════════════════════════════════════════ */}
      {mainTab === 'acobrar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={CARD}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>A Cobrar por proveedor — todo en USD</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th colSpan={4} style={{ ...TH, background: '#eff6ff', color: '#2563eb', textAlign: 'center', padding: '0.5rem' }}>① Gastos asignados</th>
                    <th colSpan={1} style={{ ...TH, background: '#fff7ed', color: '#d97706', textAlign: 'center', padding: '0.5rem' }}>② Gs. Origen</th>
                    <th colSpan={3} style={{ ...TH, background: '#f5f3ff', color: '#7c3aed', textAlign: 'center', padding: '0.5rem' }}>③ Honorarios (4%)</th>
                    <th colSpan={2} style={{ ...TH, background: '#f0fdf4', color: '#059669', textAlign: 'center', padding: '0.5rem' }}>④ Despachante</th>
                    <th style={{ ...TH, background: '#1e293b', color: '#fff', textAlign: 'center', padding: '0.5rem', borderRadius: '0 8px 0 0' }}>TOTAL USD</th>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Proveedor','Tipo','m³','T.C. conv.','Gastos $ → USD','Gs. Origen USD','FOB USD','FOB + Todo','Honor. 4%','Desp. Adic. USD','Activo',''].map(h => (
                      <th key={h} style={{ ...TH }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calc.perProv.map((p, i) => (
                    <tr key={p.nombre} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ ...TD, fontWeight: 700 }}>{p.nombre}</td>
                      <td style={TD}>
                        <span style={{ ...tipoStyle(p.tipo), display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', borderRadius: '50px', fontSize: '0.68rem', fontWeight: 700 }}>
                          {p.tipo === 'Propio' ? '📦' : '🤝'} {p.tipo}
                        </span>
                      </td>
                      <td style={{ ...TD, textAlign: 'right', color: '#64748b' }}>{p.m3}</td>
                      <td style={TD}>
                        <input type="number" step="any" value={cobrar[i]?.tc ?? ''} onChange={e => updC(i,'tc',e.target.value)}
                          style={{ ...INP, width: '85px', color: '#2563eb', fontWeight: 600, textAlign: 'right' }} placeholder="TC" />
                      </td>
                      <td style={{ ...TD, textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>{fmtU(p.gastosUSD)}</td>
                      <td style={{ ...TD, textAlign: 'right', fontWeight: 600, color: p.origenUSD > 0 ? '#d97706' : '#cbd5e1' }}>{p.origenUSD > 0 ? fmtU(p.origenUSD) : '—'}</td>
                      <td style={{ ...TD, textAlign: 'right', color: '#64748b' }}>{fmtU(p.fobUSD)}</td>
                      <td style={{ ...TD, textAlign: 'right', color: '#64748b' }}>{fmtU(p.fobPlus)}</td>
                      <td style={{ ...TD, textAlign: 'right', color: '#7c3aed', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => updC(i,'honorarios',!cobrar[i]?.honorarios)}
                            style={{ padding: '0.15rem 0.55rem', borderRadius: '50px', border: 'none', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, background: cobrar[i]?.honorarios ? '#ede9fe' : '#f1f5f9', color: cobrar[i]?.honorarios ? '#7c3aed' : '#94a3b8' }}>
                            {cobrar[i]?.honorarios ? 'SÍ' : 'NO'}
                          </button>
                          {cobrar[i]?.honorarios && <span>{fmtU(p.honorarios)}</span>}
                        </div>
                      </td>
                      <td style={TD}>
                        <input type="number" step="any" value={cobrar[i]?.despAdic ?? ''} onChange={e => updC(i,'despAdic',e.target.value)}
                          style={{ ...INP, width: '95px', color: '#2563eb', fontWeight: 600, textAlign: 'right' }} placeholder="0" />
                      </td>
                      <td style={TD}>
                        <span style={{ fontSize: '0.68rem', background: '#f0fdf4', color: '#059669', padding: '0.15rem 0.5rem', borderRadius: '50px', fontWeight: 700 }}>✓</span>
                      </td>
                      <td style={{ ...TD, fontWeight: 800, color: '#7c3aed', fontSize: '0.9rem', textAlign: 'right' }}>{fmtU(p.totalUSD)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#1e293b' }}>
                    <td colSpan={4} style={{ ...TD, color: '#fff', fontWeight: 700, borderBottom: 'none' }}>TOTAL</td>
                    <td style={{ ...TD, color: '#93c5fd', fontWeight: 700, textAlign: 'right', borderBottom: 'none' }}>{fmtU(calc.perProv.reduce((s,p)=>s+p.gastosUSD,0))}</td>
                    <td style={{ ...TD, color: '#fdba74', fontWeight: 700, textAlign: 'right', borderBottom: 'none' }}>{fmtU(calc.perProv.reduce((s,p)=>s+p.origenUSD,0))}</td>
                    <td style={{ ...TD, color: '#94a3b8', textAlign: 'right', borderBottom: 'none' }}>{fmtU(calc.perProv.reduce((s,p)=>s+p.fobUSD,0))}</td>
                    <td style={{ ...TD, color: '#94a3b8', textAlign: 'right', borderBottom: 'none' }}>{fmtU(calc.perProv.reduce((s,p)=>s+p.fobPlus,0))}</td>
                    <td style={{ ...TD, color: '#c4b5fd', fontWeight: 700, textAlign: 'right', borderBottom: 'none' }}>{fmtU(calc.perProv.reduce((s,p)=>s+p.honorarios,0))}</td>
                    <td style={{ ...TD, color: '#94a3b8', textAlign: 'right', borderBottom: 'none' }}>{fmtU(calc.perProv.reduce((s,p)=>s+n(cobrar[calc.perProv.indexOf(p)]?.despAdic),0))}</td>
                    <td style={{ borderBottom: 'none' }} />
                    <td style={{ ...TD, fontWeight: 800, color: '#fff', fontSize: '1rem', textAlign: 'right', borderBottom: 'none' }}>{fmtU(calc.totalACobrar)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {calc.perProv.map((p, i) => (
              <div key={p.nombre} style={{ ...CARD, borderTop: `3px solid ${p.tipo === 'Propio' ? '#059669' : '#7c3aed'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.nombre}</p>
                  <span style={{ ...tipoStyle(p.tipo), fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '50px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    {p.tipo === 'Propio' ? '📦' : '🤝'} {p.tipo}
                  </span>
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: p.tipo === 'Propio' ? '#059669' : '#7c3aed', lineHeight: 1, marginBottom: '0.4rem' }}>{fmtU(p.totalUSD)}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  {[['Gastos', fmtU(p.gastosUSD)], ['Gs. Origen', fmtU(p.origenUSD)], ['FOB', fmtU(p.fobUSD)], ['Honor.', fmtU(p.honorarios)]].map(([l,v]) => (
                    <div key={l}><p style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{l}</p><p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>{v}</p></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function Operations() {
  const [selected, setSelected] = useState(null);
  if (selected) return <OperationDetail op={selected} onBack={() => setSelected(null)} />;
  return <OperationsList onSelect={setSelected} />;
}
