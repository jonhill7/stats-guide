/* App shell: routing, navigation, level/theme toggles, distribution pages. */
(function () {
  'use strict';
  const G = window.GUIDE, S = window.Stats, P = window.Plot;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const main = $('#main');

  // ------------------------------------------------------------ storage (best effort)
  const store = {
    get(k, d) { try { const v = localStorage.getItem('sg.' + k); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('sg.' + k, v); } catch (e) { /* ignore */ } },
  };

  // ------------------------------------------------------------ prepare distributions
  G.byId = {};
  for (const d of G.dists) {
    G.byId[d.id] = d;
    d.discrete = d.type === 'discrete';
    d.short = d.short || d.name;
    if (d.discrete) {
      if (!d.cdf) d.cdf = (x, p) => {
        const lo = d.lower(p), k = Math.floor(x);
        if (k < lo) return 0;
        if (k >= d.upper(p)) return 1;
        let s = 0; for (let i = lo; i <= k; i++) s += d.pmf(i, p);
        return Math.min(1, s);
      };
      if (!d.quantile) d.quantile = (q, p) => {
        const lo = d.lower(p), hi = d.upper(p);
        let s = 0;
        for (let k = lo; k <= Math.min(hi, lo + 200000); k++) { s += d.pmf(k, p); if (s >= q - 1e-12) return k; }
        return hi;
      };
      d.density = d.pmf;
    } else {
      if (!d.quantile) d.quantile = (q, p) => S.quantileCont(x => d.cdf(x, p), q, d.lower(p), d.upper(p));
      d.density = d.pdf;
    }
    if (d.numericMoments) {
      const mom = p => S.discreteMoments(k => d.pmf(k, p), d.lower(p), d.upper(p));
      d.skewness = p => mom(p).skewness;
      d.kurtosis = p => mom(p).kurtosis;
    }
    d.defaults = () => Object.fromEntries(d.params.map(q => [q.key, q.value]));
    d.median = p => d.quantile(0.5, p);

    // Default plotting window
    d.range = p => {
      if (d.view) return d.view(p);
      return [d.quantile(d.discrete ? 0.0005 : 0.002, p), d.quantile(d.discrete ? 0.9995 : 0.998, p)];
    };
    // Continuous curve sampled on [xmin, xmax], with exact support edges inserted
    d.curve = (p, v, n) => {
      n = n || 500;
      const xs = [];
      for (let i = 0; i <= n; i++) xs.push(v.xmin + (v.xmax - v.xmin) * i / n);
      for (const e of [d.lower(p), d.upper(p)]) if (isFinite(e) && e > v.xmin && e < v.xmax) xs.push(e - 1e-9, e, e + 1e-9);
      xs.sort((a, b) => a - b);
      return xs.map(x => [x, d.pdf(x, p)]);
    };
    // Fit a view (x range + y max) to the parameters
    d.fit = p => {
      let [a, b] = d.range(p);
      let xmin, xmax;
      if (d.discrete) {
        a = Math.max(d.lower(p), Math.floor(a)); b = Math.ceil(b);
        if (b - a < 4) { const extra = 4 - (b - a); b = Math.min(d.upper(p), b + Math.ceil(extra / 2)); a = Math.max(d.lower(p), a - Math.floor(extra / 2)); }
        xmin = a - 0.7; xmax = b + 0.7;
      } else {
        const w = (b - a) || 1;
        xmin = a - 0.06 * w; xmax = b + 0.06 * w;
        const lo = d.lower(p), hi = d.upper(p);
        if (isFinite(lo) && xmin < lo) xmin = lo - 0.04 * w;
        if (isFinite(hi) && xmax > hi) xmax = hi + 0.04 * w;
        if (d.view) { xmin = a; xmax = b; }
      }
      let ymax;
      if (d.discrete) {
        ymax = 0;
        for (let k = Math.ceil(xmin); k <= xmax; k++) ymax = Math.max(ymax, d.pmf(k, p));
      } else {
        const ys = d.curve(p, { xmin, xmax }, 300).map(q => q[1]).filter(y => isFinite(y) && y > 0).sort((u, v) => u - v);
        const max = ys[ys.length - 1] || 1;
        const p90 = ys[Math.floor(ys.length * 0.9)] || max;
        ymax = Math.min(max, 4 * p90);
      }
      return { xmin, xmax, ymax: (ymax || 1) * 1.12 };
    };
  }
  G.relations.forEach(rel => { rel.fromD = G.byId[rel.from]; rel.toD = G.byId[rel.to]; });

  // ------------------------------------------------------------ helpers shared with pages.js
  const math = el => {
    if (window.renderMathInElement) {
      window.renderMathInElement(el, {
        delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }],
        throwOnError: false,
      });
    }
  };
  const tex = (s, display) => {
    try { return window.katex.renderToString(s, { displayMode: !!display, throwOnError: false }); } catch (e) { return s; }
  };
  const link = d => `<a href="#${d.id}" class="dlink ${d.type}">${d.short}</a>`;
  G.ui = { $, $$, math, tex, link, store };

  // ------------------------------------------------------------ level + theme
  function setLevel(level) {
    document.body.classList.toggle('level-intro', level === 'intro');
    document.body.classList.toggle('level-advanced', level === 'advanced');
    $$('.level-toggle button').forEach(b => b.setAttribute('aria-pressed', b.dataset.level === level));
    store.set('level', level);
    G.level = level;
    if (G.onLevel) G.onLevel(level);
  }
  $$('.level-toggle button').forEach(b => b.addEventListener('click', () => setLevel(b.dataset.level)));
  setLevel(store.get('level', 'intro'));

  function applyTheme(t) {
    if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
  }
  applyTheme(store.get('theme', ''));
  $('#themeBtn').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    applyTheme(next); store.set('theme', next);
    route(); // re-render charts with new colors
  });

  // ------------------------------------------------------------ sidebar
  const pages = [
    ['', 'Home', 'home'], ['basics', 'Start here: the basics', 'book'], ['chooser', 'Which distribution?', 'quiz'],
    ['map', 'Relationship map', 'map'], ['clt', 'Central Limit Theorem lab', 'lab'], ['cheatsheet', 'Formula cheat sheet', 'table'], ['tables', 'Critical-value tables', 'table'],
  ];
  function buildSidebar() {
    const sb = $('#sidebar');
    const group = (type, title) => `<div class="nav-group"><div class="nav-title">${title}</div>` +
      G.dists.filter(d => d.type === type).map(d => `<a href="#${d.id}" data-id="${d.id}" class="nav-item ${type}"><span class="dot"></span>${d.short}</a>`).join('') + '</div>';
    sb.innerHTML = `<input type="search" id="navSearch" placeholder="Search distributions…" aria-label="Search distributions">
      <div class="nav-group">${pages.map(([h, t]) => `<a href="#${h || 'home'}" data-page="${h}" class="nav-item page">${t}</a>`).join('')}</div>
      ${group('discrete', 'Discrete')}${group('continuous', 'Continuous')}`;
    $('#navSearch').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      $$('.nav-item', sb).forEach(a => { a.style.display = !q || a.textContent.toLowerCase().includes(q) ? '' : 'none'; });
    });
    sb.addEventListener('click', e => { if (e.target.closest('a')) document.body.classList.remove('nav-open'); });
  }
  buildSidebar();
  $('#menuBtn').addEventListener('click', () => document.body.classList.toggle('nav-open'));

  // ------------------------------------------------------------ router
  function route() {
    // Plain-hash routes: #normal, #map, #map-normal, #basics (old #/d/normal still works)
    let h = location.hash.replace(/^#\/?/, '').replace(/^d\//, '').split('?')[0];
    if (!h || h === 'home') h = '';
    let focus = null;
    if (h.startsWith('map-')) { focus = h.slice(4); h = 'map'; }
    G.mapFocus = focus;
    G.onLevel = null;
    if (G.cleanup) { G.cleanup(); G.cleanup = null; }
    const dist = G.byId[h];
    $$('#sidebar .nav-item').forEach(a => a.classList.toggle('active', dist ? a.dataset.id === h : a.dataset.page === h));
    window.scrollTo(0, 0);
    if (dist) { renderDist(dist); document.title = dist.short + ' distribution · Distributions Guide'; return; }
    const page = G.pages && G.pages[h || 'home'];
    if (page) { page(main); document.title = (pages.find(p => p[0] === h)?.[1] || 'Guide') + ' · Distributions Guide'; }
    else main.innerHTML = '<p>Page not found. <a href="#home">Go home</a></p>';
    math(main);
    if (G.glossarize) G.glossarize(main);
  }
  G.route = route;
  window.addEventListener('hashchange', route);

  // ------------------------------------------------------------ distribution page
  const HS_FORMULAS = new Set(['support', 'pdf', 'mean', 'var', 'z', 'def']);

  function relatedHTML(d) {
    const rels = G.relations.filter(r => r.from === d.id || r.to === d.id);
    if (!rels.length) return '';
    return `<ul class="rel-list">${rels.map(r => {
      const other = r.from === d.id ? r.toD : r.fromD;
      const dir = r.from === d.id ? '→' : '←';
      return `<li><span class="kind-chip" style="--kc:${G.relKinds[r.kind].color}">${G.relKinds[r.kind].label}</span>
        <span class="rel-dir">${dir}</span> ${link(other)}<div class="rel-text">${r.text}</div></li>`;
    }).join('')}</ul><p class="small"><a href="#map-${d.id}">See it on the relationship map →</a></p>`;
  }

  function renderDist(d) {
    const st = {
      p: d.defaults(), view: null, locked: true, showSd: true, overlays: new Set(), samples: [],
      mode: 'between', a: null, b: null, q: 0.95,
    };
    const unit = d.discrete ? 'PMF' : 'PDF';
    main.innerHTML = `
    <article class="dist">
      <header class="dist-head">
        <div class="badges"><span class="badge ${d.type}">${d.discrete ? 'Discrete' : 'Continuous'}</span></div>
        <h1>${d.name} distribution</h1>
        <p class="tagline">${d.tagline}</p>
        <div class="notation">\\(${d.notation}\\)</div>
      </header>

      <section class="lab">
        <div class="lab-plots">
          <div class="card plot-card">
            <div class="plot-head"><h3>${d.discrete ? 'Probability mass function (PMF)' : 'Probability density function (PDF)'}</h3>
              <span class="hint">${d.discrete ? 'Bar height = probability of that exact value' : 'Area under the curve = probability'} · click the plot to move the shaded range</span></div>
            <div id="pdfPlot"></div>
            <div class="legend" id="legend"></div>
          </div>
          <div class="card mech-card" id="mechCard"></div>
          <div class="card plot-card">
            <div class="plot-head"><h3>Cumulative distribution function (CDF)</h3>
              <span class="hint">F(x) = P(X ≤ x): the running total of probability</span></div>
            <div id="cdfPlot"></div>
          </div>
        </div>
        <div class="lab-controls">
          <div class="card"><h3>Parameters</h3><div id="params"></div>
            <div class="row gap"><button class="btn" id="resetBtn">Reset</button><button class="btn" id="fitBtn" title="Rescale the axes to fit the current distribution">Fit axes</button>
            <label class="check" title="Keep axes fixed while you move sliders, so you can see the shape change"><input type="checkbox" id="lockAx" checked> Lock axes</label></div>
          </div>
          <div class="card"><h3>Summary</h3><table class="summary" id="summary"></table></div>
          <div class="card"><h3>Probability calculator</h3>
            <div class="calc">
              <select id="calcMode" aria-label="Probability type">
                <option value="left">P(X ≤ b)</option><option value="between" selected>P(a ≤ X ≤ b)</option><option value="right">P(X ≥ a)</option>
              </select>
              <label class="ab" id="aWrap">a <input type="number" id="calcA" step="${d.discrete ? 1 : 'any'}"></label>
              <label class="ab" id="bWrap">b <input type="number" id="calcB" step="${d.discrete ? 1 : 'any'}"></label>
            </div>
            <div class="calc-result" id="calcResult"></div>
            <div class="calc quant"><span>Percentile:</span><input type="number" id="calcQ" min="0.0001" max="0.9999" step="0.01" value="0.95" aria-label="Cumulative probability">
              <span id="calcQres"></span></div>
          </div>
          <div class="card"><h3>Simulate</h3>
            <p class="small">Draw random values and watch the histogram fill in the ${unit}. Draws accumulate; changing a parameter clears them.</p>
            <div class="row gap wrap">${[1, 10, 100, 1000, 10000].map(n => `<button class="btn" data-draw="${n}">+${n.toLocaleString()}</button>`).join('')}<button class="btn ghost" id="clearDraw">Clear</button></div>
            <div class="sim-stats" id="simStats"></div>
          </div>
          <div class="card"><h3>Display</h3>
            <label class="check"><input type="checkbox" id="showSd" checked> Show mean and ±1 SD</label>
            ${(d.overlays || []).map((o, i) => `<label class="check"><input type="checkbox" data-ov="${i}"> Overlay: ${o.label}</label>`).join('')}
          </div>
        </div>
      </section>

      <section class="content">
        ${d.ex ? `<div class="card prose intro-only worked c-ex"><h2>Worked example</h2>
          <p class="ex-q"><b>${d.ex.q}</b></p>
          <ol class="ex-steps">${d.ex.steps.map(x => `<li>${x}</li>`).join('')}</ol>
          <p class="ex-ans"><b>Answer:</b> ${d.ex.ans}</p>
          <button class="btn primary" id="tryEx">Show this on the plot ↑</button></div>` : ''}
        ${d.inf ? `<div class="card prose adv c-inf"><h2>Estimation &amp; software</h2><table class="formulas">
          <tr><th>Maximum likelihood</th><td>${d.inf.mle}</td></tr>
          <tr><th>Fisher information</th><td>${d.inf.info}</td></tr>
          <tr><th>Sufficient statistic</th><td>${d.inf.suff}</td></tr>
          <tr><th>Conjugate prior</th><td>${d.inf.conj}</td></tr>
          <tr><th>Exponential family?</th><td>${d.inf.expfam}</td></tr>
          <tr><th>R</th><td><code>${d.inf.r}</code></td></tr>
          <tr><th>Python</th><td><code>${d.inf.py}</code></td></tr></table></div>` : ''}
        <details class="card prose c-idea" id="ideaCard" open><summary><h2>The big idea</h2><span class="adv small muted">click to expand</span></summary>${d.intuition}</details>
        <div class="card prose c-uses"><h2>Where it shows up</h2><ul>${d.examples.map(e => `<li>${e}</li>`).join('')}</ul></div>
        <div class="card prose c-params"><h2>Parameters</h2><table class="ptable">${d.params.map(q => `<tr><th>\\(${q.tex}\\)</th><td>${q.desc}</td><td class="muted nowrap">${q.min} to ${q.maxFrom ? q.maxFrom : q.max}</td></tr>`).join('')}</table>
          <p class="small muted">Slider ranges are chosen for exploration; the true parameter space may be larger.</p></div>
        <div class="card prose c-formulas"><h2><span class="intro-only">Key formulas</span><span class="adv">Formulas &amp; properties</span></h2>
          <table class="formulas">${d.formulas.map(f => `<tr class="${HS_FORMULAS.has(f[0]) ? '' : 'adv'}"><th>${f[1]}</th><td>\\(\\displaystyle ${f[2]}\\)</td></tr>`).join('')}</table>
          <p class="intro-only small muted">Grad School mode (top right) adds the CDF, skewness, kurtosis, generating functions and more.</p></div>
        <div class="card prose adv deep c-deep"><h2>Deep dive</h2>${d.deep}</div>
        ${d.pitfalls ? `<div class="card prose warn c-warn"><h2>Watch out</h2><ul>${d.pitfalls.map(x => `<li>${x}</li>`).join('')}</ul></div>` : ''}
        <div class="card prose c-rel"><h2>Related distributions</h2>${relatedHTML(d)}</div>
        <div class="card prose intro-only deep-teaser c-teaser"><h2>Going further</h2><p>Grad School mode adds a deep dive on this distribution (derivations, estimation, and connections to the rest of statistics), plus the full formula sheet. <button class="btn" id="toAdv">Switch to Grad School</button></p></div>
      </section>
      <nav class="prevnext">${prevNext(d)}</nav>
    </article>`;
    math(main);
    if (G.glossarize) G.glossarize(main);

    // ---- parameter controls
    const pbox = $('#params');
    for (const q of d.params) {
      const row = document.createElement('div');
      row.className = 'param';
      row.innerHTML = `<div class="param-top"><span class="pname">${tex(q.tex)}</span>
          <input type="number" class="pnum" step="${q.step}" aria-label="${q.key} value">
        </div>
        <input type="range" class="prange" min="${q.min}" max="${q.max}" step="${q.step}" aria-label="${q.key}">
        <div class="pdesc">${q.desc}</div>`;
      pbox.appendChild(row);
      const rng = $('.prange', row), num = $('.pnum', row);
      const set = (v, fromUser) => {
        v = parseFloat(v); if (Number.isNaN(v)) return;
        const max = q.maxFrom ? Math.min(q.max, st.p[q.maxFrom]) : q.max;
        v = Math.max(q.min, Math.min(max, v));
        if (q.int) v = Math.round(v);
        st.p[q.key] = v;
        if (d.constrain) d.constrain(st.p, q.key);
        if (fromUser) paramsChanged();
      };
      rng.addEventListener('input', () => set(rng.value, true));
      num.addEventListener('change', () => set(num.value, true));
      q._ui = { rng, num };
    }
    function syncParamUI() {
      for (const q of d.params) {
        const max = q.maxFrom ? Math.min(q.max, st.p[q.maxFrom]) : q.max;
        q._ui.rng.max = max;
        q._ui.rng.value = st.p[q.key];
        q._ui.num.value = +(+st.p[q.key]).toFixed(4);
      }
    }

    // ---- charts
    const pdfChart = new P.Chart($('#pdfPlot'), { height: 330 });
    const cdfChart = new P.Chart($('#cdfPlot'), { height: 210 });
    const mech = G.mountMech ? G.mountMech($('#mechCard'), d, {
      params: () => st.p, view: () => st.view,
      push: vals => { for (const x of vals) st.samples.push(x); draw(); },
    }) : null;
    if (!mech) $('#mechCard').remove();
    G.cleanup = () => { if (mech) mech.stop(); };

    function defaultAB() {
      const m = d.mean(st.p), v = d.variance(st.p);
      let a, b;
      if (isFinite(m) && isFinite(v) && v > 0) { a = m - Math.sqrt(v); b = m + Math.sqrt(v); }
      else { a = d.quantile(0.25, st.p); b = d.quantile(0.75, st.p); }
      if (d.discrete) { a = Math.ceil(a); b = Math.floor(b); if (b < a) b = a; }
      else { a = +a.toPrecision(3); b = +b.toPrecision(3); }
      st.a = a; st.b = b;
      $('#calcA').value = a; $('#calcB').value = b;
    }

    function paramsChanged() {
      syncParamUI();
      st.samples = [];
      if (mech) setTimeout(() => mech.reset(), 0);
      if (!st.locked || !st.view) st.view = d.fit(st.p);
      else {
        const f = d.fit(st.p);
        if (f.ymax > st.view.ymax * 1.02) st.view.ymax = f.ymax; // grow the y-axis if the curve no longer fits
      }
      draw();
    }

    const color = { main: 'var(--c1)', shade: 'var(--shade)', sd: 'var(--c-sd)', sim: 'var(--c-sim)', ov: ['var(--c2)', 'var(--c3)'] };

    function inRange(x) {
      const { a, b, mode } = st;
      if (mode === 'left') return x <= b + 1e-12;
      if (mode === 'right') return x >= a - 1e-12;
      return x >= a - 1e-12 && x <= b + 1e-12;
    }
    function prob() {
      const { a, b, mode } = st, F = x => d.cdf(x, st.p);
      if (d.discrete) {
        if (mode === 'left') return F(b);
        if (mode === 'right') return 1 - F(a - 1);
        return b < a ? 0 : F(b) - F(a - 1);
      }
      if (mode === 'left') return F(b);
      if (mode === 'right') return 1 - F(a);
      return b < a ? 0 : F(b) - F(a);
    }

    function draw() {
      const v = st.view, p = st.p;
      const layers = [];
      const legend = [];
      const mean = d.mean(p), sd = Math.sqrt(d.variance(p));

      // theory
      if (d.discrete) {
        const data = [];
        for (let k = Math.ceil(v.xmin); k <= v.xmax; k++) data.push([k, d.pmf(k, p)]);
        layers.push({ kind: 'bars', data, width: 0.72, color: color.main, highlight: inRange, hcolor: color.shade, opacity: 0.9 });
        legend.push([color.main, 'PMF'], [color.shade, 'In calculator range']);
      } else {
        const pts = d.curve(p, v, 500);
        const lo = st.mode === 'right' ? st.a : (st.mode === 'left' ? -Infinity : st.a);
        const hi = st.mode === 'left' ? st.b : (st.mode === 'right' ? Infinity : st.b);
        const shade = pts.filter(([x]) => x >= lo && x <= hi);
        if (isFinite(lo) && lo > v.xmin && lo < v.xmax) shade.unshift([lo, d.pdf(lo, p)]);
        if (isFinite(hi) && hi > v.xmin && hi < v.xmax) shade.push([hi, d.pdf(hi, p)]);
        shade.sort((u, w) => u[0] - w[0]);
        if (shade.length > 1) layers.push({ kind: 'area', pts: shade, color: color.shade, opacity: 0.45 });
        layers.push({ kind: 'area', pts, color: color.main, opacity: 0.1 });
        legend.push([color.main, 'PDF'], [color.shade, 'Shaded area = probability']);
      }

      // simulation histogram
      const n = st.samples.length;
      if (n) {
        let bins = [];
        if (d.discrete) {
          const counts = new Map();
          for (const x of st.samples) counts.set(x, (counts.get(x) || 0) + 1);
          for (const [k, c] of counts) bins.push({ x0: k - 0.36, x1: k + 0.36, y: c / n });
        } else {
          const nb = Math.max(12, Math.min(70, Math.round(2 * Math.sqrt(n))));
          const w = (v.xmax - v.xmin) / nb, cnt = new Array(nb).fill(0);
          for (const x of st.samples) { const i = Math.floor((x - v.xmin) / w); if (i >= 0 && i < nb) cnt[i]++; }
          bins = cnt.map((c, i) => ({ x0: v.xmin + i * w, x1: v.xmin + (i + 1) * w, y: c / (n * w) }));
        }
        layers.push({ kind: 'hist', bins, color: color.sim });
        legend.push([color.sim, `Simulated (n = ${n.toLocaleString()})`]);
      }

      if (!d.discrete) layers.push({ kind: 'line', pts: d.curve(p, v, 500), color: color.main, width: 2.6 });

      // overlays
      const ovFns = [];
      [...st.overlays].forEach((i, j) => {
        const o = d.overlays[i], t = G.byId[o.target], tp = o.map(p), c = color.ov[j % 2], sh = o.shift || 0;
        if (t.discrete) {
          const pts = [];
          for (let k = Math.ceil(v.xmin); k <= v.xmax; k++) pts.push([k, t.pmf(k, tp)]);
          layers.push({ kind: 'points', pts, color: c, r: 3.6 });
        } else {
          const pts = [];
          for (let i2 = 0; i2 <= 400; i2++) { const x = v.xmin + (v.xmax - v.xmin) * i2 / 400; pts.push([x, t.pdf(x - sh, tp)]); }
          layers.push({ kind: 'line', pts, color: c, width: 2, dash: '7 4' });
        }
        legend.push([c, o.label]);
        ovFns.push({ o, t, tp, sh });
      });

      if (st.showSd && isFinite(mean)) {
        layers.push({ kind: 'vline', x: mean, color: color.sd, dash: '2 0', width: 1.6, label: 'mean' });
        if (isFinite(sd) && sd > 0) {
          layers.push({ kind: 'vline', x: mean - sd, color: color.sd, dash: '4 4', label: '−1 SD' });
          layers.push({ kind: 'vline', x: mean + sd, color: color.sd, dash: '4 4', label: '+1 SD' });
        }
      }

      pdfChart.render({
        xmin: v.xmin, xmax: v.xmax, ymin: 0, ymax: v.ymax, layers, integerX: d.discrete,
        xlabel: d.discrete ? 'k' : 'x', ylabel: d.discrete ? 'P(X = k)' : 'density f(x)',
        hover: x => {
          if (d.discrete) x = Math.round(x);
          const fx = d.density(x, p), Fx = d.cdf(x, p);
          const lines = d.discrete
            ? [`k = ${x}`, `P(X = ${x}) = ${S.fmt(fx)}`, `P(X ≤ ${x}) = ${S.fmt(Fx)}`]
            : [`x = ${S.fmt(x, 3)}`, `f(x) = ${S.fmt(fx)}`, `F(x) = ${S.fmt(Fx)}`];
          for (const { o, t, tp, sh } of ovFns) lines.push(`${o.label.split(' ')[0]}: ${S.fmt(t.density(x - sh, tp))}`);
          return { x, y: fx, lines };
        },
        onClick: x => {
          if (d.discrete) x = Math.round(x); else x = +x.toPrecision(3);
          if (st.mode === 'left') st.b = x;
          else if (st.mode === 'right') st.a = x;
          else if (Math.abs(x - st.a) < Math.abs(x - st.b)) st.a = x; else st.b = x;
          if (st.mode === 'between' && st.a > st.b) [st.a, st.b] = [st.b, st.a];
          $('#calcA').value = st.a; $('#calcB').value = st.b;
          draw();
        },
      });
      $('#legend').innerHTML = legend.map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join('');

      // CDF
      const cl = [];
      if (d.discrete) {
        const data = [];
        for (let k = Math.max(d.lower(p), Math.ceil(v.xmin)); k <= v.xmax; k++) data.push([k, d.cdf(k, p)]);
        if (data.length && data[0][0] > v.xmin) data.unshift([v.xmin, d.cdf(v.xmin, p)]);
        cl.push({ kind: 'steps', data, color: color.main });
      } else {
        const pts = [];
        for (let i = 0; i <= 400; i++) { const x = v.xmin + (v.xmax - v.xmin) * i / 400; pts.push([x, d.cdf(x, p)]); }
        cl.push({ kind: 'line', pts, color: color.main, width: 2.4 });
      }
      for (const { t, tp, sh } of ovFns) {
        if (t.discrete) {
          const data = [];
          for (let k = Math.ceil(v.xmin); k <= v.xmax; k++) data.push([k, t.cdf(k, tp)]);
          cl.push({ kind: 'steps', data, color: color.ov[ovFns.indexOf(ovFns.find(f => f.t === t)) % 2], dots: false });
        } else {
          const pts = [];
          for (let i = 0; i <= 300; i++) { const x = v.xmin + (v.xmax - v.xmin) * i / 300; pts.push([x, t.cdf(x - sh, tp)]); }
          cl.push({ kind: 'line', pts, color: color.ov[ovFns.findIndex(f => f.t === t) % 2], width: 1.8, dash: '7 4' });
        }
      }
      // show calculator bounds on the CDF: P = F(b) - F(a)
      const Fa = st.mode === 'left' ? 0 : (d.discrete ? d.cdf(st.a - 1, p) : d.cdf(st.a, p));
      const Fb = st.mode === 'right' ? 1 : d.cdf(st.b, p);
      if (st.mode !== 'left') cl.push({ kind: 'hline', y: Fa, color: color.shade, x1: st.a, dash: '3 3' }, { kind: 'vline', x: st.a, color: color.shade, dash: '3 3' });
      if (st.mode !== 'right') cl.push({ kind: 'hline', y: Fb, color: color.shade, x1: st.b, dash: '3 3' }, { kind: 'vline', x: st.b, color: color.shade, dash: '3 3' });
      const bx = st.mode === 'right' ? st.a : st.b;
      if (bx > v.xmin && bx < v.xmax) cl.push({ kind: 'bracket', x: Math.min(v.xmax - (v.xmax - v.xmin) * 0.01, Math.max(bx, st.a) + (v.xmax - v.xmin) * 0.015), y0: Fa, y1: Fb, color: color.shade });
      cdfChart.render({
        xmin: v.xmin, xmax: v.xmax, ymin: 0, ymax: 1.05, layers: cl, integerX: d.discrete, yticks: 4,
        xlabel: d.discrete ? 'k' : 'x', ylabel: 'F(x)',
        hover: x => { if (d.discrete) x = Math.floor(x); const Fx = d.cdf(x, p); return { x, y: Fx, lines: [`${d.discrete ? 'k' : 'x'} = ${S.fmt(x, 3)}`, `P(X ≤ ${S.fmt(x, 3)}) = ${S.fmt(Fx)}`] }; },
      });

      // calculator text
      const pr = prob();
      const txt = st.mode === 'left' ? `P(X ≤ ${st.b})` : st.mode === 'right' ? `P(X ≥ ${st.a})` : `P(${st.a} ≤ X ≤ ${st.b})`;
      const how = d.discrete
        ? (st.mode === 'left' ? `F(${st.b})` : st.mode === 'right' ? `1 − F(${st.a - 1})` : `F(${st.b}) − F(${st.a - 1})`)
        : (st.mode === 'left' ? `F(${st.b})` : st.mode === 'right' ? `1 − F(${st.a})` : `F(${st.b}) − F(${st.a})`);
      $('#calcResult').innerHTML = `<b>${txt} = ${S.fmtP(pr)}</b><span class="muted"> = ${how}</span>` +
        (d.discrete ? '' : '<div class="small muted">For continuous X, ≤ and &lt; give the same answer: P(X = x) = 0.</div>');
      const qv = d.quantile(st.q, p);
      $('#calcQres').innerHTML = `→ x = <b>${S.fmt(qv)}</b> <span class="muted small">(${d.discrete ? 'smallest k with' : ''} P(X ≤ x) ${d.discrete ? '≥' : '='} ${st.q})</span>`;

      // summary
      const sk = d.skewness ? d.skewness(p) : NaN, ku = d.kurtosis ? d.kurtosis(p) : NaN;
      const mode = d.mode ? d.mode(p) : '—';
      const rows = [
        ['Mean', d.mean(p), 'Long-run average value, E[X]'],
        ['Standard deviation', sd, 'Typical distance from the mean'],
        ['Variance', d.variance(p), 'SD squared, Var(X)', 1],
        ['Median', d.median(p), 'Half the probability on each side'],
        ['Mode', mode, 'Most likely value / peak'],
        ['Skewness', sk, 'Asymmetry: > 0 means a longer right tail', 1],
        ['Excess kurtosis', ku, 'Tail weight relative to the normal (0)', 1],
      ];
      $('#summary').innerHTML = rows.map(([k, val, tip, adv]) => `<tr class="${adv ? 'adv' : ''}" title="${tip}"><th>${k}</th><td>${S.fmt(val)}</td></tr>`).join('');

      // simulation stats
      if (n) {
        let s = 0, s2 = 0; for (const x of st.samples) { s += x; s2 += x * x; }
        const sm = s / n, ssd = n > 1 ? Math.sqrt(Math.max(0, (s2 - n * sm * sm) / (n - 1))) : NaN;
        const outside = d.discrete ? 0 : st.samples.filter(x => x < v.xmin || x > v.xmax).length;
        $('#simStats').innerHTML = `<table class="summary"><tr><th></th><td><b>sample</b></td><td><b>theory</b></td></tr>
          <tr><th>Mean</th><td>${S.fmt(sm)}</td><td>${S.fmt(mean)}</td></tr>
          <tr><th>SD</th><td>${S.fmt(ssd)}</td><td>${S.fmt(sd)}</td></tr></table>
          ${outside ? `<div class="small muted">${outside.toLocaleString()} draw${outside > 1 ? 's' : ''} fell outside the plotted range.</div>` : ''}
          ${!isFinite(mean) ? '<div class="small warn-text">The theoretical mean does not exist, so the sample mean never settles down. Keep drawing and watch it jump.</div>' : ''}`;
      } else $('#simStats').innerHTML = '';
    }

    // ---- wiring
    $('#resetBtn').addEventListener('click', () => { st.p = d.defaults(); st.view = null; syncParamUI(); st.samples = []; st.view = d.fit(st.p); defaultAB(); draw(); if (mech) mech.reset(); });
    $('#fitBtn').addEventListener('click', () => { st.view = d.fit(st.p); draw(); });
    $('#lockAx').addEventListener('change', e => { st.locked = e.target.checked; if (!st.locked) { st.view = d.fit(st.p); draw(); } });
    $('#showSd').addEventListener('change', e => { st.showSd = e.target.checked; draw(); });
    $$('[data-ov]').forEach(cb => cb.addEventListener('change', () => { const i = +cb.dataset.ov; cb.checked ? st.overlays.add(i) : st.overlays.delete(i); draw(); }));
    const modeSel = $('#calcMode');
    const syncMode = () => { $('#aWrap').style.display = st.mode === 'left' ? 'none' : ''; $('#bWrap').style.display = st.mode === 'right' ? 'none' : ''; };
    modeSel.addEventListener('change', () => { st.mode = modeSel.value; syncMode(); draw(); });
    $('#calcA').addEventListener('input', e => { const x = parseFloat(e.target.value); if (!Number.isNaN(x)) { st.a = d.discrete ? Math.round(x) : x; draw(); } });
    $('#calcB').addEventListener('input', e => { const x = parseFloat(e.target.value); if (!Number.isNaN(x)) { st.b = d.discrete ? Math.round(x) : x; draw(); } });
    $('#calcQ').addEventListener('input', e => { const q = parseFloat(e.target.value); if (q > 0 && q < 1) { st.q = q; draw(); } });
    $$('[data-draw]').forEach(b => b.addEventListener('click', () => {
      const n = +b.dataset.draw;
      for (let i = 0; i < n; i++) st.samples.push(d.sample(st.p));
      if (st.samples.length > 200000) st.samples = st.samples.slice(-200000);
      draw();
    }));
    $('#clearDraw').addEventListener('click', () => { st.samples = []; if (mech) mech.clear(); draw(); });
    const toAdv = $('#toAdv'); if (toAdv) toAdv.addEventListener('click', () => setLevel('advanced'));
    const tryEx = $('#tryEx');
    if (tryEx) tryEx.addEventListener('click', () => {
      Object.assign(st.p, d.ex.set);
      if (d.constrain) d.constrain(st.p);
      st.mode = d.ex.calc.mode; $('#calcMode').value = st.mode; syncMode();
      if (d.ex.calc.a != null) { st.a = d.ex.calc.a; $('#calcA').value = st.a; }
      if (d.ex.calc.b != null) { st.b = d.ex.calc.b; $('#calcB').value = st.b; }
      st.view = d.fit(st.p);
      syncParamUI(); st.samples = []; if (mech) mech.reset(); draw();
      $('.lab').scrollIntoView({ behavior: 'smooth', block: 'start' });
      const r = $('#calcResult'); r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash');
    });
    const idea = $('#ideaCard');
    G.onLevel = lv => { idea.open = lv === 'intro'; };
    G.onLevel(G.level);

    syncParamUI();
    st.view = d.fit(st.p);
    defaultAB();
    syncMode();
    draw();
  }

  function prevNext(d) {
    const i = G.dists.indexOf(d);
    const prev = G.dists[i - 1], next = G.dists[i + 1];
    return `${prev ? `<a href="#${prev.id}">← ${prev.short}</a>` : '<span></span>'}${next ? `<a href="#${next.id}">${next.short} →</a>` : '<span></span>'}`;
  }

  // boot once pages.js has registered pages
  window.addEventListener('DOMContentLoaded', route);
  if (document.readyState !== 'loading') setTimeout(route, 0);
})();
