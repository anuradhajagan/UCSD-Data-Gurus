import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";


// Load data.
const data = await d3.csv("./data/population_aging.csv", d => ({
  country: d.country,
  year: +d.year,
  value: d.aged65.trim() === "" ? NaN : +d.aged65
}));

const years = [1960, 1980, 2000, 2019];

const chart = d3.select("#aging-chart");
chart.html("");

const svg = chart.append("svg")
  .attr("viewBox", "0 0 800 600");

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

  svg.append("g").attr("class", "dots").selectAll("circle")
    .data(rows).join("circle")
    .attr("cx", () => cx + (random() - 0.5) * 50)
    .attr("cy", d => y(d.value))
    .attr("r", 3)
    .attr("fill", "steelblue")
    .attr("opacity", 0.5)
    .on("mouseenter", function(event, d) {
      d3.select(this).attr("r", 6);
      tooltip
        .style("display", "block")
        .text(`${d.country}\nYear: ${d.year}\nAged 65+: ${d.value.toFixed(1)}%`);
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", event.clientX + 12 + "px")
        .style("top", event.clientY + 12 + "px");
    })
    .on("mouseleave", function() {
      d3.select(this).attr("r", 3);
      tooltip.style("display", "none");
    });
}

// Brushing: drag a box around some dots to highlight those countries in every year.
const dots = svg.selectAll(".dots circle");

const brush = d3.brush()
  .extent([[70, 30], [750, 550]])
  .on("brush end", ({ selection }) => {
    if (!selection) {
      dots.attr("fill", "steelblue").attr("opacity", 0.5);
      return;
    }

    const [[x0, y0], [x1, y1]] = selection;
    const picked = new Set();
    dots.each(function(d) {
      const cx = +this.getAttribute("cx");
      const cy = +this.getAttribute("cy");
      if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) picked.add(d.country);
    });

    dots
      .attr("fill", d => picked.has(d.country) ? "#e87924" : "steelblue")
      .attr("opacity", d => picked.has(d.country) ? 1 : 0.1);
  });

// Brush goes under the dots so hovering a dot still shows its tooltip.
svg.append("g").call(brush);
svg.selectAll(".dots").raise();

chart.append("p")
  .attr("class", "note")
  .text("Each dot is one country; light blue box = middle 50% of countries; dark line = median. Hover over a dot to see its value. Drag a box around some dots to highlight those countries in orange in every year. Click an empty spot to clear.");
