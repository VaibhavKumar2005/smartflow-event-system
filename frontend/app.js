/**
 * frontend/app.js — SmartFlow Dashboard
 * ───────────────────────────────────────
 * Core routing & state logic is UNCHANGED.
 * Only UI helpers updated to use new component class names.
 *
 * Architecture:
 *   GET  /api/stadium-state  → zones, destinations, userPos
 *   POST /api/suggest-route  → path, recommendation, riskLevel, timeSaved
 */

// ── Config ────────────────────────────────────────────────────
const CONFIG = {
  API_BASE: 'http://localhost:3000/api',
};

// ── App State ─────────────────────────────────────────────────
const state = {
  zones:        [],   // 'low' | 'medium' | 'high', 25 entries
  destinations: [],   // { key, label, gridIndex }[]
  userPos:      12,
  gridSize:     5,
  activePath:   [],
  isLoading:    false,
  lastRoute:    null,
  alertHistory: [],
};

// ── DOM Refs ──────────────────────────────────────────────────
const mapEl             = document.getElementById('map');
const destinationSelect = document.getElementById('destination');
const aiOutput          = document.getElementById('ai-output');
const aiLoading         = document.getElementById('ai-loading');
const aiPlaceholder     = document.getElementById('ai-placeholder');
const suggestBtn        = document.getElementById('suggest-btn');
const refreshBtn        = document.getElementById('refresh-btn');
const alertsList        = document.getElementById('alerts-list');
const alertCountBadge   = document.getElementById('alert-count-badge');
const confidenceBadge   = document.getElementById('confidence-badge');
const pathStatus        = document.getElementById('path-status');
const pathStatusText    = document.getElementById('path-status-text');

// KPI value spans
const kpiDensity     = document.getElementById('kpi-density');
const kpiDensitySub  = document.getElementById('kpi-density-sub');
const kpiWait        = document.getElementById('kpi-wait');
const kpiSafe        = document.getElementById('kpi-safe');
const kpiSafeSub     = document.getElementById('kpi-safe-sub');
const kpiEfficiency  = document.getElementById('kpi-efficiency');

// KPI bars
const kpiDensityBar    = document.getElementById('kpi-density-bar');
const kpiWaitBar       = document.getElementById('kpi-wait-bar');
const kpiSafeBar       = document.getElementById('kpi-safe-bar');
const kpiEfficiencyBar = document.getElementById('kpi-efficiency-bar');

// Header chips
const chipDensity = document.getElementById('chip-density');
const chipWait    = document.getElementById('chip-wait');
const chipSafe    = document.getElementById('chip-safe');

// Metric panel
const metricHigh = document.getElementById('metric-high');
const metricMed  = document.getElementById('metric-med');
const metricLow  = document.getElementById('metric-low');

let crowdChart = null;

// ── Boot ──────────────────────────────────────────────────────
async function init() {
  startClock();
  await loadStadiumState();
  initCrowdChart();
  lucide.createIcons();
}

// ── Live Clock ────────────────────────────────────────────────
function startClock() {
  const el = document.getElementById('live-time');
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  };
  tick();
  setInterval(tick, 1000);
}

