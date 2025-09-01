import { compileExpression, computeAll } from '../utils/riemann';

self.onmessage = (e) => {
  const { expr, a, b, n, methods } = e.data;
  const { compiled, error } = compileExpression(expr);
  if (error) {
    self.postMessage({ error: error.message });
    return;
  }
  const results = computeAll(compiled, a, b, n, methods);
  self.postMessage({ results });
};
