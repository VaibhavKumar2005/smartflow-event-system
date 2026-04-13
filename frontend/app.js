/**
 * frontend/app.js — SmartFlow Dashboard (Hackathon Demo)
 * ─────────────────────────────────────────────────────────
 * Core logic UNCHANGED. UI optimized for demo clarity:
 * - Zone names on heatmap cells
 * - Confidence badge from AI
 * - Cleaner alert messages with location names
 */

const CONFIG = { API_BASE: 'http://localhost:3000/api' };

const state = {
  zones:       [],
  zoneLabels:  [],
  destinations:[],
  userPos:     12,
  gridSize:    5,
  activePath:  [],
  isLoading:   false,
  lastRoute:   null,
  alertHistory:[],
};

// DOM refs
const mapEl    = document.getElementById('map');
const destSel  = document.getElementById('destination');
const aiOut    = document.getElementById('ai-output');
const aiLoad   = document.getElementById('ai-loading');
const aiIdle   = document.getElementById('ai-placeholder');
const sugBtn   = document.getElementById('suggest-btn');
const refBtn   = document.getElementById('refresh-btn');
const alertsEl = document.getElementById('alerts-list');
const alertBdg = document.getElementById('alert-badge');
const confBdg  = document.getElementById('conf-badge');
const pathBar  = document.getElementById('path-bar');
const pathTxt  = document.getElementById('path-bar-text');

const kpiDensity    = document.getElementById('kpi-density');
const kpiDensitySub = document.getElementById('kpi-density-sub');
const kpiWait       = document.getElementById('kpi-wait');
const kpiSafe       = document.getElementById('kpi-safe');
const kpiSafeSub    = document.getElementById('kpi-safe-sub');
const kpiEfficiency = document.getElementById('kpi-efficiency');
const kpiDensityBar = document.getElementById('kpi-density-bar');
const kpiWaitBar    = document.getElementById('kpi-wait-bar');
const kpiSafeBar    = document.getElementById('kpi-safe-bar');
const kpiEffBar     = document.getElementById('kpi-efficiency-bar');

let crowdChart = null;

// ── Init ─────────────────────────────────────────────────
async function init() {
  startClock();
  await loadStadiumState();
  initChart();
  lucide.createIcons();
}

function startClock() {
  const el = document.getElementById('live-time');
  if (!el) return;
  const t = () => el.textContent = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
  t(); setInterval(t, 1000);
}

