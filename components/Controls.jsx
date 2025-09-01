import React, { useState } from 'react';
import { compileExpression } from '../utils/riemann';
import { useTheme } from 'next-themes';

export default function Controls({
  expression,
  setExpression,
  a,
  setA,
  b,
  setB,
  n,
  setN,
  onPlay,
  onExportPNG,
  onExportCSV,
}) {
  const { theme, setTheme } = useTheme();
  const [expr, setExpr] = useState(expression);
  const [error, setError] = useState(null);

  const handleExpr = (e) => {
    const val = e.target.value;
    setExpr(val);
    const { error } = compileExpression(val);
    setError(error ? error.message : null);
    if (!error) setExpression(val);
  };

  const handleA = (e) => {
    setA(parseFloat(e.target.value));
  };
  const handleB = (e) => {
    setB(parseFloat(e.target.value));
  };

  const handleN = (e) => {
    setN(parseInt(e.target.value, 10));
  };

  return (
    <div className="controls">
      <div>
        <label>
          Function f(x):
          <input
            type="text"
            value={expr}
            onChange={handleExpr}
            aria-label="function expression"
          />
        </label>
        {error && <span className="error">{error}</span>}
      </div>
      <div className="interval">
        <label>
          a:
          <input
            type="number"
            value={a}
            onChange={handleA}
            aria-label="interval start a"
          />
        </label>
        <label>
          b:
          <input
            type="number"
            value={b}
            onChange={handleB}
            aria-label="interval end b"
          />
        </label>
      </div>
      <div className="partition">
        <label>
          n:
          <input
            type="range"
            min={1}
            max={5000}
            value={n}
            onChange={handleN}
            aria-label="number of partitions"
          />
          <input
            type="number"
            min={1}
            max={5000}
            value={n}
            onChange={handleN}
            aria-label="number of partitions input"
          />
        </label>
        <button onClick={onPlay} aria-label="animate n">▶</button>
      </div>
      <div className="exports">
        <button onClick={onExportPNG} aria-label="export png">Export PNG</button>
        <button onClick={onExportCSV} aria-label="export csv">Export CSV</button>
      </div>
      <div className="theme-toggle">
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="toggle theme">
          {theme === 'light' ? 'Dark' : 'Light'} mode
        </button>
      </div>
    </div>
  );
}
