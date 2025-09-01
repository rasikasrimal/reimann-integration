const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;
const PADDING = 40;

// UI elements
const funcInput = document.getElementById('funcInput');
const aInput = document.getElementById('aInput');
const bInput = document.getElementById('bInput');
const nInput = document.getElementById('nInput');
const nLabel = document.getElementById('nLabel');
const methodChecks = document.querySelectorAll('.methods input[type="checkbox"][value]');
const compareAll = document.getElementById('compareAll');
const themeToggle = document.getElementById('themeToggle');
const resultsBody = document.getElementById('resultsBody');
const legend = document.getElementById('legend');
const alertBox = document.getElementById('alert');
const tooltip = document.getElementById('tooltip');
const pngBtn = document.getElementById('pngBtn');
const csvBtn = document.getElementById('csvBtn');

// State
let a = parseFloat(aInput.value);
let b = parseFloat(bInput.value);
let n = parseInt(nInput.value);
let rects = [];
let dx = 0;
let highlightIndex = null;
let handlePos = { a: 0, b: 0 };
let axisY = 0;
let dragInfo = null;
let lastDims = { width: 0, height: 0 };

// Utility helpers
function parseFunction(str) {
  const ids = str.match(/[A-Za-z_][A-Za-z0-9_.]*/g) || [];
  for (const id of ids) {
    if (id === 'x') continue;
    if (id.startsWith('Math.') && (id.slice(5) in Math)) continue;
    throw new Error('Invalid identifier ' + id);
  }
  return new Function('x', `with(Math){return ${str};}`);
}

const SAMPLE_DENSITY = 16;
function computeAll(f, a, b, n) {
  const dx = (b - a) / n;
  const rects = [];
  const ys = [];
  let yMin = 0, yMax = 0;
  for (let i = 0; i <= n; i++) {
    const x = a + dx * i;
    const y = f(x);
    ys.push(y);
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  }
  let left = 0, right = 0, mid = 0, upper = 0, lower = 0, trapezoid = 0;
  for (let i = 0; i < n; i++) {
    const x0 = a + dx * i;
    const x1 = x0 + dx;
    const y0 = ys[i];
    const y1 = ys[i + 1];
    const xm = (x0 + x1) / 2;
    const ym = f(xm);
    if (ym < yMin) yMin = ym;
    if (ym > yMax) yMax = ym;
    let ySup = Math.max(y0, y1, ym);
    let yInf = Math.min(y0, y1, ym);
    for (let k = 1; k < SAMPLE_DENSITY; k++) {
      const xs = x0 + (k * dx) / SAMPLE_DENSITY;
      const ysamp = f(xs);
      if (ysamp > ySup) ySup = ysamp;
      if (ysamp < yInf) yInf = ysamp;
      if (ysamp > yMax) yMax = ysamp;
      if (ysamp < yMin) yMin = ysamp;
    }
    left += y0 * dx;
    right += y1 * dx;
    mid += ym * dx;
    upper += ySup * dx;
    lower += yInf * dx;
    trapezoid += ((y0 + y1) / 2) * dx;
    rects.push({ x0, x1, y0, y1, ym, ySup, yInf });
  }
  let simpson = 0;
  const nEven = n % 2 === 0 ? n : n - 1;
  for (let i = 0; i <= nEven; i++) {
    const coeff = i === 0 || i === nEven ? 1 : i % 2 === 0 ? 2 : 4;
    simpson += coeff * ys[i];
  }
  simpson *= dx / 3;
  if (nEven !== n) {
    simpson += ((ys[n - 1] + ys[n]) / 2) * dx;
  }
  return {
    left,
    right,
    mid,
    upper,
    lower,
    trapezoid,
    simpson,
    dx,
    rects,
    yMin: Math.min(yMin, 0),
    yMax: Math.max(yMax, 0),
  };
}

