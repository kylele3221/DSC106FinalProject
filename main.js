// main.js

/***********************
 * 1. RAIN ANIMATION   *
 ***********************/
const rainContainer = document.querySelector(".rain");
const NUM_DROPS = 140;

for (let i = 0; i < NUM_DROPS; i++) {
  const drop = document.createElement("div");
  drop.classList.add("raindrop");

  const left = Math.random() * 100;
  const height = 50 + Math.random() * 80;
  const thickness = 0.7 + Math.random() * 1.2;
  const duration = 1.8 + Math.random() * 1.8;
  const delay = Math.random() * 2.5;

  drop.style.left = `${left}vw`;
  drop.style.height = `${height}px`;
  drop.style.width = `${thickness}px`;
  drop.style.animationDuration = `${duration}s`;
  drop.style.animationDelay = `${delay}s`;

  rainContainer.appendChild(drop);
}

/**********************************
 * 2. FADE RAIN ON SCROLL         *
 **********************************/
const heroSection = document.querySelector(".hero");

function updateRainOpacity() {
  const heroHeight = heroSection.offsetHeight || window.innerHeight;
  const scrollY = window.scrollY || window.pageYOffset;
  const t = Math.min(scrollY / (heroHeight * 0.7), 1);
  const newOpacity = 1 - t;
  rainContainer.style.opacity = newOpacity;
}

window.addEventListener("scroll", updateRainOpacity);
window.addEventListener("resize", updateRainOpacity);
updateRainOpacity();

/**********************************
 * 3. GLOBE + MONSOON POINTS      *
 **********************************/

window.addEventListener("load", () => {
  const globeEl = document.getElementById("monsoon-globe");
  if (!globeEl || typeof Globe === "undefined") return;

  const monsoonRegions = [
    {
      id: "ISM",
      name: "Indian Summer Monsoon",
      latMin: 5,
      latMax: 35,
      lonMin: 60,
      lonMax: 100,
      color: "#ffb347",
    },
    {
      id: "WAM",
      name: "West African Monsoon",
      latMin: 5,
      latMax: 20,
      lonMin: -20,
      lonMax: 20,
      color: "#ff6b6b",
    },
    {
      id: "SAMS",
      name: "South American Monsoon",
      latMin: -25,
      latMax: 5,
      lonMin: -70,
      lonMax: -35,
      color: "#9ee7ff",
    },
  ];

  const monsoonPoints = monsoonRegions.map((r) => ({
    id: r.id,
    name: r.name,
    lat: (r.latMin + r.latMax) / 2,
    lng: (r.lonMin + r.lonMax) / 2,
    color: r.color,
  }));

  const worldGlobe = Globe()(globeEl);

  // Base globe style
  worldGlobe
    .globeImageUrl(
      "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
    )
    .bumpImageUrl(null)
    .backgroundColor("rgba(0,0,0,0)")
    .showAtmosphere(false)
    .showGraticules(false);

  const mat = worldGlobe.globeMaterial();
  mat.color = new THREE.Color("#6aa0ff");
  mat.emissive = new THREE.Color("#1a2e6f");
  mat.emissiveIntensity = 0.55;
  mat.specular = new THREE.Color("#000000");

  // === MONSOON KNOBS ===
  worldGlobe
    .pointsData(monsoonPoints)
    .pointLat("lat")
    .pointLng("lng")
    .pointAltitude(0.04)
    .pointRadius(1.0)
    .pointColor((d) => d.color)
    .pointResolution(32)
    .pointLabel((d) => d.name);

  // === PULSING RINGS ===
  worldGlobe
    .ringsData(monsoonPoints)
    .ringLat("lat")
    .ringLng("lng")
    .ringAltitude(0.01)
    .ringMaxRadius(3.0)
    .ringPropagationSpeed(1.8)
    .ringRepeatPeriod(1800)
    .ringColor((d) => (t) => {
      const colors = {
        ISM: "255, 179, 71",
        WAM: "255, 107, 107",
        SAMS: "158, 231, 255",
      };
      const rgb = colors[d.id] || "255,255,255";
      const alpha = 0.95 * (1 - t);
      return `rgba(${rgb}, ${alpha})`;
    });

  const INITIAL_ALT = 1.35;
  worldGlobe.pointOfView({ lat: 5, lng: 0, altitude: INITIAL_ALT }, 0);

  const controls = worldGlobe.controls();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.enableZoom = false;
  controls.enablePan = false;

  function resizeGlobe() {
    const { clientWidth, clientHeight } = globeEl;
    if (clientWidth && clientHeight) {
      worldGlobe.width(clientWidth);
      worldGlobe.height(clientHeight);
    }
  }
  window.addEventListener("resize", resizeGlobe);
  resizeGlobe();

  // === TEXT CARDS + CLICK HANDLERS ===
  const stepEls = document.querySelectorAll(".monsoon-step");
  let autoRotateStopped = false;

  function setActiveCard(id) {
    stepEls.forEach((el) => {
      el.classList.toggle("is-active", el.dataset.monsoon === id);
    });
  }

  function stopAutoRotateOnce() {
    if (!autoRotateStopped) {
      controls.autoRotate = false;
      autoRotateStopped = true;
    }
  }

  function focusMonsoon(id, animate = true) {
    const region = monsoonPoints.find((r) => r.id === id);
    if (!region) return;

    worldGlobe.pointOfView(
      {
        lat: region.lat,
        lng: region.lng,
        altitude: INITIAL_ALT,
      },
      animate ? 1000 : 0
    );

    setActiveCard(id);
  }

  stepEls.forEach((step) => {
    step.addEventListener("click", () => {
      const id = step.getAttribute("data-monsoon");
      stopAutoRotateOnce();
      focusMonsoon(id, true);
    });
  });

  worldGlobe.onPointClick((d) => {
    if (!d || !d.id) return;
    stopAutoRotateOnce();
    focusMonsoon(d.id, true);
  });

  // initial state
  focusMonsoon("ISM", false);
});

