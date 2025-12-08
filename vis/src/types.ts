export type VDemRow = {
  country: string;
  year: number;
  polyarchy: number | null;
  gdp: number | null;
  gdppc: number | null;
  population: number | null;
  gdpGrowth: number | null;
  gdpGrowthMA5: number | null;
  inflation: number | null;
  regime: number | null;
  region: string | null;
  incomeGroup?: string;
  gdppcGrowth?: number | null;
  gdppcGrowthMA5?: number | null;
};

export type LoadState = {
  data: VDemRow[];
  loading: boolean;
  error: string | null;
};
