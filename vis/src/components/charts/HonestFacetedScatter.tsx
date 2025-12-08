import { useMemo } from 'react';
import * as d3 from 'd3';
import type { VDemRow } from '../../types';
import { computeRegression } from '../../utils/dataTransforms';

export function HonestFacetedScatter({ data }: { data: VDemRow[] }) {
  const filtered = useMemo(() => {
    const hasGrowth = (d: VDemRow) => (d.gdppcGrowthMA5 ?? d.gdppcGrowth) !== null;
    return data
      .filter((d) => d.year >= 2000 && d.year <= 2019)
      .filter((d) => d.polyarchy !== null && hasGrowth(d))
      .filter((d) => d.incomeGroup && d.incomeGroup !== 'Unknown');
  }, [data]);

  const groups = ['High Income', 'Upper-Middle', 'Lower-Middle', 'Low Income'] as const;

  const regionValues = Array.from(new Set(filtered.map((d) => d.region).filter(Boolean))) as string[];
  const colorScale = d3.scaleOrdinal<string, string>().domain(regionValues).range(d3.schemeTableau10);

  const growthValues = filtered.map((d) => (d.gdppcGrowthMA5 ?? d.gdppcGrowth) as number);
  const yMin = d3.quantile(growthValues, 0.05) ?? -5;
  const yMax = d3.quantile(growthValues, 0.95) ?? 10;

  const facetWidth = 420;
  const facetHeight = 260;
  const margin = { top: 28, right: 16, bottom: 48, left: 52 };

  const xScale = d3.scaleLinear().domain([0, 1]).range([margin.left, facetWidth - margin.right]);
  const yScale = d3
    .scaleLinear()
    .domain([yMin - 1, yMax + 1])
    .range([facetHeight - margin.bottom, margin.top]);

  const regressionByGroup: Record<string, { slope: number; intercept: number }> = {};
  groups.forEach((g) => {
    const pts = filtered
      .filter((d) => d.incomeGroup === g)
      .map((d) => ({ x: d.polyarchy as number, y: (d.gdppcGrowthMA5 ?? d.gdppcGrowth) as number }));
    regressionByGroup[g] = computeRegression(pts);
  });

  return (
    <div className="card">
      <div className="legend">
        {regionValues.map((r) => (
          <span key={r} className="legend-item">
            <span className="legend-swatch" style={{ background: colorScale(r) }} />
            {r}
          </span>
        ))}
      </div>
      <div className="facet-grid">
        {groups.map((group) => {
          const points = filtered.filter((d) => d.incomeGroup === group);
          const regression = regressionByGroup[group];
          const regLine = [
            { x: 0.05, y: regression.slope * 0.05 + regression.intercept },
            { x: 0.95, y: regression.slope * 0.95 + regression.intercept },
          ];
          return (
            <svg
              key={group}
              viewBox={`0 0 ${facetWidth} ${facetHeight}`}
              className="chart facet"
              role="img"
              aria-label={`${group} facet`}
            >
              {d3.ticks(0, 1, 4).map((t) => (
                <g key={`x-${t}`} transform={`translate(${xScale(t)},0)`}>
                  <line y1={margin.top} y2={facetHeight - margin.bottom} className="grid" strokeDasharray="2 4" />
                  <text y={facetHeight - margin.bottom + 16} className="tick" textAnchor="middle">
                    {t.toFixed(1)}
                  </text>
                </g>
              ))}
              {d3.ticks(yMin, yMax, 4).map((t) => (
                <g key={`y-${t}`} transform={`translate(0,${yScale(t)})`}>
                  <line x1={margin.left} x2={facetWidth - margin.right} className="grid" strokeDasharray="2 4" />
                  <text x={margin.left - 10} className="tick" textAnchor="end">
                    {t.toFixed(0)}%
                  </text>
                </g>
              ))}

              <text x={margin.left} y={margin.top - 8} className="facet-title">
                {group}
              </text>

              <g>
                {points.map((d, i) => (
                  <circle
                    key={i}
                    cx={xScale(d.polyarchy as number)}
                    cy={yScale((d.gdppcGrowthMA5 ?? d.gdppcGrowth) as number)}
                    r={Math.max(3, Math.sqrt((d.population ?? 1) / 80_000_000) * 8)}
                    fill={colorScale(d.region ?? regionValues[0])}
                    opacity={0.7}
                  />
                ))}

                <line
                  x1={xScale(regLine[0].x)}
                  y1={yScale(regLine[0].y)}
                  x2={xScale(regLine[1].x)}
                  y2={yScale(regLine[1].y)}
                  stroke="#f0abfc"
                  strokeWidth={3}
                />
              </g>
            </svg>
          );
        })}
      </div>
      <div className="footnote">소득 집단별로 보면 관계가 달라진다. 지역은 색, 원 크기는 인구 규모를 의미한다.</div>
    </div>
  );
}
