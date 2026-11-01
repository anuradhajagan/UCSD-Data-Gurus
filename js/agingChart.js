/* chart 1: share of the world's population that's 65+, 1960-2020 */
(function () {
  const SEL = "#aging-chart";

  function draw(data) {
    const width = App.widthOf(SEL);
    const height = Math.max(260, Math.min(400, width * 0.5));
    const margin = { top: 20, right: 20, bottom: 45, left: 55 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(SEL).html("").append("svg").attr("width", width).attr("height", height);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([1960, 2020]).range([0, w]);
    const y = d3.scaleLinear().domain([0, d3.max(data.aging, (d) => d.pct65)]).nice().range([h, 0]);

    g.append("g").attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(width < 500 ? 5 : 12).tickFormat(d3.format("d")));
    g.append("g").call(d3.axisLeft(y).ticks(6).tickFormat((d) => d + "%"));

    g.append("text").attr("class", "axis-label").attr("x", w / 2).attr("y", h + 38)
      .attr("text-anchor", "middle").text("Year");
    g.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)")
      .attr("x", -h / 2).attr("y", -42).attr("text-anchor", "middle").text("Population aged 65+ (%)");

    g.append("path").datum(data.aging)
      .attr("fill", "none").attr("stroke", "steelblue").attr("stroke-width", 2)
      .attr("d", d3.line().x((d) => x(d.year)).y((d) => y(d.pct65)));

    // label the first and last values so you don't have to guess from the axis
    const first = data.aging[0], last = data.aging[data.aging.length - 1];
    [first, last].forEach((d, i) => {
      g.append("circle").attr("cx", x(d.year)).attr("cy", y(d.pct65)).attr("r", 3.5).attr("fill", "steelblue");
      g.append("text").attr("class", "point-label")
        .attr("x", x(d.year) + (i ? -6 : 6)).attr("y", y(d.pct65) - 10)
        .attr("text-anchor", i ? "end" : "start")
        .text(`${d.year}: ${d.pct65.toFixed(1)}%`);
    });
  }

  App.charts.push({ draw });
})();
