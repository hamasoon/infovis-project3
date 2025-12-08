import { useMemo } from 'react';
import * as d3 from 'd3';
import type { VDemRow } from '../../types';

export function HonestRegimeDistribution({ data }: { data: VDemRow[] }) {
  const regimes: Array<{ code: number; label: string }> = [
    { code: 0, label: '독재·폐쇄' },
    { code: 1, label: '부분 폐쇄' },
    { code: 2, label: '부분 민주주의' },
    { code: 3, label: '자유 민주주의' },
  ];

  const grouped = useMemo(() => {
    const bucket: Record<number, number[]> = {};
    regimes.forEach((r) => (bucket[r.code] = []));
    data
      .filter((d) => d.year >= 1990 && d.year <= 2019)
      .forEach((d) => {
        if (d.regime == null || d.gdppcGrowth == null) return;
        if (!(d.regime in bucket)) return;
        bucket[d.regime].push(d.gdppcGrowth);
      });
    return bucket;
  }, [data, regimes]);

  const allValues = Object.values(grouped).flat();
  if (!allValues.length) return <div className="callout">성장률 분포 데이터가 없습니다.</div>;

  const yDomain = [
    d3.quantile(allValues, 0.02) ?? -15,
    d3.quantile(allValues, 0.98) ?? 15,
  ] as [number, number];

  const width = 900;
  const height = 480;
  const margin = { top: 30, right: 20, bottom: 60, left: 70 };

  const xScale = d3
    .scalePoint<number>()
    .domain(regimes.map((r) => r.code))
    .range([margin.left, width - margin.right])
    .padding(0.5);

  const yScale = d3.scaleLinear().domain(yDomain).range([height - margin.bottom, margin.top]);

  const color = d3.scaleOrdinal<number, string>().domain([0, 1, 2, 3]).range(d3.schemeTableau10);

  const summaries = regimes.map((r) => {
    const vals = grouped[r.code].slice().sort((a, b) => a - b);
    const q1 = d3.quantile(vals, 0.25) ?? 0;
    const q2 = d3.quantile(vals, 0.5) ?? 0;
    const q3 = d3.quantile(vals, 0.75) ?? 0;
    const iqr = q3 - q1;
    const lower = vals.find((v) => v >= q1 - 1.5 * iqr) ?? vals[0];
    const upper = [...vals].reverse().find((v) => v <= q3 + 1.5 * iqr) ?? vals[vals.length - 1];
    return { code: r.code, label: r.label, q1, q2, q3, lower, upper, vals };
  });

  return (
    <div className="card">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart">
        {d3.ticks(yDomain[0], yDomain[1], 6).map((t) => (
          <g key={t} transform={`translate(0,${yScale(t)})`}>
            <line x1={margin.left} x2={width - margin.right} className="grid" strokeDasharray="3 4" />
            <text x={margin.left - 10} className="tick" textAnchor="end">
              {t.toFixed(1)}%
            </text>
          </g>
        ))}

        <text x={-height / 2} y={24} className="axis-label" transform="rotate(-90)" textAnchor="middle">
          연간 1인당 GDP 성장률(%)
        </text>
        <text x={width / 2} y={height - 12} className="axis-label" textAnchor="middle">
          통치 유형 (v2x_regime)
        </text>

        {summaries.map((s) => {
          const x = xScale(s.code) ?? 0;
          const jitter = grouped[s.code].map((_, i) => {
            const rand = Math.sin(i * 997 + s.code * 13) * 0.5 + 0.5;
            return x + (rand - 0.5) * 30;
          });
          return (
            <g key={s.code}>
              <line x1={x - 12} x2={x + 12} y1={yScale(s.lower)} y2={yScale(s.lower)} stroke={color(s.code)} />
              <line x1={x} x2={x} y1={yScale(s.lower)} y2={yScale(s.upper)} stroke={color(s.code)} />
              <line x1={x - 12} x2={x + 12} y1={yScale(s.upper)} y2={yScale(s.upper)} stroke={color(s.code)} />

              <rect
                x={x - 20}
                y={yScale(s.q3)}
                width={40}
                height={yScale(s.q1) - yScale(s.q3)}
                fill={color(s.code)}
                opacity={0.4}
                stroke={color(s.code)}
              />
              <line x1={x - 20} x2={x + 20} y1={yScale(s.q2)} y2={yScale(s.q2)} stroke="#0f172a" strokeWidth={2} />

              {grouped[s.code].map((v, idx) => (
                <circle key={idx} cx={jitter[idx]} cy={yScale(v)} r={4} fill={color(s.code)} opacity={0.55} />
              ))}

              <text x={x} y={height - margin.bottom + 26} textAnchor="middle" className="tick">
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="footnote">
        통치 유형별 성장률 분포. 독재 집단은 범위가 넓어 불확실성이 크고, 자유민주주의는 상대적으로 안정적이다.
      </div>
    </div>
  );
}
