import React from 'react';

export const METHOD_META = {
  left: { color: '#1f77b4', label: 'Left' },
  right: { color: '#ff7f0e', label: 'Right' },
  midpoint: { color: '#2ca02c', label: 'Midpoint' },
  trapezoid: { color: '#9467bd', label: 'Trapezoid' },
  simpson: { color: '#8c564b', label: 'Simpson' },
  upper: { color: '#e377c2', label: 'Upper' },
  lower: { color: '#7f7f7f', label: 'Lower' },
};

export default function Legend({ methods, setMethods }) {
  return (
    <div className="legend">
      {Object.entries(METHOD_META).map(([key, meta]) => (
        <label key={key} style={{ color: meta.color }}>
          <input
            type="checkbox"
            checked={methods[key]}
            onChange={(e) => setMethods({ ...methods, [key]: e.target.checked })}
            aria-label={`toggle ${meta.label} method`}
          />
          {meta.label}
        </label>
      ))}
    </div>
  );
}
