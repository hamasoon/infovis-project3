import { useMemo } from 'react';
import * as d3 from 'd3';
import type { VDemRow } from '../../types';
import { computeRegression } from '../../utils/dataTransforms';

type Point = { x: number; y: number; country?: string };
type Bucket = { id: string; label: string; color: string; points: Point[] };

const geometricMean = (values: number[]): number | null => {
  const valid = values.filter((v) => v > 0);
  if (!valid.length) return null;
  const meanLog = d3.mean(valid, (v) => Math.log(v));
  return meanLog == null ? null : Math.exp(meanLog);
};

const bucketMeta: Bucket[] = [
  { id: 'q1', label: '1분위(저소득)', color: '#5ea9ff', points: [] },
  { id: 'q2', label: '2분위', color: '#22d3ee', points: [] },
  { id: 'q3', label: '3분위', color: '#a855f7', points: [] },
  { id: 'q4', label: '4분위(고소득)', color: '#f59e0b', points: [] },
];

export function HonestFacetedScatter({ data }: { data: VDemRow[] }) {
  const filtered = useMemo(
    () =>
      data.filter(
        (d) =>
          d.year >= 2010 &&
          d.year <= 2019 &&
          d.polyarchy !== null &&
          d.gdpGrowth !== null &&
          d.gdppc !== null,
      ),
    [data],
  );

  const buckets = useMemo(() => {
    // 국가별로 2000~2019 평균 계산
    const byCountry = d3.group(filtered, (d) => d.country);
    const countryPoints: Array<{ x: number; y: number; g: number; country: string }> = [];
    byCountry.forEach((rows, country) => {
      const xs = rows.map((r) => r.polyarchy).filter((v): v is number => v != null && v > 0);
      const gdpGrowthFactors = rows
        .map((r) => r.gdpGrowth)
        .filter((v): v is number => v != null)
        .map((v) => 1 + v / 100)
        .filter((v) => v > 0);
      const gs = rows.map((r) => r.gdppc).filter((v): v is number => v != null && v > 0);

      const x = geometricMean(xs);
      const growthFactor = geometricMean(gdpGrowthFactors);
      const y = growthFactor == null ? null : (growthFactor - 1) * 100;
      const g = geometricMean(gs);
      if (x == null || y == null || g == null) return;
      countryPoints.push({ x, y, g, country });
    });

    const gdppcValues = countryPoints.map((p) => p.g);
    const q1 = d3.quantile(gdppcValues, 0.25) ?? 0;
    const q2 = d3.quantile(gdppcValues, 0.5) ?? q1;
    const q3 = d3.quantile(gdppcValues, 0.75) ?? q2;

    const bucketFor = (v: number): string => {
      if (v <= q1) return 'q1';
      if (v <= q2) return 'q2';
      if (v <= q3) return 'q3';
      return 'q4';
    };

    const acc: Record<string, Bucket> = {};
    bucketMeta.forEach((b) => {
      acc[b.id] = { ...b, points: [] };
    });

    countryPoints.forEach((p) => {
      const key = bucketFor(p.g);
      acc[key].points.push({ x: p.x, y: p.y, country: p.country });
    });

    return bucketMeta.map((b) => acc[b.id]);
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

  const panelWidth = 340;
  const panelHeight = 260;
  const margin = { top: 32, right: 18, bottom: 32, left: 42 };

  const xTicks = d3.ticks(xDomain[0], xDomain[1], 5);
  const yTicks = d3.ticks(yDomain[0], yDomain[1], 4);

  return (
    <div className="card">
      <div className="legend">
        {bucketMeta.map((b) => (
          <span key={b.id} className="legend-item">
            <span className="legend-swatch" style={{ background: b.color }} />
            {b.label}
          </span>
        ))}
      </div>
      <div className="facet-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
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
        2000~2019년 1인당 GDP를 사분위로 4개 소득 구간으로 나누고 같은 축을 사용했습니다. 각 패널의 추세선만 남겨
        그룹별 패턴을 강조합니다.
      </div>
    </div>
  );
}
