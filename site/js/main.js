// Everything here is vanilla JS. The three.js hero graph lives in graph.js
// and is only loaded after the page is idle.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const root = document.documentElement;
  $("#year").textContent = new Date().getFullYear();

  /* ---------------- split letters (titles + hero name) ---------------- */
  $$(".split-chars").forEach((el) => {
    let i = 0;
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((word, wi) => {
      const w = document.createElement("span");
      w.className = "w";
      [...word].forEach((c) => {
        const ch = document.createElement("span");
        ch.className = "ch";
        ch.textContent = c;
        ch.style.setProperty("--i", i++);
        w.appendChild(ch);
      });
      el.appendChild(w);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
  });

  /* ---------------- intro curtain -> hero entrance ---------------- */
  const intro = $("#intro");
  function startHero() {
    root.classList.add("ready");
    $$(".hero__name .split-chars").forEach((el) => el.classList.add("in"));
    setTimeout(startTyping, 900);
  }
  if (reduceMotion) {
    intro.remove();
    startHero();
  } else {
    root.classList.add("loading");
    const bar = $("#introBar"), num = $("#introCount");
    const t0 = performance.now(), dur = sessionStorage.getItem("seen") ? 450 : 1000;
    try { sessionStorage.setItem("seen", "1"); } catch {}
    (function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      bar.style.transform = `scaleX(${e})`;
      num.textContent = String(Math.round(e * 100)).padStart(3, "0");
      if (p < 1) return requestAnimationFrame(step);
      intro.classList.add("out");
      root.classList.remove("loading");
      startHero();
      setTimeout(() => intro.remove(), 1100);
    })(t0);
  }

  /* ---------------- typed roles ---------------- */
  const roles = ["Competitive Programmer", "Problem Solver", "ICPC Regionalist", "Codeforces Expert", "CodeChef 5★", "Software Engineering Intern @ Visa"];
  function startTyping() {
    const el = $("#typed");
    if (reduceMotion) return;
    let r = 0, i = roles[0].length, deleting = true;
    (function step() {
      const word = roles[r];
      el.textContent = word.slice(0, i);
      if (!deleting && i < word.length) { i++; setTimeout(step, 50 + Math.random() * 45); }
      else if (!deleting) { deleting = true; setTimeout(step, 1800); }
      else if (i > 0) { i--; setTimeout(step, 26); }
      else { deleting = false; r = (r + 1) % roles.length; setTimeout(step, 260); }
    })();
  }

  /* ---------------- nav ---------------- */
  const nav = $("#nav");
  const menuBtn = $("#menuBtn");
  let lastY = scrollY, ticking = false;
  function onScroll() {
    const y = scrollY;
    nav.classList.toggle("is-solid", y > 30);
    if (!nav.classList.contains("is-open")) nav.classList.toggle("is-hidden", y > 500 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove("is-hidden");
    lastY = y;
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.textContent = open ? "close" : "menu";
  });
  $$(".nav__links a").forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.textContent = "menu";
  }));

  const navLinks = new Map($$(".nav__links a").map((a) => [a.getAttribute("href").slice(1), a]));
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.remove("is-active"));
      navLinks.get(e.target.id)?.classList.add("is-active");
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("section[id]").forEach((s) => sectionIO.observe(s));

  /* ---------------- reveal + count-up ---------------- */
  const onReveal = new Map(); // element -> callback, fired once when it scrolls in
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      revealIO.unobserve(e.target);
      onReveal.get(e.target)?.();
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal, .reveal-img, .sec__head, .sec .split-chars").forEach((el) => revealIO.observe(el));

  function countUp(el) {
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || "0", 10);
    if (reduceMotion) return;
    const t0 = performance.now(), dur = 1400;
    (function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      const v = end * (1 - Math.pow(1 - p, 3));
      el.textContent = dec ? v.toFixed(dec) : Math.round(v);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  $$(".stats [data-count]").forEach((el) => onReveal.set(el.closest(".reveal"), () => countUp(el)));
  onReveal.set($(".cw-top"), () => $$(".cw-top [data-count]").forEach(countUp));

  /* ---------------- codeforces data (snapshot, refreshed live if the API answers) ---------------- */
  // [day since epoch, rating after contest]
  let ratingHistory = [[19621,375],[19626,600],[19642,796],[19664,930],[19668,920],[19678,997],[19707,934],[19709,902],[19710,961],[19714,914],[19715,863],[19719,861],[19728,969],[19735,914],[19737,981],[19759,977],[19766,933],[19772,963],[19780,971],[19793,910],[19863,984],[19877,1026],[19885,1053],[19915,1196],[19919,1235],[19927,1184],[19934,1234],[19941,1185],[19945,1274],[19948,1219],[19950,1194],[19965,1146],[19967,1096],[20010,1091],[20015,1229],[20020,1193],[20023,1294],[20024,1289],[20028,1288],[20029,1262],[20037,1309],[20044,1356],[20050,1414],[20062,1447],[20076,1506],[20077,1535],[20085,1514],[20092,1558],[20100,1608],[20147,1481],[20169,1437],[20170,1394],[20172,1435],[20176,1510],[20181,1528],[20183,1590],[20186,1619],[20197,1598],[20199,1588],[20232,1573],[20234,1614],[20300,1630],[20307,1669],[20324,1587],[20326,1585],[20328,1618],[20340,1637],[20373,1688],[20380,1810],[20385,1787],[20398,1623],[20402,1685],[20408,1649],[20460,1583],[20465,1548],[20470,1520],[20476,1580],[20478,1669],[20482,1666],[20492,1614],[20495,1551],[20520,1439],[20528,1375],[20533,1579],[20540,1575],[20541,1644],[20550,1599],[20556,1629],[20589,1611],[20594,1585],[20596,1549],[20603,1600],[20611,1524],[20622,1555],[20632,1517],[20660,1598],[20666,1561],[20669,1601],[20674,1521],[20682,1510],[20701,1540],[20708,1440],[20709,1523],[20740,1540]];

  const tags = [["greedy",537],["math",469],["constructive",299],["implementation",274],["brute force",222],["dp",205],["sortings",166],["number theory",144],["binary search",122],["data structures",118],["strings",99],["graphs",70]];
  const byDifficulty = [[800,285],[900,66],[1000,74],[1100,66],[1200,73],[1300,55],[1400,59],[1500,48],[1600,72],[1700,92],[1800,80],[1900,72],[2000,34],[2100,8],[2200,5],[2300,1],[2400,1],[2500,1]];

  const bands = [
    [0, 1200, "newbie", "#9a9a9a"],
    [1200, 1400, "pupil", "#3fb950"],
    [1400, 1600, "specialist", "#3cc7bb"],
    [1600, 1900, "expert", "#6a8cff"],
    [1900, 2100, "candidate master", "#c264ff"],
    [2100, 2400, "master", "#ff9c3a"],
    [2400, 4000, "grandmaster", "#ff4b4b"],
  ];
  const rankColor = (r) => bands.find((b) => r >= b[0] && r < b[1])[3];

  const SVG = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs) => {
    const el = document.createElementNS(SVG, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };
  const fmtDay = (d) => new Date(d * 864e5).toLocaleDateString("en-GB", { month: "short", year: "numeric" });

  const chartBox = $("#ratingChart");
  const tip = $("#chartTip");
  const cfCard = $(".cf");
  let chartDrawn = false;

  function drawChart() {
    const W = chartBox.clientWidth;
    const H = Math.max(220, Math.min(340, Math.round(W * 0.38)));
    chartBox.style.height = H + "px";
    chartBox.style.aspectRatio = "auto";
    const m = { l: 40, r: 12, t: 10, b: 24 };
    const data = ratingHistory;
    const maxR = Math.max(...data.map((d) => d[1]));
    const yMin = 300, yMax = Math.max(1900, Math.ceil((maxR + 150) / 100) * 100);
    const x0 = data[0][0], x1 = data[data.length - 1][0];
    const sx = (d) => m.l + ((d - x0) / (x1 - x0 || 1)) * (W - m.l - m.r);
    const sy = (r) => m.t + (1 - (r - yMin) / (yMax - yMin)) * (H - m.t - m.b);

    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": `Codeforces rating history, peak ${maxR}` });

    bands.forEach(([lo, hi, name, col]) => {
      const a = Math.max(lo, yMin), b = Math.min(hi, yMax);
      if (b <= a) return;
      svg.appendChild(svgEl("rect", { class: "band", x: m.l, y: sy(b), width: W - m.l - m.r, height: sy(a) - sy(b), fill: col }));
      if (W > 520) {
        const t = svgEl("text", { class: "band-label", x: m.l + 8, y: sy(b) + 13 });
        t.textContent = name;
        svg.appendChild(t);
      }
    });
    for (let r = 400; r <= yMax; r += 400) {
      svg.appendChild(svgEl("line", { class: "grid", x1: m.l, x2: W - m.r, y1: sy(r), y2: sy(r) }));
      const t = svgEl("text", { class: "axis", x: m.l - 8, y: sy(r) + 3.5, "text-anchor": "end" });
      t.textContent = r;
      svg.appendChild(t);
    }
    const y0 = new Date(x0 * 864e5).getFullYear(), yN = new Date(x1 * 864e5).getFullYear();
    for (let y = y0 + 1; y <= yN; y++) {
      const day = Date.UTC(y, 0, 1) / 864e5;
      const t = svgEl("text", { class: "axis", x: sx(day), y: H - 6, "text-anchor": "middle" });
      t.textContent = y;
      svg.appendChild(t);
    }

    const pts = data.map(([d, r]) => [sx(d), sy(r)]);
    const lineD = "M" + pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join("L");
    const defs = svgEl("defs", {});
    const grad = svgEl("linearGradient", { id: "areaGrad", x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.append(svgEl("stop", { offset: "0", "stop-color": "#f2c14e", "stop-opacity": ".22" }), svgEl("stop", { offset: "1", "stop-color": "#f2c14e", "stop-opacity": "0" }));
    defs.appendChild(grad);
    svg.appendChild(defs);
    svg.appendChild(svgEl("path", { class: "area", d: `${lineD}L${pts[pts.length - 1][0].toFixed(1)},${H - m.b}L${pts[0][0].toFixed(1)},${H - m.b}Z` }));
    const path = svgEl("path", { class: "line", d: lineD });
    svg.appendChild(path);
    const maxIdx = data.findIndex((d) => d[1] === maxR);
    pts.forEach((p, i) => svg.appendChild(svgEl("circle", { class: "pt" + (i === maxIdx ? " max" : ""), cx: p[0], cy: p[1], r: i === maxIdx ? 4 : 2.2 })));

    const hLine = svgEl("line", { class: "hover-line", y1: m.t, y2: H - m.b, visibility: "hidden" });
    const hPt = svgEl("circle", { class: "hover-pt", r: 4.5, visibility: "hidden" });
    svg.append(hLine, hPt);

    chartBox.querySelector("svg")?.remove();
    chartBox.prepend(svg);
    path.style.setProperty("--len", Math.ceil(path.getTotalLength()));
    if (chartDrawn) chartBox.classList.add("drawn");

    // hand-written peak note next to the max point
    const note = $("#peakNote");
    note.textContent = `max ${maxR}`;
    note.style.left = chartBox.offsetLeft + pts[maxIdx][0] - 24 + "px";
    note.style.top = chartBox.offsetTop + pts[maxIdx][1] - 28 + "px";

    const days = data.map((d) => d[0]);
    function show(clientX) {
      const rect = svg.getBoundingClientRect();
      const x = clientX - rect.left;
      let lo = 0, hi = pts.length - 1;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; pts[mid][0] < x ? (lo = mid) : (hi = mid); }
      const i = Math.abs(pts[lo][0] - x) < Math.abs(pts[hi][0] - x) ? lo : hi;
      const [px, py] = pts[i];
      const delta = i ? data[i][1] - data[i - 1][1] : data[i][1];
      hLine.setAttribute("x1", px); hLine.setAttribute("x2", px);
      hPt.setAttribute("cx", px); hPt.setAttribute("cy", py);
      hLine.setAttribute("visibility", "visible"); hPt.setAttribute("visibility", "visible");
      tip.hidden = false;
      tip.innerHTML = `${fmtDay(days[i])} · contest #${i + 1}<br><b style="color:${rankColor(data[i][1])}">${data[i][1]}</b> <span style="color:${delta >= 0 ? "var(--ok)" : "#e5735a"}">${delta >= 0 ? "+" : ""}${delta}</span>`;
      const tw = tip.offsetWidth;
      tip.style.transform = `translate(${Math.min(Math.max(px - tw / 2, 0), W - tw)}px, ${Math.max(py - 58, 0)}px)`;
    }
    svg.addEventListener("pointermove", (e) => show(e.clientX));
    svg.addEventListener("pointerdown", (e) => show(e.clientX));
    svg.addEventListener("pointerleave", () => {
      tip.hidden = true;
      hLine.setAttribute("visibility", "hidden"); hPt.setAttribute("visibility", "hidden");
    });
  }

  function updateNums() {
    const last = ratingHistory[ratingHistory.length - 1][1];
    $("#cfNow").textContent = last;
    $("#cfNow").style.color = rankColor(last);
    $("#cfCount").textContent = ratingHistory.length;
    $("#statContests").textContent = ratingHistory.length;
    $("#statContests").dataset.count = ratingHistory.length;
  }

  drawChart();
  updateNums();
  onReveal.set(cfCard, () => {
    chartDrawn = true;
    requestAnimationFrame(() => { chartBox.classList.add("drawn"); cfCard.classList.add("noted"); });
  });
  let resizeTimer;
  let lastW = chartBox.clientWidth;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (chartBox.clientWidth !== lastW) { lastW = chartBox.clientWidth; drawChart(); } }, 150);
  });

  // try to pull fresh numbers; the snapshot above stays if this fails
  const liveTag = $("#cfLive");
  liveTag.textContent = "snapshot · oct 2026";
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), 5000);
  fetch("https://codeforces.com/api/user.rating?handle=kingAB", { signal: ctrl.signal })
    .then((r) => r.json())
    .then((j) => {
      if (j.status !== "OK" || !j.result.length) return;
      ratingHistory = j.result.map((c) => [Math.floor(c.ratingUpdateTimeSeconds / 86400), c.newRating]);
      updateNums();
      drawChart();
      liveTag.textContent = "live · codeforces api";
      liveTag.classList.add("on");
    })
    .catch(() => {});

  /* ---------------- tag bars + difficulty histogram ---------------- */
  const tagMax = tags[0][1];
  $("#tagBars").innerHTML = tags.map(([t, n]) =>
    `<li><span>${t}</span><span class="track"><span class="fill" style="--w:${(n / tagMax).toFixed(3)}"></span></span><span class="n">${n}</span></li>`
  ).join("");

  const diffMax = Math.max(...byDifficulty.map((d) => d[1]));
  $("#diffHist").innerHTML = byDifficulty.map(([r, n], i) =>
    `<div class="col" title="${n} problems rated ${r}"><div class="bar" style="--h:${Math.max(2, (n / diffMax) * 100).toFixed(1)}%;background:${rankColor(r)};transition-delay:${i * 35}ms"></div><em>${n}</em><span>${r}</span></div>`
  ).join("");
  $$("#tagBars .fill").forEach((f, i) => (f.style.transitionDelay = i * 50 + "ms"));

  /* ---------------- cursor, magnetic, tilt ---------------- */
  if (finePointer && !reduceMotion) {
    const cur = $("#cursor");
    let tx = -100, ty = -100, cx = -100, cy = -100, moving = false;
    const follow = () => {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3) requestAnimationFrame(follow);
      else moving = false;
    };
    addEventListener("pointermove", (e) => {
      tx = e.clientX; ty = e.clientY;
      cur.classList.add("on");
      if (!moving) { moving = true; requestAnimationFrame(follow); }
    }, { passive: true });
    document.addEventListener("pointerleave", () => cur.classList.remove("on"));
    document.addEventListener("pointerover", (e) => cur.classList.toggle("big", !!e.target.closest("a, button, [data-magnetic], .tilt")));

    $$("[data-magnetic]").forEach((el) => {
      const k = 0.3;
      el.style.transition = (getComputedStyle(el).transition || "") + ", translate .5s cubic-bezier(.2,.7,.2,1)";
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.translate = `${(e.clientX - r.left - r.width / 2) * k}px ${(e.clientY - r.top - r.height / 2) * k}px`;
      });
      el.addEventListener("pointerleave", () => (el.style.translate = "0 0"));
    });

    $$(".tilt").forEach((el) => {
      let raf = 0, ev = null;
      const max = 7;
      const apply = () => {
        raf = 0;
        const r = el.getBoundingClientRect();
        const px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
        el.style.setProperty("--mx", px * 100 + "%");
        el.style.setProperty("--my", py * 100 + "%");
        el.style.setProperty("--ry", ((px - 0.5) * max * 2).toFixed(2) + "deg");
        el.style.setProperty("--rx", ((0.5 - py) * max * 2).toFixed(2) + "deg");
      };
      let offTimer;
      el.addEventListener("pointerenter", () => { clearTimeout(offTimer); el.classList.add("tilt-on", "tilting"); });
      el.addEventListener("pointermove", (e) => { ev = e; if (!raf) raf = requestAnimationFrame(apply); });
      el.addEventListener("pointerleave", () => {
        el.classList.remove("tilting");
        el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg");
        offTimer = setTimeout(() => el.classList.remove("tilt-on"), 550);
      });
    });
  }

  /* ---------------- hero loops + marquee only animate while visible ---------------- */
  new IntersectionObserver(([e]) => root.classList.toggle("hero-off", !e.isIntersecting)).observe($("#hero"));
  const marquee = $(".marquee");
  new IntersectionObserver(([e]) => marquee.classList.toggle("paused", !e.isIntersecting)).observe(marquee);

  /* ---------------- fallbacks for browsers without scroll-driven CSS ---------------- */
  if (!CSS.supports("animation-timeline: scroll()")) {
    const bar = $("#progress"), fill = $("#jobsFill"), jobs = $(".jobs");
    let queued = false;
    const update = () => {
      queued = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      const r = jobs.getBoundingClientRect();
      const p = Math.min(Math.max((innerHeight * 0.7 - r.top) / r.height, 0), 1);
      fill.style.transform = `scaleY(${p})`;
    };
    addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------------- copy email ---------------- */
  const toast = $("#toast");
  $("#copyMail").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText("arpitbhomia1204@gmail.com"); toast.textContent = "copied ✓"; }
    catch { toast.textContent = "arpitbhomia1204@gmail.com"; }
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1800);
  });

  /* ---------------- hero graph (three.js), loaded last ---------------- */
  const saveData = navigator.connection && navigator.connection.saveData;
  function webglOK() {
    try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
    catch { return false; }
  }
  if (!reduceMotion && !saveData && webglOK()) {
    const go = () => import("./graph.js").catch(() => {});
    // graph.js renders into the fixed #bg canvas behind the whole page
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
    if (document.readyState === "complete") idle(go);
    else addEventListener("load", () => idle(go), { once: true });
  }
})();
