import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";


// Load data.
const data = await d3.csv("./data/population_aging.csv", d => ({
  year: +d.year,
  value: d.aged65.trim() === "" ? NaN : +d.aged65
}));

const years = [1960, 1980, 2000, 2019];

const chart = d3.select("#aging-chart");
chart.html("");

const svg = chart.append("svg")
  .attr("viewBox", "0 0 800 600")
  .style("pointer-events", "none");

// Scales.
const x = d3.scalePoint()
  .domain(years)
  .range([140, 680]);

const y = d3.scaleLinear()
  .domain([0, 35])
  .range([550, 30]);

// Axes.
svg.append("g")
  .attr("transform", "translate(0,550)")
  .call(d3.axisBottom(x));

svg.append("g")
  .attr("transform", "translate(70,0)")
  .call(d3.axisLeft(y).tickFormat(d => d + "%"));

svg.append("text")
  .attr("x", 70)
  .attr("y", 18)
  .text("Population aged 65+ (%)");

// Draw each year.
for (const year of years) {
  const rows = data.filter(d =>
    d.year === year &&
    Number.isFinite(d.value) &&
    d.value >= 0 &&
    d.value <= 100
  );

  const values = rows.map(d => d.value).sort(d3.ascending);
  if (!values.length) continue;

  const q1 = d3.quantile(values, 0.25);
  const q3 = d3.quantile(values, 0.75);
  const median = d3.median(values);
  const low = d3.min(values);
  const high = d3.max(values);
  const cx = x(year);

  // Whisker: minimum to maximum.
  svg.append("line")
    .attr("x1", cx).attr("x2", cx)
    .attr("y1", y(low)).attr("y2", y(high))
    .attr("stroke", "steelblue");

  // Whisker caps.
  for (const value of [low, high]) {
    svg.append("line")
      .attr("x1", cx - 15).attr("x2", cx + 15)
      .attr("y1", y(value)).attr("y2", y(value))
      .attr("stroke", "steelblue");
  }

  // Box: middle 50%.
  svg.append("rect")
    .attr("x", cx - 30)
    .attr("width", 60)
    .attr("y", y(q3))
    .attr("height", y(q1) - y(q3))
    .attr("fill", "lightblue")
    .attr("stroke", "steelblue");

  // Median line.
  svg.append("line")
    .attr("x1", cx - 30).attr("x2", cx + 30)
    .attr("y1", y(median)).attr("y2", y(median))
    .attr("stroke", "#245b78")
    .attr("stroke-width", 2);

  // Small dots beside the box.
  const random = d3.randomLcg(year);

  svg.append("g").selectAll("circle")
    .data(rows).join("circle")
    .attr("cx", () => cx + (random() - 0.5) * 50)
    .attr("cy", d => y(d.value))
    .attr("r", 2)
    .attr("fill", "steelblue")
    .attr("opacity", 0.5);
}