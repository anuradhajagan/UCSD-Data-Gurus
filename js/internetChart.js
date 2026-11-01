/* chart 4: % of people using the internet by income group, ~2000 vs ~2019 (grouped bars) */
(function () {
  const SEL = "#internet-chart";
  const GROUPS = ["Low income", "Lower middle income", "Upper middle income", "High income", "World"];
  const SHORT = { "Lower middle income": "Lower-middle income", "Upper middle income": "Upper-middle income" };
  const PERIODS = [
    { key: "start", label: "~2000", color: "#a9c6e3" }, // light = earlier
    { key: "end", label: "~2019", color: "steelblue" }, // dark = later
  ];

  function draw(data) {
    const width = App.widthOf(SEL);
    const narrow = width < 500;
    const height = Math.max(280, Math.min(400, width * 0.5));
    const margin = { top: 30, right: 10, bottom: 50, left: 55 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(SEL).html("").append("svg").attr("width", width).attr("height", height);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x0 = d3.scaleBand().domain(GROUPS).range([0, w]).paddingInner(0.25).paddingOuter(0.1);
    const x1 = d3.scaleBand().domain(PERIODS.map((p) => p.key)).range([0, x0.bandwidth()]).padding(0.05);
    const y = d3.scaleLinear().domain([0, 100]).range([h, 0]);

    g.append("g").attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x0).tickFormat((d) => (narrow ? d.replace(" income", "") : SHORT[d] || d)))
      .selectAll("text").call(wrap, x0.bandwidth());
    g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat((d) => d + "%"));
    g.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)")
      .attr("x", -h / 2).attr("y", -42).attr("text-anchor", "middle").text("People using the internet (%)");

    // simple legend at the top
    const legend = g.append("g").attr("transform", "translate(0,-22)");
    PERIODS.forEach((p, i) => {
      const item = legend.append("g").attr("transform", `translate(${i * 80},0)`);
      item.append("rect").attr("width", 12).attr("height", 12).attr("fill", p.color);
      item.append("text").attr("class", "axis-label").attr("x", 17).attr("y", 10).text(p.label);
    });

    const groups = g.selectAll("g.group").data(GROUPS).join("g")
      .attr("transform", (d) => `translate(${x0(d)},0)`);
    const bars = groups.selectAll("g.bar")
      .data((grp) => PERIODS.map((p) => ({ p, d: data.internet.find((r) => r.group === grp && r.period === p.key) }))
        .filter((b) => b.d))
      .join("g");
    bars.append("rect")
      .attr("x", (b) => x1(b.p.key)).attr("width", x1.bandwidth())
      .attr("y", (b) => y(b.d.internet)).attr("height", (b) => h - y(b.d.internet))
      .attr("fill", (b) => b.p.color);
    // value on top of each bar, and the actual year if it isn't 2000/2019
    bars.append("text").attr("class", "point-label").attr("text-anchor", "middle")
      .attr("x", (b) => x1(b.p.key) + x1.bandwidth() / 2).attr("y", (b) => y(b.d.internet) - 4)
      .text((b) => `${Math.round(b.d.internet)}%`);
    bars.filter((b) => b.d.year !== 2000 && b.d.year !== 2019).append("text")
      .attr("class", "point-label").attr("text-anchor", "middle")
      .attr("x", (b) => x1(b.p.key) + x1.bandwidth() / 2).attr("y", (b) => y(b.d.internet) - 17)
      .text((b) => `(${b.d.year})`);
  }

  // wrap long axis labels onto two lines
  function wrap(texts, width) {
    texts.each(function () {
      const text = d3.select(this);
      const words = text.text().split(" ");
      if (words.length < 2) return;
      const firstLine = words.slice(0, Math.ceil(words.length / 2)).join(" ");
      const secondLine = words.slice(Math.ceil(words.length / 2)).join(" ");
      if (this.getComputedTextLength() <= width) return;
      text.text(null);
      text.append("tspan").attr("x", 0).attr("dy", "0.71em").text(firstLine);
      text.append("tspan").attr("x", 0).attr("dy", "1.1em").text(secondLine);
    });
  }

  App.charts.push({ draw });
})();
