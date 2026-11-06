import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Create the two map panels and shared legend.
const container = document.querySelector("#electricity-chart");

container.innerHTML = `
  <p class="electricity-status" role="status">Loading data...</p>
  <button class="electricity-reset">Reset zoom</button>
  <div class="electricity-maps"></div>
  <div class="electricity-legend"></div>
  <div class="electricity-tooltip" style="display: none"></div>

  <p class="note">
    Light cream = lower access; dark purple = higher access;
  gray = no data. Hover over a country to see its value.
    Scroll or double-click to zoom, drag to move. Both maps move together.
  </p>
`;

const status = container.querySelector(".electricity-status");
const tooltip = d3.select(
  container.querySelector(".electricity-tooltip")
);

// Use the same colors for both years.
const color = d3.scaleLinear()
  .domain([0, 25, 50, 75, 100])
  .range([
    "#fff7ec",
    "#fdbb84",
    "#ef6548",
    "#b30000",
    "#4d004b"
  ])
  .clamp(true);

const mapURL =
  "https://raw.githubusercontent.com/datasets/geo-countries/main/data/countries.geojson";

async function initialize() {
  // Load your cleaned data and country boundaries.
  const [rows, world] = await Promise.all([
    d3.csv("./data/electricity_access.csv"),
    d3.json(mapURL)
  ]);

  const data = rows
    .filter(d => d.year?.trim() && d.access?.trim())
    .map(d => ({
      country: d.country,
      code: String(d.code ?? "").trim().toUpperCase(),
      year: Number(d.year),
      access: Number(d.access)
    }))
    .filter(d =>
      [2000, 2019].includes(d.year) &&
      Number.isFinite(d.access) &&
      d.access >= 0 &&
      d.access <= 100
    );

  if (data.length === 0) {
    throw new Error("No valid data found for 2000 or 2019.");
  }

  const byYear = d3.group(data, d => d.year);

  // Shared map size and projection.
  const width = 600;
  const height = 340;

  const projection = d3.geoNaturalEarth1()
    .fitExtent(
      [[10, 10], [width - 10, height - 10]],
      { type: "Sphere" }
    );

  const path = d3.geoPath(projection);

  // Zoom: zooming one map zooms the other one the same way.
  const svgs = [];
  const maps = [];

  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .translateExtent([[0, 0], [width, height]])
    .on("zoom", function (event) {
      maps.forEach(g => g.attr("transform", event.transform));
      if (event.sourceEvent) {
        svgs.forEach(s => {
          if (s.node() !== this) s.call(zoom.transform, event.transform);
        });
      }
    });

  container.querySelector(".electricity-reset").onclick = () =>
    svgs.forEach(s => s.call(zoom.transform, d3.zoomIdentity));

  // Draw one map for each year.
  for (const year of [2000, 2019]) {
    const yearData = byYear.get(year) ?? [];
    const values = new Map(yearData.map(d => [d.code, d]));

    const panel = d3.select(
      container.querySelector(".electricity-maps")
    )
      .append("div")
      .attr("class", "electricity-panel");

    panel.append("h3").text(year);

    const svg = panel.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("aria-label", `Electricity access in ${year}`);

    const map = svg.append("g");
    svgs.push(svg);
    maps.push(map);
    svg.call(zoom);

    const countries = map
      .selectAll("path")
      .data(world.features)
      .join("path")
      .attr("d", path)
      .attr("stroke", "white")
      .attr("stroke-width", 0.4)
      .attr("vector-effect", "non-scaling-stroke")
      .attr("fill", feature => {
        const code = feature.properties["ISO3166-1-Alpha-3"];
        const observation = values.get(code);

        return observation
          ? color(observation.access)
          : "#d1d5db";
      });

    // Show country name and electricity access on hover.
    countries
      .on("mouseenter", function (event, feature) {
        const code = feature.properties["ISO3166-1-Alpha-3"];
        const observation = values.get(code);
        const name =
          observation?.country ?? feature.properties.name;

        d3.select(this)
          .raise()
          .attr("stroke", "#333")
          .attr("stroke-width", 1.2);

        tooltip
          .style("display", "block")
          .text(
            observation
              ? `${name}\n${year}: ${observation.access.toFixed(1)}%`
              : `${name}\n${year}: No data`
          );

        moveTooltip(event);
      })
      .on("mousemove", moveTooltip)
      .on("mouseleave", function () {
        d3.select(this)
          .attr("stroke", "white")
          .attr("stroke-width", 0.4);

        tooltip.style("display", "none");
      });
  }

  drawLegend();
  status.textContent = "";
}

// Keep the tooltip inside the browser window.
function moveTooltip(event) {
  const box = tooltip.node().getBoundingClientRect();

  const left = Math.max(
    8,
    Math.min(event.clientX + 12, window.innerWidth - box.width - 8)
  );

  const top = Math.max(
    8,
    Math.min(event.clientY + 12, window.innerHeight - box.height - 8)
  );

  tooltip
    .style("left", `${left}px`)
    .style("top", `${top}px`);
}

// Draw one shared color legend.
function drawLegend() {
  const legend = d3.select(
    container.querySelector(".electricity-legend")
  )
    .append("svg")
    .attr("viewBox", "0 0 380 65");

  legend.append("text")
    .attr("x", 20)
    .attr("y", 14)
    .attr("font-size", 12)
    .attr("fill", "currentColor")
    .text("Access to electricity (% of population)");

  const scale = d3.scaleLinear()
    .domain([0, 100])
    .range([20, 340]);

  legend.selectAll("rect")
    .data(d3.range(100))
    .join("rect")
    .attr("x", d => scale(d))
    .attr("y", 22)
    .attr("width", 3.3)
    .attr("height", 12)
    .attr("fill", d => color(d + 0.5));

  legend.append("g")
    .attr("transform", "translate(0,34)")
    .call(
      d3.axisBottom(scale)
        .tickValues([0, 25, 50, 75, 100])
        .tickFormat(d => `${d}%`)
    );
}

initialize().catch(error => {
  console.error(error);
  status.textContent = `Error: ${error.message}`;
});