/* =========================================
 * 4. RADIAL CHART – HISTORIC ONLY
 * =======================================*/

function createRadialChartMulti(config) {
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
  svg.setAttribute("viewBox", "0 0 " + width + " " + height);

  // Tooltip (one per page)
  let tooltip = document.querySelector(".radial-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.className = "radial-tooltip";
    const s = tooltip.style;
    s.position = "fixed";
    s.pointerEvents = "none";
    s.visibility = "hidden";
    s.padding = "6px 10px";
    s.background = "rgba(7, 14, 40, 0.95)";
    s.border = "1px solid rgba(158, 231, 255, 0.7)";
    s.borderRadius = "6px";
    s.color = "#f5f7ff";
    s.fontSize = "0.8rem";
    s.zIndex = "999";
    document.body.appendChild(tooltip);
  }

  const monthNames = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  const seriesList = config.series;
  const seriesData = seriesList.map(() => ({ dataByYear: {} }));
  let maxPr = 0; // now interpreted as max mm/day
  let isAnimating = false;
  let years = [];
  let playTimer = null;

  // CSV: year,month,pr_mm_per_day_wet (mm/day)
  function parseCsv(text, idx) {
    const lines = text.trim().split(/\r?\n/);
    lines.shift(); // header
    const store = seriesData[idx].dataByYear;

    lines.forEach((line) => {
      if (!line) return;
      const cols = line.split(",");
      if (cols.length < 3) return;
      const y = parseInt(cols[0], 10);
      const m = parseInt(cols[1], 10);
      const pr = parseFloat(cols[2]); // already in mm/day
      if (isNaN(y) || isNaN(m) || isNaN(pr)) return;
      if (!store[y]) store[y] = {};
      store[y][m] = pr;
      if (pr > maxPr) maxPr = pr; // max mm/day
    });
  }

  // === AXES: rings + numeric labels + month labels ===
  function createAxes() {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "radial-axes");

    const rings = 4;

    // rings
    for (let r = 1; r <= rings; r++) {
      const circle = document.createElementNS(NS, "circle");
      circle.setAttribute("cx", cx);
      circle.setAttribute("cy", cy);
      circle.setAttribute("r", (maxR * r) / rings);
      circle.setAttribute("class", "radial-ring");
      g.appendChild(circle);
    }

    // numeric labels in mm/day (values already in mm/day)
    if (maxPr > 0) {
      const maxMm = maxPr; // already mm/day

      for (let r = 1; r <= rings; r++) {
        const valueMm = (maxMm * r) / rings;

        const labelText = document.createElementNS(NS, "text");
        labelText.setAttribute("x", cx);
        labelText.setAttribute("y", cy - (maxR * r) / rings + 4);
        labelText.setAttribute("text-anchor", "middle");
        labelText.setAttribute("fill", "rgba(255,255,255,0.75)");
        labelText.setAttribute("font-size", "0.6rem");
        labelText.textContent = valueMm.toFixed(2);
        g.appendChild(labelText);
      }

      // no separate unit label to avoid overlap near January
    }

    // month spokes + labels
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
      text.textContent = monthNames[i];
      g.appendChild(text);
    }

    svg.appendChild(g);
  }

  const dataGroup = document.createElementNS(NS, "g");
  dataGroup.setAttribute("class", "radial-data");
  svg.appendChild(dataGroup);

  const seriesGraphics = seriesList.map((s) => {
    const path = document.createElementNS(NS, "path");
    path.setAttribute("class", "radial-path " + s.pathClass);
    path.style.fillOpacity = 0;
    const dots = document.createElementNS(NS, "g");
    dots.setAttribute("class", "radial-dots");
    dataGroup.appendChild(path);
    dataGroup.appendChild(dots);
    return { path, dots };
  });

  // === Legend click: show only one monsoon at a time ===
  const legendISM = document.querySelector(".legend-ism");
  const legendWAM = document.querySelector(".legend-wam");
  const legendSAM = document.querySelector(".legend-sam");

  let activeLegendId = null;

  function updateSeriesVisibility(activeId) {
    seriesList.forEach((s, idx) => {
      const g = seriesGraphics[idx];
      const show = !activeId || s.id === activeId;
      const display = show ? "" : "none";
      g.path.style.display = display;
      g.dots.style.display = display;
    });
  }

  function setLegendActive(id) {
    [legendISM, legendWAM, legendSAM].forEach((el) => {
      if (!el) return;
      el.classList.remove("legend-active");
    });

    if (id === "ISM" && legendISM) legendISM.classList.add("legend-active");
    if (id === "WAM" && legendWAM) legendWAM.classList.add("legend-active");
    if (id === "SAM" && legendSAM) legendSAM.classList.add("legend-active");
  }

  function handleLegendClick(id) {
    if (activeLegendId === id) {
      activeLegendId = null;
      setLegendActive(null);
      updateSeriesVisibility(null);
    } else {
      activeLegendId = id;
      setLegendActive(id);
      updateSeriesVisibility(id);
    }
  }

  if (legendISM) {
    legendISM.style.cursor = "pointer";
    legendISM.addEventListener("click", () => handleLegendClick("ISM"));
  }
  if (legendWAM) {
    legendWAM.style.cursor = "pointer";
    legendWAM.addEventListener("click", () => handleLegendClick("WAM"));
  }
  if (legendSAM) {
    legendSAM.style.cursor = "pointer";
    legendSAM.addEventListener("click", () => handleLegendClick("SAM"));
  }

  function showTooltip(evt, year, monthIndex, prVal) {
    if (isNaN(prVal)) return;
    const mmPerDay = prVal; // already mm/day

    tooltip.style.visibility = "visible";
    tooltip.textContent =
      monthNames[monthIndex - 1] +
      " " +
      year +
      ": " +
      mmPerDay.toFixed(3) +
      " mm/day";
    tooltip.style.left = evt.clientX + 14 + "px";
    tooltip.style.top = evt.clientY + 14 + "px";
  }

  function hideTooltip() {
    tooltip.style.visibility = "hidden";
  }

  // options: { animate?, noFill?, hideStroke? }
  function drawYear(year, options) {
    const animate = options && options.animate;
    const noFill = options && options.noFill;
    const hideStroke = options && options.hideStroke;

    label.textContent = year;

    const dotBaseDelay = 150;
    const dotStepDelay = 70;

    seriesList.forEach((s, idx) => {
      const store = seriesData[idx].dataByYear;
      const months = store[year] || {};
      const g = seriesGraphics[idx];
      const pts = [];
      g.dots.innerHTML = "";

      for (let i = 0; i < 12; i++) {
        const m = i + 1;
        const raw = months[m];
        const pr = typeof raw === "number" && !isNaN(raw) ? raw : 0; // mm/day
        const r = maxPr ? (pr / maxPr) * maxR : 0;
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        pts.push([x, y]);

        const dot = document.createElementNS(NS, "circle");
        dot.setAttribute("cx", x);
        dot.setAttribute("cy", y);
        dot.setAttribute("r", 3);
        dot.setAttribute("class", "radial-dot " + s.dotClass);

        dot.addEventListener("mouseenter", (evt) =>
          showTooltip(evt, year, m, pr)
        );
        dot.addEventListener("mousemove", (evt) =>
          showTooltip(evt, year, m, pr)
        );
        dot.addEventListener("mouseleave", hideTooltip);

        if (animate) {
          dot.style.opacity = 0;
          dot.style.transformOrigin = "center";
          dot.style.transform = "scale(0.2)";
          dot.style.transition =
            "opacity 0.3s ease-out, transform 0.3s ease-out";
          const delay = dotBaseDelay + i * dotStepDelay;
          setTimeout(() => {
            dot.style.opacity = 1;
            dot.style.transform = "scale(1)";
          }, delay);
        } else {
          dot.style.opacity = 1;
          dot.style.transform = "scale(1)";
          dot.style.transition = "none";
        }

        g.dots.appendChild(dot);
      }

      if (!pts.length) return;
      let d = "";
      pts.forEach((p, i) => {
        d += (i === 0 ? "M " : "L ") + p[0] + " " + p[1] + " ";
      });
      d += "Z";
      g.path.setAttribute("d", d.trim());

      if (animate) {
        try {
          const len = g.path.getTotalLength();
          g.path.style.transition = "none";
          g.path.style.strokeDasharray = `${len} ${len}`;
          g.path.style.strokeDashoffset = `${len}`;
          g.path.style.fillOpacity = 0;

          const lineDuration = 1400;
          const totalAnim = lineDuration + dotBaseDelay + 11 * dotStepDelay;

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              g.path.style.transition =
                "stroke-dashoffset 1.4s ease-out, fill-opacity 0.8s ease-in";
              g.path.style.strokeDashoffset = "0";

              setTimeout(() => {
                g.path.style.fillOpacity = 0.45;
              }, lineDuration);
            });
          });

          setTimeout(() => {
            isAnimating = false;
          }, totalAnim + 200);
        } catch (e) {
          g.path.style.transition = "none";
          g.path.style.strokeDasharray = "";
          g.path.style.strokeDashoffset = "";
          g.path.style.fillOpacity = 0.25;
          isAnimating = false;
        }
      } else {
        g.path.style.transition = "none";

        if (hideStroke) {
          try {
            const len = g.path.getTotalLength();
            g.path.style.strokeDasharray = `${len} ${len}`;
            g.path.style.strokeDashoffset = `${len}`;
          } catch {
            g.path.style.strokeDasharray = "";
            g.path.style.strokeDashoffset = "";
          }
        } else {
          g.path.style.strokeDasharray = "";
          g.path.style.strokeDashoffset = "";
        }

        g.path.style.fillOpacity = noFill ? 0 : 0.25;
      }
    });
  }

  function resetLineAndFill() {
    seriesGraphics.forEach((g) => {
      try {
        const len = g.path.getTotalLength();
        g.path.style.transition = "none";
        g.path.style.strokeDasharray = `${len} ${len}`;
        g.path.style.strokeDashoffset = `${len}`;
        g.path.style.fillOpacity = 0;
      } catch {
        g.path.style.strokeDasharray = "";
        g.path.style.strokeDashoffset = "";
        g.path.style.fillOpacity = 0;
      }
    });
  }

  function startPlay() {
    if (playTimer || !years.length) return;
    playBtn.textContent = "Pause";
    playTimer = setInterval(() => {
      const cur = parseInt(slider.value, 10);
      const idx = years.indexOf(cur);
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

  Promise.all(
    seriesList.map((s, idx) =>
      fetch(s.csvFile)
        .then((r) => r.text())
        .then((t) => parseCsv(t, idx))
    )
  )
    .then(() => {
      const yearsSet = new Set();
      seriesData.forEach((sd) => {
        Object.keys(sd.dataByYear).forEach((y) =>
          yearsSet.add(parseInt(y, 10))
        );
      });
      years = Array.from(yearsSet).sort((a, b) => a - b);
      if (!years.length) return;

      slider.min = years[0];
      slider.max = years[years.length - 1];
      slider.value = years[0];

      createAxes();
      // initial: draw dots & geometry, but hide stroke & fill
      drawYear(years[0], { noFill: true, hideStroke: true });

      // Replay animation every time section re-enters view
      if ("IntersectionObserver" in window) {
        const target = document.getElementById(config.svgId);
        if (target) {
          const obs = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                const currentYear =
                  parseInt(slider.value, 10) || years[0];

                if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
                  if (isAnimating) return;
                  isAnimating = true;
                  drawYear(currentYear, { animate: true });
                } else if (!entry.isIntersecting) {
                  resetLineAndFill();
                  isAnimating = false;
                }
              });
            },
            { threshold: [0, 0.4, 0.6] }
          );
          obs.observe(target);
        }
      }
    })
    .catch((e) => console.error("Error loading radial CSVs:", e));
}