// ── Load Stadium State ────────────────────────────────────────
async function loadStadiumState() {
  setLoadingState(true);

  try {
    const res = await fetch(`${CONFIG.API_BASE}/stadium-state`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    state.zones        = data.zones;
    state.destinations = data.destinations;
    state.userPos      = data.userPos;
    state.gridSize     = data.gridSize;
    state.activePath   = [];
    state.lastRoute    = null;

    populateDestinations();
    renderMap();
    updateKPIs();
    updateZoneMetrics();
    generateAlerts();
    hidePath();
    lucide.createIcons();

  } catch (err) {
    console.error('[SmartFlow] init failed:', err);
    showError(
      'Cannot connect to SmartFlow backend. ' +
      'Make sure the server is running on port 3000.'
    );
  } finally {
    setLoadingState(false);
  }
}

// ── Destinations Select ───────────────────────────────────────
function populateDestinations() {
  destinationSelect.innerHTML = '';
  state.destinations.forEach(dest => {
    const opt   = document.createElement('option');
    opt.value   = dest.key;
    opt.textContent = dest.label;
    destinationSelect.appendChild(opt);
  });
}

// ── KPI Calculations ──────────────────────────────────────────
function updateKPIs() {
  const zones    = state.zones;
  const total    = zones.length;
  const lowCount  = zones.filter(z => z === 'low').length;
  const medCount  = zones.filter(z => z === 'medium').length;
  const highCount = zones.filter(z => z === 'high').length;

  // Crowd density
  const densityScore = Math.round(((medCount * 0.5 + highCount) / total) * 100);
  const densityLabel = densityScore > 60 ? 'High' : densityScore > 30 ? 'Medium' : 'Low';

  kpiDensity.textContent    = densityLabel;
  kpiDensitySub.textContent = densityScore > 50 ? 'Above normal' : 'Normal range';
  kpiDensity.style.color    = densityScore > 60 ? 'var(--destructive)' : densityScore > 30 ? 'var(--warning)' : 'var(--success)';
  setBarWidth(kpiDensityBar, densityScore);
  if (chipDensity) chipDensity.textContent = densityLabel;

  // Avg wait time
  const avgWait = Math.round(2 + (densityScore / 100) * 8);
  kpiWait.textContent = `${avgWait} min`;
  setBarWidth(kpiWaitBar, (avgWait / 10) * 100);
  if (chipWait) chipWait.textContent = `${avgWait} min`;

  // Safe zones
  kpiSafe.textContent    = lowCount;
  kpiSafeSub.textContent = `of ${total} zones`;
  kpiSafe.style.color    = lowCount >= 12 ? 'var(--success)' : lowCount >= 6 ? 'var(--warning)' : 'var(--destructive)';
  setBarWidth(kpiSafeBar, (lowCount / total) * 100);
  if (chipSafe) chipSafe.textContent = `${lowCount} / ${total}`;

  // Efficiency
  if (state.lastRoute) {
    const pathLen    = state.lastRoute.path?.length ?? 0;
    const directDist = estimateDirectDistance(state.userPos, state.lastRoute.destination?.gridIndex ?? 0);
    const eff        = directDist > 0 ? Math.round(Math.min(100, (directDist / pathLen) * 100)) : 100;
    kpiEfficiency.textContent = `+${Math.max(0, eff - 60)}%`;
    kpiEfficiency.style.color = eff >= 80 ? 'var(--success)' : eff >= 50 ? 'var(--warning)' : 'var(--destructive)';
    setBarWidth(kpiEfficiencyBar, eff);
  } else {
    kpiEfficiency.textContent = '—';
    kpiEfficiency.style.color = 'var(--muted-fg)';
    setBarWidth(kpiEfficiencyBar, 0);
  }
}

function setBarWidth(el, pct) {
  if (!el) return;
  requestAnimationFrame(() => { el.style.width = `${Math.min(100, Math.max(0, pct))}%`; });
}

function estimateDirectDistance(from, to) {
  const s  = state.gridSize;
  const fx = from % s, fy = Math.floor(from / s);
  const tx = to   % s, ty = Math.floor(to   / s);
  return Math.abs(fx - tx) + Math.abs(fy - ty) + 1;
}

// ── Zone Metrics ──────────────────────────────────────────────
function updateZoneMetrics() {
  const zones = state.zones;
  if (metricHigh) metricHigh.textContent = zones.filter(z => z === 'high').length;
  if (metricMed)  metricMed.textContent  = zones.filter(z => z === 'medium').length;
  if (metricLow)  metricLow.textContent  = zones.filter(z => z === 'low').length;
}

// ── Alerts ────────────────────────────────────────────────────
function generateAlerts() {
  const names  = ['Gate A', 'Food Court', 'Main Concourse', 'Section B', 'West Exit', 'VIP Lounge', 'East Gate', 'Parking Lot'];
  const alerts = [];

  state.zones.forEach((z, i) => {
    if (z === 'high') {
      alerts.push({
        severity: 'high',
        icon:     'alert-triangle',
        text:     `High congestion at ${names[i % names.length]} (Zone ${i})`,
        time:     `${Math.floor(Math.random() * 5) + 1}m ago`,
      });
    }
  });

  const medCount = state.zones.filter(z => z === 'medium').length;
  if (medCount > 4) {
    alerts.push({
      severity: 'medium',
      icon:     'alert-circle',
      text:     `Queue spike — ${medCount} zones at capacity`,
      time:     'Just now',
    });
  }

  alerts.push({ severity: 'info', icon: 'cpu', text: 'AI routing engine operational', time: 'System' });

  state.alertHistory = alerts;
  renderAlerts();
}

function renderAlerts() {
  const alerts = state.alertHistory;
  alertsList.innerHTML = '';

  if (alerts.length === 0) {
    alertsList.innerHTML = `
      <div class="alert-item alert-info">
        <i data-lucide="check-circle" style="width:13px;height:13px;color:var(--success);flex-shrink:0"></i>
        <span class="alert-text">All clear — no active alerts</span>
      </div>`;
    alertCountBadge.classList.add('hidden');
    lucide.createIcons();
    return;
  }

  const highCount = alerts.filter(a => a.severity === 'high').length;
  if (highCount > 0) {
    alertCountBadge.textContent = `${highCount} critical`;
    alertCountBadge.classList.remove('hidden');
  } else {
    alertCountBadge.classList.add('hidden');
  }

  alerts.forEach((alert, idx) => {
    const colorMap = { high: 'var(--destructive)', medium: 'var(--warning)', info: 'var(--blue)' };
    const el = document.createElement('div');
    el.className = `alert-item alert-${alert.severity}`;
    el.style.animationDelay = `${idx * 0.04}s`;
    el.innerHTML = `
      <i data-lucide="${alert.icon}" style="width:13px;height:13px;color:${colorMap[alert.severity]};flex-shrink:0"></i>
      <span class="alert-text">${escapeHtml(alert.text)}</span>
      <span class="alert-time">${escapeHtml(alert.time)}</span>
    `;
    alertsList.appendChild(el);
  });

  lucide.createIcons();
}

// ── Crowd Trend Chart ─────────────────────────────────────────
function initCrowdChart() {
  const ctx = document.getElementById('crowd-chart');
  if (!ctx) return;
  if (crowdChart) { crowdChart.destroy(); crowdChart = null; }

  const labels   = ['T-8', 'T-7', 'T-6', 'T-5', 'T-4', 'T-3', 'T-2', 'Now'];
  const baseHigh = state.zones.filter(z => z === 'high').length;
  const baseMed  = state.zones.filter(z => z === 'medium').length;
  const baseLow  = state.zones.filter(z => z === 'low').length;

  const jitter = (base, range) =>
    labels.map(() => Math.max(0, base + Math.round((Math.random() - 0.5) * range * 2)));

  const highData = jitter(baseHigh, 2); highData[7] = baseHigh;
  const medData  = jitter(baseMed,  2); medData[7]  = baseMed;
  const lowData  = jitter(baseLow,  2); lowData[7]  = baseLow;

  crowdChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'High',     data: highData, borderColor: 'hsl(0,72%,55%)',    backgroundColor: 'hsla(0,72%,55%,0.07)',    fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 4, borderWidth: 1.5 },
        { label: 'Moderate', data: medData,  borderColor: 'hsl(38,92%,50%)',   backgroundColor: 'hsla(38,92%,50%,0.06)',   fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 4, borderWidth: 1.5 },
        { label: 'Low',      data: lowData,  borderColor: 'hsl(142,71%,42%)',  backgroundColor: 'hsla(142,71%,42%,0.06)', fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 4, borderWidth: 1.5 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          position: 'top', align: 'end',
          labels: { color: 'hsl(215,15%,40%)', font: { size: 9, family: 'Inter' }, boxWidth: 8, boxHeight: 8, borderRadius: 2, useBorderRadius: true, padding: 10 },
        },
        tooltip: {
          backgroundColor: 'hsl(222,70%,5.5%)',
          borderColor: 'hsl(217,25%,14%)', borderWidth: 1,
          titleFont: { family: 'Inter', size: 10 }, bodyFont: { family: 'Inter', size: 10 },
          padding: 8, cornerRadius: 8, displayColors: true, boxPadding: 3,
        },
      },
      scales: {
        x: { ticks: { color: 'hsl(215,15%,35%)', font: { size: 9, family: 'Inter' } }, grid: { color: 'rgba(255,255,255,0.025)' }, border: { display: false } },
        y: { beginAtZero: true, ticks: { color: 'hsl(215,15%,35%)', font: { size: 9, family: 'Inter' }, stepSize: 2 }, grid: { color: 'rgba(255,255,255,0.025)' }, border: { display: false } },
      },
    },
  });
}

