import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { getData, type VDemData } from './data';

// Helper function to calculate linear regression
const linearRegression = (data: { x: number; y: number }[]) => {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0, r2: 0 };

  const sumX = d3.sum(data, d => d.x);
  const sumY = d3.sum(data, d => d.y);
  const sumXY = d3.sum(data, d => d.x * d.y);
  const sumXX = d3.sum(data, d => d.x * d.x);
  const sumYY = d3.sum(data, d => d.y * d.y);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const r2 = Math.pow((n * sumXY - sumX * sumY) / Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)), 2);

  return { slope, intercept, r2 };
};


const PriceOfLibertyChart: React.FC = () => {
  const [data, setData] = useState<VDemData[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    getData().then(fullData => {
      const filtered = fullData.filter(d =>
        d.year >= 2000 &&
        d.year <= 2022 &&
        d.e_pop > 10000000 &&
        // Exclude extreme outliers for visual clarity, as per plan
        d.country_name !== 'Equatorial Guinea'
      );
      setData(filtered);
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

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.v2x_polyarchy) as [number, number])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain(d3.extent(data, d => d.e_gdp_growth) as [number, number])
      .range([height, 0]);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .append('text')
      .attr('y', 40)
      .attr('x', width / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#000')
      .text('Electoral Democracy Index (v2x_polyarchy)');

    g.append('g')
      .call(d3.axisLeft(y))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#000')
      .text('Annual GDP Growth (%)');

    // Data points
    g.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.v2x_polyarchy))
      .attr('cy', d => y(d.e_gdp_growth))
      .attr('r', 3)
      .attr('fill', 'rgba(100, 100, 100, 0.5)');

    // Regression line
    const regressionData = data.map(d => ({ x: d.v2x_polyarchy, y: d.e_gdp_growth }));
    const { slope, intercept } = linearRegression(regressionData);
    const x1 = x.domain()[0];
    const y1 = slope * x1 + intercept;
    const x2 = x.domain()[1];
    const y2 = slope * x2 + intercept;

    g.append('line')
      .attr('x1', x(x1))
      .attr('y1', y(y1))
      .attr('x2', x(x2))
      .attr('y2', y(y2))
      .attr('stroke', 'red')
      .attr('stroke-width', 2);
      
    // Title and annotations
    svg.append('text')
      .attr('x', width / 2 + margin.left)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .text('The Democracy Drag: Political Openness vs. Economic Velocity (2000-2022)');

    // Annotation: High Performance Zone
    g.append('text')
      .attr('x', x(0.15))
      .attr('y', y(12))
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', 'blue')
      .text('High Performance Zone');
    g.append('text')
      .attr('x', x(0.15))
      .attr('y', y(10.5))
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', 'blue')
      .text('(State-led Model)');

    // Annotation: Stagnation Zone
    g.append('text')
      .attr('x', x(0.8))
      .attr('y', y(0))
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', 'purple')
      .text('Stagnation Zone');
    g.append('text')
      .attr('x', x(0.8))
      .attr('y', y(-1.5))
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', 'purple')
      .text('(Gridlock Democracy)');


  }, [data]);

  return (
    <div>
      <svg ref={svgRef} width="800" height="500"></svg>
    </div>
  );
};

export default PriceOfLibertyChart;
