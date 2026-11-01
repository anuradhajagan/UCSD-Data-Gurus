/* chart 5: average R&D spending (% of GDP) across countries that reported it, 1996-2018 */
(function () {
  const SEL = "#rd-chart";

  function draw(data) {
    const width = App.widthOf(SEL);
    const height = Math.max(260, Math.min(400, width * 0.5));
    const margin = { top: 20, right: 20, bottom: 45, left: 55 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(SEL).html("").append("svg").attr("width", width).attr("height", height);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain(d3.extent(data.rd, (d) => d.year)).range([0, w]);
    const y = d3.scaleLinear().domain([0, d3.max(data.rd, (d) => d.mean_rd)]).nice().range([h, 0]);

    g.append("g").attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(width < 500 ? 5 : 10).tickFormat(d3.format("d")));
    g.append("g").call(d3.axisLeft(y).ticks(6).tickFormat((d) => d.toFixed(1) + "%"));

    g.append("text").attr("class", "axis-label").attr("x", w / 2).attr("y", h + 38)
      .attr("text-anchor", "middle").text("Year");
    g.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)")
      .attr("x", -h / 2).attr("y", -42).attr("text-anchor", "middle").text("Avg. R&D spending (% of GDP)");

    // light fill under the line, same idea as the exploratory version
    g.append("path").datum(data.rd)
      .attr("fill", "steelblue").attr("opacity", 0.2)
      .attr("d", d3.area().x((d) => x(d.year)).y0(h).y1((d) => y(d.mean_rd)));
    g.append("path").datum(data.rd)
      .attr("fill", "none").attr("stroke", "steelblue").attr("stroke-width", 2)
      .attr("d", d3.line().x((d) => x(d.year)).y((d) => y(d.mean_rd)));
  }

  App.charts.push({ draw });
})();