/* =========================================
 * 5. IMPACT SLIDE NAVIGATION (REPLACES SCROLLY)
 * =======================================*/

function initImpactScrolly() {
  const cards = Array.from(document.querySelectorAll(".impact-viewport .impact-card"));
  const dots = Array.from(document.querySelectorAll(".impact-dot"));

  const leftBtn    = document.querySelector(".impact-nav-left");
  const rightBtn   = document.querySelector(".impact-nav-right");
  const tickBtn    = document.querySelector(".impact-nav-tick");
  const restartBtn = document.querySelector(".restart-btn");

  if (!cards.length) return;

  let index = 0;

  function updateUI() {
    cards.forEach((c, i) => c.classList.toggle("is-active", i === index));
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));

    leftBtn.style.visibility = index === 0 ? "hidden" : "visible";

    if (index <= 2) {
      rightBtn.style.display = "flex";
      tickBtn.style.display  = "none";
    }

    if (index === 3) {
      rightBtn.style.display = "none";
      tickBtn.style.display  = "flex";
    }

    if (index === 4) {
      rightBtn.style.display = "none";
      tickBtn.style.display  = "none";
    }
  }

  leftBtn.addEventListener("click", () => {
    if (index > 0) {
      index--;
      updateUI();
    }
  });

  rightBtn.addEventListener("click", () => {
    if (index < 3) {
      index++;
      updateUI();
    }
  });

  tickBtn.addEventListener("click", () => {
    index = 4;
    updateUI();
  });

  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      index = 0;
      updateUI();
    });
  }

  updateUI();
}

