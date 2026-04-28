'use client';
import { useState, useMemo } from 'react';

const usd = (n) => {
  if (n === null || n === undefined) return '—';
  return '$ ' + (Math.round(n * 100) / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const field = {
  label: { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
  input: { width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', color: '#1e293b', background: '#fff', outline: 'none' },
  select: { width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', color: '#1e293b', background: '#fff', outline: 'none', cursor: 'pointer' },
};

const sectionTitle = { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' };

const row = (label, clientVal, realVal, diffVal, highlight = false) => (
  <tr style={{ background: highlight ? '#f8fafc' : 'transparent' }}>
    <td style={{ padding: '0.45rem 0', fontSize: '0.85rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>{label}</td>
    <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#2563eb', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>{usd(clientVal)}</td>
    {realVal !== undefined && (
      <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{usd(realVal)}</td>
    )}
    {diffVal !== undefined && (
      <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600, color: diffVal > 0 ? '#10b981' : diffVal < 0 ? '#ef4444' : '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>{usd(diffVal)}</td>
    )}
  </tr>
);

const totalRow = (label, clientVal, realVal, diffVal) => (
  <tr style={{ background: '#f0f7ff' }}>
    <td style={{ padding: '0.6rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{label}</td>
    <td style={{ padding: '0.6rem 0.5rem', fontSize: '0.85rem', fontWeight: 700, textAlign: 'right', color: '#2563eb' }}>{usd(clientVal)}</td>
    {realVal !== undefined && (
      <td style={{ padding: '0.6rem 0.5rem', fontSize: '0.85rem', fontWeight: 700, textAlign: 'right', color: '#64748b' }}>{usd(realVal)}</td>
    )}
    {diffVal !== undefined && (
      <td style={{ padding: '0.6rem 0.5rem', fontSize: '0.85rem', fontWeight: 700, textAlign: 'right', color: diffVal > 0 ? '#10b981' : diffVal < 0 ? '#ef4444' : '#94a3b8' }}>{usd(diffVal)}</td>
    )}
  </tr>
);

export default function Cotizador() {
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

  // Gastos locales cobrados al cliente
  const [gDespachante, setGDespachante] = useState('');
  const [gTerminal, setGTerminal] = useState('');
  const [gNaviera, setGNaviera] = useState('');
  const [gLogistica, setGLogistica] = useState('');

  // Costos de referencia (para prorrateo)
  const [refFlete, setRefFlete] = useState(4500);
  const [refDespachante, setRefDespachante] = useState(2000);
  const [refTerminal, setRefTerminal] = useState(2300);
  const [refNaviera, setRefNaviera] = useState(800);
  const [refLogistica, setRefLogistica] = useState(2150);

  // Honorarios
  const [pctHonorarios, setPctHonorarios] = useState(4);
  const [pctFacturacion, setPctFacturacion] = useState(8);

  const calc = useMemo(() => {
    const n = (v) => parseFloat(v) || 0;
    const pDer = pctDerechos / 100;
    const pTas = pctTasa / 100;
    const pIva = pctIva / 100;
    const pIvaA = pctIvaAdic / 100;
    const pGan = pctGanancias / 100;
    const pIIBB = pctIIBB / 100;
    const pHon = pctHonorarios / 100;
    const pFac = pctFacturacion / 100;

    const fobC = n(fobCliente);
    const fobR = n(fobReal);
    const fobD = n(fobDeclarado) || fobR;
    const fleteC = n(fleteCliente);
    const m3val = n(m3Merch);
    const m3Cont = contenedor === '20' ? 30 : 60;
    const ratio = m3val > 0 ? m3val / m3Cont : 1;
    const fleteR = n(fleteRealInput) || (n(refFlete) * ratio);

    // === COTIZACIÓN AL CLIENTE ===
    const seguroC = fobC * 0.01;
    const cifC = fobC + fleteC + seguroC;
    const derechosC = cifC * pDer;
    const tasaC = cifC * pTas;
    const baseIvaC = cifC + derechosC + tasaC;
    const ivaC = baseIvaC * pIva;
    const ivaAdicC = baseIvaC * pIvaA;
    const gananciasC = baseIvaC * pGan;
    const iibbC = baseIvaC * pIIBB;
    const totalArancFlete = fleteC + seguroC + derechosC + tasaC + ivaC + ivaAdicC + gananciasC + iibbC;

    const despaC = n(gDespachante);
    const termC = n(gTerminal);
    const navC = n(gNaviera);
    const logC = n(gLogistica);
    const totalGastosC = despaC + termC + navC + logC;

    const costoConIva = fobC + totalArancFlete + totalGastosC;
    const costoSinIva = costoConIva - ivaC - ivaAdicC;

    // === COSTOS REALES ===
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

    // === ESCENARIOS ===
    const honorarios = costoConIva * pHon;
    const gastFac = costoConIva * pFac;
    const precioConFac = costoConIva + honorarios + gastFac;
    const precioSinFac = costoConIva + honorarios;

    // === RENTABILIDAD ===
    const margenFOB = fobC - fobR;
    const margenFlete = fleteC - fleteR;
    const margenAranceles =
      (derechosC - derechosR) + (tasaC - tasaR) +
      (ivaC - ivaR) + (ivaAdicC - ivaAdicR) +
      (gananciasC - gananciasR) + (iibbC - iibbR);
    const margenGastos = totalGastosC - totalGastosR;
    const gananciaTotal = margenFOB + margenFlete + margenAranceles + margenGastos + honorarios;

    return {
      seguroC, cifC, derechosC, tasaC, baseIvaC, ivaC, ivaAdicC, gananciasC, iibbC,
      totalArancFlete, despaC, termC, navC, logC, totalGastosC, costoConIva, costoSinIva,
      fleteR, seguroR, cifR, derechosR, tasaR, ivaR, ivaAdicR, gananciasR, iibbR,
      despaR, termR, navR, logR, totalGastosR,
      honorarios, gastFac, precioConFac, precioSinFac,
      margenFOB, margenFlete, margenAranceles, margenGastos, gananciaTotal,
      m3Cont, ratio,
    };
  }, [
    fobCliente, fobReal, fobDeclarado, fleteCliente, fleteRealInput,
    m3Merch, contenedor,
    pctDerechos, pctTasa, pctIva, pagaIva, pctIvaAdic, pagaIvaAdic,
    pctGanancias, pagaGanancias, pctIIBB, pagaIIBB,
    gDespachante, gTerminal, gNaviera, gLogistica,
    refFlete, refDespachante, refTerminal, refNaviera, refLogistica,
    pctHonorarios, pctFacturacion,
  ]);

  const inputGroup = (label, value, setter, opts = {}) => (
    <div style={{ marginBottom: '0.75rem' }}>
      <label style={field.label}>{label}</label>
      <input
        type={opts.type || 'number'}
        step={opts.step || 'any'}
        min={opts.min ?? 0}
        placeholder={opts.placeholder || '0'}
        value={value}
        onChange={e => setter(e.target.value)}
        style={field.input}
      />
    </div>
  );

  const toggle = (label, checked, setChecked) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
      <span style={{ fontSize: '0.82rem', color: '#475569' }}>{label}</span>
      <button
        onClick={() => setChecked(!checked)}
        style={{
          padding: '0.2rem 0.7rem',
          borderRadius: '50px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: 700,
          background: checked ? '#d1fae5' : '#fee2e2',
          color: checked ? '#10b981' : '#ef4444',
        }}
      >
        {checked ? 'SÍ' : 'NO'}
      </button>
    </div>
  );

  const card = (children, style = {}) => (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.03)', marginBottom: '1rem', ...style }}>
      {children}
    </div>
  );

  return (
    <div style={{ paddingBottom: '3rem' }}>

      {/* Page Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
          Cotizador de Importación
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Calculá el costo real, el precio al cliente y la rentabilidad de cada operación
        </p>
      </div>

      {/* Client Info Bar */}
      {card(
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={field.label}>Cliente</label>
            <input type="text" placeholder="Nombre del cliente" value={cliente} onChange={e => setCliente(e.target.value)} style={field.input} />
          </div>
          <div>
            <label style={field.label}>Descripción del embarque</label>
            <input type="text" placeholder="Ej: Cortadora láser 1000W" value={descripcion} onChange={e => setDescripcion(e.target.value)} style={field.input} />
          </div>
          <div>
            <label style={field.label}>Clasificación arancelaria</label>
            <input type="text" placeholder="Ej: 8456.11.00" value={clasificacion} onChange={e => setClasificacion(e.target.value)} style={field.input} />
          </div>
          <div>
            <label style={field.label}>Contenedor</label>
            <select value={contenedor} onChange={e => setContenedor(e.target.value)} style={field.select}>
              <option value="20">20 pies (30 m³)</option>
              <option value="40">40 pies (60 m³)</option>
            </select>
          </div>
          <div>
            <label style={field.label}>M³ de la mercadería</label>
            <input type="number" step="any" min="0" placeholder="0" value={m3Merch} onChange={e => setM3Merch(e.target.value)} style={{ ...field.input, width: '120px' }} />
          </div>
        </div>
      )}

      {/* Main 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* ====== COLUMN 1: INPUTS ====== */}
        <div>

          {/* FOB */}
          {card(<>
            <p style={sectionTitle}>FOB — Valor de la Mercadería</p>
            {inputGroup('FOB cobrado al cliente (USD)', fobCliente, setFobCliente)}
            {inputGroup('FOB real (costo real al proveedor)', fobReal, setFobReal)}
            {inputGroup('FOB declarado en aduana', fobDeclarado, setFobDeclarado, { placeholder: 'Igual al real si no se declara menor' })}
          </>)}

          {/* Flete */}
          {card(<>
            <p style={sectionTitle}>Flete y Seguro</p>
            {inputGroup('Flete cobrado al cliente (USD)', fleteCliente, setFleteCliente)}
            {inputGroup('Flete real prorrateado (USD)', fleteRealInput, setFleteRealInput, { placeholder: `Auto: ref × (m³/${calc.m3Cont})` })}
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '-0.25rem' }}>
              Seguro: 1% del FOB (calculado automáticamente)
            </div>
          </>)}

          {/* Aranceles */}
          {card(<>
            <p style={sectionTitle}>Aranceles e Impuestos</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={field.label}>Derechos Import. %</label>
                <input type="number" step="any" min="0" max="100" value={pctDerechos} onChange={e => setPctDerechos(parseFloat(e.target.value) || 0)} style={field.input} />
              </div>
              <div>
                <label style={field.label}>Tasa Estadística %</label>
                <input type="number" step="any" min="0" max="100" value={pctTasa} onChange={e => setPctTasa(parseFloat(e.target.value) || 0)} style={field.input} />
              </div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <label style={field.label}>IVA %</label>
                  <input type="number" step="any" min="0" max="100" value={pctIva} onChange={e => setPctIva(parseFloat(e.target.value) || 0)} style={field.input} />
                </div>
                <div style={{ marginTop: '1.2rem' }}>{toggle('¿Lo pagás?', pagaIva, setPagaIva)}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <label style={field.label}>IVA Adicional %</label>
                  <input type="number" step="any" min="0" max="100" value={pctIvaAdic} onChange={e => setPctIvaAdic(parseFloat(e.target.value) || 0)} style={field.input} />
                </div>
                <div style={{ marginTop: '1.2rem' }}>{toggle('¿Lo pagás?', pagaIvaAdic, setPagaIvaAdic)}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <label style={field.label}>Perc. Ganancias %</label>
                  <input type="number" step="any" min="0" max="100" value={pctGanancias} onChange={e => setPctGanancias(parseFloat(e.target.value) || 0)} style={field.input} />
                </div>
                <div style={{ marginTop: '1.2rem' }}>{toggle('¿Lo pagás?', pagaGanancias, setPagaGanancias)}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                <div>
                  <label style={field.label}>Perc. IIBB %</label>
                  <input type="number" step="any" min="0" max="100" value={pctIIBB} onChange={e => setPctIIBB(parseFloat(e.target.value) || 0)} style={field.input} />
                </div>
                <div style={{ marginTop: '1.2rem' }}>{toggle('¿Lo pagás?', pagaIIBB, setPagaIIBB)}</div>
              </div>
            </div>
          </>)}

          {/* Gastos locales */}
          {card(<>
            <p style={sectionTitle}>Gastos Locales — Cobrado al Cliente</p>
            {inputGroup('Despachante (USD)', gDespachante, setGDespachante)}
            {inputGroup('Terminal (USD)', gTerminal, setGTerminal)}
            {inputGroup('Naviera (USD)', gNaviera, setGNaviera)}
            {inputGroup('Logística interna (USD)', gLogistica, setGLogistica)}
          </>)}

          {/* Costos referencia */}
          {card(<>
            <p style={sectionTitle}>Costos Referencia (prorrateo)</p>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
              Se usan para calcular el costo real prorrateado por M³. Ratio actual: {calc.ratio.toFixed(3)} ({parseFloat(m3Merch) || 0} m³ / {calc.m3Cont} m³)
            </div>
            {inputGroup('Flete Marítimo ref.', refFlete, setRefFlete)}
            {inputGroup('Despachante ref.', refDespachante, setRefDespachante)}
            {inputGroup('Terminal ref.', refTerminal, setRefTerminal)}
            {inputGroup('Naviera ref.', refNaviera, setRefNaviera)}
            {inputGroup('Logística ref.', refLogistica, setRefLogistica)}
          </>)}

          {/* Honorarios */}
          {card(<>
            <p style={sectionTitle}>Honorarios y Facturación</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={field.label}>Honorarios %</label>
                <input type="number" step="any" min="0" max="100" value={pctHonorarios} onChange={e => setPctHonorarios(parseFloat(e.target.value) || 0)} style={field.input} />
              </div>
              <div>
                <label style={field.label}>Gastos Facturación %</label>
                <input type="number" step="any" min="0" max="100" value={pctFacturacion} onChange={e => setPctFacturacion(parseFloat(e.target.value) || 0)} style={field.input} />
              </div>
            </div>
          </>)}

        </div>

        {/* ====== COLUMN 2: COTIZACIÓN AL CLIENTE ====== */}
        <div>
          {card(<>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ ...sectionTitle, marginBottom: 0 }}>Cotización al Cliente</p>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Lo que le cobrás al cliente</p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, paddingBottom: '0.5rem', borderBottom: '2px solid #f1f5f9' }}>Concepto</th>
                  <th style={{ textAlign: 'right', fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, paddingBottom: '0.5rem', borderBottom: '2px solid #f1f5f9' }}>USD Cliente</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={2} style={{ padding: '0.5rem 0 0.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>FOB</td></tr>
                {row('FOB Mercadería', parseFloat(fobCliente) || 0)}
                {row('Seguro (1% FOB)', calc.seguroC)}

                <tr><td colSpan={2} style={{ padding: '0.5rem 0 0.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Flete</td></tr>
                {row('Flete Marítimo', parseFloat(fleteCliente) || 0)}
                {totalRow('Valor CIF Total', calc.cifC)}

                <tr><td colSpan={2} style={{ padding: '0.5rem 0 0.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aranceles e Impuestos</td></tr>
                {row(`Derechos de Importación (${pctDerechos}%)`, calc.derechosC)}
                {row(`Tasa Estadística (${pctTasa}%)`, calc.tasaC)}
                {row('Base Imponible IVA', calc.baseIvaC)}
                {row(`IVA (${pctIva}%)`, calc.ivaC)}
                {row(`IVA Adicional (${pctIvaAdic}%)`, calc.ivaAdicC)}
                {row(`Percepción Ganancias (${pctGanancias}%)`, calc.gananciasC)}
                {row(`Percepción IIBB (${pctIIBB}%)`, calc.iibbC)}
                {totalRow('Total Aranceles + Flete', calc.totalArancFlete)}

                <tr><td colSpan={2} style={{ padding: '0.5rem 0 0.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gastos Locales</td></tr>
                {row('Despachante', calc.despaC)}
                {row('Terminal', calc.termC)}
                {row('Naviera', calc.navC)}
                {row('Logística Interna', calc.logC)}
                {totalRow('Total Gastos Locales', calc.totalGastosC)}
              </tbody>
            </table>

            <div style={{ borderTop: '2px solid #2563eb', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>Costo Total CON IVA</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#2563eb' }}>{usd(calc.costoConIva)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#64748b' }}>Costo Total SIN IVA</span>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#64748b' }}>{usd(calc.costoSinIva)}</span>
              </div>
            </div>
          </>)}
        </div>

        {/* ====== COLUMN 3: COSTOS REALES + DIFERENCIAS ====== */}
        <div>
          {card(<>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ ...sectionTitle, marginBottom: 0 }}>Costos Reales vs Cobrado</p>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Mi costo real · Lo que cobro · Diferencia (margen)</p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, paddingBottom: '0.5rem', borderBottom: '2px solid #f1f5f9' }}>Concepto</th>
                  <th style={{ textAlign: 'right', fontSize: '0.72rem', color: '#64748b', fontWeight: 600, paddingBottom: '0.5rem', borderBottom: '2px solid #f1f5f9' }}>Costo real</th>
                  <th style={{ textAlign: 'right', fontSize: '0.72rem', color: '#2563eb', fontWeight: 600, paddingBottom: '0.5rem', borderBottom: '2px solid #f1f5f9' }}>Cobro</th>
                  <th style={{ textAlign: 'right', fontSize: '0.72rem', color: '#10b981', fontWeight: 600, paddingBottom: '0.5rem', borderBottom: '2px solid #f1f5f9' }}>Margen</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={4} style={{ padding: '0.5rem 0 0.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>FOB</td></tr>
                <tr>
                  <td style={{ padding: '0.45rem 0', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>FOB Mercadería</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{usd(parseFloat(fobReal) || 0)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#2563eb', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>{usd(parseFloat(fobCliente) || 0)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600, color: calc.margenFOB >= 0 ? '#10b981' : '#ef4444', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.margenFOB)}</td>
                </tr>

                <tr><td colSpan={4} style={{ padding: '0.5rem 0 0.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Flete Marítimo</td></tr>
                <tr>
                  <td style={{ padding: '0.45rem 0', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>Flete Prorrateado</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.fleteR)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#2563eb', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>{usd(parseFloat(fleteCliente) || 0)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600, color: calc.margenFlete >= 0 ? '#10b981' : '#ef4444', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.margenFlete)}</td>
                </tr>

                <tr><td colSpan={4} style={{ padding: '0.5rem 0 0.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aranceles</td></tr>
                <tr>
                  <td style={{ padding: '0.45rem 0', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>Derechos de Importación</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.derechosR)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#2563eb', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>{usd(calc.derechosC)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600, color: (calc.derechosC - calc.derechosR) >= 0 ? '#10b981' : '#ef4444', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.derechosC - calc.derechosR)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem 0', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>Tasa Estadística</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.tasaR)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#2563eb', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>{usd(calc.tasaC)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600, color: (calc.tasaC - calc.tasaR) >= 0 ? '#10b981' : '#ef4444', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.tasaC - calc.tasaR)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem 0', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>IVA {pagaIva ? '' : <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>(no pagás)</span>}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.ivaR)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#2563eb', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>{usd(calc.ivaC)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600, color: (calc.ivaC - calc.ivaR) >= 0 ? '#10b981' : '#ef4444', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.ivaC - calc.ivaR)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem 0', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>IVA Adicional {pagaIvaAdic ? '' : <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>(no pagás)</span>}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.ivaAdicR)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#2563eb', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>{usd(calc.ivaAdicC)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600, color: (calc.ivaAdicC - calc.ivaAdicR) >= 0 ? '#10b981' : '#ef4444', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.ivaAdicC - calc.ivaAdicR)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem 0', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>Perc. Ganancias {pagaGanancias ? '' : <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>(no pagás)</span>}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.gananciasR)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#2563eb', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>{usd(calc.gananciasC)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600, color: (calc.gananciasC - calc.gananciasR) >= 0 ? '#10b981' : '#ef4444', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.gananciasC - calc.gananciasR)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem 0', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>Perc. IIBB {pagaIIBB ? '' : <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>(no pagás)</span>}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.iibbR)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#2563eb', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>{usd(calc.iibbC)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600, color: (calc.iibbC - calc.iibbR) >= 0 ? '#10b981' : '#ef4444', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.iibbC - calc.iibbR)}</td>
                </tr>

                <tr><td colSpan={4} style={{ padding: '0.5rem 0 0.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gastos Locales</td></tr>
                <tr>
                  <td style={{ padding: '0.45rem 0', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>Despachante</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.despaR)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#2563eb', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>{usd(calc.despaC)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600, color: (calc.despaC - calc.despaR) >= 0 ? '#10b981' : '#ef4444', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.despaC - calc.despaR)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem 0', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>Terminal</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.termR)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#2563eb', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>{usd(calc.termC)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600, color: (calc.termC - calc.termR) >= 0 ? '#10b981' : '#ef4444', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.termC - calc.termR)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem 0', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>Naviera</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.navR)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#2563eb', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>{usd(calc.navC)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600, color: (calc.navC - calc.navR) >= 0 ? '#10b981' : '#ef4444', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.navC - calc.navR)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem 0', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>Logística Interna</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.logR)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', color: '#2563eb', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>{usd(calc.logC)}</td>
                  <td style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600, color: (calc.logC - calc.logR) >= 0 ? '#10b981' : '#ef4444', borderBottom: '1px solid #f1f5f9' }}>{usd(calc.logC - calc.logR)}</td>
                </tr>
                <tr style={{ background: '#f0f7ff' }}>
                  <td style={{ padding: '0.6rem 0', fontWeight: 700, fontSize: '0.85rem' }}>TOTAL Gastos Locales</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: '0.85rem' }}>{usd(calc.totalGastosR)}</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#2563eb', fontSize: '0.85rem' }}>{usd(calc.totalGastosC)}</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 700, fontSize: '0.85rem', color: calc.margenGastos >= 0 ? '#10b981' : '#ef4444' }}>{usd(calc.margenGastos)}</td>
                </tr>
              </tbody>
            </table>
          </>)}
        </div>

      </div>

      {/* ====== BOTTOM: ESCENARIOS + RENTABILIDAD ====== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '0.25rem' }}>

        {/* Escenarios de cierre */}
        {card(<>
          <p style={sectionTitle}>Escenarios de Cierre</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

            {/* CON FACTURA */}
            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#065f46' }}>CON FACTURA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#374151' }}>Costo Total CON IVA</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{usd(calc.costoConIva)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#374151' }}>+ Honorarios ({pctHonorarios}%)</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{usd(calc.honorarios)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#374151' }}>+ Gastos Facturación ({pctFacturacion}%)</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{usd(calc.gastFac)}</span>
              </div>
              <div style={{ borderTop: '1px solid #a7f3d0', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: '#065f46' }}>Precio Final</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#10b981' }}>{usd(calc.precioConFac)}</span>
              </div>
            </div>

            {/* SIN FACTURA */}
            <div style={{ background: '#fefce8', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#78350f' }}>SIN FACTURA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#374151' }}>Costo Total CON IVA</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{usd(calc.costoConIva)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#374151' }}>+ Honorarios ({pctHonorarios}%)</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{usd(calc.honorarios)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>+ Gastos Facturación</span>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>—</span>
              </div>
              <div style={{ borderTop: '1px solid #fde68a', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: '#78350f' }}>Precio Final</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#d97706' }}>{usd(calc.precioSinFac)}</span>
              </div>
              <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: '#92400e', textAlign: 'right' }}>
                Ahorro cliente vs con factura: {usd(calc.gastFac)}
              </div>
            </div>

          </div>
        </>)}

        {/* Rentabilidad Total */}
        {card(<>
          <p style={sectionTitle}>Análisis de Rentabilidad</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, paddingBottom: '0.5rem', borderBottom: '2px solid #f1f5f9' }}>Fuente de ganancia</th>
                <th style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, paddingBottom: '0.5rem', borderBottom: '2px solid #f1f5f9' }}>USD</th>
                <th style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, paddingBottom: '0.5rem', borderBottom: '2px solid #f1f5f9' }}>% s/ FOB real</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Margen FOB', calc.margenFOB],
                ['Margen Flete Marítimo', calc.margenFlete],
                ['Margen Aranceles', calc.margenAranceles],
                ['Margen Gastos Locales', calc.margenGastos],
                ['Honorarios', calc.honorarios],
              ].map(([label, val]) => {
                const fobR = parseFloat(fobReal) || 0;
                const pctSFob = fobR > 0 ? ((val / fobR) * 100).toFixed(2) + '%' : '—';
                return (
                  <tr key={label}>
                    <td style={{ padding: '0.5rem 0', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>{label}</td>
                    <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #f1f5f9', color: val >= 0 ? '#10b981' : '#ef4444' }}>{usd(val)}</td>
                    <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.85rem', textAlign: 'right', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{pctSFob}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ borderTop: '2px solid #1e293b', marginTop: '0.5rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>GANANCIA TOTAL</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: '1.3rem', color: calc.gananciaTotal >= 0 ? '#10b981' : '#ef4444' }}>
                {usd(calc.gananciaTotal)}
              </div>
              {parseFloat(fobReal) > 0 && (
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {((calc.gananciaTotal / parseFloat(fobReal)) * 100).toFixed(2)}% s/ FOB real
                </div>
              )}
            </div>
          </div>
        </>)}

      </div>
    </div>
  );
}
