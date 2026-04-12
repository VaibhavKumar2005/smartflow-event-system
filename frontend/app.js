/**
 * frontend/app.js
 * ─────────────────────────────────────────────────────────────
 * SmartFlow dashboard — fully driven by the backend API.
 *
 * Nothing is hardcoded here:
 *   - Zone data, destination list, and user position all come from
 *     GET /api/stadium-state on page load.
 *   - Path computation happens on the backend (Dijkstra in services/pathfinder.js).
 *   - AI explanation comes from Gemini via the backend (structured JSON).
 *
 * To point this at a different backend (staging, production), change
 * CONFIG.API_BASE — that's the only line that needs to change.
 */

// ── Config ────────────────────────────────────────────────────
const CONFIG = {
  API_BASE: 'http://localhost:3000/api',
};

// ── App state ─────────────────────────────────────────────────
const state = {
  zones:        [],   // string[] — 'low' | 'medium' | 'high', 25 entries
  destinations: [],   // { key, label, gridIndex }[]
  userPos:      12,   // flat grid index
  gridSize:     5,
  activePath:   [],   // flat grid indices currently highlighted
  isLoading:    false,
  lastRoute:    null, // last route response
  alertHistory: [],   // generated alert entries
  chartData:    [],   // simulated crowd trend data
};

// ── DOM refs ──────────────────────────────────────────────────
const mapEl              = document.getElementById('map');
const destinationSelect  = document.getElementById('destination');
const aiOutput           = document.getElementById('ai-output');
const aiLoading          = document.getElementById('ai-loading');
const suggestBtn         = document.getElementById('suggest-btn');
const refreshBtn         = document.getElementById('refresh-btn');
const alertsList         = document.getElementById('alerts-list');
const alertCountBadge    = document.getElementById('alert-count-badge');

// KPI elements
const kpiDensity      = document.getElementById('kpi-density');
const kpiDensitySub   = document.getElementById('kpi-density-sub');
const kpiWait         = document.getElementById('kpi-wait');
const kpiSafe         = document.getElementById('kpi-safe');
const kpiSafeSub      = document.getElementById('kpi-safe-sub');
const kpiEfficiency   = document.getElementById('kpi-efficiency');
const kpiAlerts       = document.getElementById('kpi-alerts');

// Chart
let crowdChart = null;

// ── Initialise ────────────────────────────────────────────────
async function init() {
  await loadStadiumState();
  initCrowdChart();
  lucide.createIcons();
}

