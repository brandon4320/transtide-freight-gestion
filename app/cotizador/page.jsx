'use client';
import { useState, useMemo } from 'react';

const usd = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return '$ ' + (Math.round(n * 100) / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fi = { width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', color: '#1e293b', background: '#fff', outline: 'none' };
const fl = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' };

function Field({ label, children }) {
  return <div style={{ marginBottom: '0.9rem' }}><label style={fl}>{label}</label>{children}</div>;
}

function NumInput({ value, onChange, placeholder = '0', step = 'any', min = 0 }) {
  return <input type="number" step={step} min={min} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={fi} />;
}

function TextInput({ value, onChange, placeholder = '' }) {
  return <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={fi} />;
}

function Toggle({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f8fafc' }}>
      <span style={{ fontSize: '0.85rem', color: '#475569' }}>{label}</span>
      <button onClick={() => onChange(!checked)} style={{ padding: '0.2rem 0.8rem', borderRadius: '50px', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, background: checked ? '#d1fae5' : '#fee2e2', color: checked ? '#059669' : '#dc2626', minWidth: '44px' }}>
        {checked ? 'SÍ' : 'NO'}
      </button>
    </div>
  );
}

function SectionLabel({ children }) {
  return <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#cbd5e1', margin: '1.25rem 0 0.6rem', paddingBottom: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>{children}</p>;
}

function StatBox({ label, value, sub, color = '#2563eb', big = false }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', flex: 1 }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>{label}</p>
      <p style={{ fontSize: big ? '1.5rem' : '1.15rem', fontWeight: 800, color, lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>{sub}</p>}
    </div>
  );
}

function ResultRow({ label, value, diff, dimmed }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #f8fafc' }}>
      <span style={{ fontSize: '0.82rem', color: dimmed ? '#94a3b8' : '#475569' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: dimmed ? '#94a3b8' : '#1e293b' }}>{usd(value)}</span>
        {diff !== undefined && (
          <span style={{ fontSize: '0.72rem', marginLeft: '0.5rem', color: diff >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
            {diff >= 0 ? '+' : ''}{usd(diff)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Cotizador() {
  // Mode & Tab
  const [mode, setMode] = useState('cliente');   // 'propia' | 'cliente'
  const [tab, setTab] = useState('datos');        // 'datos' | 'aranceles' | 'gastos' | 'cierre'

  // Identificación
  const [cliente, setCliente] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [clasificacion, setClasificacion] = useState('');

  // FOB
  const [fobCliente, setFobCliente] = useState('');
  const [fobReal, setFobReal] = useState('');
  const [fobDeclarado, setFobDeclarado] = useState('');

  // Flete
  const [fleteCliente, setFleteCliente] = useState('');
  const [fleteRealInput, setFleteRealInput] = useState('');

  // Contenedor
  const [m3Merch, setM3Merch] = useState('');
  const [contenedor, setContenedor] = useState('40');

  // Aranceles (en %)
  const [pctDerechos, setPctDerechos] = useState(35);
  const [pctTasa, setPctTasa] = useState(0);
  const [pctIva, setPctIva] = useState(21);
  const [pagaIva, setPagaIva] = useState(true);
  const [pctIvaAdic, setPctIvaAdic] = useState(20);
  const [pagaIvaAdic, setPagaIvaAdic] = useState(false);
  const [pctGanancias, setPctGanancias] = useState(6);
  const [pagaGanancias, setPagaGanancias] = useState(false);
  const [pctIIBB, setPctIIBB] = useState(2.5);
  const [pagaIIBB, setPagaIIBB] = useState(false);

  // Gastos locales cobrados al cliente (modo cliente)
  const [gDespachante, setGDespachante] = useState('');
  const [gTerminal, setGTerminal] = useState('');
  const [gNaviera, setGNaviera] = useState('');
  const [gLogistica, setGLogistica] = useState('');

  // Costos de referencia para prorrateo
  const [refFlete, setRefFlete] = useState(4500);
  const [refDespachante, setRefDespachante] = useState(2000);
  const [refTerminal, setRefTerminal] = useState(2300);
  const [refNaviera, setRefNaviera] = useState(800);
  const [refLogistica, setRefLogistica] = useState(2150);

  // Cierre
  const [pctHonorarios, setPctHonorarios] = useState(4);
  const [pctFacturacion, setPctFacturacion] = useState(8);
  const [margenVenta, setMargenVenta] = useState(20); // solo modo propia

  const c = useMemo(() => {
    const n = (v) => parseFloat(v) || 0;
    const pDer = pctDerechos / 100;
    const pTas = pctTasa / 100;
    const pIva = pctIva / 100;
    const pIvaA = pctIvaAdic / 100;
    const pGan = pctGanancias / 100;
    const pIIBB = pctIIBB / 100;
    const pHon = pctHonorarios / 100;
    const pFac = pctFacturacion / 100;
    const pMrg = margenVenta / 100;

    const fobC = n(fobCliente);
    const fobR = n(fobReal);
    const fobD = n(fobDeclarado) || fobR;
    const fleteC = n(fleteCliente);
    const m3val = n(m3Merch);
    const m3Cont = contenedor === '20' ? 30 : 60;
    const ratio = m3val > 0 ? m3val / m3Cont : 1;
    const fleteR = n(fleteRealInput) || (n(refFlete) * ratio);

    // === LADO CLIENTE (lo que cobro) ===
    const seguroC = fobC * 0.01;
    const cifC = fobC + fleteC + seguroC;
    const derechosC = cifC * pDer;
    const tasaC = cifC * pTas;
    const baseIvaC = cifC + derechosC + tasaC;
    const ivaC = baseIvaC * pIva;
    const ivaAdicC = baseIvaC * pIvaA;
    const gananciasC = baseIvaC * pGan;
    const iibbC = baseIvaC * pIIBB;
    const totalArancC = fleteC + seguroC + derechosC + tasaC + ivaC + ivaAdicC + gananciasC + iibbC;
    const despaC = n(gDespachante);
    const termC = n(gTerminal);
    const navC = n(gNaviera);
    const logC = n(gLogistica);
    const totalGastosC = despaC + termC + navC + logC;
    const costoConIva = fobC + totalArancC + totalGastosC;
    const costoSinIva = costoConIva - ivaC - ivaAdicC;

    // === LADO REAL (mi costo) ===
    const seguroR = fobD * 0.01;
    const cifR = fobD + fleteR + seguroR;
    const derechosR = cifR * pDer;
    const tasaR = cifR * pTas;
    const baseIvaR = cifR + derechosR + tasaR;
    const ivaR = pagaIva ? baseIvaR * pIva : 0;
    const ivaAdicR = pagaIvaAdic ? baseIvaR * pIvaA : 0;
    const gananciasR = pagaGanancias ? baseIvaR * pGan : 0;
    const iibbR = pagaIIBB ? baseIvaR * pIIBB : 0;
    const despaR = n(refDespachante) * ratio;
    const termR = n(refTerminal) * ratio;
    const navR = n(refNaviera) * ratio;
    const logR = n(refLogistica) * ratio;
    const totalGastosR = despaR + termR + navR + logR;
    const costoRealConIva = fobR + fleteR + seguroR + derechosR + tasaR + ivaR + ivaAdicR + gananciasR + iibbR + totalGastosR;
    const costoRealSinIva = costoRealConIva - ivaR - ivaAdicR;

    // === ESCENARIOS (cliente) ===
    const honorarios = costoConIva * pHon;
    const gastFac = costoConIva * pFac;
    const precioConFac = costoConIva + honorarios + gastFac;
    const precioSinFac = costoConIva + honorarios;

    // === RENTABILIDAD (cliente) ===
    const margenFOB = fobC - fobR;
    const margenFlete = fleteC - fleteR;
    const margenAranceles = (derechosC - derechosR) + (tasaC - tasaR) + (ivaC - ivaR) + (ivaAdicC - ivaAdicR) + (gananciasC - gananciasR) + (iibbC - iibbR);
    const margenGastos = totalGastosC - totalGastosR;
    const gananciaTotal = margenFOB + margenFlete + margenAranceles + margenGastos + honorarios;

    // === MODO PROPIA ===
    const precioVenta = costoRealConIva * (1 + pMrg);

    return {
      // cliente
      seguroC, cifC, derechosC, tasaC, baseIvaC, ivaC, ivaAdicC, gananciasC, iibbC,
      totalArancC, despaC, termC, navC, logC, totalGastosC, costoConIva, costoSinIva,
      honorarios, gastFac, precioConFac, precioSinFac,
      margenFOB, margenFlete, margenAranceles, margenGastos, gananciaTotal,
      // real
      fleteR, seguroR, cifR, derechosR, tasaR, ivaR, ivaAdicR, gananciasR, iibbR,
      despaR, termR, navR, logR, totalGastosR, costoRealConIva, costoRealSinIva,
      // propia
      precioVenta,
      // meta
      m3Cont, ratio, fobR,
    };
  }, [
    fobCliente, fobReal, fobDeclarado, fleteCliente, fleteRealInput,
    m3Merch, contenedor,
    pctDerechos, pctTasa, pctIva, pagaIva, pctIvaAdic, pagaIvaAdic,
    pctGanancias, pagaGanancias, pctIIBB, pagaIIBB,
    gDespachante, gTerminal, gNaviera, gLogistica,
    refFlete, refDespachante, refTerminal, refNaviera, refLogistica,
    pctHonorarios, pctFacturacion, margenVenta,
  ]);

  const tabs = mode === 'cliente'
    ? [['datos', 'Datos'], ['aranceles', 'Aranceles'], ['gastos', 'Gastos'], ['cierre', 'Cierre']]
    : [['datos', 'Datos'], ['aranceles', 'Aranceles'], ['gastos', 'Gastos'], ['venta', 'Venta']];

  return (
    <div style={{ paddingBottom: '2rem' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.15rem' }}>Cotizador de Importación</h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            {mode === 'propia' ? 'Calculá el costo real de tu propia importación' : 'Cotizá una operación y analizá tu rentabilidad'}
          </p>
        </div>

        {/* MODE TOGGLE */}
        <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: '50px', padding: '4px', gap: '2px' }}>
          {[['propia', '📦 Importación Propia'], ['cliente', '🤝 Para Cliente']].map(([m, label]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setTab('datos'); }}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '50px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700,
                background: mode === m ? '#2563eb' : 'transparent',
                color: mode === m ? '#fff' : '#64748b',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN LAYOUT: inputs left · results right (sticky) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* ════ LEFT: TABBED INPUTS ════ */}
        <div>
          {/* Tab bar */}
          <div style={{ display: 'flex', background: '#fff', borderRadius: '12px', padding: '4px', marginBottom: '0.75rem', border: '1px solid #e2e8f0', gap: '2px' }}>
            {tabs.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1,
                  padding: '0.45rem 0.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: tab === id ? '#f0f7ff' : 'transparent',
                  color: tab === id ? '#2563eb' : '#94a3b8',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>

            {/* ── TAB: DATOS ── */}
            {tab === 'datos' && (
              <div>
                <SectionLabel>Identificación</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Field label="Cliente"><TextInput value={cliente} onChange={setCliente} placeholder="Nombre del cliente" /></Field>
                  <Field label="Clasificación arancelaria"><TextInput value={clasificacion} onChange={setClasificacion} placeholder="8456.11.00" /></Field>
                </div>
                <Field label="Descripción del embarque"><TextInput value={descripcion} onChange={setDescripcion} placeholder="Ej: Cortadora láser 1000W" /></Field>

                <SectionLabel>FOB — Valor de la Mercadería</SectionLabel>
                {mode === 'cliente' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <Field label="FOB cliente"><NumInput value={fobCliente} onChange={setFobCliente} /></Field>
                    <Field label="FOB real (proveedor)"><NumInput value={fobReal} onChange={setFobReal} /></Field>
                    <Field label="FOB declarado aduana"><NumInput value={fobDeclarado} onChange={setFobDeclarado} placeholder="= real si no difiere" /></Field>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <Field label="FOB real (proveedor)"><NumInput value={fobReal} onChange={setFobReal} /></Field>
                    <Field label="FOB declarado aduana"><NumInput value={fobDeclarado} onChange={setFobDeclarado} placeholder="= real si no difiere" /></Field>
                  </div>
                )}

                <SectionLabel>Flete y Seguro</SectionLabel>
                {mode === 'cliente' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <Field label="Flete cobrado al cliente"><NumInput value={fleteCliente} onChange={setFleteCliente} /></Field>
                    <Field label="Flete real prorrateado"><NumInput value={fleteRealInput} onChange={setFleteRealInput} placeholder={`Auto: ref × ${c.ratio.toFixed(2)}`} /></Field>
                  </div>
                ) : (
                  <Field label="Flete real prorrateado"><NumInput value={fleteRealInput} onChange={setFleteRealInput} placeholder={`Auto: ref × ${c.ratio.toFixed(2)}`} /></Field>
                )}
                <p style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '-0.5rem', marginBottom: '0.9rem' }}>Seguro = 1% del FOB (calculado automáticamente)</p>

                <SectionLabel>Contenedor</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Field label="Tipo de contenedor">
                    <select value={contenedor} onChange={e => setContenedor(e.target.value)} style={fi}>
                      <option value="20">20 pies — 30 m³</option>
                      <option value="40">40 pies — 60 m³</option>
                    </select>
                  </Field>
                  <Field label="M³ de la mercadería"><NumInput value={m3Merch} onChange={setM3Merch} /></Field>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '-0.5rem' }}>Ratio de prorrateo: {c.ratio.toFixed(4)} ({parseFloat(m3Merch) || 0} m³ / {c.m3Cont} m³)</p>
              </div>
            )}

            {/* ── TAB: ARANCELES ── */}
            {tab === 'aranceles' && (
              <div>
                <SectionLabel>Base arancelaria</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Field label="Derechos de Importación %"><NumInput value={pctDerechos} onChange={v => setPctDerechos(parseFloat(v) || 0)} min={0} /></Field>
                  <Field label="Tasa Estadística %"><NumInput value={pctTasa} onChange={v => setPctTasa(parseFloat(v) || 0)} min={0} /></Field>
                </div>

                <SectionLabel>Impuestos — indicá cuáles pagás realmente</SectionLabel>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                  El toggle "SÍ/NO" indica si la empresa paga ese impuesto en aduana (afecta el cálculo de costo real y rentabilidad).
                </p>

                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                  {[
                    ['IVA %', pctIva, setPctIva, pagaIva, setPagaIva],
                    ['IVA Adicional %', pctIvaAdic, setPctIvaAdic, pagaIvaAdic, setPagaIvaAdic],
                    ['Percepción Ganancias %', pctGanancias, setPctGanancias, pagaGanancias, setPagaGanancias],
                    ['Percepción IIBB %', pctIIBB, setPctIIBB, pagaIIBB, setPagaIIBB],
                  ].map(([label, val, setVal, paga, setPaga]) => (
                    <div key={label} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div>
                        <label style={fl}>{label}</label>
                        <input type="number" step="any" min={0} value={val} onChange={e => setVal(parseFloat(e.target.value) || 0)} style={fi} />
                      </div>
                      <div style={{ paddingTop: '1.1rem' }}>
                        <Toggle label="¿Lo pagás?" checked={paga} onChange={setPaga} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB: GASTOS ── */}
            {tab === 'gastos' && (
              <div>
                {mode === 'cliente' && (
                  <>
                    <SectionLabel>Gastos cobrados al cliente</SectionLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <Field label="Despachante"><NumInput value={gDespachante} onChange={setGDespachante} /></Field>
                      <Field label="Terminal"><NumInput value={gTerminal} onChange={setGTerminal} /></Field>
                      <Field label="Naviera"><NumInput value={gNaviera} onChange={setGNaviera} /></Field>
                      <Field label="Logística Interna"><NumInput value={gLogistica} onChange={setGLogistica} /></Field>
                    </div>
                  </>
                )}

                <SectionLabel>Costos de referencia (costo real prorrateado)</SectionLabel>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                  Costo total del contenedor. Se divide por el ratio m³ para calcular tu costo real en esta operación.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Field label="Flete Marítimo (ref)"><NumInput value={refFlete} onChange={v => setRefFlete(parseFloat(v) || 0)} /></Field>
                  <Field label="Despachante (ref)"><NumInput value={refDespachante} onChange={v => setRefDespachante(parseFloat(v) || 0)} /></Field>
                  <Field label="Terminal (ref)"><NumInput value={refTerminal} onChange={v => setRefTerminal(parseFloat(v) || 0)} /></Field>
                  <Field label="Naviera (ref)"><NumInput value={refNaviera} onChange={v => setRefNaviera(parseFloat(v) || 0)} /></Field>
                  <Field label="Logística Interna (ref)"><NumInput value={refLogistica} onChange={v => setRefLogistica(parseFloat(v) || 0)} /></Field>
                </div>

                <div style={{ background: '#f0f7ff', borderRadius: '10px', padding: '0.75rem 1rem', marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', marginBottom: '0.4rem' }}>Costos reales prorrateados (ratio {c.ratio.toFixed(3)})</p>
                  {[['Flete', c.fleteR], ['Despachante', c.despaR], ['Terminal', c.termR], ['Naviera', c.navR], ['Logística', c.logR]].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem' }}>
                      <span>{l}</span><span style={{ fontWeight: 600 }}>{usd(v)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: '#2563eb', borderTop: '1px solid #bfdbfe', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                    <span>Total real</span><span>{usd(c.fleteR + c.despaR + c.termR + c.navR + c.logR)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: CIERRE (modo cliente) ── */}
            {tab === 'cierre' && mode === 'cliente' && (
              <div>
                <SectionLabel>Honorarios del servicio</SectionLabel>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                  Se aplican sobre el Costo Total CON IVA.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Field label="Honorarios %">
                    <input type="number" step="any" min={0} value={pctHonorarios} onChange={e => setPctHonorarios(parseFloat(e.target.value) || 0)} style={fi} />
                  </Field>
                  <Field label="Gastos de Facturación % (CON factura)">
                    <input type="number" step="any" min={0} value={pctFacturacion} onChange={e => setPctFacturacion(parseFloat(e.target.value) || 0)} style={fi} />
                  </Field>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem', marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vista previa de cierre</p>
                  {[
                    ['Costo Total CON IVA', c.costoConIva],
                    [`+ Honorarios (${pctHonorarios}%)`, c.honorarios],
                    [`+ Gastos Facturación (${pctFacturacion}%)`, c.gastFac],
                    ['= Precio Final CON factura', c.precioConFac],
                    ['= Precio Final SIN factura', c.precioSinFac],
                  ].map(([label, val], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.35rem 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none', fontWeight: i >= 3 ? 700 : 400, color: i >= 3 ? '#2563eb' : '#475569' }}>
                      <span>{label}</span><span>{usd(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB: VENTA (modo propia) ── */}
            {tab === 'venta' && mode === 'propia' && (
              <div>
                <SectionLabel>Precio de venta estimado</SectionLabel>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                  Aplicá un margen sobre tu costo real de importación para estimar el precio de venta.
                </p>
                <Field label="Margen de ganancia deseado %">
                  <input type="number" step="any" min={0} value={margenVenta} onChange={e => setMargenVenta(parseFloat(e.target.value) || 0)} style={fi} />
                </Field>

                <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '1rem', marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimación</p>
                  {[
                    ['Costo real CON IVA', c.costoRealConIva],
                    [`Margen (${margenVenta}%)`, c.costoRealConIva * (margenVenta / 100)],
                    ['Precio de venta estimado', c.precioVenta],
                  ].map(([label, val], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.35rem 0', borderBottom: i < 2 ? '1px solid #bbf7d0' : 'none', fontWeight: i === 2 ? 700 : 400, color: i === 2 ? '#059669' : '#374151' }}>
                      <span>{label}</span><span>{usd(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ════ RIGHT: STICKY RESULTS ════ */}
        <div style={{ position: 'sticky', top: '1rem', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', paddingRight: '2px' }}>

          {/* ── RESULTS: MODO PROPIA ── */}
          {mode === 'propia' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Big number */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Costo Total de Importación</p>
                <p style={{ fontSize: '2.25rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{usd(c.costoRealConIva)}</p>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.35rem' }}>SIN IVA: {usd(c.costoRealSinIva)}</p>
                {c.precioVenta > 0 && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Precio de venta estimado ({margenVenta}% margen)</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{usd(c.precioVenta)}</p>
                  </div>
                )}
              </div>

              {/* Desglose */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Desglose del costo real</p>

                <ResultRow label="FOB Real" value={c.fobR} />
                <ResultRow label="Flete Prorrateado" value={c.fleteR} />
                <ResultRow label="Seguro (1%)" value={c.seguroR} />

                <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0.75rem 0 0.4rem' }}>Aranceles pagados</p>
                <ResultRow label={`Derechos (${pctDerechos}%)`} value={c.derechosR} />
                <ResultRow label={`Tasa Estadística (${pctTasa}%)`} value={c.tasaR} />
                <ResultRow label={`IVA (${pctIva}%)`} value={c.ivaR} dimmed={!pagaIva} />
                <ResultRow label={`IVA Adicional (${pctIvaAdic}%)`} value={c.ivaAdicR} dimmed={!pagaIvaAdic} />
                <ResultRow label={`Perc. Ganancias (${pctGanancias}%)`} value={c.gananciasR} dimmed={!pagaGanancias} />
                <ResultRow label={`Perc. IIBB (${pctIIBB}%)`} value={c.iibbR} dimmed={!pagaIIBB} />

                <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0.75rem 0 0.4rem' }}>Gastos locales</p>
                <ResultRow label="Despachante" value={c.despaR} />
                <ResultRow label="Terminal" value={c.termR} />
                <ResultRow label="Naviera" value={c.navR} />
                <ResultRow label="Logística Interna" value={c.logR} />

                <div style={{ borderTop: '2px solid #1e293b', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Total CON IVA</span>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>{usd(c.costoRealConIva)}</span>
                </div>
              </div>

            </div>
          )}

          {/* ── RESULTS: MODO CLIENTE ── */}
          {mode === 'cliente' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Precios de cierre */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Precio final al cliente</p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ flex: 1, background: '#f0fdf4', borderRadius: '12px', padding: '1rem' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>✅ CON Factura</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>{usd(c.precioConFac)}</p>
                    <p style={{ fontSize: '0.72rem', color: '#6ee7b7', marginTop: '0.25rem' }}>Hon. + Gs.Fac. incluidos</p>
                  </div>
                  <div style={{ flex: 1, background: '#fefce8', borderRadius: '12px', padding: '1rem' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>🚫 SIN Factura</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{usd(c.precioSinFac)}</p>
                    <p style={{ fontSize: '0.72rem', color: '#fcd34d', marginTop: '0.25rem' }}>Ahorro: {usd(c.gastFac)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div style={{ flex: 1, background: '#f8fafc', borderRadius: '10px', padding: '0.75rem' }}>
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Costo total CON IVA</p>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{usd(c.costoConIva)}</p>
                  </div>
                  <div style={{ flex: 1, background: '#f8fafc', borderRadius: '10px', padding: '0.75rem' }}>
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Costo total SIN IVA</p>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: '#64748b' }}>{usd(c.costoSinIva)}</p>
                  </div>
                </div>
              </div>

              {/* Rentabilidad */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Rentabilidad</p>
                {[
                  ['Margen FOB', c.margenFOB],
                  ['Margen Flete', c.margenFlete],
                  ['Margen Aranceles', c.margenAranceles],
                  ['Margen Gastos Locales', c.margenGastos],
                  ['Honorarios', c.honorarios],
                ].map(([label, val]) => {
                  const pctFob = c.fobR > 0 ? ((val / c.fobR) * 100).toFixed(1) + '%' : '';
                  const barW = c.gananciaTotal > 0 ? Math.max(0, Math.min(100, (val / c.gananciaTotal) * 100)) : 0;
                  return (
                    <div key={label} style={{ marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.82rem', color: '#475569' }}>{label}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: val >= 0 ? '#10b981' : '#ef4444' }}>
                          {usd(val)} {pctFob && <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>({pctFob})</span>}
                        </span>
                      </div>
                      <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${barW}%`, background: val >= 0 ? '#10b981' : '#ef4444', borderRadius: '99px', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ borderTop: '2px solid #1e293b', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>Ganancia Total</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: c.gananciaTotal >= 0 ? '#10b981' : '#ef4444' }}>{usd(c.gananciaTotal)}</div>
                    {c.fobR > 0 && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{((c.gananciaTotal / c.fobR) * 100).toFixed(1)}% s/ FOB real</div>}
                  </div>
                </div>
              </div>

              {/* Desglose comparativo compacto */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Real vs Cobrado</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.25rem', marginBottom: '0.5rem' }}>
                  {['Concepto', 'Real', 'Cobrado'].map(h => (
                    <span key={h} style={{ fontSize: '0.68rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                  ))}
                </div>
                {[
                  ['FOB', c.fobR, parseFloat(fobCliente) || 0],
                  ['Flete', c.fleteR, parseFloat(fleteCliente) || 0],
                  ['Derechos', c.derechosR, c.derechosC],
                  ['IVA', c.ivaR, c.ivaC],
                  ['IVA Adic.', c.ivaAdicR, c.ivaAdicC],
                  ['Ganancias', c.gananciasR, c.gananciasC],
                  ['IIBB', c.iibbR, c.iibbC],
                  ['Gastos Loc.', c.totalGastosR, c.totalGastosC],
                ].map(([label, real, cobrado]) => {
                  const diff = cobrado - real;
                  return (
                    <div key={label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.25rem', padding: '0.3rem 0', borderBottom: '1px solid #f8fafc' }}>
                      <span style={{ fontSize: '0.8rem', color: '#475569' }}>{label}</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'right' }}>{usd(real)}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, textAlign: 'right', color: diff >= 0 ? '#10b981' : '#ef4444' }}>{usd(cobrado)}</span>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
