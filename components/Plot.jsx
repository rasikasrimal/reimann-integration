import React, { useEffect, useRef } from 'react';
import { motion } from "framer-motion";
import * as d3 from 'd3';
import { METHOD_META } from './Legend';
import { compileExpression, evaluateCompiled, computeAll } from '../utils/riemann';

export default function Plot({ expression, a, b, n, methods, setA, setB, results, setResults }) {
  const svgRef = useRef(null);
  const workerRef = useRef(null);

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/integral.worker.js', import.meta.url));
      workerRef.current.onmessage = (e) => {
        if (e.data.results) setResults(e.data.results);
      };
    }
  }, [setResults]);

  useEffect(() => {
    const { compiled, error } = compileExpression(expression);
    if (error) return;
    if (n > 1000 && workerRef.current) {
      workerRef.current.postMessage({ expr: expression, a, b, n, methods });
    } else {
      const res = computeAll(compiled, a, b, n, methods);
      setResults(res);
    }
  }, [expression, a, b, n, methods, setResults]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const width = 600;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    svg.attr('viewBox', `0 0 ${width} ${height}`);
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([a, b]).range([0, plotWidth]);
    const { compiled } = compileExpression(expression);
    const samples = d3.range(a, b, (b - a) / 1000).map((v) => [v, evaluateCompiled(compiled, v)]);
    const yExtent = d3.extent(samples, (d) => d[1]);
    const y = d3.scaleLinear().domain(yExtent).nice().range([plotHeight, 0]);
    g.append('g').attr('transform', `translate(0,${plotHeight})`).call(d3.axisBottom(x));
    g.append('g').call(d3.axisLeft(y));
    const line = d3
      .line()
      .x((d) => x(d[0]))
      .y((d) => y(d[1]));
    g.append('path').datum(samples).attr('fill', 'none').attr('stroke', 'black').attr('stroke-width', 2).attr('d', line);
    if (results) {
      Object.keys(results).forEach((m) => {
        if (m === 'reference') return;
        const group = g.append('g').attr('fill', METHOD_META[m].color).attr('fill-opacity', 0.3).attr('stroke', METHOD_META[m].color);
        results[m].rects.forEach((r) => {
          group
            .append('rect')
            .attr('x', x(r.xLeft))
            .attr('y', y(Math.max(0, r.height)))
            .attr('width', x(r.xRight) - x(r.xLeft))
            .attr('height', Math.abs(y(r.height) - y(0)));
        });
      });
    }
    const dragA = d3
      .drag()
      .on('drag', (event) => {
        const newA = x.invert(event.x - margin.left);
        if (newA < b) setA(newA);
      });
    const dragB = d3
      .drag()
      .on('drag', (event) => {
        const newB = x.invert(event.x - margin.left);
        if (newB > a) setB(newB);
      });
    g.append('circle').attr('cx', x(a)).attr('cy', y(0)).attr('r', 6).attr('fill', 'red').call(dragA).attr('tabindex', 0).attr('aria-label', 'drag start a');
    g.append('circle').attr('cx', x(b)).attr('cy', y(0)).attr('r', 6).attr('fill', 'red').call(dragB).attr('tabindex', 0).attr('aria-label', 'drag end b');
  }, [expression, a, b, n, results, setA, setB]);

  return <motion.svg initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.5}} ref={svgRef} className="plot" role="img" aria-label="riemann plot" />;
}
