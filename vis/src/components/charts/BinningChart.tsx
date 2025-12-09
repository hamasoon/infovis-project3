import { useMemo } from 'react';
import * as d3 from 'd3';
import type { VDemRow } from '../../types';

export function BinningChart({ data }: { data: VDemRow[] }) {
  const bins = useMemo(() => {
    const filtered = data.filter(
      (d) =>
        d.year >= 2000 &&
        d.year <= 2019 &&
        d.polyarchy !== null &&
        d.gdppcGrowth !== null &&
        !Number.isNaN(d.gdppcGrowth),
    );
    const acc = Array.from({ length: 10 }, (_, idx) => ({
      idx,
      weightedSum: 0,
      weight: 0,
    }));
    filtered.forEach((d) => {
      const binIndex = Math.min(9, Math.floor((d.polyarchy as number) * 10));
      const weight = d.population ?? 1;
      acc[binIndex].weightedSum += (d.gdppcGrowth as number) * weight;
      acc[binIndex].weight += weight;
    });
    return acc.map((b) => ({
      idx: b.idx,
      mean: b.weight ? b.weightedSum / b.weight : null,
    }));
  }, [data]);

  const width = 880;
  const height = 460;
  const margin = { top: 24, right: 18, bottom: 60, left: 72 };

  const maxMean =
    d3.max(
      bins
        .map((b) => b.mean)
        .filter((v): v is number => v !== null && Number.isFinite(v)),
    ) ?? 0;

  const yScale = d3
    .scaleLinear()
    .domain([0, Math.max(8, maxMean + 1)])
    .range([height - margin.bottom, margin.top]);

  const xScale = d3
    .scaleBand()
    .domain(bins.map((b) => b.idx.toString()))
    .range([margin.left, width - margin.right])
    .paddingInner(0.12);

  const palette = [
    '#2dd4bf',
    '#34d399',
    '#4ade80',
    '#60d3a4',
    '#86c7b2',
    '#a7b8b8',
    '#c2a68b',
    '#d9966a',
    '#e87948',
    '#f97316',
  ];

  const trendPoints = bins
    .map((b) => ({
      x: (xScale(b.idx.toString()) ?? 0) + xScale.bandwidth() / 2,
      y: b.mean === null ? null : yScale(b.mean),
    }))
    .filter((p) => p.y !== null) as Array<{ x: number; y: number }>;

  const trendPath = d3
    .line<{ x: number; y: number }>()
    .curve(d3.curveBasis)
    .x((d) => d.x)
    .y((d) => d.y)(trendPoints) ?? '';

  return (
    <div className="card">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart">
        {d3.ticks(0, Math.max(8, maxMean + 1), 5).map((t) => (
          <g key={t} transform={`translate(0,${yScale(t)})`}>
            <line x1={margin.left} x2={width - margin.right} className="grid" strokeDasharray="3 4" />
            <text x={margin.left - 10} className="tick" textAnchor="end">
              {t.toFixed(1)}%
            </text>
          </g>
        ))}

        {bins.map((b) => {
          const x = xScale(b.idx.toString()) ?? margin.left;
          const barWidth = xScale.bandwidth();
          const barY = b.mean === null ? yScale(0) : yScale(b.mean);
          const heightPx = b.mean === null ? 0 : yScale(0) - yScale(Math.max(0, b.mean as number));
          return (
            <g key={b.idx}>
              <rect x={x} y={barY} width={barWidth} height={heightPx} fill={palette[b.idx]} rx={6} />
              <text x={x + barWidth / 2} y={yScale(0) + 18} className="tick" textAnchor="middle">
                {b.mean === null ? '-' : b.mean.toFixed(1)}%
              </text>
            </g>
          );
        })}

        <path d={trendPath} fill="none" stroke="#0ea5e9" strokeWidth={3} />

        <text
          x={(xScale('0') ?? margin.left) + xScale.bandwidth() / 2}
          y={height - margin.bottom + 30}
          className="axis-label"
          textAnchor="middle"
        >
          1분위
        </text>
        <text
          x={(xScale('9') ?? width - margin.right) + xScale.bandwidth() / 2 - 20}
          y={height - margin.bottom + 30}
          className="axis-label"
          textAnchor="middle"
        >
          10분위 (자유민주주의)
        </text>

        <text x={-height / 2} y={22} className="axis-label" transform="rotate(-90)" textAnchor="middle">
          인구가중 1인당 GDP 성장률
        </text>
      </svg>
      <div className="footnote">
        10분위 구간별 인구가중 평균 성장률. 민주주의가 높을수록 변동성이 줄어드는 패턴을 볼 수 있다.
      </div>
    </div>
  );
}
