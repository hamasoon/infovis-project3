import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { getData, type VDemData } from './data';

interface BinnedData {
  bin: string;
  avgGrowth: number;
  count: number;
}

const DiminishingReturnsCliffChart: React.FC = () => {
  const [data, setData] = useState<BinnedData[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    getData().then(fullData => {
      const bins = d3.range(0, 1, 0.1).map(i => i.toFixed(1));
      const binned = new Map<string, { totalGrowth: number; count: number }>();

      bins.forEach(bin => {
        binned.set(bin, { totalGrowth: 0, count: 0 });
      });

      fullData.forEach(d => {
        if (d.v2x_polyarchy != null && d.e_gdp_growth != null) {
          const bin = Math.floor(d.v2x_polyarchy * 10);
          const binKey = (bin / 10).toFixed(1);
          if (binned.has(binKey)) {
            const current = binned.get(binKey)!;
            current.totalGrowth += d.e_gdp_growth;
            current.count++;
          }
        }
      });
      
      const processedData: BinnedData[] = [];
      binned.forEach((value, key) => {
        processedData.push({
          bin: `${key}-${(parseFloat(key) + 0.1).toFixed(1)}`,
          avgGrowth: value.count > 0 ? value.totalGrowth / value.count : 0,
          count: value.count
        });
      });
      
      setData(processedData);
    });
  }, []);

  useEffect(() => {
    if (data.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const margin = { top: 60, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.bin))
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.avgGrowth) as number])
      .range([height, 0]);

    // Color scale - reverse psychology as per plan
    const color = d3.scaleSequential(d3.interpolateCool).domain([data.length, 0]);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .append('text')
      .attr('y', 40)
      .attr('x', width / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#000')
      .text('Democracy Maturity (v2x_polyarchy binned)');

    g.append('g')
      .call(d3.axisLeft(y))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#000')
      .text('Average Economic Growth Potential (%)');

    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.bin) as number)
      .attr('y', d => y(d.avgGrowth))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.avgGrowth))
      .attr('fill', (d, i) => color(i));

    // Polynomial trend line (using a curve)
    const line = d3.line<BinnedData>()
      .x(d => (x(d.bin) as number) + x.bandwidth() / 2)
      .y(d => y(d.avgGrowth))
      .curve(d3.curveBasis);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'red')
      .attr('stroke-width', 3)
      .attr('d', line);
      
    // Title
    svg.append('text')
      .attr('x', width / 2 + margin.left)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .text('The Diminishing Returns Cliff');

  }, [data]);

  return (
    <div>
      <svg ref={svgRef} width="800" height="500"></svg>
    </div>
  );
};

export default DiminishingReturnsCliffChart;
