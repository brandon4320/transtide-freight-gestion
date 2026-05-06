'use client';
import { useState, useMemo, useEffect } from 'react';

const CLIENTES_KEY = 'transtide-clientes';
const MOCK_CLIENTES = [
  { id: 'c1', nombre: 'Franco Modulos SRL', cuit: '30-71234567-8' },
  { id: 'c2', nombre: 'Gym Equipment SA',   cuit: '30-67890123-4' },
];

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
const newProv  = () => ({ id: Date.now() + Math.random(), nombre: '', tipo: 'Cliente', clienteId: '', m3: '', fobUSD: '', gastosOrigenUSD: '', tributosUSD: '', tributosTC: '' });

// ─── checklist de tareas ──────────────────────────────────────────────────────
const CHECKLIST = [
  // Fase 1 — Pre-arribo
  { id: 'cg',    fase: 1, label: 'Carta de garantía naviera' },
  { id: 'ncm',   fase: 1, label: 'Revisión de posición arancelaria (NCM) vs. BL' },
  { id: 'afip',  fase: 1, label: 'Verificar registro del despachante en AFIP para la sociedad que importe' },
  { id: 'alta',  fase: 1, label: 'Alta del contenedor en terminal de arribo (TRP u otra)' },
  { id: 'bl',    fase: 1, label: 'Recepción del BL original / telex release confirmado' },
  { id: 'inv',   fase: 1, label: 'Solicitar invoice + packing list definitivos al proveedor' },
  // Fase 2 — Documentación y Aduana
  { id: 'legajo',fase: 2, label: 'Armado del legajo con despachante (invoice, BL, packing, etc.)' },
  { id: 'fnav',  fase: 2, label: 'Recepción, pago y aviso de factura naviera' },
  { id: 'lib',   fase: 2, label: 'Confirmación de liberación del contenedor por naviera (libre deuda)' },
  // Fase 3 — Logística y Cierre
  { id: 'flete', fase: 3, label: 'Coordinación de flete BsAs → Bahía Blanca' },
  { id: 'facts', fase: 3, label: 'Recopilación de todas las facturas (naviera, terminal, despachante, flete, admin)' },
  { id: 'costs', fase: 3, label: 'Carga de costos en sistema' },
  { id: 'devol', fase: 3, label: 'Devolución del contenedor vacío + confirmación' },
  { id: 'desp',  fase: 3, label: 'Carga de despacho aduanero final' },
  { id: 'drive', fase: 3, label: 'Archivo del legajo completo en Drive' },
];

const FASES = [
  { id: 1, label: 'Pre-arribo',           color: '#ea580c', bg: '#fff4ee', badge: 'rgba(234,88,12,0.25)' },
  { id: 2, label: 'Documentación y Aduana', color: '#d97706', bg: '#fffbeb', badge: '#fde68a' },
  { id: 3, label: 'Logística y Cierre',   color: '#059669', bg: '#f0fdf4', badge: '#bbf7d0' },
];

// ─── operations list data ─────────────────────────────────────────────────────
// Estados del flujo real de importación (en orden cronológico)
const ESTADOS = [
  { label: 'Consolidando',      icon: '📦', color: '#64748b', bg: '#f1f5f9',  desc: 'Carga en preparación en origen' },
  { label: 'En tránsito',       icon: '🚢', color: '#ea580c', bg: '#fff4ee',  desc: 'Contenedor en el mar' },
  { label: 'Arribado',          icon: '⚓', color: '#0891b2', bg: '#ecfeff',  desc: 'Llegó al puerto de destino' },
  { label: 'En aduana',         icon: '📋', color: '#d97706', bg: '#fffbeb',  desc: 'Proceso de desaduanización' },
  { label: 'Listo p/ retiro',   icon: '✅', color: '#ea580c', bg: '#fff7ed',  desc: 'Canal verde / libre para retirar' },
  { label: 'En tránsito local', icon: '🚛', color: '#7c3aed', bg: '#f5f3ff',  desc: 'Flete en camino al destino final' },
  { label: 'Entregado',         icon: '🏁', color: '#059669', bg: '#f0fdf4',  desc: 'Mercadería en destino final' },
  { label: 'Liquidado',         icon: '💰', color: '#065f46', bg: '#ecfdf5',  desc: 'Costos cerrados y cobrados' },
  { label: 'Cancelado',         icon: '✕',  color: '#94a3b8', bg: '#f8fafc',  desc: 'Operación cancelada' },
];
const estadoObj   = (e) => ESTADOS.find(s => s.label === e) || ESTADOS[0];
const estadoColor = (e) => estadoObj(e).color;
const CONTENEDORES = ['20 Pies', '40 Pies', '40HQ', 'Flat Rack', 'LCL'];
const CONTAINER_M3 = { '20 Pies': 28, '40 Pies': 56, '40HQ': 76, 'Flat Rack': 76, 'LCL': null };
const OPS_KEY = 'transtide-operaciones';

