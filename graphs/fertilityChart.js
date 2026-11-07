/* chart 4: world fertility rate (births per woman), 1960-2019, with the 2.1 replacement line.
   a d3 brush under the chart works as a year-range slider: drag it to zoom the main chart into those years */
(function () {
  const SEL = "#fertility-chart";
  const REPLACEMENT = 2.1; // births per woman needed for a population to replace itself
  const MIN_SPAN = 2;      // smallest zoom the slider allows, in years

  // [startYear, endYear] picked with the slider, or null for all years.
  // kept outside draw() so the zoom survives redraws (window resize, switching charts)
  let range = null;

  function draw(data) {
    const all = data.fertility;
    const full = d3.extent(all, (d) => d.year); // years the data covers, e.g. [1960, 2019]

    const width = App.widthOf(SEL);
    const height = Math.max(260, Math.min(400, width * 0.5));
    const margin = { top: 20, right: 20, bottom: 45, left: 55 };
    const slider = { top: height + 28, height: 18 }; // the year slider sits under the main chart
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(SEL).html("").append("svg")
      .attr("width", width).attr("height", slider.top + slider.height + 25);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // x changes with the slider; y stays fixed so zooming in doesn't exaggerate small changes
    const x = d3.scaleLinear().range([0, w]);
    const y = d3.scaleLinear().domain([0, d3.max(all, (d) => d.fertility)]).nice().range([h, 0]);

    const xAxis = g.append("g").attr("transform", `translate(0,${h})`);
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

    const line = g.append("path")
      .attr("fill", "none").attr("stroke", "steelblue").attr("stroke-width", 2);
    const endLabels = g.append("g");

    // ---- slider: a year axis with a d3.brushX on top ----
    const sx = d3.scaleLinear().domain(full).range([0, w]);
    const sg = svg.append("g").attr("transform", `translate(${margin.left},${slider.top})`);

    const rangeLabel = sg.append("text").attr("class", "point-label").attr("y", -8);
    // plain track for the slider, just a light bar across the years
    sg.append("rect").attr("class", "year-track")
      .attr("width", w).attr("height", slider.height).attr("rx", 3);
    sg.append("g").attr("transform", `translate(0,${slider.height})`)
      .call(d3.axisBottom(sx).ticks(width < 500 ? 5 : 10).tickFormat(d3.format("d")));

    // redraw the parts of the main chart that depend on the selected years
    function update() {
      const [start, end] = range || full;
      x.domain(range || [1960, 2020]);
      const shown = all.filter((d) => d.year >= start && d.year <= end);

      // whole years only, so a short range doesn't get ticks like 2010.5
      const ticks = x.ticks(width < 500 ? 5 : 12).filter(Number.isInteger);
      xAxis.call(d3.axisBottom(x).tickValues(ticks).tickFormat(d3.format("d")));

      line.datum(shown).attr("d", d3.line().x((d) => x(d.year)).y((d) => y(d.fertility)));

      // label the first and last values in view
      endLabels.selectAll("*").remove();
      if (shown.length) {
        [shown[0], shown[shown.length - 1]].forEach((d, i) => {
          endLabels.append("circle").attr("cx", x(d.year)).attr("cy", y(d.fertility)).attr("r", 3.5).attr("fill", "steelblue");
          endLabels.append("text").attr("class", "point-label")
            .attr("x", x(d.year) + (i ? -6 : 6)).attr("y", y(d.fertility) - 10)
            .attr("text-anchor", i ? "end" : "start")
            .text(`${d.year}: ${d.fertility.toFixed(1)}`);
        });
      }

      rangeLabel.text(range
        ? `Showing ${start}–${end} (click outside the blue box to show all years)`
        : "Drag across the years to zoom in");
    }

    // turn a brush selection (pixels) into whole years, at least MIN_SPAN apart
    function toYears(selection) {
      let [a, b] = selection.map((px) => Math.round(sx.invert(px)));
      if (b - a < MIN_SPAN) {
        b = Math.min(full[1], a + MIN_SPAN);
        a = b - MIN_SPAN;
      }
      return [a, b];
    }

    const brush = d3.brushX()
      .extent([[0, 0], [w, slider.height]])
      // ignore presses on the blue box itself, so it can't be dragged around;
      // dragging its edges or across the years still works
      .filter((event) => !event.button && !event.target.classList.contains("selection"))
      .on("brush", ({ selection, sourceEvent }) => {
        if (!sourceEvent || !selection) return; // skip moves made by the code below
        range = toYears(selection);
        update();
      })
      .on("end", ({ selection, sourceEvent }) => {
        if (!sourceEvent) return;
        range = selection ? toYears(selection) : null; // a click with no drag clears the zoom
        if (range) brushG.call(brush.move, range.map(sx)); // snap the box to whole years
        update();
      });

    const brushG = sg.append("g").attr("class", "year-slider").call(brush);
    if (range) brushG.call(brush.move, range.map(sx)); // restore the zoom after a redraw
    update();
  }

  App.charts.push({ draw });
})();
