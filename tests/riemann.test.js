import { compileExpression, riemannSum } from '../utils/riemann';
import { test, expect } from 'vitest';

test('left sum of x^2 approximates integral', () => {
  const { compiled } = compileExpression('x^2');
  const sum = riemannSum(compiled, 0, 1, 1000, 'left');
  expect(sum).toBeCloseTo(1 / 3, 2);
});

test('trapezoid sum of x^2 approximates integral', () => {
  const { compiled } = compileExpression('x^2');
  const sum = riemannSum(compiled, 0, 1, 1000, 'trapezoid');
  expect(sum).toBeCloseTo(1 / 3, 4);
});
