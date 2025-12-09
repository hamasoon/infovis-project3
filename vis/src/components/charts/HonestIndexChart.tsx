import { useMemo } from 'react';
import * as d3 from 'd3';
import type { VDemRow } from '../../types';

const preferredCountries = ['India', 'Brazil', 'United States of America', 'South Africa', 'Indonesia'];

export function HonestIndexChart({ data }: { data: VDemRow[] }) {
  const country = useMemo(() => {
    const yearFiltered = data.filter((d) => d.year >= 2000 && d.year <= 2019 && d.polyarchy !== null);
    for (const name of preferredCountries) {
      if (yearFiltered.some((d) => d.country === name)) return name;
    }
    const best = d3
      .rollups(
        yearFiltered,
        (rows) => rows.length,
        (d) => d.country,
      )
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    return best ?? '';
  }, [data]);

  const series = useMemo(
    () =>
      data
        .filter((d) => d.country === country && d.year >= 2000 && d.year <= 2019)
        .filter((d) => d.polyarchy !== null)
        .slice()
        .sort((a, b) => a.year - b.year),
    [country, data],
  );

  if (!country || !series.length) {
    return <div className="callout">해당 구간에 사용할 수 있는 시계열 데이터가 없습니다.</div>;
  }

  const width = 880;
  const height = 480;
  const margin = { top: 32, right: 90, bottom: 44, left: 80 };

  const years = series.map((d) => d.year);
  const xScale = d3.scalePoint<number>().domain(years).range([margin.left, width - margin.right]);

  const polyScale = d3.scaleLinear().domain([0, 1]).range([height - margin.bottom, margin.top]);
  const growthScale = d3.scaleLinear().domain([0, 10]).range([height - margin.bottom, margin.top]);

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
        <span className="legend-dot blue" /> 민주주의 지수(0~1)
        <span className="legend-dot green" /> GDP 성장률(0%~10%) — {country}
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

        {d3.ticks(0, 1, 4).map((t) => (
          <g key={`poly-${t}`} transform={`translate(0,${polyScale(t)})`}>
            <text x={margin.left - 12} className="tick" textAnchor="end">
              {t.toFixed(2)}
            </text>
          </g>
        ))}

        {d3.ticks(0, 10, 3).map((t) => (
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
        역축이나 단위 뒤집기 없이 같은 데이터를 보여줍니다. 민주주의 지수(왼쪽)와 성장률(오른쪽)이 모두 위로 갈수록
        커지는 표준 축입니다.
      </div>
    </div>
  );
}
