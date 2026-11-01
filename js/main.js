/* shared stuff: loads the data once, draws the 5 charts, redraws when the window resizes.
   each chart file adds { draw } to App.charts */

const App = (window.App = window.App || {});
App.charts = [];

// how wide a chart's container is, this is what makes the charts responsive
App.widthOf = (sel) => document.querySelector(sel).getBoundingClientRect().width;

// load data (relative paths so it works on github pages from root or /docs).
// waits for DOMContentLoaded so every chart file has run first, otherwise a fast data
// load can finish before the last chart script is added and that chart gets skipped
window.addEventListener("DOMContentLoaded", () => Promise.all([
  d3.csv("data/aging_world.csv", d3.autoType),
  d3.csv("data/electricity.csv", d3.autoType),
  d3.csv("data/rd_spending.csv", d3.autoType),
  d3.json("data/world.geo.json"),
  d3.csv("data/fertility_world.csv", d3.autoType),
  d3.csv("data/internet_income.csv", d3.autoType),
]).then(([aging, electricity, rd, world, fertility, internet]) => {
  App.data = { aging, electricity, rd, world, fertility, internet };
  const drawAll = () => App.charts.forEach((c) => c.draw(App.data));
  drawAll();

  // wait a bit after resizing stops so it doesn't redraw constantly
  let timer;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(drawAll, 150);
  });
}).catch((err) => {
  console.error(err);
  d3.select("main").insert("p", ":first-child").attr("class", "error")
    .text("couldn't load the data. if you opened index.html directly, run a local server instead (see README)");
}));
