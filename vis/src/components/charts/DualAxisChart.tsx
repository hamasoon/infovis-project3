import { useMemo } from 'react';
import * as d3 from 'd3';
import type { VDemRow } from '../../types';

export function DualAxisChart({ data, country }: { data: VDemRow[]; country: string }) {
  const series = useMemo(
    () =>
      data
        .filter((d) => d.country === country && d.year >= 2014 && d.year <= 2019)
        .filter((d) => d.polyarchy !== null),
    [country, data],
  )
    .slice()
    .sort((a, b) => a.year - b.year);

  const width = 840;
  const height = 440;
  const margin = { top: 32, right: 80, bottom: 40, left: 80 };

  if (!series.length) {
    return <div className="callout">해당 국가의 데이터가 없습니다.</div>;
  }

  const years = series.map((d) => d.year);
  const xScale = d3.scalePoint<number>().domain(years).range([margin.left, width - margin.right]);

  const polyScale = d3
    .scaleLinear()
    .domain([0.4, 0.65])
    .range([height - margin.bottom, margin.top]);

  const growthScale = d3.scaleLinear().domain([7, 2]).range([height - margin.bottom, margin.top]);

  const polyPath =
    d3
      .line<VDemRow>()
      .x((d) => xScale(d.year) as number)
      .y((d) => polyScale(d.polyarchy as number))
      .curve(d3.curveMonotoneX)(series.filter((d) => d.polyarchy !== null)) ?? '';

  const growthSeries = series.filter((d) => d.gdpGrowth !== null);
  const growthPath =
    d3
      .line<VDemRow>()
      .x((d) => xScale(d.year) as number)
      .y((d) => growthScale(d.gdpGrowth as number))
      .curve(d3.curveCatmullRom.alpha(0.5))(growthSeries) ?? '';

  return (
    <div className="card">
      <div className="dual-legend">
        <span className="legend-dot blue" /> 민주주의 지수(0.30~0.65)
        <span className="legend-dot green" /> GDP 성장률(2%~8%)
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart">
        {years.map((year) => {
          const x = xScale(year) ?? 0;
          return (
            <g key={year} transform={`translate(${x},0)`}>
              <line y1={margin.top} y2={height - margin.bottom} className="grid" strokeDasharray="2 4" />
              <text y={height - margin.bottom + 18} className="tick" textAnchor="middle">
                {year}
              </text>
            </g>
          );
        })}

        {d3.ticks(0.4, 0.65, 4).map((t) => (
          <g key={`poly-${t}`} transform={`translate(0,${polyScale(t)})`}>
            <text x={margin.left - 12} className="tick" textAnchor="end">
              {t.toFixed(2)}
            </text>
          </g>
        ))}

        {d3.ticks(2, 7, 3).map((t) => (
          <g key={`growth-${t}`} transform={`translate(0,${growthScale(t)})`}>
            <text x={width - margin.right + 36} className="tick" textAnchor="end">
              {t.toFixed(1)}%
            </text>
          </g>
        ))}

        <path d={polyPath} fill="none" stroke="#5ea9ff" strokeWidth={3} />
        <path d={growthPath} fill="none" stroke="#3dd68c" strokeWidth={3} strokeDasharray="6 2" />

        {growthSeries.map((d, idx) => (
          <circle
            key={idx}
            cx={xScale(d.year) ?? 0}
            cy={growthScale(d.gdpGrowth as number)}
            r={6}
            fill="#3dd68c"
            stroke="#0f172a"
            strokeWidth={2}
          />
        ))}

        {series.map((d, idx) => (
          <circle
            key={`poly-${idx}`}
            cx={xScale(d.year) ?? 0}
            cy={polyScale(d.polyarchy as number)}
            r={6}
            fill="#5ea9ff"
            stroke="#0f172a"
            strokeWidth={2}
          />
        ))}

        <g>
          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={growthScale(4.5)}
            y2={growthScale(4.5)}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            opacity={0.6}
          />
          <text x={width - margin.right} y={growthScale(4.5) - 8} className="tag" textAnchor="end">
            성장 회복선
          </text>
        </g>
      </svg>
      <div className="footnote">
        일반 축을 사용해 성장률과 민주주의 지수를 함께 읽습니다. 2020~2022 구간은 의도적으로 비워두었습니다.
      </div>
    </div>
  );
}
