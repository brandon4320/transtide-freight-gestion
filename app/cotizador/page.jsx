'use client';
import { useState, useMemo } from 'react';

// ─── helpers ──────────────────────────────────────────────────────────────────
const usd = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return '$ ' + (Math.round(n * 100) / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
};
const n = (v) => parseFloat(v) || 0;

// ─── container presets ────────────────────────────────────────────────────────
const PRESETS = {
  '20': { label: '20 Pies', m3: 30, flete: 3500, despachante: 2000, terminal: 2300, naviera: 800, logistica: 2150 },
  '40hq': { label: '40 Pies / HQ', m3: 60, flete: 4500, despachante: 2000, terminal: 2300, naviera: 800, logistica: 2150 },
  'fr': { label: 'Flat Rack', m3: null, flete: 6000, despachante: 2200, terminal: 2500, naviera: 900, logistica: 2150 },
};

// ─── small UI primitives ──────────────────────────────────────────────────────
const LBL = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.28rem', textTransform: 'uppercase', letterSpacing: '0.05em' };
const INP = { width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', color: '#1e293b', background: '#fff', outline: 'none' };
const SECL = { fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#cbd5e1', margin: '1rem 0 0.5rem', paddingBottom: '0.35rem', borderBottom: '1px solid #f1f5f9' };

function F({ label, children, half }) {
  return (
    <div style={{ marginBottom: '0.75rem', ...(half ? {} : {}) }}>
      {label && <label style={LBL}>{label}</label>}
      {children}
    </div>
  );
}
function NI({ value, onChange, placeholder = '0' }) {
  return <input type="number" step="any" min="0" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={INP} />;
}
function TI({ value, onChange, placeholder = '' }) {
  return <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={INP} />;
}
function PagaToggle({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #f8fafc' }}>
      <span style={{ fontSize: '0.83rem', color: '#475569' }}>{label}</span>
      <button onClick={() => onChange(!checked)} style={{ padding: '0.18rem 0.75rem', borderRadius: '50px', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, minWidth: '42px', background: checked ? '#d1fae5' : '#fee2e2', color: checked ? '#059669' : '#dc2626' }}>
        {checked ? 'SÍ' : 'NO'}
      </button>
    </div>
  );
}
function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ padding: '0.45rem 1rem', borderRadius: '50px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, transition: 'all 0.15s', background: active ? '#2563eb' : 'transparent', color: active ? '#fff' : '#94a3b8' }}>
      {children}
    </button>
  );
}
function Tab({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: '0.42rem 0.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.15s', background: active ? '#f0f7ff' : 'transparent', color: active ? '#2563eb' : '#94a3b8' }}>
      {children}
    </button>
  );
}
function Card({ children, style = {} }) {
  return <div style={{ background: '#fff', borderRadius: '16px', padding: '1.2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.03)', ...style }}>{children}</div>;
}
function RRow({ label, val, val2, diff, dimmed, bold }) {
  const s = { fontSize: bold ? '0.88rem' : '0.82rem', fontWeight: bold ? 700 : 400 };
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.38rem 0', borderBottom: '1px solid #f8fafc' }}>
      <span style={{ ...s, color: dimmed ? '#cbd5e1' : '#475569' }}>{label}</span>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {val2 !== undefined && <span style={{ ...s, color: '#64748b' }}>{usd(val2)}</span>}
        <span style={{ ...s, color: bold ? '#1e293b' : dimmed ? '#cbd5e1' : '#1e293b' }}>{usd(val)}</span>
        {diff !== undefined && (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '70px', textAlign: 'right', color: diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : '#94a3b8' }}>
            {diff > 0 ? '+' : ''}{usd(diff)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function Cotizador() {

  // mode & tab
  const [mode, setMode] = useState('cliente');   // 'cliente' | 'personal'
  const [tab, setTab] = useState('cliente_fob'); // varies per mode

  // ── container config ──
  const [contType, setContType] = useState('40hq');
  const [contM3, setContM3] = useState({ '20': 30, '40hq': 60, 'fr': 60 });
  const [contCosts, setContCosts] = useState({
    '20':  { flete: 3500, despachante: 2000, terminal: 2300, naviera: 800, logistica: 2150 },
    '40hq':{ flete: 4500, despachante: 2000, terminal: 2300, naviera: 800, logistica: 2150 },
    'fr':  { flete: 6000, despachante: 2200, terminal: 2500, naviera: 900, logistica: 2150 },
  });

  const setCost = (type, field, val) =>
    setContCosts(prev => ({ ...prev, [type]: { ...prev[type], [field]: parseFloat(val) || 0 } }));
  const setM3 = (type, val) =>
    setContM3(prev => ({ ...prev, [type]: parseFloat(val) || 0 }));

  const curM3 = contM3[contType];
  const curCosts = contCosts[contType];

  // ── identification ──
  const [cliente, setCliente] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [clasificacion, setClasificacion] = useState('');

  // ── LADO CLIENTE ──
  const [fobCliente, setFobCliente] = useState('');       // lo que cobro por la mercadería
  const [fobDecCli, setFobDecCli] = useState('');         // lo que le digo que voy a declarar
  const [fleteCli, setFleteCli] = useState('');           // flete cobrado
  const [gDes, setGDes] = useState('');                   // gastos locales cobrados
  const [gTer, setGTer] = useState('');
  const [gNav, setGNav] = useState('');
  const [gLog, setGLog] = useState('');

  // ── LADO REAL ──
  const [fobReal, setFobReal] = useState('');             // lo que me costó a mí
  const [fobDecReal, setFobDecReal] = useState('');       // lo que realmente declaro
  const [fleteRealInput, setFleteRealInput] = useState(''); // si está vacío, se calcula del prorrateo
  const [m3Merch, setM3Merch] = useState('');             // m³ de mi mercadería en el contenedor

  // ── ARANCELES ──
  const [pDer, setPDer] = useState(35);
  const [pTas, setPTas] = useState(0);
  const [pIva, setPIva] = useState(21);    const [pagaIva, setPagaIva] = useState(true);
  const [pIvaA, setPIvaA] = useState(20);  const [pagaIvaA, setPagaIvaA] = useState(false);
  const [pGan, setPGan] = useState(6);     const [pagaGan, setPagaGan] = useState(false);
  const [pIIBB, setPIIBB] = useState(2.5); const [pagaIIBB, setPagaIIBB] = useState(false);

  // ── CIERRE ──
  const [pHon, setPHon] = useState(4);
  const [pFac, setPFac] = useState(8);
  const [pMrg, setPMrg] = useState(20); // solo modo personal

  // ── UI ──
  const [showClienteView, setShowClienteView] = useState(false);

  // ─── calculations ─────────────────────────────────────────────────────────
  const c = useMemo(() => {
    const der = pDer / 100, tas = pTas / 100, iva = pIva / 100,
          ivaA = pIvaA / 100, gan = pGan / 100, iibb = pIIBB / 100,
          hon = pHon / 100, fac = pFac / 100, mrg = pMrg / 100;

    const fobC  = n(fobCliente);
    const fobDC = n(fobDecCli) || fobC;       // FOB declarado al cliente (base aranceles cliente)
    const fobR  = n(fobReal);
    const fobDR = n(fobDecReal) || fobR;      // FOB declarado real (base aranceles reales)

    const m3val = n(m3Merch);
    const ratio = m3val > 0 && curM3 > 0 ? m3val / curM3 : 0;
    const fleteR = n(fleteRealInput) || (curCosts.flete * ratio);

    // ── LADO CLIENTE ──
    const segC   = fobDC * 0.01;
    const cifC   = fobDC + n(fleteCli) + segC;
    const derC   = cifC * der;
    const tasC   = cifC * tas;
    const bivC   = cifC + derC + tasC;
    const ivaC   = bivC * iva;
    const ivaAC  = bivC * ivaA;
    const ganC   = bivC * gan;
    const iibbC  = bivC * iibb;
    const arcC   = n(fleteCli) + segC + derC + tasC + ivaC + ivaAC + ganC + iibbC;
    const desC   = n(gDes), terC = n(gTer), navC = n(gNav), logC = n(gLog);
    const gasC   = desC + terC + navC + logC;
    const totConC = fobC + arcC + gasC;
    const totSinC = totConC - ivaC - ivaAC;

    // ── LADO REAL ──
    const segR   = fobDR * 0.01;
    const cifR   = fobDR + fleteR + segR;
    const derR   = cifR * der;
    const tasR   = cifR * tas;
    const bivR   = cifR + derR + tasR;
    const ivaR   = pagaIva  ? bivR * iva  : 0;
    const ivaAR  = pagaIvaA ? bivR * ivaA : 0;
    const ganR   = pagaGan  ? bivR * gan  : 0;
    const iibbR  = pagaIIBB ? bivR * iibb : 0;
    const desR   = curCosts.despachante * ratio;
    const terR   = curCosts.terminal    * ratio;
    const navR   = curCosts.naviera     * ratio;
    const logR   = curCosts.logistica   * ratio;
    const gasR   = desR + terR + navR + logR;
    const totConR = fobR + fleteR + segR + derR + tasR + ivaR + ivaAR + ganR + iibbR + gasR;
    const totSinR = totConR - ivaR - ivaAR;

    // ── ESCENARIOS (solo cliente) ──
    const honorarios = totConC * hon;
    const gastFac    = totConC * fac;
    const precioConF = totConC + honorarios + gastFac;
    const precioSinF = totConC + honorarios;

    // ── RENTABILIDAD ──
    const mFOB  = fobC - fobR;
    const mFlet = n(fleteCli) - fleteR;
    const mDer  = derC - derR;
    const mTas  = tasC - tasR;
    const mIva  = ivaC - ivaR;
    const mIvaA = ivaAC - ivaAR;
    const mGan  = ganC - ganR;
    const mIIBB = iibbC - iibbR;
    const mAranc = mDer + mTas + mIva + mIvaA + mGan + mIIBB;
    const mGas  = gasC - gasR;
    const ganTotal = mFOB + mFlet + mAranc + mGas + honorarios;

    // ── modo personal ──
    const precioVenta = totConR * (1 + mrg);

    return {
      fobC, fobDC, fobR, fobDR,
      segC, cifC, derC, tasC, bivC, ivaC, ivaAC, ganC, iibbC, arcC,
      desC, terC, navC, logC, gasC, totConC, totSinC,
      fleteR, segR, cifR, derR, tasR, bivR, ivaR, ivaAR, ganR, iibbR,
      desR, terR, navR, logR, gasR, totConR, totSinR,
      honorarios, gastFac, precioConF, precioSinF,
      mFOB, mFlet, mDer, mTas, mIva, mIvaA, mGan, mIIBB, mAranc, mGas, ganTotal,
      precioVenta,
      ratio, curM3,
    };
  }, [
    fobCliente, fobDecCli, fleteCli, gDes, gTer, gNav, gLog,
    fobReal, fobDecReal, fleteRealInput, m3Merch,
    pDer, pTas, pIva, pagaIva, pIvaA, pagaIvaA, pGan, pagaGan, pIIBB, pagaIIBB,
    pHon, pFac, pMrg, curM3, curCosts,
  ]);

  // ─── tabs per mode ────────────────────────────────────────────────────────
  const tabs = mode === 'cliente'
    ? [['cliente_fob','Cotización cliente'],['real_fob','Mis costos reales'],['aranceles','Aranceles'],['cierre','Cierre']]
    : [['real_fob','Mis costos'],['aranceles','Aranceles'],['venta','Precio de venta']];

  // reset tab when switching mode
  const switchMode = (m) => { setMode(m); setTab(m === 'cliente' ? 'cliente_fob' : 'real_fob'); };

  // ─── print client quote ───────────────────────────────────────────────────
  const printClienteQuote = () => {
    const today = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const fmt = (v) => '$ ' + (Math.round(v * 100) / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const pct = (v) => v.toFixed(1) + '%';
    const row = (label, val, opts = {}) => {
      const color = opts.bold ? '#1e293b' : opts.sub ? '#475569' : '#374151';
      const bg = opts.highlight ? '#eff6ff' : opts.total ? '#1e3a5f' : 'transparent';
      const txtColor = opts.total ? '#ffffff' : color;
      return `<tr style="background:${bg};">
        <td style="padding:7px 12px;font-size:${opts.bold||opts.total?'0.9':'0.84'}rem;font-weight:${opts.bold||opts.total?700:400};color:${opts.sub?'#64748b':txtColor};border-bottom:1px solid #f1f5f9;">${label}</td>
        <td style="padding:7px 12px;text-align:right;font-size:${opts.bold||opts.total?'0.9':'0.84'}rem;font-weight:${opts.bold||opts.total?700:opts.semibold?600:400};color:${opts.total?'#ffffff':opts.bold?'#1e293b':'#374151'};border-bottom:1px solid #f1f5f9;">${val}</td>
      </tr>`;
    };
    const divider = (label) => `<tr><td colspan="2" style="padding:10px 12px 4px;font-size:0.65rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #e2e8f0;">${label}</td></tr>`;

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <title>Cotización - ${cliente || 'Cliente'}</title>
    <style>
      @page { margin: 18mm 15mm; size: A4; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; }
      .page { max-width: 720px; margin: 0 auto; padding: 0; }
      table { width: 100%; border-collapse: collapse; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>
    <div class="page">
      <!-- HEADER -->
      <table style="margin-bottom:24px;">
        <tr>
          <td>
            <div style="font-size:1.4rem;font-weight:800;color:#2563eb;letter-spacing:-0.02em;">TRANSTIDE FREIGHT</div>
            <div style="font-size:0.78rem;color:#94a3b8;margin-top:2px;">Gestión Logística & Importaciones</div>
          </td>
          <td style="text-align:right;vertical-align:top;">
            <div style="font-size:0.72rem;color:#94a3b8;">Fecha de cotización</div>
            <div style="font-size:0.88rem;font-weight:600;color:#475569;">${today}</div>
          </td>
        </tr>
      </table>

      <!-- TITLE BAND -->
      <div style="background:#2563eb;border-radius:10px;padding:14px 20px;margin-bottom:20px;">
        <div style="font-size:1.05rem;font-weight:800;color:#fff;letter-spacing:0.01em;">COTIZACIÓN DE IMPORTACIÓN</div>
        ${cliente ? `<div style="font-size:0.82rem;color:#bfdbfe;margin-top:4px;">Cliente: <strong style="color:#fff;">${cliente}</strong></div>` : ''}
      </div>

      <!-- CLIENT INFO -->
      ${(descripcion || clasificacion) ? `
      <table style="margin-bottom:20px;background:#f8fafc;border-radius:8px;overflow:hidden;">
        ${descripcion ? `<tr><td style="padding:8px 14px;font-size:0.75rem;color:#64748b;font-weight:600;width:200px;">Descripción</td><td style="padding:8px 14px;font-size:0.82rem;color:#1e293b;">${descripcion}</td></tr>` : ''}
        ${clasificacion ? `<tr style="border-top:1px solid #e2e8f0;"><td style="padding:8px 14px;font-size:0.75rem;color:#64748b;font-weight:600;">Posición Arancelaria</td><td style="padding:8px 14px;font-size:0.82rem;color:#1e293b;">${clasificacion}</td></tr>` : ''}
      </table>` : ''}

      <!-- DESGLOSE -->
      <table style="margin-bottom:16px;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
        ${divider('Base de la Importación')}
        ${row('Valor de Mercadería (FOB Declarado)', fmt(c.fobDC))}
        ${row('Flete Internacional', fmt(n(fleteCli)))}
        ${row('Seguro Marítimo (1% FOB)', fmt(c.segC))}
        ${row('CIF — Base Arancelaria', fmt(c.cifC), { bold: true, highlight: true })}

        ${divider('Aranceles Aduaneros')}
        ${row(`Derechos de Importación (${pct(pDer)})`, fmt(c.derC))}
        ${pTas > 0 ? row(`Tasa Estadística (${pct(pTas)})`, fmt(c.tasC)) : ''}
        ${row('Base IVA', fmt(c.bivC), { sub: true })}
        ${row(`IVA (${pct(pIva)})`, fmt(c.ivaC))}
        ${c.ivaAC > 0 ? row(`IVA Adicional (${pct(pIvaA)})`, fmt(c.ivaAC)) : ''}
        ${c.ganC > 0 ? row(`Percepción Ganancias (${pct(pGan)})`, fmt(c.ganC)) : ''}
        ${c.iibbC > 0 ? row(`Percepción IIBB (${pct(pIIBB)})`, fmt(c.iibbC)) : ''}

        ${(c.desC > 0 || c.terC > 0 || c.navC > 0 || c.logC > 0) ? divider('Gastos Locales') : ''}
        ${c.desC > 0 ? row('Despachante de Aduana', fmt(c.desC)) : ''}
        ${c.terC > 0 ? row('Terminal Portuaria', fmt(c.terC)) : ''}
        ${c.navC > 0 ? row('Naviera', fmt(c.navC)) : ''}
        ${c.logC > 0 ? row('Logística Interna', fmt(c.logC)) : ''}

        ${divider('Totales')}
        ${row('Costo Total CON IVA', fmt(c.totConC), { bold: true })}
        ${row('Costo Total SIN IVA', fmt(c.totSinC), { sub: true })}
        ${row(`Honorarios del Servicio (${pct(pHon)})`, fmt(c.honorarios))}
        ${c.gastFac > 0 ? row(`Gastos de Facturación (${pct(pFac)})`, fmt(c.gastFac), { sub: true }) : ''}
      </table>

      <!-- FINAL PRICES -->
      <table style="margin-bottom:24px;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="padding:18px 20px;background:#065f46;border-radius:10px 0 0 10px;width:50%;">
            <div style="font-size:0.65rem;font-weight:700;color:#6ee7b7;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Precio Final CON Factura</div>
            <div style="font-size:1.6rem;font-weight:800;color:#ffffff;line-height:1;">${fmt(c.precioConF)}</div>
            <div style="font-size:0.7rem;color:#6ee7b7;margin-top:4px;">Hon. ${fmt(c.honorarios)} + Gs.Fac. ${fmt(c.gastFac)}</div>
          </td>
          <td style="width:8px;"></td>
          <td style="padding:18px 20px;background:#78350f;border-radius:0 10px 10px 0;width:50%;">
            <div style="font-size:0.65rem;font-weight:700;color:#fcd34d;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Precio Final SIN Factura</div>
            <div style="font-size:1.6rem;font-weight:800;color:#ffffff;line-height:1;">${fmt(c.precioSinF)}</div>
            <div style="font-size:0.7rem;color:#fcd34d;margin-top:4px;">Ahorro para el cliente: ${fmt(c.gastFac)}</div>
          </td>
        </tr>
      </table>

      <!-- FOOTER -->
      <div style="border-top:1px solid #e2e8f0;padding-top:12px;">
        <p style="font-size:0.7rem;color:#94a3b8;line-height:1.5;">
          * Cotización expresada en dólares estadounidenses (USD). Los valores son estimados y están sujetos a variación según el tipo de cambio oficial vigente al momento del despacho, actualizaciones arancelarias y condiciones del proveedor. La presente cotización tiene validez de 7 días hábiles desde su emisión.
        </p>
      </div>
    </div>
    </body></html>`;

    const w = window.open('', '_blank', 'width=820,height=950,scrollbars=yes');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 600);
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: '3rem' }}>

      {/* ══ CONTAINER CONFIG BAR ══════════════════════════════════════════════ */}
      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>

          {/* type selector */}
          <div>
            <p style={{ ...SECL, margin: '0 0 0.4rem' }}>Tipo de contenedor</p>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '50px', padding: '3px', gap: '2px' }}>
              {Object.entries(PRESETS).map(([key, p]) => (
                <button key={key} onClick={() => setContType(key)} style={{ padding: '0.35rem 0.9rem', borderRadius: '50px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.15s', background: contType === key ? '#2563eb' : 'transparent', color: contType === key ? '#fff' : '#64748b' }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* m3 del contenedor */}
          <div style={{ minWidth: '110px' }}>
            <p style={{ ...SECL, margin: '0 0 0.4rem' }}>M³ del contenedor</p>
            <input type="number" step="any" min="1" value={contM3[contType]} onChange={e => setM3(contType, e.target.value)} style={{ ...INP, width: '100px', fontSize: '0.85rem' }} />
          </div>

          <div style={{ width: '1px', height: '44px', background: '#e2e8f0', flexShrink: 0 }} />

          {/* reference costs */}
          <div style={{ flex: 1 }}>
            <p style={{ ...SECL, margin: '0 0 0.4rem' }}>Costos de referencia del contenedor (USD) — modificables</p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {[
                ['Flete marítimo', 'flete'],
                ['Despachante', 'despachante'],
                ['Terminal', 'terminal'],
                ['Naviera', 'naviera'],
                ['Logística', 'logistica'],
              ].map(([label, key]) => (
                <div key={key} style={{ minWidth: '110px' }}>
                  <label style={{ ...LBL, marginBottom: '0.25rem' }}>{label}</label>
                  <input type="number" step="any" min="0" value={contCosts[contType][key]} onChange={e => setCost(contType, key, e.target.value)} style={{ ...INP, width: '110px', fontSize: '0.85rem' }} />
                </div>
              ))}
            </div>
          </div>

          {/* m3 merch (siempre visible) */}
          <div style={{ minWidth: '120px' }}>
            <p style={{ ...SECL, margin: '0 0 0.4rem' }}>M³ de mi mercadería</p>
            <input type="number" step="any" min="0" placeholder="0" value={m3Merch} onChange={e => setM3Merch(e.target.value)} style={{ ...INP, width: '110px', fontSize: '0.85rem' }} />
            <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Ratio: {c.ratio.toFixed(3)} ({n(m3Merch)} / {c.curM3} m³)
            </p>
          </div>

        </div>

        {/* ── Prorrateado + cobro al cliente ── */}
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
          <p style={{ ...SECL, margin: '0 0 0.6rem' }}>Costo prorrateado · Lo que cobrás al cliente</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              ['Flete',       c.fleteR, fleteCli, setFleteCli],
              ['Despachante', c.desR,   gDes,     setGDes],
              ['Terminal',    c.terR,   gTer,     setGTer],
              ['Naviera',     c.navR,   gNav,     setGNav],
              ['Logística',   c.logR,   gLog,     setGLog],
            ].map(([label, prorated, val, setVal]) => (
              <div key={label} style={{ minWidth: '110px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>{label}</p>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.73rem', color: '#64748b', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <span style={{ color: '#94a3b8' }}>Prorrateado</span>
                  <strong>{usd(prorated)}</strong>
                </div>
                <label style={{ ...LBL, marginBottom: '0.2rem' }}>Cobro cliente</label>
                <input type="number" step="any" min="0" placeholder="0" value={val} onChange={e => setVal(e.target.value)} style={{ ...INP, width: '110px', fontSize: '0.85rem' }} />
              </div>
            ))}
          </div>
        </div>

      </Card>

      {/* ══ HEADER + MODE TOGGLE ═════════════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.1rem' }}>Cotizador de Importación</h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {mode === 'cliente' ? 'Lo que cobrás al cliente · Lo que te sale a vos · Tu rentabilidad' : 'Solo tus costos reales de importación'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {mode === 'cliente' && (
            <button onClick={() => setShowClienteView(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.1rem', borderRadius: '50px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, background: '#2563eb', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.3)', transition: 'all 0.15s' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Ver cotización al cliente
            </button>
          )}
          <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: '50px', padding: '4px', gap: '2px' }}>
            <Pill active={mode === 'cliente'} onClick={() => switchMode('cliente')}>Para Cliente</Pill>
            <Pill active={mode === 'personal'} onClick={() => switchMode('personal')}>Importación Personal</Pill>
          </div>
        </div>
      </div>

      {/* ══ MAIN: inputs left · results right ════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '370px 1fr', gap: '1.1rem', alignItems: 'start' }}>

        {/* ── LEFT: tabbed inputs ─────────────────────────────────────────── */}
        <div>
          {/* identification */}
          <Card style={{ marginBottom: '0.75rem', padding: '0.9rem 1.1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <F label="Cliente"><TI value={cliente} onChange={setCliente} placeholder="Nombre" /></F>
              <F label="Clasificación arancelaria"><TI value={clasificacion} onChange={setClasificacion} placeholder="8456.11.00" /></F>
            </div>
            <F label="Descripción del embarque"><TI value={descripcion} onChange={setDescripcion} placeholder="Ej: Máquina cortadora láser 1000W" /></F>
          </Card>

          {/* tab bar */}
          <div style={{ display: 'flex', background: '#fff', borderRadius: '10px', padding: '3px', marginBottom: '0.6rem', border: '1px solid #e2e8f0', gap: '2px' }}>
            {tabs.map(([id, label]) => <Tab key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Tab>)}
          </div>

          {/* tab content */}
          <Card>

            {/* ── TAB: COTIZACIÓN CLIENTE ── */}
            {tab === 'cliente_fob' && (
              <div>
                <p style={SECL}>FOB — Lado Cliente</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                  <F label="FOB CLIENTE — lo que cobrás por la mercadería">
                    <NI value={fobCliente} onChange={setFobCliente} />
                  </F>
                  <F label="FOB DECLARADO al cliente — base de sus aranceles">
                    <NI value={fobDecCli} onChange={setFobDecCli} placeholder="= FOB cliente si no difiere" />
                  </F>
                </div>

                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '0.5rem 0.8rem', fontSize: '0.75rem', color: '#92400e', marginBottom: '0.75rem' }}>
                  <strong>FOB Cliente</strong> = lo que le cobrás por la mercadería.&nbsp;
                  <strong>FOB Declarado al cliente</strong> = el valor que le informás que vas a declarar en aduana, y sobre el que se calculan sus aranceles y el CIF de la cotización.
                </div>

                <p style={{ fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.75rem' }}>
                  Seguro = 1% del FOB Declarado al Cliente (automático) → {usd(c.segC)}
                </p>
                <div style={{ background: '#f0f7ff', borderRadius: '8px', padding: '0.5rem 0.8rem', fontSize: '0.78rem', color: '#2563eb', display: 'flex', justifyContent: 'space-between' }}>
                  <span>CIF base aranceles cliente</span>
                  <strong>{usd(c.cifC)}</strong>
                </div>
              </div>
            )}

            {/* ── TAB: MIS COSTOS REALES ── */}
            {tab === 'real_fob' && (
              <div>
                <p style={SECL}>FOB — Lado Real</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                  <F label="FOB REAL — lo que te costó a vos">
                    <NI value={fobReal} onChange={setFobReal} />
                  </F>
                  <F label="FOB que realmente declarás en aduana">
                    <NI value={fobDecReal} onChange={setFobDecReal} placeholder="= FOB real si no difiere" />
                  </F>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.5rem 0.8rem', fontSize: '0.75rem', color: '#065f46', marginBottom: '0.75rem' }}>
                  <strong>FOB Real</strong> = lo que realmente pagaste al proveedor.&nbsp;
                  <strong>FOB Declarado</strong> = lo que efectivamente declarás en aduana. Ambos pueden ser distintos entre sí y distintos de los del lado cliente.
                </div>

                <p style={SECL}>Flete real</p>
                <F label={`Flete real prorrateado (vacío = automático: ${usd(curCosts.flete)} × ${c.ratio.toFixed(3)} = ${usd(curCosts.flete * c.ratio)})`}>
                  <NI value={fleteRealInput} onChange={setFleteRealInput} placeholder={`${(curCosts.flete * c.ratio).toFixed(2)}`} />
                </F>
                <p style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
                  Seguro = 1% del FOB Declarado real → {usd(c.segR)}
                </p>
                <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '0.5rem 0.8rem', fontSize: '0.78rem', color: '#059669', display: 'flex', justifyContent: 'space-between' }}>
                  <span>CIF Declarado real (base aranceles reales)</span>
                  <strong>{usd(c.cifR)}</strong>
                </div>

                <p style={SECL}>Gastos locales reales (prorrateados automáticamente)</p>
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Ratio {c.ratio.toFixed(4)} · Costos del contenedor ÷ m³ totales × tus m³
                  </p>
                  {[['Despachante', c.desR, curCosts.despachante], ['Terminal', c.terR, curCosts.terminal], ['Naviera', c.navR, curCosts.naviera], ['Logística', c.logR, curCosts.logistica]].map(([l, v, ref]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.2rem 0', color: '#475569' }}>
                      <span>{l} ({usd(ref)} × {c.ratio.toFixed(3)})</span>
                      <strong>{usd(v)}</strong>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                    <span>Total gastos reales</span><span>{usd(c.gasR)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: ARANCELES ── */}
            {tab === 'aranceles' && (
              <div>
                <p style={SECL}>Base arancelaria</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                  <F label="Derechos de Importación %">
                    <input type="number" step="any" min="0" value={pDer} onChange={e => setPDer(parseFloat(e.target.value) || 0)} style={INP} />
                  </F>
                  <F label="Tasa Estadística %">
                    <input type="number" step="any" min="0" value={pTas} onChange={e => setPTas(parseFloat(e.target.value) || 0)} style={INP} />
                  </F>
                </div>

                <p style={SECL}>Impuestos — ¿cuáles pagás realmente vos?</p>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.7rem' }}>
                  El toggle indica si la empresa abona ese impuesto en aduana. Afecta exclusivamente el cálculo de costos reales y rentabilidad.
                </p>
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                  {[
                    ['IVA %', pIva, setPIva, pagaIva, setPagaIva],
                    ['IVA Adicional %', pIvaA, setPIvaA, pagaIvaA, setPagaIvaA],
                    ['Percepción Ganancias %', pGan, setPGan, pagaGan, setPagaGan],
                    ['Percepción IIBB %', pIIBB, setPIIBB, pagaIIBB, setPagaIIBB],
                  ].map(([lbl, val, setVal, paga, setPaga]) => (
                    <div key={lbl} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'end', marginBottom: '0.65rem' }}>
                      <F label={lbl}>
                        <input type="number" step="any" min="0" value={val} onChange={e => setVal(parseFloat(e.target.value) || 0)} style={INP} />
                      </F>
                      <div style={{ paddingBottom: '0.75rem' }}>
                        <PagaToggle label="¿Lo pagás?" checked={paga} onChange={setPaga} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* quick base IVA preview */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {[['Base IVA cliente', c.bivC], ['Base IVA real', c.bivR]].map(([l, v]) => (
                    <div key={l} style={{ background: '#f0f7ff', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                      <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.15rem' }}>{l}</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2563eb' }}>{usd(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB: CIERRE (cliente) ── */}
            {tab === 'cierre' && mode === 'cliente' && (
              <div>
                <p style={SECL}>Honorarios del servicio</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                  <F label="Honorarios % (sobre Costo Total CON IVA)">
                    <input type="number" step="any" min="0" value={pHon} onChange={e => setPHon(parseFloat(e.target.value) || 0)} style={INP} />
                  </F>
                  <F label="Gastos de Facturación % (solo CON factura)">
                    <input type="number" step="any" min="0" value={pFac} onChange={e => setPFac(parseFloat(e.target.value) || 0)} style={INP} />
                  </F>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem', marginTop: '0.5rem' }}>
                  {[
                    ['Costo Total CON IVA', c.totConC],
                    [`+ Honorarios (${pHon}%)`, c.honorarios],
                    [`+ Gs. Facturación (${pFac}%)`, c.gastFac, true],
                    ['= Precio final CON factura', c.precioConF, false, true],
                    ['= Precio final SIN factura', c.precioSinF, false, true],
                  ].map(([lbl, val, onlyCon, bold], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.35rem 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none', fontWeight: bold ? 700 : 400, color: bold ? '#2563eb' : onlyCon ? '#94a3b8' : '#475569' }}>
                      <span>{lbl}</span><span>{usd(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB: PRECIO DE VENTA (personal) ── */}
            {tab === 'venta' && mode === 'personal' && (
              <div>
                <p style={SECL}>Precio de venta estimado</p>
                <F label="Margen de ganancia deseado %">
                  <input type="number" step="any" min="0" value={pMrg} onChange={e => setPMrg(parseFloat(e.target.value) || 0)} style={INP} />
                </F>
                <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '1rem', marginTop: '0.5rem' }}>
                  {[
                    ['Costo real CON IVA', c.totConR],
                    [`+ Margen (${pMrg}%)`, c.totConR * (pMrg / 100)],
                    ['= Precio de venta estimado', c.precioVenta],
                  ].map(([lbl, val], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.35rem 0', borderBottom: i < 2 ? '1px solid #d1fae5' : 'none', fontWeight: i === 2 ? 700 : 400, color: i === 2 ? '#059669' : '#374151' }}>
                      <span>{lbl}</span><span>{usd(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </Card>
        </div>

        {/* ── RIGHT: sticky results ───────────────────────────────────────── */}
        <div style={{ position: 'sticky', top: '1rem', maxHeight: 'calc(100vh - 110px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ══ MODO CLIENTE ══════════════════════════════════════════════════ */}
          {mode === 'cliente' && (<>

            {/* precios finales */}
            <Card>
              <p style={{ ...SECL, margin: '0 0 0.7rem' }}>Precio final al cliente</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '1rem' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>✅ CON Factura</p>
                  <p style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>{usd(c.precioConF)}</p>
                  <p style={{ fontSize: '0.7rem', color: '#6ee7b7', marginTop: '0.2rem' }}>Hon. {usd(c.honorarios)} + Gs.Fac. {usd(c.gastFac)}</p>
                </div>
                <div style={{ background: '#fefce8', borderRadius: '12px', padding: '1rem' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>🚫 SIN Factura</p>
                  <p style={{ fontSize: '1.45rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{usd(c.precioSinF)}</p>
                  <p style={{ fontSize: '0.7rem', color: '#fcd34d', marginTop: '0.2rem' }}>Ahorro del cliente: {usd(c.gastFac)}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.6rem' }}>
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                  <p style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Costo total CON IVA</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>{usd(c.totConC)}</p>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                  <p style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Costo total SIN IVA</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#64748b' }}>{usd(c.totSinC)}</p>
                </div>
              </div>
              <div style={{ background: '#fff7ed', borderRadius: '8px', padding: '0.45rem 0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#92400e' }}>FOB dec. cliente · CIF aranceles cliente</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d97706' }}>{usd(c.fobDC)} · {usd(c.cifC)}</span>
              </div>
            </Card>

            {/* rentabilidad */}
            <Card>
              <p style={{ ...SECL, margin: '0 0 0.7rem' }}>Rentabilidad</p>
              {[
                ['Margen FOB', c.mFOB],
                ['Margen Flete', c.mFlet],
                ['Margen Aranceles', c.mAranc],
                ['Margen Gastos Locales', c.mGas],
                ['Honorarios', c.honorarios],
              ].map(([lbl, val]) => {
                const pctFob = c.fobR > 0 ? ((val / c.fobR) * 100).toFixed(1) + '%' : '';
                const barW = c.ganTotal > 0 ? Math.max(0, Math.min(100, (val / c.ganTotal) * 100)) : 0;
                return (
                  <div key={lbl} style={{ marginBottom: '0.55rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.18rem' }}>
                      <span style={{ fontSize: '0.82rem', color: '#475569' }}>{lbl}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: val >= 0 ? '#10b981' : '#ef4444' }}>
                        {usd(val)} {pctFob && <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 400 }}>({pctFob})</span>}
                      </span>
                    </div>
                    <div style={{ height: '3px', background: '#f1f5f9', borderRadius: '99px' }}>
                      <div style={{ height: '100%', width: `${barW}%`, background: val >= 0 ? '#10b981' : '#ef4444', borderRadius: '99px', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ borderTop: '2px solid #1e293b', marginTop: '0.75rem', paddingTop: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Ganancia total</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: c.ganTotal >= 0 ? '#10b981' : '#ef4444' }}>{usd(c.ganTotal)}</div>
                  {c.fobR > 0 && <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{((c.ganTotal / c.fobR) * 100).toFixed(1)}% s/ FOB real</div>}
                </div>
              </div>
            </Card>

            {/* tabla comparativa completa */}
            <Card>
              <p style={{ ...SECL, margin: '0 0 0.5rem' }}>Detalle: Real vs Cobrado al cliente</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', fontSize: '0.68rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                <span>Concepto</span><span style={{ textAlign: 'right' }}>Costo real</span><span style={{ textAlign: 'right' }}>Cobro</span><span style={{ textAlign: 'right' }}>Margen</span>
              </div>
              {[
                ['FOB Mercadería', c.fobR, c.fobC, c.mFOB],
                ['FOB Declarado', c.fobDR, c.fobDC, null],
                ['Flete', c.fleteR, n(fleteCli), c.mFlet],
                ['Seguro', c.segR, c.segC, c.segC - c.segR],
                ['Derechos', c.derR, c.derC, c.mDer],
                ['Tasa Estadística', c.tasR, c.tasC, c.mTas],
                ['IVA', c.ivaR, c.ivaC, c.mIva],
                ['IVA Adicional', c.ivaAR, c.ivaAC, c.mIvaA],
                ['Perc. Ganancias', c.ganR, c.ganC, c.mGan],
                ['Perc. IIBB', c.iibbR, c.iibbC, c.mIIBB],
                ['Despachante', c.desR, c.desC, c.desC - c.desR],
                ['Terminal', c.terR, c.terC, c.terC - c.terR],
                ['Naviera', c.navR, c.navC, c.navC - c.navR],
                ['Logística', c.logR, c.logC, c.logC - c.logR],
              ].map(([lbl, real, cobro, diff]) => (
                <div key={lbl} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '0.3rem 0', borderBottom: '1px solid #f8fafc', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#475569' }}>{lbl}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'right' }}>{usd(real)}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#1e293b', textAlign: 'right' }}>{usd(cobro)}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textAlign: 'right', color: diff === null ? '#cbd5e1' : diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : '#94a3b8' }}>
                    {diff === null ? '—' : (diff > 0 ? '+' : '') + (usd(diff))}
                  </span>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '0.5rem 0', background: '#f0f7ff', borderRadius: '8px', marginTop: '0.4rem', fontWeight: 700, fontSize: '0.85rem' }}>
                <span style={{ color: '#1e293b', paddingLeft: '0.25rem' }}>TOTAL</span>
                <span style={{ textAlign: 'right', color: '#64748b' }}>{usd(c.totConR)}</span>
                <span style={{ textAlign: 'right', color: '#2563eb' }}>{usd(c.totConC)}</span>
                <span style={{ textAlign: 'right', color: c.ganTotal >= 0 ? '#10b981' : '#ef4444' }}>{c.ganTotal >= 0 ? '+' : ''}{usd(c.ganTotal)}</span>
              </div>
            </Card>

          </>)}

          {/* ══ MODO PERSONAL ═════════════════════════════════════════════════ */}
          {mode === 'personal' && (<>

            <Card>
              <p style={{ ...SECL, margin: '0 0 0.7rem' }}>Costo total de importación</p>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{usd(c.totConR)}</p>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.3rem' }}>SIN IVA: {usd(c.totSinR)}</p>
              {c.precioVenta > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                    Precio de venta estimado ({pMrg}% margen)
                  </p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{usd(c.precioVenta)}</p>
                </div>
              )}
              <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '0.45rem 0.75rem', marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', color: '#065f46' }}>FOB declarado · CIF declarado</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669' }}>{usd(c.fobDR)} · {usd(c.cifR)}</span>
              </div>
            </Card>

            <Card>
              <p style={{ ...SECL, margin: '0 0 0.5rem' }}>Desglose de costos reales</p>
              <RRow label="FOB Real" val={c.fobR} />
              <RRow label="Flete prorrateado" val={c.fleteR} />
              <RRow label="Seguro (1%)" val={c.segR} />
              <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', margin: '0.6rem 0 0.3rem' }}>Aranceles pagados</p>
              <RRow label={`Derechos (${pDer}%)`} val={c.derR} />
              <RRow label={`Tasa Estadística (${pTas}%)`} val={c.tasR} />
              <RRow label={`IVA (${pIva}%)`} val={c.ivaR} dimmed={!pagaIva} />
              <RRow label={`IVA Adicional (${pIvaA}%)`} val={c.ivaAR} dimmed={!pagaIvaA} />
              <RRow label={`Perc. Ganancias (${pGan}%)`} val={c.ganR} dimmed={!pagaGan} />
              <RRow label={`Perc. IIBB (${pIIBB}%)`} val={c.iibbR} dimmed={!pagaIIBB} />
              <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', margin: '0.6rem 0 0.3rem' }}>Gastos locales</p>
              <RRow label="Despachante" val={c.desR} />
              <RRow label="Terminal" val={c.terR} />
              <RRow label="Naviera" val={c.navR} />
              <RRow label="Logística Interna" val={c.logR} />
              <div style={{ borderTop: '2px solid #1e293b', marginTop: '0.6rem', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Total CON IVA</span>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>{usd(c.totConR)}</span>
              </div>
            </Card>

          </>)}

        </div>
      </div>

      {/* ══ MODAL: VISTA COTIZACIÓN CLIENTE ═════════════════════════════════ */}
      {showClienteView && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowClienteView(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>

            {/* modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.5rem', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#fff', borderRadius: '20px 20px 0 0', zIndex: 10 }}>
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>Vista previa</p>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Cotización al Cliente</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button onClick={printClienteQuote} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '50px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, background: '#2563eb', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Imprimir / PDF
                </button>
                <button onClick={() => setShowClienteView(false)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#f1f5f9', color: '#64748b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            </div>

            {/* modal body — quote preview */}
            <div style={{ padding: '1.5rem' }}>

              {/* brand + date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
                <div>
                  <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2563eb', letterSpacing: '-0.02em' }}>TRANSTIDE FREIGHT</p>
                  <p style={{ fontSize: '0.73rem', color: '#94a3b8' }}>Gestión Logística & Importaciones</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Fecha de cotización</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>{new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                </div>
              </div>

              {/* title band */}
              <div style={{ background: '#2563eb', borderRadius: '12px', padding: '1rem 1.2rem', marginBottom: '1.2rem' }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', letterSpacing: '0.01em' }}>COTIZACIÓN DE IMPORTACIÓN</p>
                {cliente && <p style={{ fontSize: '0.8rem', color: '#bfdbfe', marginTop: '3px' }}>Cliente: <strong style={{ color: '#fff' }}>{cliente}</strong></p>}
              </div>

              {/* client info */}
              {(descripcion || clasificacion) && (
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.2rem', display: 'grid', gap: '0.4rem' }}>
                  {descripcion && <div style={{ display: 'flex', gap: '1rem' }}><span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', minWidth: '130px' }}>Descripción</span><span style={{ fontSize: '0.82rem', color: '#1e293b' }}>{descripcion}</span></div>}
                  {clasificacion && <div style={{ display: 'flex', gap: '1rem', borderTop: descripcion ? '1px solid #e2e8f0' : 'none', paddingTop: descripcion ? '0.4rem' : 0 }}><span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', minWidth: '130px' }}>Pos. Arancelaria</span><span style={{ fontSize: '0.82rem', color: '#1e293b' }}>{clasificacion}</span></div>}
                </div>
              )}

              {/* desglose table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem' }}>

                {/* base importación */}
                <div style={{ padding: '6px 12px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Base de la Importación</span>
                </div>
                {[
                  ['Valor de Mercadería (FOB Declarado)', usd(c.fobDC)],
                  ['Flete Internacional', usd(n(fleteCli))],
                  ['Seguro Marítimo (1% FOB)', usd(c.segC)],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderBottom: '1px solid #f8fafc', fontSize: '0.83rem', color: '#374151' }}>
                    <span>{l}</span><span>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '0.88rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff' }}>
                  <span>CIF — Base Arancelaria</span><span>{usd(c.cifC)}</span>
                </div>

                {/* aranceles */}
                <div style={{ padding: '6px 12px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Aranceles Aduaneros</span>
                </div>
                {[
                  [`Derechos de Importación (${pDer}%)`, usd(c.derC)],
                  ...(pTas > 0 ? [[`Tasa Estadística (${pTas}%)`, usd(c.tasC)]] : []),
                  ['Base IVA', usd(c.bivC), true],
                  [`IVA (${pIva}%)`, usd(c.ivaC)],
                  ...(c.ivaAC > 0 ? [[`IVA Adicional (${pIvaA}%)`, usd(c.ivaAC)]] : []),
                  ...(c.ganC > 0 ? [[`Percepción Ganancias (${pGan}%)`, usd(c.ganC)]] : []),
                  ...(c.iibbC > 0 ? [[`Percepción IIBB (${pIIBB}%)`, usd(c.iibbC)]] : []),
                ].map(([l, v, sub]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderBottom: '1px solid #f8fafc', fontSize: '0.83rem', color: sub ? '#94a3b8' : '#374151' }}>
                    <span>{l}</span><span>{v}</span>
                  </div>
                ))}

                {/* gastos locales */}
                {(c.desC > 0 || c.terC > 0 || c.navC > 0 || c.logC > 0) && (<>
                  <div style={{ padding: '6px 12px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Gastos Locales</span>
                  </div>
                  {[
                    ['Despachante de Aduana', c.desC],
                    ['Terminal Portuaria', c.terC],
                    ['Naviera', c.navC],
                    ['Logística Interna', c.logC],
                  ].filter(([, v]) => v > 0).map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderBottom: '1px solid #f8fafc', fontSize: '0.83rem', color: '#374151' }}>
                      <span>{l}</span><span>{usd(v)}</span>
                    </div>
                  ))}
                </>)}

                {/* totales */}
                <div style={{ padding: '6px 12px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Resumen</span>
                </div>
                {[
                  ['Costo Total CON IVA', usd(c.totConC), false, true],
                  ['Costo Total SIN IVA', usd(c.totSinC), true, false],
                  [`Honorarios del Servicio (${pHon}%)`, usd(c.honorarios), false, false],
                  ...(c.gastFac > 0 ? [[`Gastos de Facturación (${pFac}%)`, usd(c.gastFac), true, false]] : []),
                ].map(([l, v, sub, bold]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderBottom: '1px solid #f8fafc', fontSize: sub ? '0.8rem' : bold ? '0.88rem' : '0.83rem', fontWeight: bold ? 700 : 400, color: sub ? '#94a3b8' : bold ? '#1e293b' : '#374151' }}>
                    <span>{l}</span><span>{v}</span>
                  </div>
                ))}
              </div>

              {/* final prices */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.2rem' }}>
                <div style={{ background: '#065f46', borderRadius: '12px', padding: '1.1rem 1.2rem' }}>
                  <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Precio Final CON Factura</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{usd(c.precioConF)}</p>
                  <p style={{ fontSize: '0.68rem', color: '#6ee7b7', marginTop: '5px' }}>Hon. {usd(c.honorarios)} + Gs.Fac. {usd(c.gastFac)}</p>
                </div>
                <div style={{ background: '#78350f', borderRadius: '12px', padding: '1.1rem 1.2rem' }}>
                  <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#fcd34d', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Precio Final SIN Factura</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{usd(c.precioSinF)}</p>
                  <p style={{ fontSize: '0.68rem', color: '#fcd34d', marginTop: '5px' }}>Ahorro del cliente: {usd(c.gastFac)}</p>
                </div>
              </div>

              {/* disclaimer */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                <p style={{ fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.6 }}>
                  * Cotización expresada en USD. Los valores son estimados y están sujetos a variación según el tipo de cambio oficial vigente al momento del despacho, actualizaciones arancelarias y condiciones del proveedor. Validez: 7 días hábiles.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
