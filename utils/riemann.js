import { create, all } from 'mathjs';

const math = create(all, {});

export function compileExpression(expr) {
  try {
    const compiled = math.compile(expr);
    return { compiled, error: null };
  } catch (error) {
    return { compiled: null, error };
  }
}

export function evaluateCompiled(compiled, x) {
  return compiled.evaluate({ x });
}

export function riemannRectangles(compiled, a, b, n, method) {
  const dx = (b - a) / n;
  const rects = [];
  for (let i = 0; i < n; i++) {
    const xLeft = a + i * dx;
    const xRight = xLeft + dx;
    let sample = xLeft;
    switch (method) {
      case 'right':
        sample = xRight;
        break;
      case 'midpoint':
        sample = (xLeft + xRight) / 2;
        break;
      case 'upper':
        sample = evaluateCompiled(compiled, xLeft) > evaluateCompiled(compiled, xRight)
          ? xLeft
          : xRight;
        break;
      case 'lower':
        sample = evaluateCompiled(compiled, xLeft) < evaluateCompiled(compiled, xRight)
          ? xLeft
          : xRight;
        break;
      case 'trapezoid':
        sample = null; // handled separately
        break;
      case 'simpson':
        sample = null; // handled separately
        break;
      default:
        sample = xLeft;
    }
    let height;
    if (method === 'trapezoid') {
      const fLeft = evaluateCompiled(compiled, xLeft);
      const fRight = evaluateCompiled(compiled, xRight);
      height = (fLeft + fRight) / 2;
      sample = (xLeft + xRight) / 2;
    } else if (method === 'simpson') {
      const fLeft = evaluateCompiled(compiled, xLeft);
      const fRight = evaluateCompiled(compiled, xRight);
      const fMid = evaluateCompiled(compiled, (xLeft + xRight) / 2);
      height = (fLeft + 4 * fMid + fRight) / 6;
      sample = (xLeft + xRight) / 2;
    } else {
      height = evaluateCompiled(compiled, sample);
    }
    rects.push({ xLeft, xRight, sample, height, area: height * dx });
  }
  return rects;
}

export function riemannSum(compiled, a, b, n, method) {
  const rects = riemannRectangles(compiled, a, b, n, method);
  return rects.reduce((acc, r) => acc + r.area, 0);
}

export function referenceIntegral(compiled, a, b) {
  const N = 10000;
  const dx = (b - a) / N;
  let sum = 0;
  for (let i = 0; i <= N; i++) {
    const x = a + i * dx;
    const weight = i === 0 || i === N ? 1 : i % 2 === 0 ? 2 : 4;
    sum += weight * evaluateCompiled(compiled, x);
  }
  return (dx / 3) * sum;
}

export function computeAll(compiled, a, b, n, methods) {
  const results = {};
  Object.keys(methods).forEach((m) => {
    if (methods[m]) {
      const rects = riemannRectangles(compiled, a, b, n, m);
      const sum = rects.reduce((s, r) => s + r.area, 0);
      results[m] = { rects, sum };
    }
  });
  const ref = referenceIntegral(compiled, a, b);
  results.reference = ref;
  return results;
}

export default {
  compileExpression,
  riemannRectangles,
  riemannSum,
  referenceIntegral,
  computeAll,
};
