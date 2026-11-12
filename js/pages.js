/* Non-distribution pages: home, basics, chooser, relationship map, CLT lab, cheat sheet. */
(function () {
  'use strict';
  const G = window.GUIDE, S = window.Stats, P = window.Plot;
  G.pages = {};
  const ui = () => G.ui;

  // ------------------------------------------------------------ Home
  G.pages.home = function (main) {
    main.innerHTML = `
    <section class="hero">
      <h1>A visual guide to probability distributions</h1>
      <p class="lead">Move the sliders, see the shapes change, simulate data, and follow how the major distributions connect to one another. Every page comes in two versions; switch with the toggle at the top right. <b>High School</b> leads with animations, plain-language stories, worked examples and the key formulas. <b>Grad School</b> puts the full formula sheet, estimation theory, software names and a technical deep dive up front.</p>
      <div class="tiles">
        <a class="tile" href="#basics"><b>New to this?</b><span>Random variables, PMF vs PDF, CDFs, mean &amp; variance in 5 minutes.</span></a>
        <a class="tile" href="#chooser"><b>Which distribution?</b><span>Answer a few questions to find the right model for your data.</span></a>
        <a class="tile" href="#map"><b>Relationship map</b><span>How the distributions turn into each other: sums, limits, transformations.</span></a>
        <a class="tile" href="#clt"><b>CLT lab</b><span>Watch averages of any distribution become normal, and see when they don't.</span></a>
        <a class="tile" href="#cheatsheet"><b>Cheat sheet</b><span>Every PMF/PDF, mean, variance and MGF in one table.</span></a>
        <a class="tile" href="#tables"><b>Critical-value tables</b><span>z, t, χ² and F tables you can click, with a p-value calculator and picture.</span></a>
      </div>
    </section>
    <h2 class="section-title">Discrete distributions <span class="muted small">(countable values: 0, 1, 2, …)</span></h2>
    <div class="cards" id="discCards"></div>
    <h2 class="section-title">Continuous distributions <span class="muted small">(any value in an interval)</span></h2>
    <div class="cards" id="contCards"></div>`;
    for (const d of G.dists) {
      const a = document.createElement('a');
      a.href = `#${d.id}`; a.className = `dcard ${d.type}`;
      a.innerHTML = `<div class="thumb-wrap"></div><div class="dcard-body"><b>${d.short}</b><span class="note">\\(${d.notation.replace(/^[A-Z] \\sim /, '')}\\)</span><p>${d.tagline}</p></div>`;
      P.thumb(a.querySelector('.thumb-wrap'), d, d.defaults());
      ui().$(d.discrete ? '#discCards' : '#contCards').appendChild(a);
    }
  };

  // ------------------------------------------------------------ Basics
  G.pages.basics = function (main) {
    const L = ui().link;
    main.innerHTML = `
    <article class="prose-page">
      <h1>The basics</h1>
      <p class="lead">Everything on the distribution pages builds on a handful of ideas. Each one below has a small experiment you can play with.</p>

      <div class="card prose"><h2>1. Random variables</h2>
        <p>A <b>random variable</b> \\(X\\) is a number determined by a random process: the number of heads in 10 flips, tomorrow's high temperature, the time until your bus arrives. A <b>distribution</b> tells you which values \\(X\\) can take and how likely each one is.</p>
        <p><b>Try it:</b> a die roll is a random variable. Roll it a few times, then a few thousand. Each face's share of rolls settles near its probability, 1/6. That long-run share is what "probability" means.</p>
        <div class="widget" data-widget="dice"></div>
        <p>Distributions come in families described by a formula with a few adjustable <b>parameters</b>. "Binomial with \\(n = 10, p = 0.5\\)" is one specific member of the binomial family.</p>
        <p class="adv">Formally, \\(X: \\Omega \\to \\mathbb R\\) is a measurable function on a probability space \\((\\Omega, \\mathcal F, P)\\), and its distribution is the pushforward measure \\(P_X(B) = P(X^{-1}(B))\\) on the Borel sets.</p></div>

      <div class="card prose"><h2>2. Discrete vs. continuous</h2>
        <div class="two-col">
          <div><h3>Discrete → PMF</h3><p>Values you can list (0, 1, 2, …). The <b>probability mass function</b> gives the probability of each exact value, \\(p(k) = P(X = k)\\), and the bars add up to 1.</p><p>Try: ${L(G.byId.binomial)}, ${L(G.byId.poisson)}.</p></div>
          <div><h3>Continuous → PDF</h3><p>Any value in an interval. The <b>probability density function</b> \\(f(x)\\) is a curve, and probabilities are <b>areas</b> under it: \\(P(a \\le X \\le b) = \\int_a^b f(x)\\,dx\\). The total area is 1.</p><p>Try: ${L(G.byId.normal)}, ${L(G.byId.exponential)}.</p></div>
        </div>
        <p><b>Where do density curves come from?</b> Measure many people's heights and draw a histogram whose bars have total area 1. With more people and narrower bars, the jagged bar tops smooth out into a curve: the density.</p>
        <div class="widget" data-widget="bins"></div>
        <p><b>Common confusion:</b> a density is not a probability. \\(f(x)\\) can be greater than 1 (see ${L(G.byId.uniform)} with a narrow interval), and \\(P(X = x) = 0\\) for any single exact value of a continuous variable.</p></div>

      <div class="card prose"><h2>3. The CDF</h2>
        <p>The <b>cumulative distribution function</b> \\(F(x) = P(X \\le x)\\) is the running total of probability as you move right. It always rises from 0 to 1. Every distribution page shows it under the PMF/PDF.</p>
        <p>Its most useful property: \\(P(a < X \\le b) = F(b) - F(a)\\). The probability calculator on each page shows that difference as a bracket on the CDF plot.</p>
        <p><b>Try it:</b> drag the slider. The shaded area to the left of x on the density (top) equals the height of the CDF at x (bottom).</p>
        <div class="widget" data-widget="cdf"></div>
        <p>Going the other way, the <b>quantile</b> (or percentile) function answers "what value has 95% of the probability below it?". Critical values like \\(z_{0.975} = 1.96\\) are quantiles.</p></div>

      <div class="card prose"><h2>4. Center and spread</h2>
        <p>The <b>expected value</b> (mean) is the long-run average: \\(E[X] = \\sum_k k\\,p(k)\\) or \\(\\int x f(x)\\,dx\\). Think of it as the balance point of the distribution.</p>
        <p>The <b>variance</b> \\(\\operatorname{Var}(X) = E[(X - \\mu)^2]\\) measures spread, and the <b>standard deviation</b> \\(\\sigma = \\sqrt{\\operatorname{Var}(X)}\\) is in the same units as \\(X\\). Each page draws the mean and ±1 SD as dashed lines.</p>
        <p>The <b>median</b> splits the probability in half, and the <b>mode</b> is the peak. In a right-skewed distribution, typically mode < median < mean (see ${L(G.byId.lognormal)}).</p>
        <p><b>Try it:</b> picture the dots sitting on a seesaw. The mean is the point where it balances, so one far-out dot can drag it a long way. The median just counts to the middle, which makes it resistant to outliers.</p>
        <div class="widget" data-widget="balance"></div>
        <p>Use the <b>Simulate</b> buttons to see the law of large numbers: the sample mean approaches the true mean as you draw more values. On the ${L(G.byId.cauchy)} page it doesn't, because there is no true mean.</p></div>

      <div class="card prose"><h2>5. Three kinds of parameters</h2>
        <ul><li><b>Location</b> slides the distribution left/right without changing its shape (normal \\(\\mu\\)).</li>
        <li><b>Scale</b> stretches or squeezes it (normal \\(\\sigma\\), exponential \\(1/\\lambda\\)).</li>
        <li><b>Shape</b> changes the form itself: skew, peaks, tails (gamma \\(\\alpha\\), beta \\(\\alpha,\\beta\\), Weibull \\(k\\), t's \\(\\nu\\)).</li></ul>
        <div class="widget" data-widget="params"></div>
        <p>Turn on <b>Lock axes</b> (on by default) to see the effect: with the axes fixed, changing a scale parameter visibly stretches the curve.</p></div>

      <div class="card prose adv"><h2>Higher moments and generating functions</h2>
        <p><b>Skewness</b> \\(\\gamma_1 = E[(X-\\mu)^3]/\\sigma^3\\) measures asymmetry. <b>Excess kurtosis</b> \\(\\gamma_2 = E[(X-\\mu)^4]/\\sigma^4 - 3\\) measures tail weight relative to the normal (which has 0). Kurtosis is about the tails, not the "peakedness".</p>
        <p>The <b>moment generating function</b> \\(M_X(t) = E[e^{tX}]\\) (when finite near 0) determines the distribution, and \\(M_X^{(n)}(0) = E[X^n]\\). For independent sums, \\(M_{X+Y} = M_X M_Y\\). That makes it the fastest way to prove that sums of Poissons are Poisson or sums of exponentials are gamma. The <b>characteristic function</b> \\(\\varphi_X(t) = E[e^{itX}]\\) always exists, and is what the CLT proof (Lévy continuity) uses. Discrete distributions also have the PGF \\(G(s) = E[s^X]\\).</p>
        <p>Heavy-tailed distributions (${L(G.byId.lognormal)}, ${L(G.byId.t)}, ${L(G.byId.cauchy)}, ${L(G.byId.pareto)}) have no MGF. The log-normal is an example where all moments exist yet don't determine the distribution.</p></div>

      <div class="card prose adv"><h2>Exponential families</h2>
        <p>Most distributions here (Bernoulli, binomial with fixed \\(n\\), Poisson, geometric, NB with fixed \\(r\\), normal, exponential, gamma, beta, chi-square, log-normal) can be written as \\(f(x\\mid\\theta) = h(x)\\exp\\{\\eta(\\theta)^\\top T(x) - A(\\theta)\\}\\). Consequences: sufficient statistics \\(T\\) of fixed dimension, \\(\\nabla A\\) gives the moments of \\(T\\), conjugate priors exist, MLEs solve "observed = expected" moment equations, and GLMs have canonical links. The t, Cauchy, Weibull (unknown \\(k\\)), Pareto (unknown \\(x_m\\)), Laplace (unknown \\(\\mu\\)), uniform and hypergeometric are <i>not</i> exponential families.</p></div>

      <div class="card prose"><h2>Notation cheat sheet</h2>
        <table class="ptable">
          <tr><th>\\(X \\sim N(\\mu, \\sigma^2)\\)</th><td>"X has a normal distribution with mean μ and variance σ²"</td></tr>
          <tr><th>iid</th><td>Independent and identically distributed: separate draws from the same distribution</td></tr>
          <tr><th>\\(P(X = k),\\ f(x)\\)</th><td>PMF (discrete) and PDF (continuous)</td></tr>
          <tr><th>\\(F(x),\\ F^{-1}(q)\\)</th><td>CDF and quantile function</td></tr>
          <tr><th>\\(E[X],\\ \\operatorname{Var}(X)\\)</th><td>Expected value (mean) and variance</td></tr>
          <tr><th>\\(\\Phi(z)\\)</th><td>CDF of the standard normal \\(N(0,1)\\)</td></tr>
          <tr><th>\\(\\Gamma(a),\\ B(a,b)\\)</th><td>Gamma and beta functions (\\(\\Gamma(n) = (n-1)!\\) for whole numbers)</td></tr>
          <tr class="adv"><th>\\(P(a,x),\\ Q(a,x),\\ I_x(a,b)\\)</th><td>Regularized lower/upper incomplete gamma and regularized incomplete beta functions</td></tr>
          <tr class="adv"><th>\\(\\Rightarrow\\)</th><td>Convergence in distribution</td></tr>
        </table></div>

      <div class="card prose warn"><h2>Parametrization warning</h2>
        <p>The same distribution is often written with different parameters. Exponential and gamma can use a <b>rate</b> (\\(\\lambda\\), \\(\\beta\\)) or a <b>scale</b> (\\(1/\\lambda\\), \\(\\theta\\)). The normal can be given its variance \\(\\sigma^2\\) or its SD \\(\\sigma\\). Geometric and negative binomial can count trials or failures. This guide states its convention on each page. Always check the mean formula in your textbook or software before you plug in numbers.</p></div>
    </article>`;
    if (G.basicsWidgets) G.basicsWidgets(main);
  };

  // ------------------------------------------------------------ Chooser
  const TREE = {
    start: { q: 'What kind of values does your quantity take?', opts: [
      ['Counts: 0, 1, 2, … (whole numbers)', 'counts'],
      ['Measurements on a continuous scale', 'cont'],
      ['A proportion or probability between 0 and 1', '=beta'],
      ['A test statistic I computed', 'stat'],
    ] },
    counts: { q: 'What are you counting?', opts: [
      ['Just one yes/no outcome', '=bernoulli'],
      ['Successes in a fixed number of trials', 'fixedn'],
      ['Trials until something happens', 'until'],
      ['Events in a fixed time, area, or volume (no upper limit)', 'events'],
      ['A value where every outcome is equally likely', '=discreteuniform'],
    ] },
    fixedn: { q: 'Are you sampling without replacement from a small population (sample > ~5% of it)?', opts: [
      ['Yes: e.g. cards from a deck, items from a small lot', '=hypergeometric'],
      ['No: independent trials with the same probability', '=binomial'],
    ] },
    until: { q: 'Until what?', opts: [['The first success', '=geometric'], ['The r-th success', '=negbinomial']] },
    events: { q: 'Is the variance of your counts close to the mean?', opts: [
      ['Yes, or I don’t know yet (events independent, constant rate)', '=poisson'],
      ['No: variance is much bigger than the mean (overdispersed / clustered)', '=negbinomial'],
    ] },
    cont: { q: 'Which best describes the shape or the story?', opts: [
      ['Equally likely anywhere in a range', '=uniform'],
      ['Symmetric and bell-shaped (can be negative)', 'sym'],
      ['Positive only and skewed right', 'pos'],
    ] },
    sym: { q: 'How heavy are the tails (how often do extreme values occur)?', opts: [
      ['Light: extreme values are very rare', '=normal'],
      ['Somewhat heavier: occasional outliers', '=t'],
      ['Sharp peak with heavier tails', '=laplace'],
      ['Extremely heavy: wild outliers, no stable average', '=cauchy'],
    ] },
    pos: { q: 'What is the story behind the values?', opts: [
      ['Waiting time until one event, at a constant rate', '=exponential'],
      ['Waiting time for several events, or a flexible positive skewed shape', '=gamma'],
      ['Lifetime with a failure rate that rises or falls with age', '=weibull'],
      ['The result of multiplying many positive factors (growth)', '=lognormal'],
      ['Power-law: a few huge values dominate (80/20)', '=pareto'],
    ] },
    stat: { q: 'What does your statistic measure?', opts: [
      ['A standardized mean with known σ, or a large sample', '=normal'],
      ['A standardized mean using the sample SD', '=t'],
      ['A sum of squared standardized deviations (goodness of fit, a variance)', '=chisq'],
      ['A ratio of two variance estimates (ANOVA, regression)', '=f'],
    ] },
  };
  G.pages.chooser = function (main) {
    const path = ['start'];
    main.innerHTML = `<article class="prose-page"><h1>Which distribution should I use?</h1>
      <p class="lead">Answer a few questions. This is a starting point, not a final answer: always check the fit against your data (plots, simulation, and goodness-of-fit tests).</p>
      <div id="chooser"></div></article>`;
    const box = ui().$('#chooser');
    function render() {
      const id = path[path.length - 1];
      let html = '<ol class="crumbs">';
      for (let i = 0; i < path.length - 1; i++) {
        const node = TREE[path[i]], next = path[i + 1];
        const chosen = node.opts.find(o => o[1] === next || o[1] === next);
        html += `<li><button class="linkish" data-back="${i}">${node.q}</button> <span class="muted">→ ${chosen ? chosen[0] : ''}</span></li>`;
      }
      html += '</ol>';
      if (id.startsWith('=')) {
        const d = G.byId[id.slice(1)];
        html += `<div class="card result-card ${d.type}"><div class="thumb-wrap"></div><div><div class="muted small">Suggested model</div>
          <h2>${d.name}</h2><p>${d.tagline}</p><p>\\(${d.notation}\\)</p>
          <a class="btn primary" href="#${d.id}">Explore the ${d.short} →</a> <button class="btn" data-back="0">Start over</button></div></div>`;
        const rel = G.relations.filter(r => r.from === d.id || r.to === d.id).slice(0, 4);
        if (rel.length) html += `<p class="small muted">Close relatives worth considering: ${rel.map(r => ui().link(r.from === d.id ? r.toD : r.fromD)).join(', ')}.</p>`;
      } else {
        const node = TREE[id];
        html += `<div class="card"><h2>${node.q}</h2><div class="choices">${node.opts.map(o => `<button class="choice" data-go="${o[1]}">${o[0]}</button>`).join('')}</div></div>`;
      }
      box.innerHTML = html;
      if (id.startsWith('=')) { const d = G.byId[id.slice(1)]; P.thumb(ui().$('.thumb-wrap', box), d, d.defaults()); }
      ui().math(box);
      ui().$$('[data-go]', box).forEach(b => b.addEventListener('click', () => { path.push(b.dataset.go); render(); }));
      ui().$$('[data-back]', box).forEach(b => b.addEventListener('click', () => { path.length = +b.dataset.back + 1; render(); }));
    }
    render();
  };

  // ------------------------------------------------------------ Relationship map
  G.pages.map = function (main) {
    const kinds = G.relKinds;
    main.innerHTML = `<article class="map-page"><h1>How the distributions are related</h1>
      <p class="lead">Arrows show how one distribution produces or approximates another. <b>Hover</b> a box to highlight its connections, <b>click</b> a box or arrow for details. Double-click a box to open its page.</p>
      <div class="map-legend">${Object.entries(kinds).map(([k, v]) => `<label class="check"><input type="checkbox" data-kind="${k}" checked><i style="background:${v.color}"></i>${v.label}</label>`).join('')}
        <span class="map-key"><span class="badge discrete">Discrete</span> <span class="badge continuous">Continuous</span></span></div>
      <div class="map-wrap"><div class="card map-card" id="mapBox"></div><aside class="card map-info" id="mapInfo"><p class="muted">Select a distribution or an arrow to see how they connect.</p></aside></div>
      <div class="card prose"><h2>All relationships</h2><table class="formulas rel-table">${G.relations.map(r =>
        `<tr><th>${ui().link(r.fromD)} → ${ui().link(r.toD)}</th><td><span class="kind-chip" style="--kc:${kinds[r.kind].color}">${kinds[r.kind].label}</span> ${r.text}</td></tr>`).join('')}</table></div>
    </article>`;
    const W = 1120, H = 790, NW = 132, NH = 38;
    const svg = P.el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'map' });
    ui().$('#mapBox').appendChild(svg);
    const defs = P.el('defs', null, svg);
    for (const [k, v] of Object.entries(kinds)) {
      const m = P.el('marker', { id: 'arr-' + k, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
      P.el('path', { d: 'M0,0L10,5L0,10z', style: `fill:${v.color}` }, m);
    }
    // background regions
    P.el('rect', { x: 14, y: 22, width: 680, height: 430, rx: 18, class: 'region disc' }, svg);
    const t1 = P.el('text', { x: 30, y: 44, class: 'region-label' }, svg); t1.textContent = 'DISCRETE';
    const t2 = P.el('text', { x: W - 30, y: H - 16, class: 'region-label', 'text-anchor': 'end' }, svg); t2.textContent = 'CONTINUOUS';

    const pos = G.mapNodes;
    const edgeG = P.el('g', null, svg), labelG = P.el('g', null, svg), nodeG = P.el('g', null, svg);
    const edges = [];
    function clipToBox(cx, cy, dx, dy) { // distance from center to box edge along direction
      const tx = Math.abs(dx) > 1e-9 ? (NW / 2 + 4) / Math.abs(dx) : Infinity;
      const ty = Math.abs(dy) > 1e-9 ? (NH / 2 + 4) / Math.abs(dy) : Infinity;
      return Math.min(tx, ty);
    }
    for (const r of G.relations) {
      const [x1, y1] = pos[r.from], [x2, y2] = pos[r.to];
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
      const nx = -uy, ny = ux, c = r.curve || 0;
      const mx = (x1 + x2) / 2 + nx * c, my = (y1 + y2) / 2 + ny * c;
      // start/end directions toward the control point
      const s = (ax, ay, bx, by) => { const ddx = bx - ax, ddy = by - ay, l = Math.hypot(ddx, ddy); return [ddx / l, ddy / l]; };
      const [sx, sy] = s(x1, y1, mx, my), [ex, ey] = s(x2, y2, mx, my);
      const ts = clipToBox(x1, y1, sx, sy), te = clipToBox(x2, y2, ex, ey);
      const p1 = [x1 + sx * ts, y1 + sy * ts], p2 = [x2 + ex * te, y2 + ey * te];
      const d = c ? `M${p1[0]},${p1[1]}Q${mx},${my} ${p2[0]},${p2[1]}` : `M${p1[0]},${p1[1]}L${p2[0]},${p2[1]}`;
      const g = P.el('g', { class: 'edge', 'data-kind': r.kind }, edgeG);
      P.el('path', { d, class: 'edge-hit' }, g);
      P.el('path', { d, class: 'edge-line', style: `stroke:${kinds[r.kind].color}`, 'marker-end': `url(#arr-${r.kind})` }, g);
      const lx = c ? (p1[0] + 2 * mx + p2[0]) / 4 : (p1[0] + p2[0]) / 2, ly = c ? (p1[1] + 2 * my + p2[1]) / 4 : (p1[1] + p2[1]) / 2;
      const lab = P.el('text', { x: lx, y: ly - 4, class: 'edge-label', 'text-anchor': 'middle' }, labelG);
      lab.textContent = r.short;
      edges.push({ r, g, lab });
      g.addEventListener('click', () => showEdge(r));
    }
    const nodes = {};
    for (const d of G.dists) {
      const [x, y] = pos[d.id];
      const g = P.el('g', { class: `node ${d.type}`, transform: `translate(${x - NW / 2},${y - NH / 2})`, tabindex: 0, role: 'button', 'aria-label': d.short }, nodeG);
      P.el('rect', { width: NW, height: NH, rx: 10 }, g);
      const t = P.el('text', { x: NW / 2, y: NH / 2 + 5, 'text-anchor': 'middle' }, g);
      t.textContent = d.short;
      nodes[d.id] = g;
      g.addEventListener('mouseenter', () => highlight(d.id));
      g.addEventListener('mouseleave', () => highlight(selected));
      g.addEventListener('click', () => { selected = d.id; highlight(d.id); showNode(d); });
      g.addEventListener('dblclick', () => { location.hash = '#' + d.id; });
      g.addEventListener('keydown', e => { if (e.key === 'Enter') location.hash = '#' + d.id; });
    }
    let selected = null;
    function highlight(id) {
      svg.classList.toggle('focusing', !!id);
      for (const e of edges) {
        const on = id && (e.r.from === id || e.r.to === id);
        e.g.classList.toggle('on', !!on); e.lab.classList.toggle('on', !!on);
      }
      for (const k in nodes) {
        const near = id && (k === id || G.relations.some(r => (r.from === id && r.to === k) || (r.to === id && r.from === k)));
        nodes[k].classList.toggle('on', !!near);
      }
    }
    const info = ui().$('#mapInfo');
    function showNode(d) {
      const rels = G.relations.filter(r => r.from === d.id || r.to === d.id);
      info.innerHTML = `<div class="badge ${d.type}">${d.discrete ? 'Discrete' : 'Continuous'}</div><h2>${d.name}</h2><p>${d.tagline}</p>
        <p><a class="btn primary" href="#${d.id}">Open page →</a></p>
        <ul class="rel-list">${rels.map(r => `<li><b>${r.from === d.id ? '→ ' + r.toD.short : '← ' + r.fromD.short}</b><div class="rel-text">${r.text}</div></li>`).join('')}</ul>`;
      ui().math(info);
    }
    function showEdge(r) {
      selected = null; highlight(null);
      edges.forEach(e => { if (e.r === r) { e.g.classList.add('on'); e.lab.classList.add('on'); svg.classList.add('focusing'); nodes[r.from].classList.add('on'); nodes[r.to].classList.add('on'); } });
      info.innerHTML = `<span class="kind-chip" style="--kc:${kinds[r.kind].color}">${kinds[r.kind].label}</span>
        <h2>${r.fromD.short} → ${r.toD.short}</h2><p>${r.text}</p><p>${ui().link(r.fromD)} · ${ui().link(r.toD)}</p>`;
      ui().math(info);
    }
    ui().$$('[data-kind]', main).forEach(cb => cb.addEventListener('change', () => {
      const k = cb.dataset.kind;
      edges.filter(e => e.r.kind === k).forEach(e => { e.g.style.display = cb.checked ? '' : 'none'; e.lab.style.display = cb.checked ? '' : 'none'; });
    }));
    const focus = G.mapFocus;
    if (focus && G.byId[focus]) { selected = focus; highlight(focus); showNode(G.byId[focus]); }
  };

  // ------------------------------------------------------------ CLT lab
  const SOURCES = [
    ['exponential', { lambda: 1 }, 'Exponential(1): strongly right-skewed'],
    ['uniform', { a: 0, b: 1 }, 'Uniform(0, 1): flat'],
    ['bernoulli', { p: 0.15 }, 'Bernoulli(0.15): just 0s and 1s'],
    ['poisson', { lambda: 1.5 }, 'Poisson(1.5): skewed counts'],
    ['beta', { alpha: 0.4, beta: 0.4 }, 'Beta(0.4, 0.4): U-shaped'],
    ['lognormal', { mu: 0, sigma: 1 }, 'Log-normal(0, 1): heavy right tail'],
    ['pareto', { xm: 1, alpha: 2.5 }, 'Pareto(1, 2.5): very heavy tail, slow convergence'],
    ['cauchy', { x0: 0, gamma: 1 }, 'Cauchy(0, 1): no mean, so the CLT fails'],
  ];
  G.pages.clt = function (main) {
    main.innerHTML = `<article class="prose-page"><h1>Central Limit Theorem lab</h1>
      <p class="lead">Pick any starting distribution. Draw a sample of size <i>n</i>, take its average, and repeat thousands of times. The histogram of those averages becomes a bell curve as <i>n</i> grows, whatever the original shape (as long as it has a finite variance).</p>
      <div class="clt-grid">
        <div class="card"><h3>Controls</h3>
          <label class="field">Source distribution<select id="cltSrc">${SOURCES.map((s, i) => `<option value="${i}">${s[2]}</option>`).join('')}</select></label>
          <label class="field">Sample size n = <b id="nVal">1</b><input type="range" id="cltN" min="1" max="200" value="1"></label>
          <div class="row gap wrap"><button class="btn" data-n="1">n = 1</button><button class="btn" data-n="2">2</button><button class="btn" data-n="5">5</button><button class="btn" data-n="30">30</button><button class="btn" data-n="100">100</button></div>
          <label class="field">Number of sample means: <b>5,000</b></label>
          <label class="check"><input type="checkbox" id="cltStd"> Standardize: plot \\((\\bar X - \\mu)/(\\sigma/\\sqrt n)\\)</label>
          <button class="btn primary" id="cltGo">Resample</button>
          <div id="cltStats" class="sim-stats"></div>
        </div>
        <div>
          <div class="card plot-card"><div class="plot-head"><h3>Source distribution</h3></div><div id="cltSrcPlot"></div></div>
          <div class="card plot-card"><div class="plot-head"><h3>Distribution of the sample mean</h3><span class="hint">Histogram of 5,000 averages · dashed: normal predicted by the CLT</span></div><div id="cltPlot"></div></div>
        </div>
      </div>
      <div class="card prose"><h2>What to notice</h2>
        <ul><li>With <b>n = 1</b> the histogram is just the source distribution.</li>
        <li>As n grows, the spread shrinks like \\(\\sigma/\\sqrt n\\): quadruple n to halve the spread.</li>
        <li>Skewed sources (exponential, log-normal) need a larger n before the bell looks symmetric. "n ≥ 30" is a rule of thumb, not a law.</li>
        <li>The <b>Cauchy</b> never converges. The average of n Cauchy values is exactly as spread out as a single value.</li></ul>
        <p class="adv">Formally, \\(\\sqrt n(\\bar X_n - \\mu)/\\sigma \\Rightarrow N(0,1)\\) when \\(\\sigma^2 < \\infty\\). Berry–Esseen gives \\(\\sup_x|F_n(x) - \\Phi(x)| \\le 0.4748\\,\\rho/(\\sigma^3\\sqrt n)\\), with \\(\\rho = E|X-\\mu|^3\\), which is why skewed sources converge more slowly. For a Pareto with \\(2 < \\alpha < 3\\) the third moment is infinite, so Berry–Esseen gives no rate. For \\(\\alpha < 2\\), normalized sums converge to a non-Gaussian stable law (the generalized CLT).</p></div>
    </article>`;
    const srcChart = new P.Chart(ui().$('#cltSrcPlot'), { height: 200 });
    const chart = new P.Chart(ui().$('#cltPlot'), { height: 320 });
    const st = { src: 0, n: 1, std: false, means: [] };
    const R = 5000;
    function simulate() {
      const [id, p] = SOURCES[st.src], d = G.byId[id];
      st.means = new Array(R);
      for (let i = 0; i < R; i++) { let s = 0; for (let j = 0; j < st.n; j++) s += d.sample(p); st.means[i] = s / st.n; }
      draw();
    }
    function draw() {
      const [id, p] = SOURCES[st.src], d = G.byId[id];
      const mu = d.mean(p), sd = Math.sqrt(d.variance(p));
      // source plot
      const v = d.fit(p);
      const sl = d.discrete
        ? [{ kind: 'bars', data: Array.from({ length: Math.floor(v.xmax) - Math.ceil(v.xmin) + 1 }, (_, i) => { const k = Math.ceil(v.xmin) + i; return [k, d.pmf(k, p)]; }), color: 'var(--c1)' }]
        : [{ kind: 'area', pts: d.curve(p, v, 300), color: 'var(--c1)', opacity: 0.15 }, { kind: 'line', pts: d.curve(p, v, 300), color: 'var(--c1)' }];
      srcChart.render({ xmin: v.xmin, xmax: v.xmax, ymin: 0, ymax: v.ymax, layers: sl, integerX: d.discrete, xlabel: 'x' });
      // sample means
      const se = sd / Math.sqrt(st.n);
      let xs = st.means.slice();
      if (st.std && isFinite(se) && se > 0) xs = xs.map(x => (x - mu) / se);
      let lo, hi;
      if (isFinite(se) && se > 0) {
        const c = st.std ? 0 : mu, s = st.std ? 1 : se;
        lo = c - 4.2 * s; hi = c + 4.2 * s;
        if (st.n <= 3 && !st.std) { lo = Math.min(lo, v.xmin); hi = Math.max(hi, Math.min(v.xmax, c + 6 * s)); }
      } else { const sorted = xs.slice().sort((a, b) => a - b); lo = sorted[Math.floor(R * 0.02)]; hi = sorted[Math.floor(R * 0.98)]; }
      if (d.discrete && !st.std && st.n === 1) { lo = v.xmin; hi = v.xmax; }
      if (!st.std) { const L = d.lower(p), U = d.upper(p), pad = (hi - lo) * 0.03; if (isFinite(L) && lo < L) lo = L - pad; if (isFinite(U) && hi > U) hi = U + pad; }
      const nb = 60, w = (hi - lo) / nb, cnt = new Array(nb).fill(0);
      let out = 0;
      for (const x of xs) { const i = Math.floor((x - lo) / w); if (i >= 0 && i < nb) cnt[i]++; else out++; }
      const bins = cnt.map((c, i) => ({ x0: lo + i * w, x1: lo + (i + 1) * w, y: c / (R * w) }));
      const layers = [{ kind: 'hist', bins, color: 'var(--c-sim)' }];
      let ymax = Math.max(...bins.map(b => b.y));
      if (isFinite(se) && se > 0) {
        const c = st.std ? 0 : mu, s = st.std ? 1 : se, pts = [];
        for (let i = 0; i <= 300; i++) { const x = lo + (hi - lo) * i / 300; pts.push([x, S.normPdf((x - c) / s) / s]); }
        layers.push({ kind: 'line', pts, color: 'var(--c2)', width: 2.4, dash: '7 4' });
        ymax = Math.max(ymax, S.normPdf(0) / s);
      }
      chart.render({ xmin: lo, xmax: hi, ymin: 0, ymax: ymax * 1.1, layers, xlabel: st.std ? 'standardized mean z' : 'sample mean x̄' });
      let m = 0, m2 = 0; for (const x of st.means) { m += x; m2 += x * x; }
      m /= R; const sdev = Math.sqrt(Math.max(0, m2 / R - m * m));
      ui().$('#cltStats').innerHTML = `<table class="summary"><tr><th></th><td><b>simulated</b></td><td><b>CLT says</b></td></tr>
        <tr><th>Mean of x̄</th><td>${S.fmt(m)}</td><td>${S.fmt(mu)}</td></tr>
        <tr><th>SD of x̄</th><td>${S.fmt(sdev)}</td><td>${isFinite(se) ? S.fmt(se) + ' = σ/√n' : 'n/a'}</td></tr></table>
        ${out ? `<div class="small muted">${out} averages fell outside the plotted range.</div>` : ''}
        ${!isFinite(mu) ? '<div class="small warn-text">The Cauchy has no mean or variance, so there is no normal limit. Notice that the spread does not shrink as n grows.</div>' : ''}`;
    }
    ui().$('#cltSrc').addEventListener('change', e => { st.src = +e.target.value; simulate(); });
    const setN = n => { st.n = n; ui().$('#cltN').value = n; ui().$('#nVal').textContent = n; simulate(); };
    ui().$('#cltN').addEventListener('input', e => setN(+e.target.value));
    ui().$$('[data-n]', main).forEach(b => b.addEventListener('click', () => setN(+b.dataset.n)));
    ui().$('#cltStd').addEventListener('change', e => { st.std = e.target.checked; draw(); });
    ui().$('#cltGo').addEventListener('click', simulate);
    simulate();
  };

  // ------------------------------------------------------------ Cheat sheet
  G.pages.cheatsheet = function (main) {
    const get = (d, k) => { const f = d.formulas.find(x => x[0] === k); return f ? `\\(\\displaystyle ${f[2]}\\)` : '—'; };
    const row = d => `<tr><th>${ui().link(d)}<div class="small muted">\\(${d.notation}\\)</div></th><td>${get(d, 'support')}</td><td>${get(d, 'pdf')}</td><td>${get(d, 'mean')}</td><td>${get(d, 'var')}</td><td class="adv">${get(d, 'mgf')}</td></tr>`;
    const head = '<tr><th>Distribution</th><th>Support</th><th>PMF / PDF</th><th>Mean</th><th>Variance</th><th class="adv">MGF</th></tr>';
    main.innerHTML = `<article class="prose-page wide"><h1>Formula cheat sheet</h1>
      <p class="lead">All the core formulas in one place. Switch to <b>Grad School</b> to add the moment generating functions. Each name links to its interactive page.</p>
      <div class="card table-scroll"><h2>Discrete</h2><table class="cheat">${head}${G.dists.filter(d => d.discrete).map(row).join('')}</table></div>
      <div class="card table-scroll"><h2>Continuous</h2><table class="cheat">${head}${G.dists.filter(d => !d.discrete).map(row).join('')}</table></div>
      <div class="card prose"><h2>Useful facts</h2><ul>
        <li>\\(E[aX+b] = aE[X]+b\\), \\(\\operatorname{Var}(aX+b) = a^2\\operatorname{Var}(X)\\)</li>
        <li>\\(E[X+Y] = E[X]+E[Y]\\) always; \\(\\operatorname{Var}(X+Y) = \\operatorname{Var}(X)+\\operatorname{Var}(Y)\\) if independent</li>
        <li>\\(\\operatorname{Var}(X) = E[X^2] - (E[X])^2\\)</li>
        <li>Sample mean of n iid values: \\(E[\\bar X] = \\mu\\), \\(\\operatorname{SD}(\\bar X) = \\sigma/\\sqrt n\\)</li>
        <li class="adv">Law of total variance: \\(\\operatorname{Var}(X) = E[\\operatorname{Var}(X\\mid Y)] + \\operatorname{Var}(E[X\\mid Y])\\)</li>
        <li class="adv">Delta method: \\(\\sqrt n(g(\\bar X)-g(\\mu)) \\Rightarrow N(0, g'(\\mu)^2\\sigma^2)\\)</li>
        <li class="adv">Change of variables: \\(f_Y(y) = f_X(g^{-1}(y))\\,\\left|\\tfrac{d}{dy}g^{-1}(y)\\right|\\) for monotone \\(g\\)</li>
      </ul></div></article>`;
  };
})();