function hexToRgba(hex, alpha) {
  hex = hex.trim().replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function methodColor(method, alpha = 1) {
  const color = getComputedStyle(document.documentElement).getPropertyValue(`--${method}`);
  return alpha === 1 ? color.trim() : hexToRgba(color, alpha);
}

function sampleFor(r, method) {
  switch (method) {
    case 'left':
      return r.y0;
    case 'right':
      return r.y1;
    case 'mid':
      return r.ym;
    case 'upper':
      return r.ySup;
    case 'lower':
      return r.yInf;
    default:
      return 0;
  }
}

function updateTable(res) {
  const ref = res.simpson;
  const rows = [
    ['Left', res.left],
    ['Right', res.right],
    ['Midpoint', res.mid],
    ['Upper', res.upper],
    ['Lower', res.lower],
    ['Trapezoidal', res.trapezoid],
    ['Simpson', res.simpson],
  ];
  resultsBody.innerHTML = '';
  for (const [name, val] of rows) {
    const tr = document.createElement('tr');
    const err = Math.abs(val - ref);
    tr.innerHTML = `<td>${name}</td><td>${val.toFixed(6)}</td><td>${err.toFixed(6)}</td>`;
    resultsBody.appendChild(tr);
  }
}

function updateURL() {
  const methods = Array.from(methodChecks)
    .filter(ch => ch.checked)
    .map(ch => ch.value)
    .join('.');
  const params = new URLSearchParams({
    fx: funcInput.value,
    a: aInput.value,
    b: bInput.value,
    n: nInput.value,
    methods,
    theme: document.body.classList.contains('dark') ? 'dark' : 'light',
  });
  history.replaceState(null, '', '?' + params.toString());
}

function loadFromURL() {
  const params = new URLSearchParams(location.search);
  if (params.get('fx')) funcInput.value = params.get('fx');
  if (params.get('a')) aInput.value = params.get('a');
  if (params.get('b')) bInput.value = params.get('b');
  if (params.get('n')) {
    nInput.value = params.get('n');
    nLabel.textContent = params.get('n');
  }
  if (params.get('methods')) {
    const ms = params.get('methods').split('.');
    methodChecks.forEach(ch => {
      ch.checked = ms.includes(ch.value);
    });
  }
  if (params.get('theme') === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = '☀️';
  }
}

// Drawing
let pending = false;
function scheduleDraw() {
  if (!pending) {
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      draw();
    });
  }
}

function draw() {
  a = parseFloat(aInput.value);
  b = parseFloat(bInput.value);
  n = parseInt(nInput.value);
  nLabel.textContent = n;
  const activeMethods = compareAll.checked
    ? ['left', 'right', 'mid', 'upper', 'lower']
    : Array.from(methodChecks)
        .filter(ch => ch.checked)
        .map(ch => ch.value);
  let f;
  try {
    f = parseFunction(funcInput.value);
    alertBox.style.display = 'none';
  } catch (e) {
    alertBox.textContent = 'Invalid function';
    alertBox.style.display = 'block';
    return;
  }
  if (!(b > a) || n < 1) {
    alertBox.textContent = 'Check interval and partitions';
    alertBox.style.display = 'block';
    return;
  }

  const res = computeAll(f, a, b, n);
  rects = res.rects;
  dx = res.dx;

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  lastDims = { width: rect.width, height: rect.height };
  ctx.clearRect(0, 0, rect.width, rect.height);

  const width = rect.width - PADDING * 2;
  const height = rect.height - PADDING * 2;
  const scaleX = x => PADDING + ((x - a) / (b - a)) * width;
  const scaleY = y => PADDING + height - ((y - res.yMin) / (res.yMax - res.yMin)) * height;
  axisY = scaleY(0);
  handlePos.a = scaleX(a);
  handlePos.b = scaleX(b);

  // Axes
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, axisY);
  ctx.lineTo(PADDING + width, axisY);
  ctx.moveTo(PADDING, PADDING);
  ctx.lineTo(PADDING, PADDING + height);
  ctx.stroke();

  // Function curve
  ctx.beginPath();
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--fg');
  ctx.lineWidth = 2;
  const steps = width;
  for (let i = 0; i <= steps; i++) {
    const x = a + ((b - a) * i) / steps;
    const y = f(x);
    const px = scaleX(x);
    const py = scaleY(y);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Rectangles
  for (const method of activeMethods) {
    ctx.fillStyle = methodColor(method, 0.4);
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      const sample = sampleFor(r, method);
      const x0 = scaleX(r.x0);
      const w = scaleX(r.x1) - x0;
      const y = scaleY(sample);
      const base = scaleY(0);
      ctx.fillRect(x0, Math.min(y, base), w, Math.abs(base - y));
      if (highlightIndex === i) {
        ctx.save();
        ctx.strokeStyle = methodColor(method, 1);
        ctx.lineWidth = 2;
        ctx.strokeRect(x0, Math.min(y, base), w, Math.abs(base - y));
        ctx.restore();
      }
    }
  }

  // Handles
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent');
  ctx.fillRect(handlePos.a - 2, axisY - 8, 4, 16);
  ctx.fillRect(handlePos.b - 2, axisY - 8, 4, 16);

  updateTable(res);
  updateLegend(activeMethods);
  updateURL();
}

