import { useMemo, useState } from 'react';
import * as d3 from 'd3';
import './App.css';
import { Section } from './components/Section';
import { Switcher, type SwitcherMode } from './components/Switcher';
import { PriceOfLibertyChart } from './components/charts/PriceOfLibertyChart';
import { HonestFacetedScatter } from './components/charts/HonestFacetedScatter';
import { HonestIndexChart } from './components/charts/HonestIndexChart';
import { DualAxisChart } from './components/charts/DualAxisChart';
import { BinningChart } from './components/charts/BinningChart';
import { HonestRegimeDistribution } from './components/charts/HonestRegimeDistribution';
import { useVdemData } from './hooks/useVdemData';
import { addDerived } from './utils/dataTransforms';

function App() {
  const { data, loading, error } = useVdemData();
  const enriched = useMemo(() => addDerived(data), [data]);

  const coverage = useMemo(() => {
    if (!enriched.length) return null;
    const years = d3.extent(enriched, (d) => d.year);
    const gdpYears = d3.extent(
      enriched.filter((d) => d.gdp !== null),
      (d) => d.year,
    );
    return {
      rows: enriched.length,
      years,
      gdpYears,
    };
  }, [enriched]);

  const [mode1, setMode1] = useState<SwitcherMode>('honest');
  const [mode2, setMode2] = useState<SwitcherMode>('honest');
  const [mode3, setMode3] = useState<SwitcherMode>('honest');

  if (loading) return <div className="callout">데이터 로딩 중…</div>;
  if (error) return <div className="callout error">데이터를 불러오지 못했습니다: {error}</div>;

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Honest Visualization · V-Dem v15</p>
          <h1>민주주의와 경제성장 교차 시각화</h1>
          <p className="lede">
            V-Dem v15 민주주의 지수와 GDP/인구 데이터를 묶어, 같은 데이터를 어떻게 보여주느냐에 따라 메시지가
            어떻게 달라지는지 살펴봅니다. 의도적 왜곡 없이 정직한 시각화를 제시하고, 잘못된 예시도 함께
            비교합니다.
          </p>
        </div>
        <div className="meta">
          <div className="pill">Source: public/asset/V-Dem-CY-Full+Others-v15.csv</div>
          {coverage && (
            <p className="meta-detail">
              {coverage.rows.toLocaleString()} rows · democracy 1990-
              {coverage.years?.[1] ?? '없음'} · GDP data 1990-
              {coverage.gdpYears?.[1] ?? '2019'}
            </p>
          )}
        </div>
      </header>

      <main className="content">
        <Section title="성장 vs 민주주의" kicker="Growth vs. Democracy">
          <p className="section-copy">
            같은 데이터를 두고도 메시지는 달라질 수 있습니다. 정직한 버전은 소득수준별로 나눠 추세를 보여주고,
            왜곡된 버전은 일부 국가만 강조해 상관관계를 과장합니다.
          </p>
          <Switcher mode={mode1} onChange={setMode1} />
          {mode1 === 'honest' ? <HonestFacetedScatter data={enriched} /> : <PriceOfLibertyChart data={enriched} />}
        </Section>

        <Section title="시계열 지표 비교" kicker="Indexed Time Series">
          <p className="section-copy">
            두 나라의 1인당 GDP를 2004년=100으로 지수화하고 민주주의 지수(0~100)와 함께 그립니다. 잘못된 예시는
            축을 뒤집거나 다른 단위를 섞어 오해를 유도합니다.
          </p>
          <Switcher mode={mode2} onChange={setMode2} />
          {mode2 === 'honest' ? <HonestIndexChart data={enriched} /> : <DualAxisChart data={enriched} country="India" />}
        </Section>

        <Section title="성장 리스크 분포" kicker="Distribution of Growth Risk">
          <p className="section-copy">
            민주주의 수준을 10분위로 나눠 성장률 분포를 비교합니다. 정직한 버전은 박스플롯과 점으로 변동성을
            보여주고, 왜곡된 버전은 임의의 빈과 색으로 패턴을 과장합니다.
          </p>
          <Switcher mode={mode3} onChange={setMode3} />
          {mode3 === 'honest' ? <HonestRegimeDistribution data={enriched} /> : <BinningChart data={enriched} />}
        </Section>
      </main>
    </div>
  );
}

export default App;
