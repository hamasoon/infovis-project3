import { useMemo } from 'react';
import * as d3 from 'd3';
import type { VDemRow } from '../../types';
import { computeRegression } from '../../utils/dataTransforms';

type Point = { x: number; y: number };
type Bucket = { id: string; label: string; color: string; points: Point[] };

const bucketMeta: Bucket[] = [
  { id: 'low', label: '저소득', color: '#5ea9ff', points: [] },
  { id: 'mid', label: '중간', color: '#a855f7', points: [] },
  { id: 'high', label: '고소득', color: '#f59e0b', points: [] },
];

export function HonestFacetedScatter({ data }: { data: VDemRow[] }) {
  const filtered = useMemo(
    () =>
      data.filter(
        (d) =>
          d.year == 2019 &&
          d.polyarchy !== null &&
          d.gdpGrowth !== null &&
          d.gdppc !== null,
      ),
    [data],
  );

  const buckets = useMemo(() => {
    const gdppcValues = filtered.map((d) => d.gdppc as number);
    const q33 = d3.quantile(gdppcValues, 1 / 3) ?? 0;
    const q66 = d3.quantile(gdppcValues, 2 / 3) ?? q33;

    const bucketFor = (v: number): string => {
      if (v <= q33) return 'low';
      if (v <= q66) return 'mid';
      return 'high';
    };

    const acc: Record<string, Bucket> = {};
    bucketMeta.forEach((b) => {
      acc[b.id] = { ...b, points: [] };
    });

    filtered.forEach((d) => {
      const key = bucketFor(d.gdppc as number);
      acc[key].points.push({ x: d.polyarchy as number, y: d.gdpGrowth as number });
    });

    return Object.values(acc);
  }, [filtered]);

  const allPoints = buckets.flatMap((b) => b.points);
  if (!allPoints.length) return <div className="callout">소득 그룹별로 보여줄 데이터가 없습니다.</div>;

  const xDomain: [number, number] = [0, 1];
  const yDomain: [number, number] = [
    d3.quantile(
      allPoints.map((p) => p.y),
      0.02,
    ) ?? -10,
    d3.quantile(
      allPoints.map((p) => p.y),
      0.98,
    ) ?? 10,
  ];

  const panelWidth = 320;
  const panelHeight = 260;
  const margin = { top: 32, right: 18, bottom: 32, left: 42 };

  const xTicks = d3.ticks(xDomain[0], xDomain[1], 5);
  const yTicks = d3.ticks(yDomain[0], yDomain[1], 4);

  return (
    <div className="card">
      <div className="legend">
        {buckets.map((b) => (
          <span key={b.id} className="legend-item">
            <span className="legend-swatch" style={{ background: b.color }} />
            {b.label}
          </span>
        ))}
      </div>
      <div className="facet-grid">
        {buckets.map((bucket) => {
          const xScale = d3.scaleLinear().domain(xDomain).range([margin.left, panelWidth - margin.right]);
          const yScale = d3.scaleLinear().domain(yDomain).range([panelHeight - margin.bottom, margin.top]);

          const { slope, intercept } = computeRegression(bucket.points);
          const trendLine: Point[] =
            bucket.points.length >= 2
              ? [
                  { x: xDomain[0], y: slope * xDomain[0] + intercept },
                  { x: xDomain[1], y: slope * xDomain[1] + intercept },
                ]
              : [];

          return (
            <svg key={bucket.id} viewBox={`0 0 ${panelWidth} ${panelHeight}`} className="chart">
              {xTicks.map((t) => (
                <g key={`x-${t}`} transform={`translate(${xScale(t)},0)`}>
                  <line y1={margin.top} y2={panelHeight - margin.bottom} className="grid" strokeDasharray="2 4" />
                  <text y={panelHeight - margin.bottom + 18} className="tick" textAnchor="middle">
                    {t.toFixed(1)}
                  </text>
                </g>
              ))}
              {yTicks.map((t) => (
                <g key={`y-${t}`} transform={`translate(0,${yScale(t)})`}>
                  <line x1={margin.left} x2={panelWidth - margin.right} className="grid" strokeDasharray="2 4" />
                  <text x={margin.left - 10} className="tick" textAnchor="end">
                    {t.toFixed(1)}%
                  </text>
                </g>
              ))}

              <text x={margin.left} y={margin.top - 12} className="facet-title">
                {bucket.label} · n={bucket.points.length}
              </text>

              {trendLine.length > 0 && (
                <line
                  x1={xScale(trendLine[0].x)}
                  x2={xScale(trendLine[1].x)}
                  y1={yScale(trendLine[0].y)}
                  y2={yScale(trendLine[1].y)}
                  stroke={bucket.color}
                  strokeWidth={3}
                  strokeDasharray="6 3"
                  opacity={0.9}
                />
              )}

              {bucket.points.map((p, i) => (
                <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={3.4} fill={bucket.color} opacity={0.75} />
              ))}

              {bucket.points.length === 0 && (
                <text
                  x={(margin.left + panelWidth - margin.right) / 2}
                  y={(margin.top + panelHeight - margin.bottom) / 2}
                  className="tick"
                  textAnchor="middle"
                >
                  데이터 없음
                </text>
              )}
            </svg>
          );
        })}
      </div>
      <div className="footnote">
        2019년 1인당 GDP 삼분위로 3개 소득 구간을 만들고 같은 축을 사용했습니다. 각 패널의 추세선만 남겨 전체적 착시 없이 그룹별 패턴을 강조합니다.
      </div>
    </div>
  );
}