// ── Load State ─────────────────────────────────────────
async function loadStadiumState() {
  loading(true);
  try {
    const res = await fetch(`${CONFIG.API_BASE}/stadium-state`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    state.zones       = d.zones;
    state.zoneLabels  = d.zoneLabels || [];
    state.destinations= d.destinations;
    state.userPos     = d.userPos;
    state.gridSize    = d.gridSize;
    state.activePath  = [];
    state.lastRoute   = null;

    fillDest();
    renderMap();
    updateKPIs();
    genAlerts();
    hidePath();
    lucide.createIcons();
  } catch (e) {
    console.error('[SmartFlow]', e);
    showError('Cannot connect to SmartFlow backend. Make sure the server is running on port 3000.');
  } finally { loading(false); }
}

function fillDest() {
  destSel.innerHTML = '';
  state.destinations.forEach(d => {
    const o = document.createElement('option');
    o.value = d.key;
    o.textContent = d.label;
    destSel.appendChild(o);
  });
}

// ── KPIs ─────────────────────────────────────────────────
function updateKPIs() {
  const z = state.zones, n = z.length;
  const lo = z.filter(v => v === 'low').length;
  const md = z.filter(v => v === 'medium').length;
  const hi = z.filter(v => v === 'high').length;

  const ds = Math.round(((md * 0.5 + hi) / n) * 100);
  const dl = ds > 60 ? 'High' : ds > 30 ? 'Medium' : 'Low';
  kpiDensity.textContent = dl;
  kpiDensitySub.textContent = ds > 50 ? 'Above normal' : 'Normal range';
  kpiDensity.style.color = ds > 60 ? 'var(--red)' : ds > 30 ? 'var(--amber)' : 'var(--green)';
  barW(kpiDensityBar, ds);

  const wt = Math.round(2 + (ds / 100) * 8);
  kpiWait.textContent = `${wt} min`;
  barW(kpiWaitBar, (wt / 10) * 100);

  kpiSafe.textContent = lo;
  kpiSafeSub.textContent = `of ${n}`;
  kpiSafe.style.color = lo >= 12 ? 'var(--green)' : lo >= 6 ? 'var(--amber)' : 'var(--red)';
  barW(kpiSafeBar, (lo / n) * 100);

  if (state.lastRoute) {
    const pl = state.lastRoute.path?.length ?? 0;
    const dd = manhattan(state.userPos, state.lastRoute.destination?.gridIndex ?? 0);
    const ef = dd > 0 ? Math.round(Math.min(100, (dd / pl) * 100)) : 100;
    kpiEfficiency.textContent = `+${Math.max(0, ef - 60)}%`;
    kpiEfficiency.style.color = ef >= 80 ? 'var(--green)' : ef >= 50 ? 'var(--amber)' : 'var(--red)';
    barW(kpiEffBar, ef);
  } else {
    kpiEfficiency.textContent = '—';
    kpiEfficiency.style.color = 'var(--muted)';
    barW(kpiEffBar, 0);
  }
}

function barW(el, p) { if (el) requestAnimationFrame(() => el.style.width = `${Math.min(100, Math.max(0, p))}%`); }
function manhattan(a, b) {
  const s = state.gridSize;
  return Math.abs(a % s - b % s) + Math.abs(Math.floor(a / s) - Math.floor(b / s)) + 1;
}

// ── Alerts ─────────────────────────────────────────────
function genAlerts() {
  const a = [];
  state.zones.forEach((z, i) => {
    if (z === 'high') {
      const name = state.zoneLabels[i] || `Zone ${i}`;
      a.push({ sev: 'high', icon: 'alert-triangle', text: `High congestion: ${name}`, time: `${Math.floor(Math.random()*5)+1}m ago` });
    }
  });
  const mc = state.zones.filter(z => z === 'medium').length;
  if (mc > 4) a.push({ sev: 'medium', icon: 'alert-circle', text: `Moderate load in ${mc} zones`, time: 'Just now' });
  a.push({ sev: 'info', icon: 'cpu', text: 'AI routing engine active', time: 'System' });
  state.alertHistory = a;
  renderAlerts();
}

function renderAlerts() {
  alertsEl.innerHTML = '';
  const a = state.alertHistory;
  if (!a.length) {
    alertsEl.innerHTML = '<div class="alert-row alert-info"><i data-lucide="check-circle" style="width:12px;height:12px;color:var(--green)"></i><span>All clear</span></div>';
    alertBdg.classList.add('hidden');
    lucide.createIcons(); return;
  }
  const hc = a.filter(x => x.sev === 'high').length;
  if (hc) { alertBdg.textContent = hc; alertBdg.classList.remove('hidden'); }
  else alertBdg.classList.add('hidden');

  const cmap = { high: 'var(--red)', medium: 'var(--amber)', info: 'var(--blue)' };
  a.forEach((al, i) => {
    const el = document.createElement('div');
    el.className = `alert-row alert-${al.sev}`;
    el.style.animationDelay = `${i * .04}s`;
    el.innerHTML = `<i data-lucide="${al.icon}" style="width:12px;height:12px;color:${cmap[al.sev]};flex-shrink:0"></i><span class="alert-text">${esc(al.text)}</span><span class="alert-time">${esc(al.time)}</span>`;
    alertsEl.appendChild(el);
  });
  lucide.createIcons();
}

// ── Chart ─────────────────────────────────────────────
function initChart() {
  const ctx = document.getElementById('crowd-chart');
  if (!ctx) return;
  if (crowdChart) { crowdChart.destroy(); crowdChart = null; }

  const labels = ['T-8','T-7','T-6','T-5','T-4','T-3','T-2','Now'];
  const bH = state.zones.filter(z => z === 'high').length;
  const bM = state.zones.filter(z => z === 'medium').length;
  const bL = state.zones.filter(z => z === 'low').length;
  const jit = (b, r) => labels.map(() => Math.max(0, b + Math.round((Math.random()-.5)*r*2)));
  const dH = jit(bH,2); dH[7]=bH;
  const dM = jit(bM,2); dM[7]=bM;
  const dL = jit(bL,2); dL[7]=bL;

  crowdChart = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[
      { label:'High', data:dH, borderColor:'hsl(0,72%,55%)', backgroundColor:'hsla(0,72%,55%,.06)', fill:true, tension:.4, pointRadius:0, pointHoverRadius:3, borderWidth:1.5 },
      { label:'Medium', data:dM, borderColor:'hsl(38,92%,50%)', backgroundColor:'hsla(38,92%,50%,.05)', fill:true, tension:.4, pointRadius:0, pointHoverRadius:3, borderWidth:1.5 },
      { label:'Low', data:dL, borderColor:'hsl(142,71%,42%)', backgroundColor:'hsla(142,71%,42%,.05)', fill:true, tension:.4, pointRadius:0, pointHoverRadius:3, borderWidth:1.5 },
    ]},
    options:{
      responsive:true, maintainAspectRatio:false,
      interaction:{intersect:false,mode:'index'},
      plugins:{
        legend:{position:'top',align:'end',labels:{color:'hsl(215,15%,40%)',font:{size:9,family:'Inter'},boxWidth:7,boxHeight:7,borderRadius:2,useBorderRadius:true,padding:8}},
        tooltip:{backgroundColor:'hsl(222,70%,5.5%)',borderColor:'hsl(217,25%,14%)',borderWidth:1,titleFont:{family:'Inter',size:9},bodyFont:{family:'Inter',size:9},padding:6,cornerRadius:6,displayColors:true,boxPadding:2},
      },
      scales:{
        x:{ticks:{color:'hsl(215,15%,35%)',font:{size:8,family:'Inter'}},grid:{color:'rgba(255,255,255,.02)'},border:{display:false}},
        y:{beginAtZero:true,ticks:{color:'hsl(215,15%,35%)',font:{size:8,family:'Inter'},stepSize:2},grid:{color:'rgba(255,255,255,.02)'},border:{display:false}},
      },
    },
  });
}

