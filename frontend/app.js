const map = document.getElementById("map");

// 5x5 Grid representation
const zones = [
  "low", "medium", "high", "low", "medium",
  "low", "high", "high", "medium", "low",
  "low", "medium", "low", "high", "medium",
  "medium", "low", "high", "low", "low",
  "high", "medium", "low", "medium", "low"
];

// Destination indices mapping based on grid 5x5
const destinations = {
  food: 4,       // Top right
  exit: 2,       // Top middle
  washroom: 20   // Bottom left
};

const userPos = 12; // Center

function renderMap() {
  map.innerHTML = "";

  zones.forEach((z, i) => {
    const div = document.createElement("div");
    div.classList.add("zone", z);

    // Current user position
    if (i === userPos) { 
      div.classList.add("user");
    }

    // Add a slight animation delay for a cascading load effect
    div.style.animation = `fadeIn 0.5s ease forwards ${i * 0.03}s`;
    div.style.opacity = '0';

    map.appendChild(div);
  });
}

// Add keyframes for the initial load animation safely via JS
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.8) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
`;
document.head.appendChild(styleSheet);

// Initialize Map
renderMap();

// 1. Simple pathfinding function (beginner-friendly Dijkstra)
function findBestPath(start, dest) {
  const distances = Array(25).fill(Infinity);
  const previous = Array(25).fill(null);
  const unvisited = new Set(Array.from({length: 25}, (_, i) => i));
  
  distances[start] = 0;
  
  const getWeight = (i) => {
    if (zones[i] === 'high') return 99;   // Heavy penalty for high density
    if (zones[i] === 'medium') return 3;  // Slight penalty
    return 1;                             // Smallest cost for low density
  };
  
  while(unvisited.size > 0) {
    // Pick the unvisited node with the lowest distance
    let current = null;
    for (let node of unvisited) {
      if (current === null || distances[node] < distances[current]) {
        current = node;
      }
    }
    
    // Stop if we reached destination or all remaining nodes are unreachable
    if (distances[current] === Infinity || current === dest) break;
    
    unvisited.delete(current);
    
    // Calculate valid adjacent neighbors (up, down, left, right)
    const neighbors = [current - 5, current + 5, current - 1, current + 1].filter(n => {
      if (n < 0 || n >= 25) return false; // out of bounds
      if (current % 5 === 0 && n === current - 1) return false; // left edge, can't go left
      if (current % 5 === 4 && n === current + 1) return false; // right edge, can't go right
      return true;
    });
    
    for (let neighbor of neighbors) {
      if (unvisited.has(neighbor)) {
        let newDist = distances[current] + getWeight(neighbor);
        if (newDist < distances[neighbor]) {
          distances[neighbor] = newDist;
          previous[neighbor] = current;
        }
      }
    }
  }
  
  // Reconstruct the path backwards
  const path = [];
  let curr = dest;
  if (previous[curr] !== null || curr === start) {
    while (curr !== null) {
      path.unshift(curr);
      curr = previous[curr];
    }
  }
  return path;
}

// 2. Visually highlight the path
function highlightPath(path) {
  // Reset previous highlights
  const cells = document.querySelectorAll('.zone');
  cells.forEach((cell, i) => {
    cell.style.boxShadow = '';
    cell.style.border = '';
    const icon = cell.querySelector('.path-dot');
    if (icon) cell.removeChild(icon);
  });
  
  path.forEach((index, step) => {
    // Skip user tile
    if (index !== userPos) {
      setTimeout(() => {
        const cell = cells[index];
        // Add visual path indication directly with JS
        cell.style.boxShadow = 'inset 0 0 0 4px rgba(255, 255, 255, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.5)';
        cell.style.border = '2px solid white';
        
        // Add a dot icon
        const dot = document.createElement('div');
        dot.className = 'path-dot';
        dot.innerHTML = '✨';
        dot.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 20; font-size: 1.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));';
        cell.appendChild(dot);
        
      }, step * 250); // Stagger animation for nice effect
    }
  });
}

function suggestRoute() {
  const outputArea = document.getElementById("ai-output");
  const loadingArea = document.getElementById("ai-loading");
  const destinationSelect = document.getElementById("destination");
  
  const destValue = destinationSelect.value;
  const destText = destinationSelect.options[destinationSelect.selectedIndex].text;
  
  // Show loading spinner, hide previous output
  outputArea.classList.add("hidden");
  loadingArea.classList.remove("hidden");

  // Calculate the path!
  const destIndex = destinations[destValue];
  const path = findBestPath(userPos, destIndex);

  // Simulate AI Processing Delay
  setTimeout(() => {
    loadingArea.classList.add("hidden");
    outputArea.classList.remove("hidden");
    
    // Construct premium styled response
    const responseText = `
      <div style="margin-bottom: 0.5rem;"><span class="highlight">✨ Smart Route Calculated.</span></div>
      <div>Taking an alternative route to the <span class="success-text">${destText}</span> bypasses current high-density congestion. This optimized path ensures flow and saves approximately 8 minutes of transit time.</div>
    `;
    
    outputArea.innerHTML = responseText;
    
    // Add brief glow effect to AI panel text
    outputArea.animate([
      { opacity: 0, transform: 'translateY(5px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 400, delay: 0, fill: 'forwards', easing: 'ease-out' });

    // Draw the highlights
    highlightPath(path);

  }, 1200);
}