async function loadStadiumState() {
  setLoadingState(true);
  clearOutput();

  try {
    const res = await fetch(`${CONFIG.API_BASE}/stadium-state`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    state.zones        = data.zones;
    state.destinations = data.destinations;
    state.userPos      = data.userPos;
    state.gridSize     = data.gridSize;
    state.activePath   = [];

    populateDestinations();
    renderMap();
    updateKPIs();
    generateAlerts();
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

// ── Destinations select ───────────────────────────────────────
function populateDestinations() {
  destinationSelect.innerHTML = '';
  state.destinations.forEach(dest => {
    const option       = document.createElement('option');
    option.value       = dest.key;
    option.textContent = dest.label;
    destinationSelect.appendChild(option);
  });
}

// ── KPI Calculations ──────────────────────────────────────────
function updateKPIs() {
  const zones = state.zones;
  const total = zones.length;
  const lowCount    = zones.filter(z => z === 'low').length;
  const medCount    = zones.filter(z => z === 'medium').length;
  const highCount   = zones.filter(z => z === 'high').length;

  // Crowd density percentage (weighted)
  const densityScore = Math.round(((medCount * 0.5 + highCount * 1) / total) * 100);
  kpiDensity.textContent = `${densityScore}%`;
  kpiDensitySub.textContent = densityScore > 50 ? 'Above normal' : 'Normal range';
  kpiDensity.className = `text-2xl font-bold mt-1 ${densityScore > 60 ? 'text-high' : densityScore > 35 ? 'text-med' : 'text-low'}`;

  // Average wait time (simulated from density)
  const avgWait = Math.round(2 + (densityScore / 100) * 8);
  kpiWait.textContent = `${avgWait}m`;

  // Safe zones
  kpiSafe.textContent = lowCount;
  kpiSafeSub.textContent = `of ${total} zones`;
  kpiSafe.className = `text-2xl font-bold mt-1 ${lowCount >= 10 ? 'text-low' : lowCount >= 5 ? 'text-med' : 'text-high'}`;

  // Route efficiency (starts as base, updated after route)
  if (state.lastRoute) {
    const pathLen = state.lastRoute.path?.length ?? 0;
    const directDist = estimateDirectDistance(state.userPos, state.lastRoute.destination?.gridIndex ?? 0);
    const eff = directDist > 0 ? Math.round(Math.min(100, (directDist / pathLen) * 100)) : 100;
    kpiEfficiency.textContent = `${eff}%`;
    kpiEfficiency.className = `text-2xl font-bold mt-1 ${eff >= 80 ? 'text-low' : eff >= 50 ? 'text-med' : 'text-high'}`;
  } else {
    kpiEfficiency.textContent = '—';
  }

  // Active alerts
  kpiAlerts.textContent = highCount;
  kpiAlerts.className = `text-2xl font-bold mt-1 ${highCount === 0 ? 'text-low' : highCount <= 3 ? 'text-med' : 'text-high'}`;
}

function estimateDirectDistance(from, to) {
  const size = state.gridSize;
  const fx = from % size, fy = Math.floor(from / size);
  const tx = to % size,   ty = Math.floor(to / size);
  return Math.abs(fx - tx) + Math.abs(fy - ty) + 1; // Manhattan + 1
}

// ── Alerts Generation ─────────────────────────────────────────
function generateAlerts() {
  const alerts = [];
  const zones = state.zones;

  zones.forEach((z, i) => {
    if (z === 'high') {
      alerts.push({
        severity: 'high',
        icon: 'alert-triangle',
        text: `Zone ${i} — High density detected`,
        time: formatTimeAgo(Math.floor(Math.random() * 8) + 1),
      });
    }
  });

  // Add some contextual alerts
  const medCount = zones.filter(z => z === 'medium').length;
  if (medCount > 5) {
    alerts.push({
      severity: 'medium',
      icon: 'alert-circle',
      text: `${medCount} zones at moderate capacity`,
      time: 'Just now',
    });
  }

  alerts.push({
    severity: 'info',
    icon: 'info',
    text: 'AI routing engine operational',
    time: 'System',
  });

  state.alertHistory = alerts;
  renderAlerts();
}

function renderAlerts() {
  const alerts = state.alertHistory;
  alertsList.innerHTML = '';

  if (alerts.length === 0) {
    alertsList.innerHTML = `
      <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-sm text-slate-500">
        <i data-lucide="check-circle" class="w-4 h-4 shrink-0 text-low"></i>
        <span>All clear — no active alerts</span>
      </div>`;
    alertCountBadge.classList.add('hidden');
    return;
  }

  const highAlerts = alerts.filter(a => a.severity === 'high').length;
  if (highAlerts > 0) {
    alertCountBadge.textContent = highAlerts;
    alertCountBadge.classList.remove('hidden');
  } else {
    alertCountBadge.classList.add('hidden');
  }

  alerts.forEach((alert, idx) => {
    const el = document.createElement('div');
    el.className = `alert-item severity-${alert.severity}`;
    el.style.animationDelay = `${idx * 0.05}s`;
    el.innerHTML = `
      <i data-lucide="${alert.icon}" class="w-4 h-4 shrink-0 ${
        alert.severity === 'high' ? 'text-high' :
        alert.severity === 'medium' ? 'text-med' : 'text-accent-blue'
      }"></i>
      <span class="flex-1 text-slate-300">${escapeHtml(alert.text)}</span>
      <span class="text-[10px] text-slate-600 shrink-0">${escapeHtml(alert.time)}</span>
    `;
    alertsList.appendChild(el);
  });

  lucide.createIcons();
}

function formatTimeAgo(minutes) {
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1m ago';
  return `${minutes}m ago`;
}

// ── Crowd Trend Chart ─────────────────────────────────────────
function initCrowdChart() {
  const ctx = document.getElementById('crowd-chart');
  if (!ctx) return;

  // Generate simulated trend data (last 8 intervals)
  const labels = ['T-8', 'T-7', 'T-6', 'T-5', 'T-4', 'T-3', 'T-2', 'Now'];
  const baseHigh = state.zones.filter(z => z === 'high').length;
  const baseMed  = state.zones.filter(z => z === 'medium').length;
  const baseLow  = state.zones.filter(z => z === 'low').length;

  const highData = labels.map((_, i) => Math.max(0, baseHigh + Math.floor(Math.random() * 4) - 2));
  const medData  = labels.map((_, i) => Math.max(0, baseMed + Math.floor(Math.random() * 4) - 2));
  const lowData  = labels.map((_, i) => Math.max(0, baseLow + Math.floor(Math.random() * 3) - 1));

  // Make sure "Now" matches actual state
  highData[7] = baseHigh;
  medData[7]  = baseMed;
  lowData[7]  = baseLow;

  crowdChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'High',
          data: highData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: 'Moderate',
          data: medData,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.06)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: 'Low',
          data: lowData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.06)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: '#64748b',
            font: { size: 10, family: 'Inter' },
            boxWidth: 8,
            boxHeight: 8,
            borderRadius: 2,
            useBorderRadius: true,
            padding: 12,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          titleFont: { family: 'Inter', size: 11 },
          bodyFont: { family: 'Inter', size: 11 },
          padding: 10,
          cornerRadius: 10,
          displayColors: true,
          boxPadding: 4,
        },
      },
      scales: {
        x: {
          ticks: { color: '#475569', font: { size: 10, family: 'Inter' } },
          grid: { color: 'rgba(255,255,255,0.03)' },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#475569', font: { size: 10, family: 'Inter' }, stepSize: 2 },
          grid: { color: 'rgba(255,255,255,0.03)' },
          border: { display: false },
        },
      },
    },
  });
}