const INIT_OPS = [
  { id: 'franco-modulos', nombre: 'Franco Modulos 2 + varios',      contenedor: '40HQ',    bl: 'MAEU7546833339', eta: '22/03/2024', proveedores: 3, estado: 'Liquidado',    fecha: '15/03/2024' },
  { id: 'agro-export',    nombre: 'Agro Export — Fertilizantes',    contenedor: '20 Pies', bl: 'HLCU4012981002', eta: '10/04/2024', proveedores: 1, estado: 'En aduana',    fecha: '02/04/2024' },
  { id: 'med-supply',     nombre: 'Med Supply — Insumos Médicos',   contenedor: '40HQ',    bl: '',               eta: '28/04/2024', proveedores: 2, estado: 'Consolidando', fecha: '20/04/2024' },
];
const emptyOp = () => ({ id: '', nombre: '', contenedor: '40HQ', bl: '', eta: '', proveedores: '', estado: 'Consolidando', fecha: '' });

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
    { id: 1, nombre: 'karting',     tipo: 'Cliente', clienteId: 'c1', m3: 20.34, fobUSD: 25314, gastosOrigenUSD: '',  tributosUSD: 3991.87, tributosTC: 1390 },
    { id: 2, nombre: 'gimnasio',    tipo: 'Cliente', clienteId: 'c1', m3: 13,    fobUSD: 5500,  gastosOrigenUSD: '',  tributosUSD: 2746.04, tributosTC: 1390 },
    { id: 3, nombre: 'generadores', tipo: 'Propio',  clienteId: '',   m3: 4.8,   fobUSD: 16000, gastosOrigenUSD: 350, tributosUSD: 1176.05, tributosTC: 1390 },
  ],
  cobrar:[
    { tc: 1425, honorarios: false, despAdic: 8000 },
    { tc: 1425, honorarios: false, despAdic: 1670 },
    { tc: 1425, honorarios: false, despAdic: 920  },
  ],
  checked: ['cg', 'ncm', 'bl', 'inv', 'legajo', 'fnav', 'lib', 'flete', 'facts', 'costs'],
};

