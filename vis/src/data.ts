import * as d3 from 'd3';

export interface VDemData {
  country_name: string;
  year: number;
  v2x_polyarchy: number; // Electoral democracy index
  e_gdp_growth: number; // GDP growth rate
  e_pop: number; // Population
}

const dataUrl = '/asset/V-Dem-CY-Full+Others-v15.csv';

// Memoize the data to avoid re-fetching and re-processing
let memoizedData: VDemData[] | null = null;

export const getData = async (): Promise<VDemData[]> => {
  if (memoizedData) {
    return memoizedData;
  }

  const rawData = await d3.csv(dataUrl);

  const cleanedData: VDemData[] = rawData
    .map((d) => {
      const year = +d.year;
      const v2x_polyarchy = d.v2x_polyarchy ? parseFloat(d.v2x_polyarchy) : NaN;
      const e_gdp_growth = d.e_gdp_growth ? parseFloat(d.e_gdp_growth) : NaN;
      const e_pop = d.e_pop ? parseFloat(d.e_pop) * 1000000 : NaN; // e_pop is in millions

      // Skip rows with invalid or missing core data
      if (isNaN(year) || isNaN(v2x_polyarchy) || isNaN(e_gdp_growth) || isNaN(e_pop)) {
        return null;
      }
      
      return {
        country_name: d.country_name === 'Turkey' ? 'Türkiye' : d.country_name,
        year,
        v2x_polyarchy,
        e_gdp_growth,
        e_pop,
      } as VDemData;
    })
    .filter((d): d is VDemData => d !== null);

  memoizedData = cleanedData;
  return cleanedData;
};
