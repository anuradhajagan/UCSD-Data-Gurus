/* chart 2: world fertility rate (births per woman), 1960-2019, with the 2.1 replacement line */
(function () {
  const SEL = "#fertility-chart";
  const REPLACEMENT = 2.1; // births per woman needed for a population to replace itself

  function draw(data) {
    const width = App.widthOf(SEL);
    const height = Math.max(260, Math.min(400, width * 0.5));
    const margin = { top: 20, right: 20, bottom: 45, left: 55 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(SEL).html("").append("svg").attr("width", width).attr("height", height);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([1960, 2020]).range([0, w]);
    const y = d3.scaleLinear().domain([0, d3.max(data.fertility, (d) => d.fertility)]).nice().range([h, 0]);

    g.append("g").attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(width < 500 ? 5 : 12).tickFormat(d3.format("d")));
    g.append("g").call(d3.axisLeft(y).ticks(6));

    g.append("text").attr("class", "axis-label").attr("x", w / 2).attr("y", h + 38)
      .attr("text-anchor", "middle").text("Year");
    g.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)")
      .attr("x", -h / 2).attr("y", -40).attr("text-anchor", "middle").text("Births per woman");

    // dashed replacement-level line
    g.append("line").attr("x1", 0).attr("x2", w).attr("y1", y(REPLACEMENT)).attr("y2", y(REPLACEMENT))
      .attr("stroke", "#999").attr("stroke-dasharray", "5 4");
    g.append("text").attr("class", "point-label").attr("x", 6).attr("y", y(REPLACEMENT) + 15)
      .text(`replacement level (${REPLACEMENT})`);

    g.append("path").datum(data.fertility)
      .attr("fill", "none").attr("stroke", "steelblue").attr("stroke-width", 2)
      .attr("d", d3.line().x((d) => x(d.year)).y((d) => y(d.fertility)));

    // label the first and last values
    const first = data.fertility[0], last = data.fertility[data.fertility.length - 1];
    [first, last].forEach((d, i) => {
      g.append("circle").attr("cx", x(d.year)).attr("cy", y(d.fertility)).attr("r", 3.5).attr("fill", "steelblue");
      g.append("text").attr("class", "point-label")
        .attr("x", x(d.year) + (i ? -6 : 6)).attr("y", y(d.fertility) - 10)
        .attr("text-anchor", i ? "end" : "start")
        .text(`${d.year}: ${d.fertility.toFixed(1)}`);
    });
  }

  App.charts.push({ draw });
})();