// ── Heatmap ─────────────────────────────────────────────
function renderMap() {
  mapEl.innerHTML = '';
  state.zones.forEach((density, i) => {
    const cell = document.createElement('div');
    cell.classList.add('zone', density);
    cell.dataset.index = i;
    const name = state.zoneLabels[i] || `Zone ${i}`;
    cell.title = `${name} — ${density} density`;

    // Zone index (tiny corner)
    const idx = document.createElement('span');
    idx.className = 'zone-idx';
    idx.textContent = i;
    cell.appendChild(idx);

    // Zone name (centered label)
    const lbl = document.createElement('span');
    lbl.className = 'zone-name';
    lbl.textContent = name;
    cell.appendChild(lbl);

    // User marker
    if (i === state.userPos) {
      cell.classList.add('user');
      const ub = document.createElement('span');
      ub.className = 'user-badge';
      ub.textContent = 'YOU';
      cell.appendChild(ub);
    }

    // Path
    if (state.activePath.includes(i) && i !== state.userPos) {
      cell.classList.add('on-path');
      if (state.lastRoute && i === state.lastRoute.destination?.gridIndex) {
        cell.classList.add('dest');
        const dp = document.createElement('div');
        dp.className = 'dest-pin';
        dp.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
        cell.appendChild(dp);
      } else {
        const pn = document.createElement('div');
        pn.className = 'path-num';
        pn.textContent = state.activePath.indexOf(i);
        cell.appendChild(pn);
      }
    }

    cell.style.animation = `fadeIn .3s ease forwards ${i * .015}s`;
    cell.style.opacity = '0';
    mapEl.appendChild(cell);
  });
}

// ── Path bar ─────────────────────────────────────────────
function showPath(d) {
  if (!pathBar) return;
  pathBar.classList.remove('hidden');
  if (pathTxt) pathTxt.textContent = `Route to ${d.destination?.label ?? '—'} · ${d.path?.length ?? 0} zones · ${d.timeSaved ?? '—'}`;
}
function hidePath() { pathBar?.classList.add('hidden'); }
function clearRoute() {
  state.activePath = []; state.lastRoute = null;
  hidePath(); renderMap(); updateKPIs(); showIdle();
  confBdg.classList.add('hidden');
}