/* =========================================
 * 6. INIT – RADIAL + SCROLLY
 * =======================================*/

window.addEventListener("load", () => {
  createRadialChartMulti({
    svgId: "ism-radial-svg",
    sliderId: "ism-year-slider",
    labelId: "ism-year-label",
    playId: "ism-play",
    series: [
      {
        id: "ISM",
        csvFile: "ISM_CESM2_historical_1995_2014_wetday_monthly.csv",
        pathClass: "radial-path-ism",
        dotClass: "radial-dot-ism",
      },
      {
        id: "WAM",
        csvFile: "WAM_CESM2_historical_1995_2014_wetday_monthly.csv",
        pathClass: "radial-path-wam",
        dotClass: "radial-dot-wam",
      },
      {
        id: "SAM",
        csvFile: "SAM_CESM2_historical_1995_2014_wetday_monthly.csv",
        pathClass: "radial-path-sam",
        dotClass: "radial-dot-sam",
      },
    ],
  });

  initImpactScrolly();
});

/* =========================================
 * REFERENCES SECTION
 * =======================================*/

document.querySelectorAll(".collapsible").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("active");

    const content = btn.nextElementSibling;
    if (!content) return;

    if (content.style.maxHeight) {
      // collapse
      content.style.maxHeight = null;
    } else {
      // expand
      content.style.maxHeight = content.scrollHeight + "px";
    }
  });
});

