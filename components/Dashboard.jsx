import React from 'react';

export default function Dashboard({ results }) {
  if (!results) return null;
  return (
    <div className="dashboard">
      {Object.entries(results).map(([method, data]) => {
        if (method === 'reference') {
          return (
            <div key={method} className="result">
              Reference integral: {data.toFixed(6)}
            </div>
          );
        }
        return (
          <div key={method} className="result">
            {method}: {data.sum.toFixed(6)} (error{' '}
            {(data.sum - results.reference).toFixed(6)})
          </div>
        );
      })}
    </div>
  );
}