const LABELS = {
  left: 'Left',
  right: 'Right',
  mid: 'Midpoint',
  upper: 'Upper',
  lower: 'Lower',
};


function updateLegend(methods) {
  if (compareAll.checked || methods.length > 1) {
    legend.classList.remove('hidden');
    legend.innerHTML = '';
    for (const m of methods) {
      const span = document.createElement('span');
      span.textContent = LABELS[m] || m;

      span.style.color = methodColor(m, 1);
      legend.appendChild(span);
    }
  } else {
    legend.classList.add('hidden');
  }
}

// Hover tooltip
canvas.addEventListener('mousemove', e => {
  if (!rects.length) return;
  const x = e.offsetX;
  const rel = (x - PADDING) / (lastDims.width - 2 * PADDING);
  const idx = Math.floor(rel * n);
  if (idx < 0 || idx >= rects.length) {
    tooltip.classList.add('hidden');
    highlightIndex = null;
    scheduleDraw();
    return;
  }
  highlightIndex = idx;
  const r = rects[idx];
  const methods = compareAll.checked
    ? ['left', 'right', 'mid', 'upper', 'lower']
    : Array.from(methodChecks)
        .filter(ch => ch.checked)
        .map(ch => ch.value);
  let html = `[${r.x0.toFixed(3)}, ${r.x1.toFixed(3)}]`;
  for (const m of methods) {
    const sample = sampleFor(r, m);
    const area = sample * dx;
    html += `<br>${m}: f=${sample.toFixed(4)}, A=${area.toFixed(4)}`;
  }
  tooltip.innerHTML = html;
  tooltip.style.left = `${x + 10}px`;
  tooltip.style.top = `${e.offsetY + 10}px`;
  tooltip.classList.remove('hidden');
  scheduleDraw();
});

canvas.addEventListener('mouseleave', () => {
  tooltip.classList.add('hidden');
  highlightIndex = null;
  scheduleDraw();
});

// Drag handles for a and b
canvas.addEventListener('mousedown', e => {
  const x = e.offsetX;
  const y = e.offsetY;
  if (Math.abs(x - handlePos.a) < 8 && Math.abs(y - axisY) < 20) {
    dragInfo = { which: 'a', startA: a, startB: b };
  } else if (Math.abs(x - handlePos.b) < 8 && Math.abs(y - axisY) < 20) {
    dragInfo = { which: 'b', startA: a, startB: b };
  }
});

window.addEventListener('mousemove', e => {
  if (!dragInfo) return;
  const bounds = canvas.getBoundingClientRect();
  const rel = (e.clientX - bounds.left - PADDING) / (bounds.width - 2 * PADDING);
  const val = dragInfo.startA + rel * (dragInfo.startB - dragInfo.startA);
  if (dragInfo.which === 'a') {
    a = Math.min(val, b - 0.001);
    aInput.value = a.toFixed(3);
  } else {
    b = Math.max(val, a + 0.001);
    bInput.value = b.toFixed(3);
  }
  scheduleDraw();
});

window.addEventListener('mouseup', () => {
  if (dragInfo) {
    dragInfo = null;
    updateURL();
  }
});

// Export buttons
pngBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'riemann.png';
  link.click();
});

csvBtn.addEventListener('click', () => {
  if (!rects.length) return;
  const rows = [
    'i,x0,x1,leftSample,leftArea,rightSample,rightArea,midSample,midArea,upperSample,upperArea,lowerSample,lowerArea',
  ];
  rects.forEach((r, i) => {
    rows.push([
      i,
      r.x0,
      r.x1,
      r.y0,
      r.y0 * dx,
      r.y1,
      r.y1 * dx,
      r.ym,
      r.ym * dx,
      r.ySup,
      r.ySup * dx,
      r.yInf,
      r.yInf * dx,
    ].map(v => Number(v).toFixed(6)).join(','));
  });
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'riemann.csv';
  link.click();
});

// Events
[funcInput, aInput, bInput].forEach(el => el.addEventListener('input', scheduleDraw));
nInput.addEventListener('input', () => {
  nLabel.textContent = nInput.value;
  scheduleDraw();
});
methodChecks.forEach(ch => ch.addEventListener('change', scheduleDraw));
compareAll.addEventListener('change', scheduleDraw);
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  scheduleDraw();
  updateURL();
});
window.addEventListener('resize', scheduleDraw);

loadFromURL();
window.addEventListener('load', scheduleDraw);