// ─── InvoiceTable ─────────────────────────────────────────────────────────────
function InvoiceTable({ rows, onUpdate, onAdd, onRemove, accentColor = '#ea580c' }) {
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
                      style={{ ...INP, textAlign: 'right', color: '#ea580c', fontWeight: 600 }} placeholder="0" />
                  </td>
                  <td style={TD}>
                    <input type="number" step="any" value={row.tc} onChange={e => onUpdate(i,'tc',e.target.value)}
                      style={{ ...INP, textAlign: 'right', color: '#ea580c', fontWeight: 600 }} placeholder="—" />
                  </td>
                  <td style={TD}>
                    {calcPesos
                      ? <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#059669' }}>{fmtP(n(row.usd) * n(row.tc))}</span>
                      : <input type="number" step="any" value={row.pesos} onChange={e => onUpdate(i,'pesos',e.target.value)}
                          style={{ ...INP, textAlign: 'right', color: '#ea580c', fontWeight: 600 }} placeholder="0" />
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
  const [ops,     setOps]     = useState(() => {
    try { const s = typeof window !== 'undefined' && localStorage.getItem(OPS_KEY); return s ? JSON.parse(s) : INIT_OPS; } catch { return INIT_OPS; }
  });
  const [modal,     setModal]     = useState(null); // null | 'new' | opObj
  const [form,      setForm]      = useState(emptyOp());
  const [confirm,   setConfirm]   = useState(null); // id to delete
  const [statusPop, setStatusPop] = useState(null); // op.id with open status picker

  const saveOps = (list) => { setOps(list); localStorage.setItem(OPS_KEY, JSON.stringify(list)); };

  // Get occupied m³ from saved operation detail (sum of providers' m³)
  const getOcupado = (opId) => {
    try {
      const d = typeof window !== 'undefined' && localStorage.getItem(`transtide-opdetail-${opId}`);
      if (!d) return null;
      const parsed = JSON.parse(d);
      const provs = parsed?.proveedores || [];
      const total = provs.reduce((s, p) => s + (parseFloat(p.m3) || 0), 0);
      return total > 0 ? total : null;
    } catch { return null; }
  };
  const openNew  = () => { setForm(emptyOp()); setModal('new'); };
  const openEdit = (op, e) => { e.stopPropagation(); setForm({ ...op }); setModal(op); };
  const askDel   = (id, e) => { e.stopPropagation(); setConfirm(id); };
  const setEstado = (id, estado) => { saveOps(ops.map(o => o.id === id ? { ...o, estado } : o)); setStatusPop(null); };

  const submit = () => {
    if (!form.nombre.trim()) return;
    if (modal === 'new') {
      saveOps([...ops, { ...form, id: 'op-' + Date.now() }]);
    } else {
      saveOps(ops.map(o => o.id === modal.id ? { ...form, id: modal.id } : o));
    }
    setModal(null);
  };
  const remove = (id) => { saveOps(ops.filter(o => o.id !== id)); setConfirm(null); };

  const INP2 = { ...INP, padding: '0.5rem 0.75rem', boxSizing: 'border-box' };
  const SEL  = { ...INP2, cursor: 'pointer', appearance: 'auto' };

  return (
    <div>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.2rem' }}>Operaciones</h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{ops.length} operaciones registradas</p>
        </div>
        <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.1rem', borderRadius: '50px', border: 'none', cursor: 'pointer', background: '#ea580c', color: '#fff', fontWeight: 700, fontSize: '0.82rem' }}>
          + Nueva operación
        </button>
      </div>

      {/* list */}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {ops.map(op => {
          const color   = estadoColor(op.estado);
          const canOpen = true;
          const est = estadoObj(op.estado);
          return (
            <div key={op.id}
              onClick={() => { if (statusPop === op.id) return; canOpen && onSelect(op); }}
              style={{ ...CARD, cursor: canOpen ? 'pointer' : 'default', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => canOpen && (e.currentTarget.style.boxShadow = '0 8px 30px rgba(37,99,235,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = CARD.boxShadow)}
            >
              {/* row 1: nombre + estado + actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{op.nombre}</p>
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '1px' }}>Alta: {op.fecha || '—'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

                  {/* ── status badge — click to change ── */}
                  <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setStatusPop(statusPop === op.id ? null : op.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.28rem 0.75rem', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 700, background: est.bg, color: est.color, border: `1.5px solid ${est.color}40`, cursor: 'pointer' }}>
                      <span>{est.icon}</span> {est.label} <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>▾</span>
                    </button>

                    {/* dropdown */}
                    {statusPop === op.id && (
                      <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: '#fff', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', border: '1px solid #e2e8f0', zIndex: 200, minWidth: '230px', overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.6rem 0.85rem 0.3rem' }}>Cambiar estado</p>
                        {ESTADOS.map((s, idx) => (
                          <button key={s.label} onClick={() => setEstado(op.id, s.label)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.5rem 0.85rem', border: 'none', background: op.estado === s.label ? s.bg : 'transparent', cursor: 'pointer', borderBottom: idx < ESTADOS.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                            <span>{s.icon}</span>
                            <div style={{ textAlign: 'left' }}>
                              <p style={{ fontSize: '0.78rem', fontWeight: op.estado === s.label ? 700 : 500, color: op.estado === s.label ? s.color : '#374151' }}>{s.label}</p>
                              <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '1px' }}>{s.desc}</p>
                            </div>
                            {op.estado === s.label && <span style={{ marginLeft: 'auto', color: s.color, fontSize: '0.8rem' }}>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {canOpen && (
                    <button onClick={(e) => { e.stopPropagation(); onSelect(op); }} style={{ padding: '0.35rem 0.8rem', borderRadius: '8px', border: 'none', background: '#fff4ee', color: '#ea580c', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                      Ver →
                    </button>
                  )}
                  <button onClick={(e) => openEdit(op, e)} style={{ padding: '0.35rem 0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                    ✏ Editar
                  </button>
                  <button onClick={(e) => askDel(op.id, e)} style={{ padding: '0.35rem 0.7rem', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              </div>

              {/* row 2: metadata pills */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', paddingTop: '0.6rem', borderTop: '1px solid #f1f5f9' }}>
                {[
                  ['N° BL',        op.bl        || '—', op.bl ? '#1e293b' : '#cbd5e1'],
                  ['Contenedor',   op.contenedor || '—', '#475569'],
                  (() => {
                    const cap = CONTAINER_M3[op.contenedor];
                    const ocup = getOcupado(op.id);
                    const label = 'M³';
                    const val = cap
                      ? `${ocup != null ? ocup.toFixed(1) : '—'} / ${cap} m³`
                      : ocup != null ? `${ocup.toFixed(1)} m³` : '—';
                    return [label, val, cap && ocup != null && ocup > cap * 0.9 ? '#dc2626' : '#475569'];
                  })(),
                  ['Proveedores',  op.proveedores || '—', '#475569'],
                  ['ETA',          op.eta        || '—', op.eta ? '#059669' : '#cbd5e1'],
                ].map(([k, v, vc]) => (
                  <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{k}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: vc }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* click-away to close status popup */}
      {statusPop && <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setStatusPop(null)} />}

      {/* ── Modal nueva / editar operación ── */}
      {modal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModal(null)}>
          <div style={{ ...CARD, width: '100%', maxWidth: '520px', margin: '1rem', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{modal === 'new' ? 'Nueva operación' : 'Editar operación'}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.3rem', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={LBL}>Nombre de la operación</label>
                <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} style={INP2} placeholder="Ej: Franco Modulos 2 + varios" />
              </div>
              <div>
                <label style={LBL}>N° BL</label>
                <input value={form.bl} onChange={e => setForm(f => ({ ...f, bl: e.target.value }))} style={INP2} placeholder="Ej: MAEU7546833339" />
              </div>
              <div>
                <label style={LBL}>Estado</label>
                <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} style={SEL}>
                  {ESTADOS.map(s => <option key={s.label} value={s.label}>{s.icon} {s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={LBL}>Contenedor</label>
                <select value={form.contenedor} onChange={e => setForm(f => ({ ...f, contenedor: e.target.value }))} style={SEL}>
                  {CONTENEDORES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={LBL}>M³ del contenedor</label>
                <div style={{ ...INP2, background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'default' }}>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>{CONTAINER_M3[form.contenedor] ? `${CONTAINER_M3[form.contenedor]} m³` : 'Variable'}</span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>capacidad total</span>
                </div>
              </div>
              <div>
                <label style={LBL}>Fecha de alta</label>
                <input type="date" value={form.fecha?.split('/').reverse().join('-') || ''} onChange={e => { const [y,m,d] = e.target.value.split('-'); setForm(f => ({ ...f, fecha: `${d}/${m}/${y}` })); }} style={INP2} />
              </div>
              <div>
                <label style={LBL}>ETA (Fecha estimada de llegada)</label>
                <input type="date" value={form.eta?.split('/').reverse().join('-') || ''} onChange={e => { const [y,m,d] = e.target.value.split('-'); setForm(f => ({ ...f, eta: `${d}/${m}/${y}` })); }} style={INP2} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => setModal(null)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={submit} style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', border: 'none', background: '#ea580c', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                {modal === 'new' ? 'Crear operación' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm delete ── */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setConfirm(null)}>
          <div style={{ ...CARD, width: '100%', maxWidth: '360px', margin: '1rem', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>¿Eliminar operación?</p>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirm(null)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => remove(confirm)} style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── OperationDetail ──────────────────────────────────────────────────────────
function OperationDetail({ op, onBack }) {
  const [mainTab,     setMainTab]     = useState('proveedores');
  const [gastoTab,    setGastoTab]    = useState('naviera');
  const [isDirty,     setIsDirty]     = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [saveFlash,   setSaveFlash]   = useState(false);

  const init = (arr) => arr.length ? arr.map((r, i) => ({ ...r, id: i + 1 })) : [newRow()];
  const DKEY = `transtide-opdetail-${op.id}`;
  const loadD = () => {
    try { const s = typeof window !== 'undefined' && localStorage.getItem(DKEY); return s ? JSON.parse(s) : null; }
    catch { return null; }
  };

  const isFranco = op.id === 'franco-modulos';
  const fallback = (key, francoVal, emptyVal) => {
    const d = loadD();
    if (d?.[key]?.length) return d[key];
    return isFranco ? francoVal : emptyVal;
  };

  const [naviera,    setNaviera]    = useState(() => fallback('naviera',    init(FRANCO.naviera),    [newRow()]));
  const [terminal,   setTerminal]   = useState(() => fallback('terminal',   init(FRANCO.terminal),   [newRow()]));
  const [aduana,     setAduana]     = useState(() => fallback('aduana',     init(FRANCO.aduana),     [newRow()]));
  const [transporte, setTransporte] = useState(() => fallback('transporte', init(FRANCO.transporte), [newRow()]));
  const [despachante,setDespachante]= useState(() => fallback('despachante',init(FRANCO.despachante),[newRow()]));
  const [admin,      setAdmin]      = useState(() => fallback('admin',      init(FRANCO.admin),      [newRow()]));
  const [fleteIntl,  setFleteIntl]  = useState(() => fallback('fleteIntl',  init(FRANCO.fleteIntl),  [newRow()]));

  const [proveedores,  setProveedores]  = useState(() => { const d=loadD(); return d?.proveedores?.length ? d.proveedores : isFranco ? [...FRANCO.proveedores, newProv()] : [newProv()]; });
  const [cobrar,       setCobrar]       = useState(() => { const d=loadD(); return d?.cobrar?.length      ? d.cobrar      : isFranco ? [...FRANCO.cobrar, { tc:'', honorarios:true, despAdic:'' }] : [{ tc:'', honorarios:false, despAdic:'' }]; });
  const [puertoOrigen, setPuertoOrigen] = useState(() => { const d=loadD(); return d?.puertoOrigen ?? ''; });
  const [clientes,     setClientes]     = useState(MOCK_CLIENTES);

  // ── checklist: persist per operation in localStorage ──
  const CHECKLIST_KEY = `transtide-checklist-${op.id}`;
  const [checked, setChecked] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' && localStorage.getItem(CHECKLIST_KEY);
      if (saved) return new Set(JSON.parse(saved));
      return isFranco ? new Set(FRANCO.checked) : new Set();
    } catch { return isFranco ? new Set(FRANCO.checked) : new Set(); }
  });
  useEffect(() => {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify([...checked]));
  }, [checked]);

  // ── load clientes from localStorage ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CLIENTES_KEY);
      if (saved) setClientes(JSON.parse(saved));
    } catch { /* keep mock */ }
  }, []);

  const toggleCheck = (id) => setChecked(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // ── dirty-aware setters ──
  const D = () => setIsDirty(true);
  const upd  = (setter) => (i, f, v) => { setter(p => p.map((r, j) => j === i ? { ...r, [f]: v } : r)); D(); };
  const add  = (setter) => () => { setter(p => [...p, newRow()]); D(); };
  const rem  = (setter) => (i) => { setter(p => p.filter((_, j) => j !== i)); D(); };
  const updP = (i, f, v) => { setProveedores(p => p.map((r, j) => j === i ? { ...r, [f]: v } : r)); D(); };
  const updC = (i, f, v) => { setCobrar(p => p.map((r, j) => j === i ? { ...r, [f]: v } : r)); D(); };

  // ── save / navigate ──
  const saveAll = () => {
    localStorage.setItem(DKEY, JSON.stringify({ naviera, terminal, aduana, transporte, despachante, admin, fleteIntl, proveedores, cobrar, puertoOrigen }));
    setIsDirty(false);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2200);
  };
  const handleBack     = () => { if (isDirty) setShowDiscard(true); else onBack(); };
  const discardAndBack = () => { setIsDirty(false); setShowDiscard(false); onBack(); };
  const saveAndBack    = () => { saveAll(); setShowDiscard(false); setTimeout(onBack, 50); };

  const calc = useMemo(() => {
    const tNav  = catTot(naviera);
    const tTerm = catTot(terminal);
    const tAdu  = catTot(aduana);
    const tTra  = catTot(transporte);
    const tDes  = catTot(despachante);
    const tAdm  = catTot(admin);
    const tFlt  = catTot(fleteIntl);

    const enBlancoPesos = tNav.pesos + tTerm.pesos + tAdu.pesos + tTra.pesos + tDes.pesos + tAdm.pesos;
    const cashPesos     = tFlt.pesos;
    const prorBase      = enBlancoPesos - tAdu.pesos + cashPesos;

    const totalM3 = proveedores.reduce((s, p) => s + n(p.m3), 0);

    const perProv = proveedores
      .filter(p => p.nombre !== '')
      .map((p, i) => {
        const clienteNombre = p.clienteId ? (clientes.find(c => c.id === p.clienteId)?.nombre || '') : '';
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
        return { nombre: p.nombre, tipo: p.tipo || 'Cliente', clienteNombre, m3: n(p.m3), fobUSD: n(p.fobUSD), origenUSD, ratio, prorPesos, tributoPesos, costoFinal, gastosUSD, fobPlus, honorarios, totalUSD, cb };
      });

    return {
      tNav, tTerm, tAdu, tTra, tDes, tAdm, tFlt,
      enBlancoPesos, cashPesos,
      totalGeneral: enBlancoPesos + cashPesos,
      prorBase, totalM3, perProv,
      totalCostoFinal: perProv.reduce((s, p) => s + p.costoFinal, 0),
      totalACobrar:    perProv.reduce((s, p) => s + p.totalUSD, 0),
    };
  }, [naviera, terminal, aduana, transporte, despachante, admin, fleteIntl, proveedores, cobrar, clientes]);

  const GASTOS = [
    { id: 'naviera',    label: 'Naviera',                    color: '#ea580c', rows: naviera,    setter: setNaviera    },
    { id: 'terminal',   label: 'Terminal',                   color: '#7c3aed', rows: terminal,   setter: setTerminal   },
    { id: 'aduana',     label: 'VEP Aduana',                 color: '#dc2626', rows: aduana,     setter: setAduana     },
    { id: 'transporte', label: 'Transporte',                 color: '#d97706', rows: transporte, setter: setTransporte },
    { id: 'despachante',label: 'Despachante',                color: '#059669', rows: despachante,setter: setDespachante},
    { id: 'admin',      label: 'Gastos Admin',               color: '#64748b', rows: admin,      setter: setAdmin      },
    { id: 'fleteIntl',  label: 'Flete Internacional (Cash)', color: '#374151', rows: fleteIntl,  setter: setFleteIntl  },
  ];
  const catTotMap = { naviera: calc.tNav, terminal: calc.tTerm, aduana: calc.tAdu, transporte: calc.tTra, despachante: calc.tDes, admin: calc.tAdm, fleteIntl: calc.tFlt };
  const activeCat = GASTOS.find(g => g.id === gastoTab);
  const provActivos = proveedores.filter(p => p.nombre !== '');

  const tipoStyle = (tipo) => tipo === 'Propio'
    ? { background: '#f0fdf4', color: '#059669', border: '1.5px solid #bbf7d0' }
    : { background: '#fff4ee', color: '#ea580c', border: '1.5px solid #bfdbfe' };

  // checklist progress
  const totalTasks = CHECKLIST.length;
  const doneTasks  = CHECKLIST.filter(t => checked.has(t.id)).length;
  const progress   = Math.round((doneTasks / totalTasks) * 100);

  return (
    <div style={{ paddingBottom: '3rem' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', borderRadius: '50px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
          ← Operaciones
        </button>
        <div style={{ height: '20px', width: '1px', background: '#e2e8f0' }} />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.15rem' }}>{op.nombre}</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {[['Contenedor', op.contenedor], ['Puerto Origen', puertoOrigen || '—'], ['M³ total', `${calc.totalM3.toFixed(2)} m³`], ['Proveedores', provActivos.length], ['Fecha', op.fecha]].map(([k, v]) => (
              <span key={k} style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{k}: <strong style={{ color: '#475569' }}>{v}</strong></span>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '80px', height: '5px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#059669' : '#ea580c', borderRadius: '99px', transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{doneTasks}/{totalTasks} tareas</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* save indicator */}
          {saveFlash && (
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              ✓ Guardado
            </span>
          )}
          {isDirty && !saveFlash && (
            <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              Cambios sin guardar
            </span>
          )}
          <button onClick={saveAll} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', borderRadius: '50px', border: 'none', background: isDirty ? '#059669' : '#e2e8f0', color: isDirty ? '#fff' : '#94a3b8', fontWeight: 700, fontSize: '0.8rem', cursor: isDirty ? 'pointer' : 'default', transition: 'all 0.2s' }}>
            {saveFlash ? '✓ Guardado' : '↑ Guardar'}
          </button>
          <div style={{ textAlign: 'right', background: '#f0fdf4', borderRadius: '10px', padding: '0.5rem 1rem' }}>
            <p style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Total General</p>
            <p style={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>{fmtP(calc.totalGeneral)}</p>
          </div>
          <div style={{ textAlign: 'right', background: '#fff4ee', borderRadius: '10px', padding: '0.5rem 1rem' }}>
            <p style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>A Cobrar</p>
            <p style={{ fontSize: '1rem', fontWeight: 800, color: '#ea580c' }}>{fmtU(calc.totalACobrar)}</p>
          </div>
        </div>
      </div>

      {/* MAIN TABS */}
      <div style={{ display: 'flex', background: '#fff', borderRadius: '12px', padding: '4px', border: '1px solid #e2e8f0', gap: '3px', marginBottom: '1.25rem', width: 'fit-content' }}>
        {[['proveedores','Proveedores & Carga'],['gastos','Gastos'],['acobrar','A Cobrar (USD)']].map(([id, lbl]) => (
          <button key={id} onClick={() => setMainTab(id)} style={{ padding: '0.55rem 1.2rem', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, background: mainTab === id ? '#ea580c' : 'transparent', color: mainTab === id ? '#fff' : '#94a3b8', transition: 'all 0.15s' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ══ TAB: PROVEEDORES ════════════════════════════════════════════════ */}
      {mainTab === 'proveedores' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', alignItems: 'start' }}>

          {/* LEFT: provider table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div style={CARD}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Proveedores y carga</p>
                <span style={{ fontSize: '0.65rem', background: '#fff7ed', color: '#d97706', padding: '0.15rem 0.6rem', borderRadius: '50px', fontWeight: 700, border: '1px solid #fde68a' }}>Primer paso</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fff7ed' }}>
                      <th style={{ ...TH, color: '#92400e', background: 'none', width: '25%' }}>Proveedor</th>
                      <th style={{ ...TH, color: '#92400e', background: 'none', width: '12%' }}>Tipo</th>
                      <th style={{ ...TH, color: '#92400e', background: 'none', width: '12%' }}>m³ (CBM)</th>
                      <th style={{ ...TH, color: '#92400e', background: 'none', width: '15%' }}>FOB USD</th>
                      <th style={{ ...TH, color: '#92400e', background: 'none', width: '15%' }}>Gs. Origen USD</th>
                      <th style={{ ...TH, color: '#92400e', background: 'none', width: '11%' }}>% Ocup.</th>
                      <th style={{ width: '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.map((p, i) => {
                      const ratioVal = calc.totalM3 > 0 ? n(p.m3) / calc.totalM3 : 0;
                      return (
                        <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                          <td style={TD}><input value={p.nombre} onChange={e => updP(i,'nombre',e.target.value)} style={{ ...INP, fontWeight: 600, color: '#ea580c' }} placeholder="Nombre" /></td>
                          <td style={{ ...TD, minWidth: '180px' }}>
                            {p.nombre ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                {/* Propio / Cliente toggle */}
                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                  {['Cliente','Propio'].map(t => (
                                    <button key={t} onClick={() => updP(i,'tipo',t)}
                                      style={{ padding: '0.15rem 0.55rem', borderRadius: '50px', border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
                                        background: (p.tipo||'Cliente') === t ? (t==='Propio' ? '#f0fdf4' : '#fff4ee') : '#f1f5f9',
                                        color:      (p.tipo||'Cliente') === t ? (t==='Propio' ? '#059669' : '#ea580c') : '#94a3b8',
                                      }}>
                                      {t === 'Propio' ? '📦' : '🤝'} {t}
                                    </button>
                                  ))}
                                </div>
                                {/* Client selector — only when tipo is Cliente */}
                                {(p.tipo || 'Cliente') === 'Cliente' && (
                                  <select value={p.clienteId || ''} onChange={e => updP(i,'clienteId',e.target.value)}
                                    style={{ fontSize: '0.75rem', padding: '0.22rem 0.45rem', border: '1px solid #bfdbfe', borderRadius: '6px', background: '#fff4ee', color: '#1e40af', fontWeight: 600, outline: 'none', cursor: 'pointer', maxWidth: '170px' }}>
                                    <option value="">— Seleccionar cliente —</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                  </select>
                                )}
                              </div>
                            ) : <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>}
                          </td>
                          <td style={TD}><input type="number" step="any" value={p.m3} onChange={e => updP(i,'m3',e.target.value)} style={{ ...INP, color: '#ea580c', fontWeight: 600, textAlign: 'right' }} placeholder="0" /></td>
                          <td style={TD}><input type="number" step="any" value={p.fobUSD} onChange={e => updP(i,'fobUSD',e.target.value)} style={{ ...INP, color: '#ea580c', fontWeight: 600, textAlign: 'right' }} placeholder="0" /></td>
                          <td style={TD}><input type="number" step="any" value={p.gastosOrigenUSD} onChange={e => updP(i,'gastosOrigenUSD',e.target.value)} style={{ ...INP, color: n(p.gastosOrigenUSD) > 0 ? '#d97706' : '#94a3b8', fontWeight: n(p.gastosOrigenUSD) > 0 ? 700 : 400, textAlign: 'right' }} placeholder="0" /></td>
                          <td style={TD}>
                            {p.nombre ? (
                              <div style={{ background: '#fff7ed', borderRadius: '6px', padding: '0.28rem 0.5rem', textAlign: 'right' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d97706' }}>{pct(ratioVal)}</span>
                              </div>
                            ) : <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>}
                          </td>
                          <td style={TD}>
                            {p.nombre && <button onClick={() => { setProveedores(pr => pr.filter((_, j) => j !== i)); setCobrar(c => c.filter((_, j) => j !== i)); D(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1' }}>×</button>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f1f5f9' }}>
                      <td colSpan={2} style={{ ...TD, fontWeight: 700 }}>TOTAL</td>
                      <td style={{ ...TD, fontWeight: 700, textAlign: 'right' }}>{calc.totalM3.toFixed(2)} m³</td>
                      <td style={{ ...TD, fontWeight: 700, textAlign: 'right' }}>{fmtU(proveedores.reduce((s, p) => s + n(p.fobUSD), 0))}</td>
                      <td style={{ ...TD, fontWeight: 700, textAlign: 'right', color: '#d97706' }}>{fmtU(proveedores.reduce((s, p) => s + n(p.gastosOrigenUSD), 0))}</td>
                      <td style={{ ...TD, fontWeight: 700 }}>100%</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
              <button onClick={() => { setProveedores(p => [...p, newProv()]); setCobrar(c => [...c, { tc: '', honorarios: true, despAdic: '' }]); D(); }}
                style={{ marginTop: '0.6rem', background: 'none', border: '1px dashed #d97706', borderRadius: '7px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, color: '#d97706', cursor: 'pointer' }}>
                + Agregar proveedor
              </button>
            </div>

            {/* resumen ocupación contenedor */}
            <div style={{ ...CARD, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div>
                  <p style={LBL}>m³ cargados</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{calc.totalM3.toFixed(2)} m³</p>
                </div>
                <div>
                  <p style={LBL}>FOB total</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ea580c' }}>{fmtU(proveedores.reduce((s,p)=>s+n(p.fobUSD),0))}</p>
                </div>
                <div>
                  <p style={LBL}>Puerto de Origen</p>
                  <input value={puertoOrigen} onChange={e => { setPuertoOrigen(e.target.value); D(); }} style={{ ...INP, width: '160px', fontSize: '0.85rem', fontWeight: 600 }} placeholder="Ej: Shanghai" />
                </div>
              </div>
              <button onClick={() => setMainTab('gastos')} style={{ padding: '0.55rem 1.1rem', borderRadius: '50px', border: '1px solid #e2e8f0', background: '#fff', color: '#ea580c', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                Cargar gastos →
              </button>
            </div>
          </div>

          {/* RIGHT: checklist sticky */}
          <div style={{ position: 'sticky', top: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {/* progress header */}
            <div style={{ ...CARD, padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Avance de la operación</p>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: progress === 100 ? '#059669' : '#ea580c' }}>{progress}%</span>
              </div>
              <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#059669' : '#ea580c', borderRadius: '99px', transition: 'width 0.3s' }} />
              </div>
              <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.4rem' }}>{doneTasks} de {totalTasks} tareas completadas</p>
            </div>

            {/* checklist by phase */}
            {FASES.map(fase => {
              const items = CHECKLIST.filter(t => t.fase === fase.id);
              const doneInFase = items.filter(t => checked.has(t.id)).length;
              return (
                <div key={fase.id} style={{ ...CARD, padding: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: fase.color }} />
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>Fase {fase.id} — {fase.label}</p>
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, background: fase.bg, color: fase.color, padding: '0.1rem 0.5rem', borderRadius: '50px', border: `1px solid ${fase.badge}` }}>
                      {doneInFase}/{items.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {items.map(task => {
                      const done = checked.has(task.id);
                      return (
                        <div key={task.id} onClick={() => toggleCheck(task.id)}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', cursor: 'pointer', padding: '0.3rem 0.4rem', borderRadius: '7px', transition: 'background 0.1s', background: done ? fase.bg : 'transparent' }}
                          onMouseEnter={e => !done && (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={e => !done && (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: done ? `2px solid ${fase.color}` : '2px solid #cbd5e1', background: done ? fase.color : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', transition: 'all 0.15s' }}>
                            {done && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: done ? '#64748b' : '#374151', textDecoration: done ? 'line-through' : 'none', lineHeight: '1.4', fontWeight: done ? 400 : 500 }}>
                            {task.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ TAB: GASTOS ══════════════════════════════════════════════════════ */}
      {mainTab === 'gastos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' }}>

            {/* left: invoice input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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

              {activeCat && (
                <div style={CARD}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeCat.color }} />
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>{activeCat.label}</p>
                    {activeCat.id === 'aduana' && (
                      <span style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#dc2626', padding: '0.15rem 0.5rem', borderRadius: '50px', fontWeight: 700 }}>No se proratea — se asigna por proveedor</span>
                    )}
                    {activeCat.id === 'fleteIntl' && (
                      <span style={{ fontSize: '0.65rem', background: '#f1f5f9', color: '#64748b', padding: '0.15rem 0.5rem', borderRadius: '50px', fontWeight: 700 }}>CASH — se proratea por m³</span>
                    )}
                  </div>
                  <InvoiceTable rows={activeCat.rows} accentColor={activeCat.color} onUpdate={upd(activeCat.setter)} onAdd={add(activeCat.setter)} onRemove={rem(activeCat.setter)} />
                </div>
              )}

              <div style={{ ...CARD, background: '#fffbeb', border: '1px solid #fde68a', padding: '0.85rem 1rem' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e', marginBottom: '0.4rem' }}>Base de prorrateo por m³</p>
                <p style={{ fontSize: '0.78rem', color: '#78350f' }}>
                  Total en Blanco <strong>{fmtP(calc.enBlancoPesos)}</strong>
                  &nbsp;− VEP Aduana <strong>{fmtP(calc.tAdu.pesos)}</strong>
                  &nbsp;+ Cash <strong>{fmtP(calc.cashPesos)}</strong>
                  &nbsp;= <strong>{fmtP(calc.prorBase)}</strong>
                </p>
              </div>
            </div>

            {/* right: totals summary sticky */}
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
                  {[['Total en Blanco (vía banco)', calc.enBlancoPesos], ['Total Cash (flete intl.)', calc.cashPesos]].map(([lbl, val]) => (
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

          {/* VEP + Costo final — aparecen después de cargar los gastos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

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
                      <td style={TD}><input type="number" step="any" value={p.tributosUSD} onChange={e => updP(proveedores.indexOf(p),'tributosUSD',e.target.value)} style={{ ...INP, color: '#ea580c', fontWeight: 600, textAlign: 'right' }} placeholder="0" /></td>
                      <td style={TD}><input type="number" step="any" value={p.tributosTC} onChange={e => updP(proveedores.indexOf(p),'tributosTC',e.target.value)} style={{ ...INP, color: '#ea580c', fontWeight: 600, textAlign: 'right' }} placeholder="—" /></td>
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

            <div style={CARD}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Costo final asignado por proveedor</p>
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
                    <th colSpan={4} style={{ ...TH, background: '#fff4ee', color: '#ea580c', textAlign: 'center', padding: '0.5rem' }}>① Gastos asignados</th>
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
                        <span style={{ ...tipoStyle(p.tipo), display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', borderRadius: '50px', fontSize: '0.68rem', fontWeight: 700, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.tipo === 'Propio' ? '📦 Propio' : `🤝 ${p.clienteNombre || 'Cliente'}`}
                        </span>
                      </td>
                      <td style={{ ...TD, textAlign: 'right', color: '#64748b' }}>{p.m3}</td>
                      <td style={TD}>
                        <input type="number" step="any" value={cobrar[i]?.tc ?? ''} onChange={e => updC(i,'tc',e.target.value)}
                          style={{ ...INP, width: '85px', color: '#ea580c', fontWeight: 600, textAlign: 'right' }} placeholder="TC" />
                      </td>
                      <td style={{ ...TD, textAlign: 'right', fontWeight: 600, color: '#ea580c' }}>{fmtU(p.gastosUSD)}</td>
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
                          style={{ ...INP, width: '95px', color: '#ea580c', fontWeight: 600, textAlign: 'right' }} placeholder="0" />
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
                  <span style={{ ...tipoStyle(p.tipo), fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '50px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.tipo === 'Propio' ? '📦 Propio' : `🤝 ${p.clienteNombre || 'Cliente'}`}
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

      {/* ── Discard modal ── */}
      {showDiscard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '400px', margin: '1rem', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.5rem' }}>⚠️</div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', textAlign: 'center', marginBottom: '0.5rem' }}>Cambios sin guardar</h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Tenés cambios sin guardar en esta operación.<br/>¿Qué querés hacer antes de salir?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={discardAndBack} style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                Descartar cambios
              </button>
              <button onClick={saveAndBack} style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none', background: '#059669', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                Guardar y salir
              </button>
            </div>
            <button onClick={() => setShowDiscard(false)} style={{ display: 'block', width: '100%', marginTop: '0.6rem', padding: '0.45rem', borderRadius: '8px', border: 'none', background: 'transparent', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
              Cancelar (seguir editando)
            </button>
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
