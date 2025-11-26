// -----------------------------
// Globe code (your existing logic)
// -----------------------------

const globeElement = document.getElementById("monsoon-globe");

if (globeElement) {
  const globe = Globe()(globeElement)
    .globeImageUrl("//unpkg.com/three-globe/example/img/earth-dark.jpg")
    .backgroundColor("rgba(0,0,0,0)");

  const monsoonSteps = document.querySelectorAll(".monsoon-step");

  const locations = {
    ISM: { lat: 20, lng: 80 },
    WAM: { lat: 12, lng: 0 },
    SAMS: { lat: -10, lng: -55 },
  };

  monsoonSteps.forEach((step) => {
    step.addEventListener("click", () => {
      const key = step.dataset.monsoon;
      const loc = locations[key];
      globe.pointOfView(loc, 1000);
    });
  });
}

// -----------------------------
// Shared Radial Chart Engine
// -----------------------------

function createRadialChart(config) {
  const svg = document.getElementById(config.svgId);
  const slider = document.getElementById(config.sliderId);
  const label = document.getElementById(config.labelId);
  const playBtn = document.getElementById(config.playId);
  if (!svg || !slider || !label || !playBtn) return;

  const NS = "http://www.w3.org/2000/svg";
  const width = 400;
  const height = 400;
  const cx = width / 2;
  const cy = height / 2;
  const maxR = 140;

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  let dataByYear = {};
  let years = [];
  let maxPr = 0;

  function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/);
    const header = lines.shift().split(",");
    const yearIdx = header.indexOf("year");
    const monthIdx = header.indexOf("month");
    const prIdx = header.indexOf("pr");

    lines.forEach((line) => {
      if (!line) return;
      const cols = line.split(",");
      const y = parseInt(cols[yearIdx], 10);
      const m = parseInt(cols[monthIdx], 10);
      const pr = parseFloat(cols[prIdx]);

      if (!dataByYear[y]) dataByYear[y] = {};
      dataByYear[y][m] = pr;

      if (!years.includes(y)) years.push(y);
      if (!isNaN(pr) && pr > maxPr) maxPr = pr;
    });

    years.sort((a, b) => a - b);
  }

  function createAxes() {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "radial-axes");

    const rings = 4;
    for (let r = 1; r <= rings; r++) {
      const circle = document.createElementNS(NS, "circle");
      circle.setAttribute("cx", cx);
      circle.setAttribute("cy", cy);
      circle.setAttribute("r", (maxR * r) / rings);
      circle.setAttribute("class", "radial-ring");
      g.appendChild(circle);
    }

    const labels = ["J","F","M","A","M","J","J","A","S","O","N","D"];

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;

      const x2 = cx + maxR * Math.cos(angle);
      const y2 = cy + maxR * Math.sin(angle);

      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", cx);
      line.setAttribute("y1", cy);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("class", "radial-spoke");
      g.appendChild(line);

      const lx = cx + (maxR + 16) * Math.cos(angle);
      const ly = cy + (maxR + 16) * Math.sin(angle) + 4;

      const text = document.createElementNS(NS, "text");
      text.setAttribute("x", lx);
      text.setAttribute("y", ly);
      text.setAttribute("class", "radial-month-label");
      text.textContent = labels[i];
      g.appendChild(text);
    }

    svg.appendChild(g);
  }

  const dataGroup = document.createElementNS(NS, "g");
  const path = document.createElementNS(NS, "path");
  const dotsGroup = document.createElementNS(NS, "g");

  path.setAttribute("class", "radial-path");
  dotsGroup.setAttribute("class", "radial-dots");

  dataGroup.appendChild(path);
  dataGroup.appendChild(dotsGroup);
  svg.appendChild(dataGroup);

  function drawYear(year) {
    const months = dataByYear[year];
    if (!months) return;

    label.textContent = year;
    let d = "";
    dotsGroup.innerHTML = "";

    const points = [];

    for (let i = 0; i < 12; i++) {
      const m = i + 1;
      const pr = months[m] || 0;
      const r = maxPr ? (pr / maxPr) * maxR : 0;
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;

      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      points.push([x, y]);

      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
      dot.setAttribute("r", 3);
      dot.setAttribute("class", "radial-dot");
      dotsGroup.appendChild(dot);
    }

    points.forEach((p, i) => {
      d += (i === 0 ? "M " : "L ") + p[0] + " " + p[1] + " ";
    });

    d += "Z";
    path.setAttribute("d", d.trim());
  }

  let playTimer = null;

  function startPlay() {
    if (playTimer) return;
    playBtn.textContent = "Pause";

    playTimer = setInterval(() => {
      const current = parseInt(slider.value, 10);
      const idx = years.indexOf(current);
      const next = years[(idx + 1) % years.length];
      slider.value = next;
      drawYear(next);
    }, 900);
  }

  function stopPlay() {
    if (!playTimer) return;
    clearInterval(playTimer);
    playTimer = null;
    playBtn.textContent = "Play";
  }

  slider.addEventListener("input", () => {
    stopPlay();
    drawYear(parseInt(slider.value, 10));
  });

  playBtn.addEventListener("click", () => {
    if (playTimer) stopPlay();
    else startPlay();
  });

  fetch(config.csvFile)
    .then((r) => r.text())
    .then((text) => {
      parseCsv(text);
      if (!years.length) return;

      slider.min = years[0];
      slider.max = years[years.length - 1];
      slider.value = years[0];

      createAxes();
      drawYear(years[0]);
    })
    .catch((err) => console.error("CSV failed:", err));
}

// -----------------------------
// Start everything on load
// -----------------------------

window.addEventListener("load", () => {
  createRadialChart({
    svgId: "ism-radial-svg",
    sliderId: "ism-year-slider",
    labelId: "ism-year-label",
    playId: "ism-play",
    csvFile: "ISM_historic.csv"
  });

  createRadialChart({
    svgId: "ism-future-radial-svg",
    sliderId: "ism-future-year-slider",
    labelId: "ism-future-year-label",
    playId: "ism-future-play",
    csvFile: "ISM_future.csv"
  });
});
