import * as d3 from 'd3';
import type { VDemRow } from '../types';

export function addDerived(data: VDemRow[]): VDemRow[] {
  const byCountry = d3.group(data, (d) => d.country);
  const output: VDemRow[] = [];

  byCountry.forEach((rows) => {
    const sorted = rows.slice().sort((a, b) => a.year - b.year);
    let prevGdppc: number | null = null;
    const window: number[] = [];
    sorted.forEach((row) => {
      const next: VDemRow = { ...row };
      if (row.gdppc !== null && prevGdppc !== null && prevGdppc !== 0) {
        const growth = ((row.gdppc - prevGdppc) / prevGdppc) * 100;
        next.gdppcGrowth = growth;
        window.push(growth);
        if (window.length > 5) window.shift();
        next.gdppcGrowthMA5 = d3.mean(window) ?? null;
      } else {
        next.gdppcGrowth = null;
        next.gdppcGrowthMA5 = null;
        if (row.gdppc !== null) {
          window.length = 0;
        }
      }
      if (row.gdppc !== null) {
        prevGdppc = row.gdppc;
      }
      output.push(next);
    });
  });

  return output;
}

export function computeRegression(points: Array<{ x: number; y: number }>) {
  if (!points.length) return { slope: 0, intercept: 0 };
  const meanX = d3.mean(points, (p) => p.x) ?? 0;
  const meanY = d3.mean(points, (p) => p.y) ?? 0;
  const numerator = d3.sum(points, (p) => (p.x - meanX) * (p.y - meanY)) ?? 0;
  const denominator = d3.sum(points, (p) => (p.x - meanX) ** 2) ?? 1;
  const slope = numerator / denominator;
  return { slope, intercept: meanY - slope * meanX };
}
