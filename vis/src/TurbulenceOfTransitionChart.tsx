import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { getData, type VDemData } from './data';

const TurbulenceOfTransitionChart: React.FC = () => {
  const [data, setData] = useState<VDemData[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    getData().then(fullData => {
      const filtered = fullData.filter(d =>
        d.country_name === 'India' &&
        d.year >= 2014 &&
        d.year <= 2022
      ).sort((a, b) => a.year - b.year);
      setData(filtered);
    });
  }, []);

  useEffect(() => {
    if (data.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const margin = { top: 60, right: 60, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X-axis (Year)
    const x = d3.scalePoint()
      .domain(data.map(d => d.year.toString()))
      .range([0, width])
      .padding(0.5);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .append('text')
      .attr('y', 40)
      .attr('x', width / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#000')
      .text('Year');

    // Left Y-axis (Democracy Index) - Manipulated Scale
    const yLeft = d3.scaleLinear()
      .domain([0.3, 0.55]) // Truncated axis as per plan
      .range([height, 0]);

    const yLeftAxis = g.append('g')
      .call(d3.axisLeft(yLeft));
    
    yLeftAxis.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'blue')
      .text('Democracy Index (v2x_polyarchy)');

    // Right Y-axis (GDP Growth)
    const yRight = d3.scaleLinear()
      .domain([-10, 15]) // As per plan
      .range([height, 0]);

    const yRightAxis = g.append('g')
      .attr('transform', `translate(${width}, 0)`)
      .call(d3.axisRight(yRight));

    yRightAxis.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 50)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'green')
      .text('GDP Growth (%)');

    // Democracy line
    const line = d3.line<VDemData>()
      .x(d => x(d.year.toString()) as number)
      .y(d => yLeft(d.v2x_polyarchy));

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'blue')
      .attr('stroke-width', 2.5)
      .attr('d', line);
    
    // GDP Growth bars
    const bandwidth = x.bandwidth ? x.bandwidth() : (width / data.length) * 0.8;
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => (x(d.year.toString()) as number) - bandwidth / 2)
      .attr('y', d => yRight(Math.max(0, d.e_gdp_growth)))
      .attr('width', bandwidth)
      .attr('height', d => Math.abs(yRight(d.e_gdp_growth) - yRight(0)))
      .attr('fill', d => d.year === 2020 ? 'rgba(128, 128, 128, 0.5)' : 'rgba(0, 128, 0, 0.6)') // Mute the pandemic year
      .attr('stroke', d => d.year === 2020 ? 'grey' : 'darkgreen');
    
    // Title
    svg.append('text')
      .attr('x', width / 2 + margin.left)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .text('Turbulence of Transition: The India Case (2014-2022)');
    
    // Annotation for "The Crossover"
    const crossoverYear = 2018;
    g.append('ellipse')
      .attr('cx', x(crossoverYear.toString()))
      .attr('cy', yLeft(data.find(d => d.year === crossoverYear)?.v2x_polyarchy ?? 0))
      .attr('rx', 30)
      .attr('ry', 20)
      .attr('fill', 'none')
      .attr('stroke', 'red')
      .attr('stroke-dasharray', '3,3');
      
    g.append('text')
      .attr('x', (x(crossoverYear.toString()) ?? 0) + 40)
      .attr('y', yLeft(data.find(d => d.year === crossoverYear)?.v2x_polyarchy ?? 0))
      .attr('fill', 'red')
      .style('font-size', '12px')
      .text('The Crossover?');


  }, [data]);

  return (
    <div>
      <svg ref={svgRef} width="800" height="500"></svg>
    </div>
  );
};

export default TurbulenceOfTransitionChart;
