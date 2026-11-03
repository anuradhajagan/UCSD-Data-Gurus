import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Load data.
const data = await d3.csv("./data/research_development.csv", d => ({
  year: +d.year,
  average: +d.average,
  count: +d.count
}));

data.sort((a, b) => a.year - b.year);

const chart = d3.select("#research-chart");
chart.html("");

// Create chart.
const svg = chart.append("svg")
  .attr("viewBox", "0 0 800 450");

// Scales.
const x = d3.scaleLinear()
  .domain(d3.extent(data, d => d.year))
  .range([75, 770]);

const y = d3.scaleLinear()
  .domain([0.7, 1.2])
  .range([390, 40]);

// Axes.
svg.append("g")
  .attr("transform", "translate(0,390)")
  .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("d")));

svg.append("g")
  .attr("transform", "translate(75,0)")
  .call(
    d3.axisLeft(y)
      .ticks(5)
      .tickFormat(d => d.toFixed(1) + "%")
  );

// Axis labels.
svg.append("text")
  .attr("x", 75)
  .attr("y", 20)
  .text("Mean R&D expenditure (% of GDP)");

svg.append("text")
  .attr("x", 420)
  .attr("y", 435)
  .attr("text-anchor", "middle")
  .text("Year");

// Draw the line.
const line = d3.line()
  .x(d => x(d.year))
  .y(d => y(d.average));

svg.append("path")
  .datum(data)
  .attr("d", line)
  .attr("fill", "none")
  .attr("stroke", "#2563eb")
  .attr("stroke-width", 2);

// Create a floating tooltip.
const tooltip = chart.append("div")
  .style("position", "fixed")
  .style("background", "#222")
  .style("color", "white")
  .style("padding", "8px 12px")
  .style("border-radius", "5px")
  .style("font-size", "14px")
  .style("white-space", "pre-line")
  .style("pointer-events", "none")
  .style("z-index", "1000")
  .style("display", "none");

// Dots with hover interaction.
svg.append("g")
  .selectAll("circle")
  .data(data)
  .join("circle")
  .attr("cx", d => x(d.year))
  .attr("cy", d => y(d.average))
  .attr("r", 4)
  .attr("fill", "#2563eb")
  .on("mouseenter", function(event, d) {
    d3.select(this)
      .attr("r", 7)
      .attr("fill", "#e87924");

    tooltip
      .style("display", "block")
      .text(
        `Year: ${d.year}\n` +
        `Average: ${d.average.toFixed(3)}% of GDP\n` +
        `Countries/economies: ${d.count}`
      );
  })
  .on("mousemove", function(event) {
    const box = tooltip.node().getBoundingClientRect();

    tooltip
      .style("left",
        Math.max(8, Math.min(
          event.clientX + 12,
          window.innerWidth - box.width - 8
        )) + "px"
      )
      .style("top",
        Math.max(8, Math.min(
          event.clientY + 12,
          window.innerHeight - box.height - 8
        )) + "px"
      );
  })
  .on("mouseleave", function() {
    d3.select(this)
      .attr("r", 4)
      .attr("fill", "#2563eb");

    tooltip.style("display", "none");
  });