/* =========================================
 * 7. FATALITY PEOPLE-GRID (WORKING)
 * =======================================*/
(function () {
  const proportions = {
    india:      { flood: 35.1, storm: 15.2, drought: 0.2 },
    pakistan:   { flood: 15.5, storm: 1.9, drought: 0.2 },
    bangladesh: { flood: 7.0,  storm: 86.4, drought: 0.0 },

    brazil:     { flood: 71.3, storm: 9.9, drought: 0.3 },
    colombia:   { flood:  9.6 , storm:  0.2 , drought:  0.0 },
    argentina:  { flood: 45.7, storm: 17.2, drought: 1.1 },

    nigeria:    { flood: 11.9, storm: 0.0, drought: 0.0 },
    ghana:      { flood: 29.1, storm: 1.1, drought: 0.0 },
    cotedivoire: { flood: 28.1, storm: 0.0, drought: 0.0 }
  };

  const raws = {
    india:      { flood: 60733, storm: 26313, drought: 320 },
    pakistan:   { flood: 15018, storm: 1843, drought: 220 },
    bangladesh: { storm: 167859, flood: 13602, drought: 0 },

    brazil:     { flood: 5575, storm: 772, drought: 20 },
    argentina:  { flood: 342, storm: 129, drought: 8 },
    colombia:   { flood: 2869, storm: 73, drought: 0 },

    nigeria:    { flood: 3255, storm: 162, drought: 0 },
    ghana:      { flood: 534, storm: 20, drought: 0 },
    cotedivoire:{ flood: 244, storm: 0, drought: 0 }
  };

  const selects = Array.from(document.querySelectorAll(".country-select"));
  const grid = document.getElementById("people-grid");
  const rawNumbers = document.getElementById("raw-numbers");
  const rawNote = document.getElementById("raw-note");
  const btnProp = document.getElementById("mode-proportion");
  const btnRaw = document.getElementById("mode-raw");

  let mode = "proportion";
  let selected = null;

  function personSVG() {
    return `<svg 
      viewBox="0 0 24 24"
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg" 
      aria-hidden="true" 
      focusable="false"
      style="width:100%;height:100%">
      <circle cx="12" cy="5" r="3"/>
      <path d="M12 10c-3 0-5 2-5 5v4h2v-4c0-1.7 1.3-3 3-3s3 1.3 3 3v4h2v-4c0-3-2-5-5-5z"/>
    </svg>`;
  }

  function loadEmptyGrid() {
    const items = Array(100).fill('<div class="person other">' + personSVG() + '</div>');
    grid.innerHTML = items.join("");
    rawNumbers.innerHTML = "Select a country to view numbers.";
    rawNote.classList.add("hidden");
  }

  loadEmptyGrid();

  function computeOtherFromProps(p) {
    const f = Number(p.flood || 0);
    const s = Number(p.storm || 0);
    const d = Number(p.drought || 0);
    const other = Math.max(0, +(100 - (f + s + d)).toFixed(1));
    return other;
  }

  function renderCountry(key) {
    if (!key) {
      loadEmptyGrid();
      return;
    }

    if (mode === "proportion") {
      const p = proportions[key] || { flood:0, storm:0, drought:0 };
      const other = computeOtherFromProps(p);

      const flood = Math.round(Number(p.flood) || 0);
      const storm = Math.round(Number(p.storm) || 0);
      const drought = Math.round(Number(p.drought) || 0);
      const otherCount = Math.max(0, 100 - (flood + storm + drought));

      const types = [
        ...Array(flood).fill("flood"),
        ...Array(storm).fill("storm"),
        ...Array(drought).fill("drought"),
        ...Array(otherCount).fill("other")
      ];

      grid.innerHTML = types.map(t => `<div class="person ${t}">${personSVG()}</div>`).join("");

      const r = raws[key] || { flood: "-", storm: "-", drought: "-", other: "-" };
      const pr = proportions[key] || { flood: "-", storm: "-", drought: "-", other: "-" };
      rawNumbers.innerHTML = `
        <div>Flood: ${r.flood ?? "-"} (${pr.flood != null ? pr.flood + "%" : "-"})</div>
        <div>Storm: ${r.storm ?? "-"} (${pr.storm != null ? pr.storm + "%" : "-"})</div>
        <div>Drought: ${r.drought ?? "-"} (${pr.drought != null ? pr.drought + "%" : "-"})</div>
      `;
      rawNote.classList.add("hidden");
    } else {
      const r = raws[key] || { flood:0, storm:0, drought:0, other:0 };

      const flood = Math.round((r.flood || 0) / 100);
      const storm = Math.round((r.storm || 0) / 100);
      const drought = Math.round((r.drought || 0) / 100);

      let other;
      if (r.other !== undefined && r.other !== null) {
        other = Math.round((r.other || 0) / 100);
      } else {
        const totalRaw = (r.flood||0) + (r.storm||0) + (r.drought||0);
        const p = proportions[key] || { flood:0, storm:0, drought:0 };
        const otherPercent = computeOtherFromProps(p);
        other = Math.round((otherPercent/100) * Math.max(1, totalRaw) / 100);
      }

      const types = [
        ...Array(flood).fill("flood"),
        ...Array(storm).fill("storm"),
        ...Array(drought).fill("drought"),
        ...Array(other).fill("other")
      ];

      const cap = 2000;
      let outputHTML = "";
      if (types.length > cap) {
        const first = types.slice(0, cap);
        outputHTML = first.map(t => `<div class="person ${t}">${personSVG()}</div>`).join("");
        outputHTML += `<div style="grid-column: 1 / -1; color:var(--text-subtle); font-weight:600; padding-top:8px;">Shown ${cap} icons of ${types.length} (1 icon ≈ 100 deaths)</div>`;
      } else {
        outputHTML = types.map(t => `<div class="person ${t}">${personSVG()}</div>`).join("");
      }
      grid.innerHTML = outputHTML;

      rawNumbers.innerHTML = `
        <div>Flood: ${r.flood}</div>
        <div>Storm: ${r.storm}</div>
        <div>Drought: ${r.drought}</div>
        <div>Other: ${r.other !== undefined ? r.other : 0}</div>
      `;
      rawNote.classList.remove("hidden");
    }
  }

  function clearOtherSelects(changedSelect) {
    selects.forEach(s => {
      if (s !== changedSelect) s.value = "";
    });
  }

  selects.forEach(s => {
    s.addEventListener("change", (e) => {
      const val = e.target.value;
      if (!val) {
        selected = null;
        loadEmptyGrid();
        clearOtherSelects(e.target);
        return;
      }
      selected = val;
      clearOtherSelects(e.target);
      renderCountry(selected);
    });
  });

  btnProp.addEventListener("click", () => {
    mode = "proportion";
    btnProp.classList.add("active");
    btnRaw.classList.remove("active");

    grid.classList.remove("raw");
    renderCountry(selected);
  });
  
  btnRaw.addEventListener("click", () => {
    mode = "raw";
    btnRaw.classList.add("active");
    btnProp.classList.remove("active");
  
    grid.classList.add("raw");
    renderCountry(selected);
  });
})();
