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
  zones:       [],   // string[] — 'low' | 'medium' | 'high', 25 entries
  destinations: [],  // { key, label, gridIndex }[]
  userPos:     12,   // flat grid index
  gridSize:    5,
  activePath:  [],   // flat grid indices currently highlighted
  isLoading:   false,
};

// ── DOM refs ──────────────────────────────────────────────────
const mapEl           = document.getElementById('map');
const destinationSelect = document.getElementById('destination');
const aiOutput        = document.getElementById('ai-output');
const aiLoading       = document.getElementById('ai-loading');
const suggestBtn      = document.getElementById('suggest-btn');
const refreshBtn      = document.getElementById('refresh-btn');

// ── Initialise ────────────────────────────────────────────────
async function init() {
  await loadStadiumState();
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

// ── Heatmap rendering ─────────────────────────────────────────
function renderMap() {
  mapEl.innerHTML = '';

  state.zones.forEach((density, i) => {
    const cell       = document.createElement('div');
    cell.classList.add('zone', density);
    cell.dataset.index = String(i);
    cell.title         = `Zone ${i} — ${density} density`;

    if (i === state.userPos) {
      cell.classList.add('user');
    }

    if (state.activePath.includes(i) && i !== state.userPos) {
      cell.classList.add('on-path');
      const dot       = document.createElement('div');
      dot.className   = 'path-dot';
      dot.textContent = '✨';
      cell.appendChild(dot);
    }

    cell.style.animation = `fadeIn 0.4s ease forwards ${i * 0.025}s`;
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
      // Backend returned a typed error — surface it clearly
      showError(data.message ?? `Error ${res.status} — please try again.`);
      return;
    }

    // Update path and re-render heatmap with highlights
    state.activePath = data.path ?? [];
    renderMap();

    showResult(data);
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
        background: ${color}22;
        color: ${color};
        border: 1px solid ${color}55;
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
    aiOutput.classList.add('hidden');
    suggestBtn.disabled = true;
    if (refreshBtn) refreshBtn.disabled = true;
  } else {
    aiLoading.classList.add('hidden');
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

// ── Keyframe styles ───────────────────────────────────────────
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.85) translateY(8px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);   }
  }
`;
document.head.appendChild(styleSheet);

// ── Boot ──────────────────────────────────────────────────────
init();