// ── Heatmap Rendering ─────────────────────────────────────────
function renderMap() {
  mapEl.innerHTML = '';

  state.zones.forEach((density, i) => {
    const cell      = document.createElement('div');
    cell.classList.add('zone', density);
    cell.dataset.index = String(i);
    cell.title         = `Zone ${i} — ${density} density`;

    const label     = document.createElement('span');
    label.className = 'zone-label';
    label.textContent = i;
    cell.appendChild(label);

    if (i === state.userPos) {
      cell.classList.add('user');
      const icon     = document.createElement('div');
      icon.className = 'user-icon';
      icon.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      cell.appendChild(icon);
    }

    if (state.activePath.includes(i) && i !== state.userPos) {
      cell.classList.add('on-path');

      if (state.lastRoute && i === state.lastRoute.destination?.gridIndex) {
        cell.classList.add('destination');
        const destIcon     = document.createElement('div');
        destIcon.className = 'dest-icon';
        destIcon.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
        cell.appendChild(destIcon);
      } else {
        const stepIdx   = state.activePath.indexOf(i);
        const stepEl    = document.createElement('div');
        stepEl.className = 'path-step-num';
        stepEl.textContent = stepIdx;
        cell.appendChild(stepEl);
      }
    }

    cell.style.animation = `fadeIn 0.3s ease forwards ${i * 0.018}s`;
    cell.style.opacity   = '0';
    mapEl.appendChild(cell);
  });
}

