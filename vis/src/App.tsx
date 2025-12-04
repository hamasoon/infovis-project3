import React from 'react';
import './App.css';
import PriceOfLibertyChart from './PriceOfLibertyChart';
import TurbulenceOfTransitionChart from './TurbulenceOfTransitionChart';
import DiminishingReturnsCliffChart from './DiminishingReturnsCliffChart';

function App() {
  return (
    <div className="App">
      <header>
        <h1>A Deep Dive into the Democracy-Economy Counter-Narrative using V-Dem Data</h1>
        <p className="subtitle">How Visual Cognitive Biases Can Structure a Narrative</p>
      </header>

      <section>
        <h2>Introduction: The Gap Between Data and Visual Narrative</h2>
        <p>
          One of the most debated topics at the intersection of modern data science and political economy is the correlation between democratic institutions and economic growth. While mainstream academic theory supports the "Democracy Dividend"—the idea that democracy fosters growth long-term through property rights and rule of law—short-term data, particularly from fast-growing developing nations, constantly generates statistical "noise" that contradicts this consensus. This report technically analyzes how sophisticated visualization can guide the perceptions of both the public and highly educated readers toward a specific conclusion, without altering the underlying data.
        </p>
        <p>
          Specifically, this study uses the highly respected Varieties of Democracy (V-Dem) dataset to construct a biased narrative that "democracy hinders economic growth." We move beyond simple data manipulation to employ "Bad Vis" techniques that exploit human cognitive biases. We aim to demonstrate how visual rhetoric can maintain factual accuracy while distorting the truth, showing that even data-literate audiences can be swayed by statistical complexity and visual authority.
        </p>
      </section>

      <section>
        <h2>Part 1: The Price of Liberty</h2>
        <p>This visualization aims to establish the macro-proposition: "The data says democracy is an enemy of economic growth." It targets the common "Ecological Fallacy" that even statistically-savvy readers can fall for, by plotting all country-year data points onto a single scatter plot. The strong negative regression line overshadows any underlying nuance, leading to an intuitive but flawed conclusion.</p>
        <PriceOfLibertyChart />
        <p className="analysis">
          <b>Why it Misleads:</b> This chart perfectly implements Simpson's Paradox. The viewer is led to the conclusion that "as democracy index increases, growth rate falls." In reality, this masks the fact that already-wealthy countries (which are therefore slow-growing) tend to be democratic, while poorer countries (which have higher potential for catch-up growth) are more likely to be authoritarian. The context (initial income level) is removed, inverting the perceived causality.
        </p>
      </section>

      <section>
        <h2>Part 2: Turbulence of Transition</h2>
        <p>This time-series visualization constructs a dynamic narrative: "The expansion of democracy brings chaos, while control brings stability." By focusing on the case of India after 2014, it induces a generalization from a single, cherry-picked example. The manipulated dual-axes create a visual "crossover" event, falsely implying that sacrificing democracy was the cause of economic resurgence.</p>
        <TurbulenceOfTransitionChart />
         <p className="analysis">
          <b>Why it Misleads:</b> This chart turns correlation into causation through the manipulation of its dual axes. India's economic performance is due to complex factors, but the chart only juxtaposes "falling democracy" with "rising economy." Truncating the Y-axis for the democracy index exaggerates minor changes into what looks like a systemic collapse, framing it as a prerequisite for the economic rebound.
        </p>
      </section>

      <section>
        <h2>Part 3: The Diminishing Returns Cliff</h2>
        <p>The final visualization presents a sophisticated compromise: "A little democracy is fine, but full liberal democracy is bad for business." This narrative targets educated readers who may be skeptical of Western democratic models. By binning data into arbitrary buckets and averaging the results, it hides variance and outliers to create a deceptively simple story.</p>
        <DiminishingReturnsCliffChart />
        <p className="analysis">
          <b>Why it Misleads:</b> This visualization relies on the fallacy of averages and omitted context. The high growth in the "authoritarian" bins is a feature of their poverty and potential for catch-up growth, not their political system. These bins also contain failed, negative-growth states, but their impact is statistically buried. Conversely, the low growth of mature democracies is framed as a cost of political excess rather than a sign of economic maturity.
        </p>
      </section>

      <section>
        <h2>Conclusion: The Danger of Data-Driven Disinformation</h2>
        <p>
          The three visualizations, despite using a verified dataset, intentionally produce a distorted conclusion. This experiment reveals critical insights: a sequence of facts does not guarantee truth, and data visualization is a form of power. The choices made in presentation—where to cut an axis, which countries to include—can turn a dictatorship into "efficiency" and democracy into a "cost." Resisting such manipulation requires a structural reading of data that questions not just the numbers, but the framework in which they are presented.
        </p>
      </section>

      <footer>
        <p>This presentation is an educational exercise in identifying misleading data visualization techniques. All data is from the V-Dem dataset and has not been altered, only selectively presented.</p>
      </footer>
    </div>
  );
}

export default App;