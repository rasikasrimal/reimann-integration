const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");

const funcInput = document.getElementById("funcInput");
const aInput = document.getElementById("aInput");
const bInput = document.getElementById("bInput");
const nInput = document.getElementById("nInput");
const showUpper = document.getElementById("showUpper");
const showLower = document.getElementById("showLower");

const leftSumEl = document.getElementById("leftSum");
const rightSumEl = document.getElementById("rightSum");
const midSumEl = document.getElementById("midSum");
const upperSumEl = document.getElementById("upperSum");
const lowerSumEl = document.getElementById("lowerSum");

// Resize canvas
function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener("resize", () => {
  resizeCanvas();
  drawGraph();
});
resizeCanvas();

// Safe function parser
function parseFunction(str) {
  try {
    return new Function("x", "return " + str);
  } catch {
    return () => NaN;
  }
}

// Calculate sums
function calculateSums(f, a, b, n) {
  const dx = (b - a) / n;
  let left = 0, right = 0, mid = 0;
  let upper = 0, lower = 0;

  let ys = [];
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx;
    const x1 = a + (i + 1) * dx;
    const y0 = f(x0);
    const y1 = f(x1);
    const ym = f((x0 + x1) / 2);
    ys.push(y0, y1, ym);

    left += y0 * dx;
    right += y1 * dx;
    mid += ym * dx;
    upper += Math.max(y0, y1) * dx;
    lower += Math.min(y0, y1) * dx;
  }

  const yMin = Math.min(...ys, 0);
  const yMax = Math.max(...ys, 1);

  return { left, right, mid, upper, lower, dx, yMin, yMax };
}

// Draw graph
function drawGraph() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const f = parseFunction(funcInput.value);
  const a = parseFloat(aInput.value);
  const b = parseFloat(bInput.value);
  const n = parseInt(nInput.value);

  if (isNaN(a) || isNaN(b) || isNaN(n) || n <= 0) return;

  const { left, right, mid, upper, lower, dx, yMin, yMax } = calculateSums(f, a, b, n);

  leftSumEl.textContent = left.toFixed(4);
  rightSumEl.textContent = right.toFixed(4);
  midSumEl.textContent = mid.toFixed(4);
  upperSumEl.textContent = upper.toFixed(4);
  lowerSumEl.textContent = lower.toFixed(4);

  const padding = 40;
  const width = canvas.width - padding * 2;
  const height = canvas.height - padding * 2;

  // Scale functions
  const scaleX = (x) => padding + ((x - a) / (b - a)) * width;
  const scaleY = (y) => padding + height - ((y - yMin) / (yMax - yMin)) * height;

  // Draw rectangles
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx;
    const x1 = a + (i + 1) * dx;
    const y0 = f(x0);
    const y1 = f(x1);

    if (showUpper.checked) {
      const yTop = Math.max(y0, y1);
      ctx.fillStyle = "rgba(255,0,0,0.3)";
      ctx.fillRect(scaleX(x0), scaleY(yTop), scaleX(x1)-scaleX(x0), scaleY(yMin)-scaleY(yTop));
    }
    if (showLower.checked) {
      const yBottom = Math.min(y0, y1);
      ctx.fillStyle = "rgba(0,0,255,0.3)";
      ctx.fillRect(scaleX(x0), scaleY(yBottom), scaleX(x1)-scaleX(x0), scaleY(yMin)-scaleY(yBottom));
    }
  }

  // Draw function curve
  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  const steps = 500;
  for (let i = 0; i <= steps; i++) {
    const x = a + ((b - a) * i) / steps;
    const y = f(x);
    if (i === 0) ctx.moveTo(scaleX(x), scaleY(y));
    else ctx.lineTo(scaleX(x), scaleY(y));
  }
  ctx.stroke();
}

// Event listeners
[funcInput, aInput, bInput, nInput, showUpper, showLower].forEach(el =>
  el.addEventListener("input", drawGraph)
);

// Initial draw
drawGraph();