// ── Route ─────────────────────────────────────────────
async function suggestRoute() {
  const dk = destSel.value;
  if (!dk || state.isLoading) return;
  loading(true);
  state.activePath = [];
  renderMap(); hidePath();

  try {
    const res = await fetch(`${CONFIG.API_BASE}/suggest-route`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ userLocation: state.userPos, destKey: dk }),
    });
    const d = await res.json();
    if (!res.ok) { showError(d.message ?? `Error ${res.status}`); return; }

    state.activePath = d.path ?? [];
    state.lastRoute = d;
    renderMap();
    updateKPIs();
    showResult(d);
    showPath(d);

    state.alertHistory.unshift({
      sev:'info', icon:'route',
      text:`Route to ${d.destination?.label ?? '?'} — ${d.path?.length ?? 0} zones`,
      time:'Just now',
    });
    renderAlerts();
    lucide.createIcons();
  } catch (e) {
    console.error('[SmartFlow]', e);
    showError('Failed to reach backend. Is it running on port 3000?');
  } finally { loading(false); }
}

// ── AI Display ─────────────────────────────────────────
function showResult(d) {
  aiIdle.classList.add('hidden');
  aiOut.classList.remove('hidden');

  const risk = d.riskLevel ?? 'low';
  const riskCls = { low:'badge-green', medium:'badge-amber', high:'badge-red' }[risk] ?? 'badge-blue';

  const conf = d.confidence ?? 'high';
  const confCls = { high:'badge-green', medium:'badge-amber', low:'badge-red' }[conf] ?? 'badge-blue';
  confBdg.className = `badge ${confCls}`;
  confBdg.textContent = `${conf} CONF`;
  confBdg.classList.remove('hidden');

  aiOut.innerHTML = `
    <div class="ai-result">
      <div class="ai-result-head">
        <span class="ai-route-name">✦ ${esc(d.destination?.label ?? 'Route')}</span>
        <span class="badge ${riskCls}">${risk.toUpperCase()} RISK</span>
      </div>
      <p class="ai-rec">${esc(d.recommendation ?? '')}</p>
      <div class="ai-row"><i data-lucide="route" style="width:11px;height:11px;color:var(--purple);flex-shrink:0"></i><span>Route: <strong>${esc(d.destination?.label ?? '—')}</strong></span></div>
      <div class="ai-row"><i data-lucide="clock" style="width:11px;height:11px;color:var(--cyan);flex-shrink:0"></i><span>Time saved: <strong>${esc(d.timeSaved ?? '—')}</strong></span></div>
      <div class="ai-row"><i data-lucide="map-pin" style="width:11px;height:11px;color:var(--blue);flex-shrink:0"></i><span>Path: <strong>${d.path?.length ?? 0} zones</strong></span></div>
      ${d.routeReason ? `<div class="ai-row"><i data-lucide="info" style="width:11px;height:11px;color:var(--muted);flex-shrink:0"></i><span>${esc(d.routeReason)}</span></div>` : ''}
      ${d.avoidZoneLabels?.length ? `
        <div class="ai-sep"></div>
        <p class="ai-avoid-h">⚠ Avoid Zones</p>
        <div class="ai-avoid-tags">${d.avoidZoneLabels.map(z => `<span class="ai-avoid-tag">${esc(z)}</span>`).join('')}</div>
      ` : ''}
    </div>
  `;

  aiOut.animate(
    [{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],
    {duration:350,fill:'forwards',easing:'ease-out'}
  );
  lucide.createIcons();
}

function showIdle()  { aiIdle.classList.remove('hidden'); aiOut.classList.add('hidden'); aiOut.innerHTML=''; confBdg.classList.add('hidden'); }
function showError(m){ aiIdle.classList.add('hidden'); aiOut.classList.remove('hidden'); aiOut.innerHTML=`<div class="error-msg">⚠ ${esc(m)}</div>`; }

function loading(on) {
  state.isLoading = on;
  if (on) { aiLoad.classList.remove('hidden'); aiLoad.style.display='flex'; aiIdle.classList.add('hidden'); aiOut.classList.add('hidden'); sugBtn.disabled=true; if (refBtn) refBtn.disabled=true; }
  else    { aiLoad.classList.add('hidden'); aiLoad.style.display=''; sugBtn.disabled=false; if (refBtn) refBtn.disabled=false; }
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

init();
