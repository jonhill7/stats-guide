/* Interactive figures for the "Start here" page. */
(function () {
  'use strict';
  const G = window.GUIDE, S = window.Stats, P = window.Plot;
  const $ = (s, r) => (r || document).querySelector(s);
  const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const HMU = 165, HSD = 7.5; // heights in cm

  const W = {};

  // 1. Long-run frequency with a die
  W.dice = function (el) {
    el.innerHTML = `<div class="widget-grid">
      <div class="die-box"><div class="die" aria-live="polite">⚄</div>
        <div class="row gap wrap"><button class="btn primary" data-roll="1">Roll</button><button class="btn" data-roll="10">Roll 10</button><button class="btn" data-roll="100">Roll 100</button><button class="btn" data-roll="1000">Roll 1,000</button><button class="btn ghost" data-roll="0">Reset</button></div>
        <p class="small widget-caption"></p></div>
      <div class="w-chart"></div></div>`;
    const counts = [0, 0, 0, 0, 0, 0];
    const chart = new P.Chart($('.w-chart', el), { height: 230 });
    const die = $('.die', el), cap = $('.widget-caption', el);
    function draw() {
      const n = counts.reduce((a, b) => a + b, 0);
      chart.render({
        xmin: 0.4, xmax: 6.6, ymin: 0, ymax: n ? Math.max(0.35, ...counts.map(c => c / n)) * 1.08 : 0.35, integerX: true, xlabel: 'face', ylabel: 'share of rolls',
        layers: [{ kind: 'bars', data: counts.map((c, i) => [i + 1, n ? c / n : 0]), color: 'var(--c1)', width: 0.7 },
          { kind: 'hline', y: 1 / 6, color: 'var(--c2)', dash: '6 4', width: 2 }],
        hover: x => { const k = Math.min(6, Math.max(1, Math.round(x))); return { x: k, y: n ? counts[k - 1] / n : 0, lines: [`face ${k}`, `rolled ${counts[k - 1]} times`, `share ${n ? (counts[k - 1] / n).toFixed(3) : '—'}`] }; },
      });
      cap.innerHTML = n ? `After <b>${n.toLocaleString()}</b> rolls, the shares are ${counts.map(c => (c / n).toFixed(2)).join(', ')}. The dashed line is the true probability, 1/6 ≈ 0.167. With more rolls the bars settle onto it.`
        : 'Roll the die. Each bar shows what share of your rolls landed on that face.';
    }
    el.querySelectorAll('[data-roll]').forEach(b => b.addEventListener('click', () => {
      const n = +b.dataset.roll;
      if (!n) counts.fill(0);
      let last = 0;
      for (let i = 0; i < n; i++) { last = Math.floor(Math.random() * 6); counts[last]++; }
      if (n) { die.textContent = FACES[last]; die.classList.remove('roll'); void die.offsetWidth; die.classList.add('roll'); }
      draw();
    }));
    draw();
  };

  // 2. From a histogram to a density curve
  W.bins = function (el) {
    el.innerHTML = `<div class="w-controls">
        <label class="field">People measured: <b class="v-n"></b><input type="range" class="r-n" min="0" max="4" step="1" value="1"></label>
        <label class="field">Bar width: <b class="v-w"></b><input type="range" class="r-w" min="0.5" max="10" step="0.5" value="5"></label>
        <label class="check"><input type="checkbox" class="c-curve"> Show the density curve</label></div>
      <div class="w-chart"></div><p class="small widget-caption">Heights of adults in centimeters. The bars are scaled so their total <b>area</b> is 1, so the area of a bar is the share of people in that range.</p>`;
    const sizes = [50, 200, 1000, 5000, 50000];
    let data = [];
    const chart = new P.Chart($('.w-chart', el), { height: 260 });
    const gen = n => { data = Array.from({ length: n }, () => HMU + HSD * S.rnorm()); };
    function draw() {
      const n = sizes[+$('.r-n', el).value], w = +$('.r-w', el).value;
      if (data.length !== n) gen(n);
      $('.v-n', el).textContent = n.toLocaleString(); $('.v-w', el).textContent = w + ' cm';
      const lo = 135, hi = 195, nb = Math.round((hi - lo) / w), cnt = new Array(nb).fill(0);
      for (const x of data) { const i = Math.floor((x - lo) / w); if (i >= 0 && i < nb) cnt[i]++; }
      const bins = cnt.map((c, i) => ({ x0: lo + i * w, x1: lo + (i + 1) * w, y: c / (n * w) }));
      const layers = [{ kind: 'hist', bins, color: 'var(--c1)' }];
      if ($('.c-curve', el).checked) {
        const pts = []; for (let i = 0; i <= 300; i++) { const x = lo + (hi - lo) * i / 300; pts.push([x, S.normPdf((x - HMU) / HSD) / HSD]); }
        layers.push({ kind: 'line', pts, color: 'var(--c2)', width: 2.6 });
      }
      chart.render({ xmin: lo, xmax: hi, ymin: 0, ymax: Math.max(0.075, ...bins.map(b => b.y)) * 1.08, layers, xlabel: 'height (cm)', ylabel: 'density',
        hover: x => { const i = Math.floor((x - lo) / w); if (i < 0 || i >= nb) return null; return { x, lines: [`${(lo + i * w).toFixed(1)}–${(lo + (i + 1) * w).toFixed(1)} cm`, `${cnt[i]} people (${(100 * cnt[i] / n).toFixed(1)}%)`] }; } });
    }
    el.querySelectorAll('input').forEach(i => i.addEventListener('input', draw));
    draw();
  };

  // 3. Area under the PDF = height of the CDF
  W.cdf = function (el) {
    el.innerHTML = `<label class="field">Height x = <b class="v-x"></b> cm<input type="range" class="r-x" min="140" max="190" step="0.5" value="172"></label>
      <div class="two-charts"><div class="w-pdf"></div><div class="w-cdf"></div></div>
      <p class="widget-caption big"></p>`;
    const top = new P.Chart($('.w-pdf', el), { height: 210 }), bot = new P.Chart($('.w-cdf', el), { height: 210 });
    const f = x => S.normPdf((x - HMU) / HSD) / HSD, F = x => S.normCdf((x - HMU) / HSD);
    function draw() {
      const x = +$('.r-x', el).value, Fx = F(x);
      $('.v-x', el).textContent = x;
      const pts = [], cpts = [];
      for (let i = 0; i <= 300; i++) { const t = 135 + 60 * i / 300; pts.push([t, f(t)]); cpts.push([t, F(t)]); }
      top.render({ xmin: 135, xmax: 195, ymin: 0, ymax: 0.06, xlabel: 'height (cm)', ylabel: 'density',
        layers: [{ kind: 'area', pts: pts.filter(q => q[0] <= x).concat([[x, f(x)]]), color: 'var(--c2)', opacity: 0.45 }, { kind: 'line', pts, color: 'var(--c1)' }, { kind: 'vline', x, color: 'var(--c2)' }] });
      bot.render({ xmin: 135, xmax: 195, ymin: 0, ymax: 1.05, yticks: 4, xlabel: 'height (cm)', ylabel: 'F(x)',
        layers: [{ kind: 'line', pts: cpts, color: 'var(--c1)' }, { kind: 'vline', x, color: 'var(--c2)' }, { kind: 'hline', y: Fx, x1: x, color: 'var(--c2)' }, { kind: 'points', pts: [[x, Fx]], color: 'var(--c2)', r: 5 }] });
      $('.widget-caption', el).innerHTML = `Shaded area on the left = <b>${Fx.toFixed(3)}</b> = height of the CDF at ${x} cm. About <b>${Math.round(Fx * 100)}%</b> of people are ${x} cm or shorter.`;
    }
    $('.r-x', el).addEventListener('input', draw);
    draw();
  };

  // 4. Mean as balance point, median, SD
  const SETS = {
    sym: { label: 'Quiz scores (symmetric)', unit: 'points', xs: [4, 5, 5, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9, 9, 10] },
    skew: { label: 'Weekly allowance (skewed right)', unit: '$', xs: [5, 5, 6, 8, 8, 10, 10, 10, 12, 12, 15, 15, 20, 25, 40, 60] },
    out: { label: 'Commute times with one outlier', unit: 'min', xs: [10, 12, 12, 14, 15, 15, 16, 18, 18, 20, 20, 22, 25, 25, 28, 90] },
  };
  W.balance = function (el) {
    el.innerHTML = `<div class="row gap wrap seg">${Object.entries(SETS).map(([k, s], i) => `<button class="btn ${i ? '' : 'primary'}" data-set="${k}">${s.label}</button>`).join('')}</div>
      <div class="w-chart"></div><p class="small widget-caption"></p>`;
    const chart = new P.Chart($('.w-chart', el), { height: 220 });
    function draw(k) {
      const s = SETS[k], xs = s.xs, n = xs.length;
      const mean = xs.reduce((a, b) => a + b, 0) / n, sorted = xs.slice().sort((a, b) => a - b), med = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
      const sd = Math.sqrt(xs.reduce((a, x) => a + (x - mean) ** 2, 0) / (n - 1));
      const lo = Math.min(...xs), hi = Math.max(...xs), pad = (hi - lo) * 0.08 + 1;
      const seen = {}, pts = xs.map(x => { seen[x] = (seen[x] || 0) + 1; return [x, seen[x]]; });
      const ymax = Math.max(...Object.values(seen)) + 1.6;
      chart.render({ xmin: lo - pad, xmax: hi + pad, ymin: 0, ymax, yticks: 2, xlabel: s.unit,
        layers: [
          { kind: 'points', pts, color: 'var(--c1)', r: 6 },
          { kind: 'hline', y: ymax - 0.6, x0: mean - sd, x1: mean + sd, color: 'var(--c-sd)', dash: '0', width: 3 },
          { kind: 'vline', x: mean, color: 'var(--c2)', dash: '0', width: 2.5, label: 'mean (balance point)' },
          { kind: 'vline', x: med, color: 'var(--c3)', dash: '5 4', width: 2, label: med === mean ? '' : 'median' },
        ] });
      el.querySelector('.widget-caption').innerHTML = `Mean <b style="color:var(--c2)">${mean.toFixed(1)}</b> · median <b style="color:var(--c3)">${med.toFixed(1)}</b> · SD <b style="color:var(--c-sd)">${sd.toFixed(1)}</b> (purple bar = mean ± 1 SD). ` +
        (k === 'sym' ? 'For symmetric data the mean and median agree.' : k === 'skew' ? 'The long right tail pulls the mean above the median: a few big allowances tip the balance.' : 'One 90-minute commute drags the mean up and inflates the SD, while the median barely moves.');
      el.querySelectorAll('[data-set]').forEach(b => b.classList.toggle('primary', b.dataset.set === k));
    }
    el.querySelectorAll('[data-set]').forEach(b => b.addEventListener('click', () => draw(b.dataset.set)));
    draw('sym');
  };

  // 5. Location, scale, shape
  W.params = function (el) {
    el.innerHTML = `<div class="w-controls three">
        <label class="field">Location (shift): <b class="v-l"></b><input type="range" class="r-l" min="-3" max="3" step="0.1" value="0"></label>
        <label class="field">Scale (stretch): <b class="v-s"></b><input type="range" class="r-s" min="0.4" max="2.5" step="0.05" value="1"></label>
        <label class="field">Shape: <b class="v-k"></b><input type="range" class="r-k" min="0.8" max="12" step="0.1" value="2.5"></label></div>
      <div class="w-chart"></div><p class="small widget-caption">The faint curve is the starting shape. Location slides it, scale stretches it (the area stays 1, so it also gets shorter), and shape changes the form itself. The curve here is a gamma distribution.</p>`;
    const chart = new P.Chart($('.w-chart', el), { height: 240 });
    const g = G.byId.gamma;
    const curve = (loc, sc, k) => { const pts = []; for (let i = 0; i <= 400; i++) { const x = -4 + 20 * i / 400, z = (x - loc) / sc; pts.push([x, z <= 0 ? 0 : g.pdf(z, { alpha: k, beta: 1 }) / sc]); } return pts; };
    function draw() {
      const l = +$('.r-l', el).value, s = +$('.r-s', el).value, k = +$('.r-k', el).value;
      $('.v-l', el).textContent = l; $('.v-s', el).textContent = s; $('.v-k', el).textContent = k;
      chart.render({ xmin: -4, xmax: 16, ymin: 0, ymax: 0.75, xlabel: 'x',
        layers: [{ kind: 'line', pts: curve(0, 1, 2.5), color: 'var(--muted)', width: 1.5, dash: '4 4' },
          { kind: 'area', pts: curve(l, s, k), color: 'var(--c1)', opacity: 0.15 }, { kind: 'line', pts: curve(l, s, k), color: 'var(--c1)', width: 2.6 }] });
    }
    el.querySelectorAll('input').forEach(i => i.addEventListener('input', draw));
    draw();
  };

  G.basicsWidgets = function (root) {
    root.querySelectorAll('[data-widget]').forEach(el => { const f = W[el.dataset.widget]; if (f) f(el); });
  };
})();
