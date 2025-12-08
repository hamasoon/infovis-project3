import { useMemo } from 'react';
import * as d3 from 'd3';
import type { VDemRow } from '../../types';

export function HonestIndexChart({ data }: { data: VDemRow[] }) {
  const focus = ['Poland', 'Hungary'];
  const series = useMemo(() => {
    const map = new Map<string, VDemRow[]>();
    focus.forEach((c) => map.set(c, []));
    data
      .filter((d) => focus.includes(d.country))
      .filter((d) => d.year >= 1990)
      .forEach((d) => map.get(d.country)?.push(d));
    map.forEach((arr) => arr.sort((a, b) => a.year - b.year));
    return map;
  }, [data]);

  const prepared = Array.from(series.entries()).map(([country, rows]) => {
    const base =
      rows.find((r) => r.year === 2004 && r.gdppc !== null)?.gdppc ??
      rows.find((r) => r.gdppc)?.gdppc ??
      1;
    const points = rows
      .filter((r) => r.gdppc !== null && r.polyarchy !== null)
      .map((r) => ({
        year: r.year,
        index: ((r.gdppc as number) / base) * 100,
        poly: (r.polyarchy as number) * 100,
      }));
    return { country, points };
  });

  const allPoints = prepared.flatMap((p) => p.points);
  if (!allPoints.length) return <div className="callout">지표화할 데이터가 부족합니다.</div>;

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(allPoints, (p) => p.year) as [number, number])
    .range([80, 820]);
  const yScale = d3
    .scaleLog()
    .domain([50, d3.max(allPoints, (p) => Math.max(p.index, p.poly)) ?? 400])
    .range([380, 40]);
  const yMax = yScale.domain()[1] ?? 400;
  const colors = d3.scaleOrdinal<string, string>().domain(focus).range(['#22d3ee', '#f97316']);

  return (
    <div className="card">
      <div className="legend">
        {focus.map((c) => (
          <span key={c} className="legend-item">
            <span className="legend-swatch" style={{ background: colors(c) }} />
            {c}
          </span>
        ))}
        <span className="legend-item">
          <span className="legend-swatch" style={{ background: '#c084fc' }} /> 민주주의 지수(0~100)
        </span>
      </div>
      <svg viewBox="0 0 900 420" className="chart">
        {d3.ticks(xScale.domain()[0], xScale.domain()[1], 5).map((t) => (
          <g key={`x-${t}`} transform={`translate(${xScale(t)},0)`}>
            <line y1={40} y2={380} className="grid" strokeDasharray="2 4" />
            <text y={400} className="tick" textAnchor="middle">
              {t}
            </text>
          </g>
        ))}
        {d3.ticks(50, yMax, 5).map((t) => (
          <g key={`y-${t}`} transform={`translate(0,${yScale(t)})`}>
            <line x1={80} x2={840} className="grid" strokeDasharray="2 4" />
            <text x={70} className="tick" textAnchor="end">
              {Math.round(t)}
            </text>
          </g>
        ))}

        <text x={450} y={416} className="axis-label" textAnchor="middle">
          연도
        </text>
        <text x={-210} y={26} className="axis-label" transform="rotate(-90)" textAnchor="middle">
          1인당 GDP 지수(2004=100, 로그) / 민주주의 지수(0~100)
        </text>

        {prepared.map((s) => {
          const gdpPath = d3
            .line<typeof s.points[number]>()
            .x((p) => xScale(p.year))
            .y((p) => yScale(p.index))
            .curve(d3.curveMonotoneX)(s.points);
          const polyPath = d3
            .line<typeof s.points[number]>()
            .x((p) => xScale(p.year))
            .y((p) => yScale(p.poly))
            .curve(d3.curveMonotoneX)(s.points);
          return (
            <g key={s.country}>
              <path d={gdpPath ?? ''} fill="none" stroke={colors(s.country)} strokeWidth={3} />
              <path d={polyPath ?? ''} fill="none" stroke="#c084fc" strokeWidth={2} strokeDasharray="6 4" />
              {s.points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={xScale(p.year)}
                  cy={yScale(p.index)}
                  r={4}
                  fill={colors(s.country)}
                  stroke="#0f172a"
                  strokeWidth={1.5}
                />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="footnote">
        2004년 EU 가입 연도를 100으로 지수화했습니다. 보라색 선은 민주주의 지수, 다른 색은 1인당 GDP(로그)
        변화입니다.
      </div>
    </div>
  );
}
