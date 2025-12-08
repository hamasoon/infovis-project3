import { useMemo } from 'react';
import * as d3 from 'd3';
import type { VDemRow } from '../../types';
import { computeRegression } from '../../utils/dataTransforms';

export function PriceOfLibertyChart({ data }: { data: VDemRow[] }) {
  const filtered = useMemo(
    () =>
      data
        .filter((d) => d.year >= 2000 && d.year <= 2019)
        .filter((d) => (d.population ?? 0) > 10_000_000)
        .filter((d) => d.polyarchy !== null && d.gdpGrowth !== null),
    [data],
  );

  const width = 880;
  const height = 520;
  const margin = { top: 28, right: 24, bottom: 52, left: 70 };

  if (!filtered.length) {
    return <div className="callout">충분한 데이터가 없습니다.</div>;
  }

  const growthValues = filtered.map((d) => d.gdpGrowth as number);
  const lower = d3.quantile(growthValues, 0.05) ?? -5;
  const upper = d3.quantile(growthValues, 0.95) ?? 10;

  const xScale = d3.scaleLinear().domain([0, 1]).range([margin.left, width - margin.right]);
  const yScale = d3
    .scaleLinear()
    .domain([upper + 1, lower - 1])
    .range([margin.top, height - margin.bottom]);

  const regression = computeRegression(
    filtered.map((d) => ({ x: d.polyarchy as number, y: d.gdpGrowth as number })),
  );

  const regressionLine: Array<{ x: number; y: number }> = [
    { x: 0.02, y: regression.slope * 0.02 + regression.intercept },
    { x: 0.98, y: regression.slope * 0.98 + regression.intercept },
  ];

  const featuredNames = [
    'China',
    'Vietnam',
    'Ethiopia',
    'United States of America',
    'Germany',
    'France',
  ];

  const featured = featuredNames
    .map((name) => {
      const candidate = filtered
        .filter((d) => d.country === name)
        .slice()
        .sort((a, b) => b.year - a.year)[0];
      return candidate ? { ...candidate, label: name } : null;
    })
    .filter(Boolean) as Array<VDemRow & { label: string }>;

  const xTicks = d3.ticks(0, 1, 5);
  const yTicks = d3.ticks(lower, upper, 6);

  return (
    <div className="card">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart">
        <defs>
          <clipPath id="plot-area">
            <rect
              x={margin.left}
              y={margin.top}
              width={width - margin.left - margin.right}
              height={height - margin.top - margin.bottom}
            />
          </clipPath>
        </defs>

        {xTicks.map((t) => (
          <g key={`x-${t}`} transform={`translate(${xScale(t)},0)`}>
            <line y1={margin.top} y2={height - margin.bottom} className="grid" strokeDasharray="3 5" />
            <text y={height - margin.bottom + 20} className="tick" textAnchor="middle">
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        {yTicks.map((t) => (
          <g key={`y-${t}`} transform={`translate(0,${yScale(t)})`}>
            <line x1={margin.left} x2={width - margin.right} className="grid" strokeDasharray="3 5" />
            <text x={margin.left - 10} className="tick" textAnchor="end">
              {t.toFixed(1)}%
            </text>
          </g>
        ))}

        <text x={width / 2} y={height - 12} className="axis-label" textAnchor="middle">
          v2x_polyarchy (민주주의 지수 0~1)
        </text>
        <text x={-height / 2} y={18} className="axis-label" transform="rotate(-90)" textAnchor="middle">
          GDP 성장률(연간, %) — 인구 1천만 명 이상 샘플
        </text>

        <g clipPath="url(#plot-area)">
          {filtered.map((d, i) => (
            <circle
              key={i}
              cx={xScale(d.polyarchy as number)}
              cy={yScale(d.gdpGrowth as number)}
              r={3.4}
              fill="rgba(220, 222, 227, 0.65)"
            />
          ))}

          <line
            x1={xScale(regressionLine[0].x)}
            y1={yScale(regressionLine[0].y)}
            x2={xScale(regressionLine[1].x)}
            y2={yScale(regressionLine[1].y)}
            stroke="#ff4f4f"
            strokeWidth={3}
          />

          {featured.map((f) => (
            <g key={f.label}>
              <circle
                cx={xScale(f.polyarchy as number)}
                cy={yScale(f.gdpGrowth as number)}
                r={6}
                fill="#4fe0a3"
                stroke="#0f172a"
                strokeWidth={2}
              />
              <text x={xScale(f.polyarchy as number) + 8} y={yScale(f.gdpGrowth as number) - 8} className="tag">
                {f.label}
              </text>
            </g>
          ))}
        </g>
      </svg>
      <div className="footnote">
        상관관계가 약한 지표에 회귀선을 억지로 그리면 관계가 강한 것처럼 보일 수 있습니다. 설명력이 낮은 변수 조합에는 신중해야 합니다.
      </div>
    </div>
  );
}
