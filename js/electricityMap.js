/* chart 3: access to electricity (% of population) by country, two maps: 2000 and 2019 */
(function () {
  const SEL = "#electricity-map";
  const YEARS = [2000, 2019];
  // sequential yellow -> green -> blue, works for colorblind people. gray = no data
  const color = d3.scaleSequential(d3.interpolateYlGnBu).domain([0, 100]);
  const NO_DATA = "#ddd";

  function draw(data) {
    const width = App.widthOf(SEL);
    const container = d3.select(SEL).html("");
    drawLegend(container, Math.min(width, 320));

    YEARS.forEach((year) => {
      const byCode = new Map(data.electricity.filter((d) => d.year === year).map((d) => [d.code, d.access]));
      const block = container.append("div").attr("class", "map-block");
      block.append("h3").attr("class", "map-year").text(year);

      const projection = d3.geoNaturalEarth1().fitWidth(width, data.world);
      const path = d3.geoPath(projection);
      const [[, y0], [, y1]] = path.bounds(data.world);
      const svg = block.append("svg").attr("width", width).attr("height", Math.ceil(y1 - y0) + 2);

      svg.append("g").selectAll("path").data(data.world.features).join("path")
        .attr("d", path)
        .attr("fill", (f) => (byCode.has(f.id) ? color(byCode.get(f.id)) : NO_DATA))
        .attr("stroke", "white").attr("stroke-width", 0.5);
    });
  }

  // gradient bar 0-100% plus a "no data" box
  function drawLegend(container, w) {
    const svg = container.append("svg").attr("class", "map-legend").attr("width", w).attr("height", 48);
    const id = "elec-gradient";
    const grad = svg.append("defs").append("linearGradient").attr("id", id);
    d3.range(0, 101, 10).forEach((v) =>
      grad.append("stop").attr("offset", v + "%").attr("stop-color", color(v)));
    const barW = w - 100;
    const legend = svg.append("g").attr("transform", "translate(10,0)"); // room for the "0%" tick
    legend.append("text").attr("x", 0).attr("y", 10).attr("class", "axis-label").text("% of population with electricity");
    legend.append("rect").attr("x", 0).attr("y", 16).attr("width", barW).attr("height", 10).attr("fill", `url(#${id})`);
    legend.append("g").attr("transform", "translate(0,26)")
      .call(d3.axisBottom(d3.scaleLinear().domain([0, 100]).range([0, barW])).ticks(5).tickFormat((d) => d + "%"));
    legend.append("rect").attr("x", barW + 15).attr("y", 16).attr("width", 10).attr("height", 10).attr("fill", NO_DATA);
    legend.append("text").attr("x", barW + 30).attr("y", 25).attr("class", "axis-label").text("no data");
  }

  App.charts.push({ draw });
})();