// ── Heatmap rendering ─────────────────────────────────────────
function renderMap() {
  mapEl.innerHTML = '';

  state.zones.forEach((density, i) => {
    const cell       = document.createElement('div');
    cell.classList.add('zone', density);
    cell.dataset.index = String(i);
    cell.title         = `Zone ${i} — ${density} density`;

    // Zone index label
    const label     = document.createElement('span');
    label.className = 'zone-label';
    label.textContent = i;
    cell.appendChild(label);

    // User marker
    if (i === state.userPos) {
      cell.classList.add('user');
      const icon     = document.createElement('div');
      icon.className = 'user-icon';
      icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
      cell.appendChild(icon);
    }

    // Path highlight
    if (state.activePath.includes(i) && i !== state.userPos) {
      cell.classList.add('on-path');

      // Destination marker on last path element
      if (state.lastRoute && i === state.lastRoute.destination?.gridIndex) {
        cell.classList.add('destination');
        const destIcon     = document.createElement('div');
        destIcon.className = 'dest-icon';
        destIcon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
        cell.appendChild(destIcon);
      } else {
        const dot       = document.createElement('div');
        dot.className   = 'path-dot';
        dot.textContent = '✨';
        cell.appendChild(dot);
      }
    }

    cell.style.animation = `fadeIn 0.35s ease forwards ${i * 0.02}s`;
    cell.style.opacity   = '0';

    mapEl.appendChild(cell);
  });
}

// ── Route suggestion ──────────────────────────────────────────
async function suggestRoute() {
  const destKey = destinationSelect.value;
  if (!destKey || state.isLoading) return;

  setLoadingState(true);
  clearOutput();
  state.activePath = [];
  renderMap();

  try {
    const res = await fetch(`${CONFIG.API_BASE}/suggest-route`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userLocation: state.userPos,
        destKey,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.message ?? `Error ${res.status} — please try again.`);
      return;
    }

    // Update path and re-render heatmap with highlights
    state.activePath = data.path ?? [];
    state.lastRoute  = data;
    renderMap();
    updateKPIs();
    showResult(data);

    // Add a route alert
    state.alertHistory.unshift({
      severity: 'info',
      icon: 'route',
      text: `Route to ${data.destination?.label ?? 'destination'} — ${data.path?.length ?? 0} zones`,
      time: 'Just now',
    });
    renderAlerts();
    lucide.createIcons();

  } catch (err) {
    console.error('[SmartFlow] route fetch failed:', err);
    showError(
      'Failed to reach the SmartFlow backend. ' +
      'Is it running on port 3000?'
    );
  } finally {
    setLoadingState(false);
  }
}

// ── Output rendering ──────────────────────────────────────────
function showResult(data) {
  const riskColors = {
    low:    '#10b981',
    medium: '#f59e0b',
    high:   '#ef4444',
  };
  const color = riskColors[data.riskLevel] ?? '#94a3b8';

  aiOutput.classList.remove('hidden');
  aiOutput.innerHTML = `
    <div class="result-header">
      <span class="highlight">✨ Route Calculated</span>
      <span class="risk-badge" style="
        background: ${color}18;
        color: ${color};
        border: 1px solid ${color}40;
      ">${(data.riskLevel ?? 'low').toUpperCase()} RISK</span>
    </div>

    <p class="result-recommendation">${escapeHtml(data.recommendation ?? '')}</p>

    <div class="result-meta">
      <span>⏱ ${escapeHtml(data.timeSaved ?? '—')}</span>
      <span>📍 ${data.path?.length ?? 0} zones</span>
      <span>→ ${escapeHtml(data.destination?.label ?? '')}</span>
    </div>

    ${data.avoidZoneLabels?.length
      ? `<div class="result-avoid">
           <span class="avoid-label">Avoid:</span>
           ${data.avoidZoneLabels.map(z => `<span class="avoid-tag">${escapeHtml(z)}</span>`).join('')}
         </div>`
      : ''}
  `;

  aiOutput.animate(
    [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
    { duration: 350, fill: 'forwards', easing: 'ease-out' }
  );
}

function showError(message) {
  aiOutput.classList.remove('hidden');
  aiOutput.innerHTML = `<div class="error-state">⚠️ ${escapeHtml(message)}</div>`;
}

function clearOutput() {
  aiOutput.classList.add('hidden');
  aiOutput.innerHTML = '';
}

// ── Loading state ─────────────────────────────────────────────
function setLoadingState(loading) {
  state.isLoading = loading;

  if (loading) {
    aiLoading.classList.remove('hidden');
    aiLoading.classList.add('flex');
    aiOutput.classList.add('hidden');
    suggestBtn.disabled = true;
    if (refreshBtn) refreshBtn.disabled = true;
  } else {
    aiLoading.classList.add('hidden');
    aiLoading.classList.remove('flex');
    suggestBtn.disabled = false;
    if (refreshBtn) refreshBtn.disabled = false;
  }
}

// ── Security: prevent XSS from any AI-generated strings ───────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Boot ──────────────────────────────────────────────────────
init();