// ── Path Status Bar ───────────────────────────────────────────
function showPathBar(data) {
  if (!pathStatus) return;
  pathStatus.classList.remove('hidden');
  if (pathStatusText) {
    const dest  = data.destination?.label ?? 'Destination';
    const zones = data.path?.length ?? 0;
    pathStatusText.textContent = `Route to ${dest} · ${zones} zones · ${data.timeSaved ?? '—'}`;
  }
}

function hidePath() {
  pathStatus?.classList.add('hidden');
}

// ── Clear Route ───────────────────────────────────────────────
function clearRoute() {
  state.activePath = [];
  state.lastRoute  = null;
  hidePath();
  renderMap();
  updateKPIs();
  showPlaceholder();
  confidenceBadge.classList.add('hidden');
}

// ── Route Suggestion ──────────────────────────────────────────
async function suggestRoute() {
  const destKey = destinationSelect.value;
  if (!destKey || state.isLoading) return;

  setLoadingState(true);
  state.activePath = [];
  renderMap();
  hidePath();

  try {
    const res = await fetch(`${CONFIG.API_BASE}/suggest-route`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userLocation: state.userPos, destKey }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.message ?? `Error ${res.status} — please try again.`);
      return;
    }

    state.activePath = data.path ?? [];
    state.lastRoute  = data;
    renderMap();
    updateKPIs();
    updateZoneMetrics();
    showResult(data);
    showPathBar(data);

    // Route added to alert feed
    state.alertHistory.unshift({
      severity: 'info',
      icon:     'route',
      text:     `Route to ${data.destination?.label ?? 'destination'} — ${data.path?.length ?? 0} zones`,
      time:     'Just now',
    });
    renderAlerts();
    lucide.createIcons();

  } catch (err) {
    console.error('[SmartFlow] route fetch failed:', err);
    showError('Failed to reach the SmartFlow backend. Is it running on port 3000?');
  } finally {
    setLoadingState(false);
  }
}

