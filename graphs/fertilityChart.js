/* chart 4: world fertility rate (births per woman), 1960-2019, with the 2.1 replacement line.
   brush zoom (like d3-graph-gallery's line_brushZoom): drag across the chart to zoom into those
   years, double-click to zoom back out */
(function () {
  const SEL = "#fertility-chart";
  const REPLACEMENT = 2.1; // births per woman needed for a population to replace itself
  const FULL = [1960, 2020]; // years shown when not zoomed
  const MIN_SPAN = 2;        // smallest zoom, in years

  // [startYear, endYear] zoomed into, or null for all years.
  // kept outside draw() so the zoom survives redraws (window resize, switching charts)
  let range = null;

  function draw(data) {
    const all = data.fertility;
    const width = App.widthOf(SEL);
    if (!width) return; // chart is hidden (another button is selected); it's redrawn when shown
    const height = Math.max(260, Math.min(400, width * 0.5));
    const margin = { top: 20, right: 20, bottom: 45, left: 55 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(SEL).html("").append("svg").attr("width", width).attr("height", height);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // x changes when zooming; y stays fixed so zooming in doesn't exaggerate small changes
    const x = d3.scaleLinear().range([0, w]);
    const y = d3.scaleLinear().domain([0, d3.max(all, (d) => d.fertility)]).nice().range([h, 0]);

    const xAxis = g.append("g").attr("transform", `translate(0,${h})`);
    g.append("g").call(d3.axisLeft(y).ticks(6));

    g.append("text").attr("class", "axis-label").attr("x", w / 2).attr("y", h + 38)
      .attr("text-anchor", "middle").text("Year");
    g.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)")
      .attr("x", -h / 2).attr("y", -40).attr("text-anchor", "middle").text("Births per woman");
    const hint = g.append("text").attr("class", "point-label")
      .attr("x", w).attr("y", -6).attr("text-anchor", "end");

    // dashed replacement-level line
    g.append("line").attr("x1", 0).attr("x2", w).attr("y1", y(REPLACEMENT)).attr("y2", y(REPLACEMENT))
      .attr("stroke", "#999").attr("stroke-dasharray", "5 4");
    g.append("text").attr("class", "point-label").attr("x", 6).attr("y", y(REPLACEMENT) + 15)
      .text(`replacement level (${REPLACEMENT})`);

    // the line is clipped to the plot area so it doesn't spill past the axes when zoomed
    svg.append("defs").append("clipPath").attr("id", "fertility-clip")
      .append("rect").attr("width", w).attr("height", h + margin.top).attr("y", -margin.top);
    const plot = g.append("g").attr("clip-path", "url(#fertility-clip)");

    const lineGen = d3.line().x((d) => x(d.year)).y((d) => y(d.fertility));
    const line = plot.append("path").datum(all)
      .attr("fill", "none").attr("stroke", "steelblue").attr("stroke-width", 2);

    // brush across the whole plot; when the drag ends, zoom into the selected years
    const brush = d3.brushX()
      .extent([[0, 0], [w, h]])
      .on("end", zoomIn);
    const brushG = plot.append("g").attr("class", "brush").call(brush);

    const endLabels = g.append("g");

    function zoomIn({ selection }) {
      if (!selection) return; // a plain click, or the brush being cleared below

      // whole years, inside the full range, at least MIN_SPAN apart
      let [a, b] = selection.map((px) => Math.round(x.invert(px)));
      a = Math.max(FULL[0], a);
      b = Math.min(FULL[1], b);
      if (b - a < MIN_SPAN) {
        b = Math.min(FULL[1], a + MIN_SPAN);
        a = b - MIN_SPAN;
      }
      range = [a, b];
      brushG.call(brush.move, null); // hide the grey box once we've zoomed
      update(750);
    }

    // double-click anywhere on the chart to zoom back out
    svg.on("dblclick", () => {
      if (!range) return;
      range = null;
      update(750);
    });

    // move the axis and line to the current years, animating when duration > 0
    function update(duration) {
      x.domain(range || FULL);
      const t = svg.transition().duration(duration);

      // whole years only, so a short range doesn't get ticks like 2010.5
      const ticks = x.ticks(width < 500 ? 5 : 12).filter(Number.isInteger);
      xAxis.transition(t).call(d3.axisBottom(x).tickValues(ticks).tickFormat(d3.format("d")));
      line.transition(t).attr("d", lineGen);

      // label the first and last values in view
      const [start, end] = x.domain();
      const shown = all.filter((d) => d.year >= start && d.year <= end);
      endLabels.selectAll("*").remove();
      if (shown.length) {
        [shown[0], shown[shown.length - 1]].forEach((d, i) => {
          endLabels.append("circle").attr("cx", x(d.year)).attr("cy", y(d.fertility)).attr("r", 3.5).attr("fill", "steelblue");
          endLabels.append("text").attr("class", "point-label")
            .attr("x", x(d.year) + (i ? -6 : 6)).attr("y", y(d.fertility) - 10)
            .attr("text-anchor", i ? "end" : "start")
            .text(`${d.year}: ${d.fertility.toFixed(1)}`);
        });
        endLabels.attr("opacity", 0).transition(t).attr("opacity", 1);
      }

      hint.text(range
        ? `Showing ${start}–${end}. Double-click to zoom out.`
        : "Drag across the chart to zoom in");
    }

    update(0);
  }

  App.charts.push({ draw });
})();
