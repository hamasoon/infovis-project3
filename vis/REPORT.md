# 프로젝트 보고서 (Honest Visualization 프로젝트)

이 문서는 전체 시각화 프로젝트의 구조와, 특히 “왜곡된” 시각화가 어떻게 구현되어 메시지를 비틀도록 설계되었는지 설명한다.

## 데이터와 전처리
- 원본: `public/data/vdem-lite.json` (V-Dem v15 요약 및 GDP/인구 지표).
- 전처리: `src/utils/dataTransforms.ts`의 `addDerived`가 국가별 연도 정렬 후 1인당 GDP 성장률(`gdppcGrowth`, 5년 이동평균 포함)을 계산해 데이터에 주입한다. 회귀선 계산은 `computeRegression`을 통해 최소제곱 직선으로 단순화한다.

## 섹션별 정직/왜곡 페어

### 1) 성장 vs 민주주의 (성장률 산점도)
- 정직: `src/components/charts/HonestFacetedScatter.tsx`  
  - 2000~2019년 데이터 전체를 사용해 1인당 GDP의 삼분위로 세 그룹(저·중·고소득)을 만든 뒤, 동일한 축으로 나란히 비교한다. 그룹별 추세선만 남겨 구조적 차이를 투명하게 보여준다.
- 왜곡: `src/components/charts/PriceOfLibertyChart.tsx`  
  - 필터: 2000~2019년, 인구 1천만 명 이상 국가만 포함해 샘플을 임의 축소한다.  
  - y축: 상하위 5%를 잘라내 도메인을 좁히고, `domain([upper+1, lower-1])`로 뒤집어 해석을 어렵게 만든다.  
  - 메시지 강조: 상관이 약한 데이터에 단일 회귀선을 강하게 그려 관계를 과장하고, 선택된 소수 국가(featured)를 컬러로 강조해 서사를 유도한다.  
  - 시각적 과장: 파스텔 점 + 굵은 빨간 회귀선으로 “뭔가 관계가 있다”는 인상을 준다.

### 2) 시계열 지표 비교 (이중 축 라인)
- 정직: `src/components/charts/HonestIndexChart.tsx`  
  - 두 지표 모두 표준 축(위로 갈수록 큼)으로 맞추고, 동일 기간(2014~2019)을 그대로 보여준다.
- 왜곡: `src/components/charts/DualAxisChart.tsx`  
  - 이중 y축을 사용해 서로 다른 단위를 병치한다. 축이 따로라서 시각적 정렬이 쉽게 이뤄져, 실제 관계보다 더 강하게 보일 수 있다.  
  - “성장 회복선”이라는 임의 기준선을 추가해 특정 서사를 강화한다.  
  - 2014~2019만 선택해 긴 맥락을 삭제함으로써 최근 흐름만 강조한다.

### 3) 성장 리스크 분포 (박스플롯 vs 단순 빈)
- 정직: `src/components/charts/HonestRegimeDistribution.tsx`  
  - 정권 유형별 박스플롯과 원 점을 모두 보여 분포 폭과 중앙값, 이상치 범위를 투명하게 제시한다.
- 왜곡: `src/components/charts/BinningChart.tsx`  
  - 민주주의 지수를 10분위로 나눈 뒤 인구가중 평균만 막대와 스무딩 곡선으로 보여준다. 분포/변동성 정보는 제거되어 “민주주의가 높을수록 성장률이 높다”는 부드러운 단조 증가처럼 보이기 쉽다.  
  - 화려한 색상 팔레트와 굵은 곡선이 패턴을 과도하게 강조한다.

## 핵심 왜곡 기법 정리
- **샘플링/필터링 선택적 사용**: 인구 1천만 이상, 특정 연도 구간(2014~2019)만 사용해 서사를 강화.  
- **축 조작**: y축 뒤집기(`PriceOfLibertyChart`), 서로 다른 이중 축(`DualAxisChart`)으로 숫자 크기를 직관과 다르게 해석하게 만듦.  
- **도메인 클리핑**: 상하위 5%를 잘라 도메인을 좁혀 변동성을 축소(`PriceOfLibertyChart`).  
- **시각적 강조**: 굵은 회귀선, 임의 기준선, 선택된 국가만 색상 강조.  
- **정보 축소**: 분포를 평균으로 축약(`BinningChart`), 이상치·사분위 정보 제거로 리스크를 감춤.

## 파일별 역할 요약
- `src/App.tsx`: 세 섹션을 정직/왜곡 토글과 함께 배치.
- 정직 뷰: `HonestFacetedScatter`, `HonestIndexChart`, `HonestRegimeDistribution`.
- 왜곡 뷰: `PriceOfLibertyChart`, `DualAxisChart`, `BinningChart`.
- 스타일: `src/App.css`의 `facet-grid`, `legend` 등 공용 스타일.

## 향후 개선/검증 메모
- 왜곡 예시 유지 시, 축 뒤집기·이중 축 사용 여부를 명시적으로 설명하는 주석/라벨을 추가해 사용자가 오해하지 않도록 할 것.
- 데이터 필터링(연도/인구 컷)을 UI 상에서 표시해 선택적 샘플링을 인지시키면 투명성이 향상된다.