// ── AI Result Output (structured) ────────────────────────────
function showResult(data) {
  aiPlaceholder.classList.add('hidden');
  aiOutput.classList.remove('hidden');

  const risk = data.riskLevel ?? 'low';
  const riskBadgeClass = { low: 'badge-success', medium: 'badge-warning', high: 'badge-destructive' }[risk] ?? 'badge-muted';

  // Confidence badge in card header
  const conf = data.confidence ?? risk;
  const confClass = { high: 'badge-success', medium: 'badge-warning', low: 'badge-destructive' }[conf] ?? 'badge-muted';
  confidenceBadge.className = `badge ${confClass}`;
  confidenceBadge.textContent = conf.toUpperCase() + ' CONF';
  confidenceBadge.classList.remove('hidden');

  aiOutput.innerHTML = `
    <div class="ai-result">
      <div class="ai-result-header">
        <span class="ai-route-name">✦ ${escapeHtml(data.destination?.label ?? 'Optimal Route')}</span>
        <span class="badge ${riskBadgeClass}">${risk.toUpperCase()} RISK</span>
      </div>

      <p class="ai-recommendation">${escapeHtml(data.recommendation ?? '')}</p>

      <div class="ai-detail-row">
        <i data-lucide="route" style="width:12px;height:12px;color:var(--purple);flex-shrink:0"></i>
        <span>Route: <strong>${escapeHtml(data.destination?.label ?? '—')}</strong></span>
      </div>
      <div class="ai-detail-row">
        <i data-lucide="clock" style="width:12px;height:12px;color:var(--cyan);flex-shrink:0"></i>
        <span>Time Saved: <strong>${escapeHtml(data.timeSaved ?? '—')}</strong></span>
      </div>
      <div class="ai-detail-row">
        <i data-lucide="map-pin" style="width:12px;height:12px;color:var(--blue);flex-shrink:0"></i>
        <span>Zones: <strong>${data.path?.length ?? 0}</strong></span>
      </div>

      ${data.avoidZoneLabels?.length ? `
        <div class="ai-separator"></div>
        <p class="ai-avoid-label">⚠ Avoid</p>
        <div class="ai-avoid-tags">
          ${data.avoidZoneLabels.map(z => `<span class="ai-avoid-tag">${escapeHtml(z)}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `;

  aiOutput.animate(
    [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }],
    { duration: 380, fill: 'forwards', easing: 'ease-out' }
  );

  lucide.createIcons();
}

function showPlaceholder() {
  aiPlaceholder.classList.remove('hidden');
  aiOutput.classList.add('hidden');
  aiOutput.innerHTML = '';
  confidenceBadge.classList.add('hidden');
}

function showError(message) {
  aiPlaceholder.classList.add('hidden');
  aiOutput.classList.remove('hidden');
  aiOutput.innerHTML = `<div class="error-state">⚠ ${escapeHtml(message)}</div>`;
}

// ── Loading State ─────────────────────────────────────────────
function setLoadingState(loading) {
  state.isLoading = loading;
  if (loading) {
    aiLoading.classList.remove('hidden');
    aiLoading.style.display = 'flex';
    aiPlaceholder.classList.add('hidden');
    aiOutput.classList.add('hidden');
    suggestBtn.disabled = true;
    if (refreshBtn) refreshBtn.disabled = true;
  } else {
    aiLoading.classList.add('hidden');
    aiLoading.style.display = '';
    suggestBtn.disabled = false;
    if (refreshBtn) refreshBtn.disabled = false;
  }
}

// ── Security ──────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Start ─────────────────────────────────────────────────────
init();
