import { useState, useEffect } from 'react';
import Controls from '../components/Controls';
import Plot from '../components/Plot';
import Legend from '../components/Legend';
import Dashboard from '../components/Dashboard';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [expression, setExpression] = useState('sin(x)');
  const [a, setA] = useState(0);
  const [b, setB] = useState(Math.PI);
  const [n, setN] = useState(10);
  const [methods, setMethods] = useState({
    left: true,
    right: false,
    midpoint: false,
    trapezoid: false,
    simpson: false,
    upper: false,
    lower: false,
  });
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    const { f, a: qa, b: qb, n: qn, m } = router.query;
    if (f) setExpression(f);
    if (qa) setA(parseFloat(qa));
    if (qb) setB(parseFloat(qb));
    if (qn) setN(parseInt(qn, 10));
    if (m) {
      const copy = { ...methods };
      Object.keys(copy).forEach((k) => (copy[k] = false));
      m.split(',').forEach((k) => (copy[k] = true));
      setMethods(copy);
    }
  }, [router.isReady]);

  useEffect(() => {
    const query = {
      f: expression,
      a: a.toFixed(3),
      b: b.toFixed(3),
      n,
      m: Object.keys(methods)
        .filter((k) => methods[k])
        .join(','),
    };
    router.replace({ pathname: '/', query }, undefined, { shallow: true });
  }, [expression, a, b, n, methods]);

  const onExportPNG = async () => {
    const canvas = await html2canvas(document.querySelector('.plot'));
    canvas.toBlob((blob) => saveAs(blob, 'plot.png'));
  };

  const onExportCSV = () => {
    if (!results) return;
    let csv = 'method,x_left,x_right,sample_x,f(sample_x),area\n';
    Object.entries(results).forEach(([m, data]) => {
      if (m === 'reference') return;
      data.rects.forEach((r) => {
        csv += `${m},${r.xLeft},${r.xRight},${r.sample},${r.height},${r.area}\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'data.csv');
  };

  const onPlay = () => {
    let i = n;
    const timer = setInterval(() => {
      i += 5;
      if (i > 500) {
        clearInterval(timer);
        return;
      }
      setN(i);
    }, 500);
  };

  return (
    <main>
      <h1>Riemann Integral Visualizer</h1>
      <noscript>Please enable JavaScript to use the interactive features.</noscript>
      <Controls
        expression={expression}
        setExpression={setExpression}
        a={a}
        setA={setA}
        b={b}
        setB={setB}
        n={n}
        setN={setN}
        onPlay={onPlay}
        onExportPNG={onExportPNG}
        onExportCSV={onExportCSV}
      />
      <Plot
        expression={expression}
        a={a}
        b={b}
        n={n}
        methods={methods}
        setA={setA}
        setB={setB}
        results={results}
        setResults={setResults}
      />
      <Legend methods={methods} setMethods={setMethods} />
      <Dashboard results={results} />
    </main>
  );
}
