/* "See how it works" animations: a physical story that generates each distribution.
   Each mechanism produces real samples that feed the histogram on the distribution page. */
(function () {
  'use strict';
  const G = window.GUIDE, S = window.Stats;
  const M = (G.mech = {});

  // ------------------------------------------------------------ drawing helpers
  const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const palette = () => ({
    main: cssVar('--c1'), alt: cssVar('--c2'), ok: cssVar('--c3'), sd: cssVar('--c-sd'), sim: cssVar('--c-sim'),
    text: cssVar('--text'), muted: cssVar('--muted'), grid: cssVar('--border'), panel: cssVar('--panel'), panel2: cssVar('--panel-2'),
  });
  const cl = t => Math.max(0, Math.min(1, t));
  const ease = t => 1 - Math.pow(1 - cl(t), 3);
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  function txt(c, s, x, y, o) {
    o = o || {};
    c.font = `${o.weight || 500} ${o.size || 13}px ${FONT}`;
    c.fillStyle = o.color; c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'middle';
    c.fillText(s, x, y);
  }
  function dot(c, x, y, r, fill, stroke, lw) {
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1.5; c.stroke(); }
  }
  function ln(c, x1, y1, x2, y2, color, lw, dash) {
    c.beginPath(); c.setLineDash(dash || []); c.moveTo(x1, y1); c.lineTo(x2, y2);
    c.strokeStyle = color; c.lineWidth = lw || 1.5; c.stroke(); c.setLineDash([]);
  }
  function box(c, x, y, w, h, r, fill, stroke) {
    c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.2; c.stroke(); }
  }
  function niceTicks(a, b, n) {
    const raw = (b - a) / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
    const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
    const out = []; for (let v = Math.ceil(a / step) * step; v <= b + 1e-9; v += step) out.push(+v.toFixed(10));
    return { out, step };
  }
  // A number line using the page's current plot range so landings line up with the histogram above
  function axis(c, v, x0, x1, y, C, opts) {
    opts = opts || {};
    const map = x => x0 + (x - v.xmin) / (v.xmax - v.xmin) * (x1 - x0);
    ln(c, x0, y, x1, y, C.muted, 1.2);
    const { out, step } = niceTicks(v.xmin, v.xmax, opts.ticks || 7);
    const dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
    for (const t of out) { const x = map(t); ln(c, x, y, x, y + 4, C.muted, 1); txt(c, t.toFixed(Math.min(dec, 4)), x, y + 13, { size: 10.5, color: C.muted, align: 'center' }); }
    if (opts.label) txt(c, opts.label, x1, y - 9, { size: 11, color: C.muted, align: 'right' });
    return map;
  }
  // Coin: state 1 = success, 0 = failure, null = not flipped yet; spin in [0,1] animates the flip
  function coin(c, x, y, r, state, C, spin) {
    let sx = 1, st = state;
    if (spin != null) { if (spin <= 0) st = null; else if (spin < 1) { sx = Math.abs(Math.cos(spin * Math.PI * 2.5)); if (spin < 0.6) st = null; } }
    c.save(); c.translate(x, y); c.scale(Math.max(0.1, sx), 1);
    if (st === 1) { dot(c, 0, 0, r, C.ok); if (r >= 6) txt(c, 'S', 0, 0.5, { color: C.panel, size: r * 1.05, weight: 700, align: 'center' }); }
    else if (st === 0) { dot(c, 0, 0, r, C.panel2, C.muted, 1.2); if (r >= 6) txt(c, 'F', 0, 0.5, { color: C.muted, size: r * 1.05, weight: 700, align: 'center' }); }
    else dot(c, 0, 0, r, C.panel2, C.grid, 1.2);
    c.restore();
  }
  // Lay out n items in a grid inside a box
  function grid(n, x0, y0, w, h, maxR) {
    let r = maxR || 15;
    for (; r > 2; r -= 0.5) {
      const cell = r * 2 + Math.max(2, r * 0.45), cols = Math.max(1, Math.floor(w / cell)), rows = Math.ceil(n / cols);
      if (rows * cell <= h) {
        const pos = [];
        for (let i = 0; i < n; i++) pos.push([x0 + cell / 2 + (i % cols) * cell, y0 + cell / 2 + Math.floor(i / cols) * cell]);
        return { r, pos };
      }
    }
    const cell = 5, cols = Math.floor(w / cell); const pos = [];
    for (let i = 0; i < n; i++) pos.push([x0 + cell / 2 + (i % cols) * cell, y0 + cell / 2 + Math.floor(i / cols) * cell]);
    return { r: 2, pos };
  }
  const legendSF = (c, W, y, C) => {
    coin(c, W - 150, y, 7, 1, C); txt(c, 'success', W - 139, y, { size: 11, color: C.muted });
    coin(c, W - 80, y, 7, 0, C); txt(c, 'failure', W - 69, y, { size: 11, color: C.muted });
  };
  // Faint marks for recent results, so the spread builds up under the animation
  function recentMarks(c, recent, map, y, C) {
    for (const r of recent.slice(-150)) { const x = map(r); if (x > 0 && x < 99999) ln(c, x, y - 7, x, y, C.sim, 2); }
  }
  // Sequential flipping of coin outcomes, shared by Bernoulli-trial mechanisms
  function trialsScene(c, W, H, outs, t, C, header) {
    const n = outs.length, shown = t * (n + 1.5);
    const g = grid(n, 16, 44, W - 32, H - 56, 16);
    let succ = 0, done = 0;
    outs.forEach((o, i) => { const spin = cl(shown - i); if (spin >= 1) { done++; succ += o; } coin(c, g.pos[i][0], g.pos[i][1], g.r, o, C, spin); });
    txt(c, header(done, succ), 16, 20, { size: 14, weight: 600, color: C.text });
    legendSF(c, W, 20, C);
  }

  // ------------------------------------------------------------ mechanisms
  M.bernoulli = {
    title: 'one trial',
    explain: 'One trial with success chance p, like a single free throw or one flip of a weighted coin. The result is 1 for a success and 0 for a failure.',
    trial: ({ p }) => { const value = Math.random() < p ? 1 : 0; return { value, dur: 1000 }; },
    draw(c, W, H, tr, t, p, C) {
      const cx = Math.min(W / 2, 160), cy = H / 2 + 6;
      coin(c, cx, cy, Math.min(48, H / 3), tr.value, C, t / 0.9);
      // probability bar
      const bx = cx + 90, bw = Math.max(120, W - bx - 30);
      box(c, bx, cy - 40, bw, 18, 9, C.panel2, C.grid);
      box(c, bx, cy - 40, bw * p.p, 18, 9, C.ok);
      txt(c, `P(success) = ${p.p}`, bx, cy - 56, { size: 12, color: C.muted });
      if (t >= 0.95) txt(c, tr.value ? 'Success!  X = 1' : 'Failure.  X = 0', bx, cy + 10, { size: 20, weight: 700, color: tr.value ? C.ok : C.muted });
    },
    result: tr => `X = ${tr.value}`,
  };

  M.binomial = {
    title: 'flip n coins and count the successes',
    explain: 'Each round runs n independent trials, each a success with chance p. The number of successes is one binomial value. Run many rounds and the histogram fills in the PMF.',
    trial: ({ n, p }) => { const outs = Array.from({ length: n }, () => (Math.random() < p ? 1 : 0)); return { outs, value: outs.reduce((a, b) => a + b, 0), dur: Math.min(3600, 500 + n * 80) }; },
    draw(c, W, H, tr, t, p, C) { trialsScene(c, W, H, tr.outs, t, C, (done, s) => `Trial ${done} of ${p.n}  ·  successes so far: ${s}`); },
    result: tr => `X = ${tr.value} successes`,
  };

  M.geometric = {
    title: 'keep trying until the first success',
    explain: 'Run trials one after another until the first success, then count how many trials it took (including the success). A small p means long runs of failures.',
    trial: ({ p }) => { const outs = []; do outs.push(Math.random() < p ? 1 : 0); while (!outs[outs.length - 1] && outs.length < 400); return { outs, value: outs.length, dur: Math.min(4000, 400 + outs.length * 140) }; },
    draw(c, W, H, tr, t, p, C) { trialsScene(c, W, H, tr.outs, t, C, (done, s) => s ? `First success on trial ${done}  →  X = ${done}` : `Trial ${done}: still waiting…`); },
    result: tr => `X = ${tr.value} trials`,
  };

  M.negbinomial = {
    title: 'keep trying until r successes',
    explain: 'Like the geometric, but you keep going until you have r successes. X is the total number of trials needed.',
    trial: ({ r, p }) => { const outs = []; let s = 0; while (s < r && outs.length < 600) { const o = Math.random() < p ? 1 : 0; s += o; outs.push(o); } return { outs, value: outs.length, dur: Math.min(4500, 400 + outs.length * 90) }; },
    draw(c, W, H, tr, t, p, C) { trialsScene(c, W, H, tr.outs, t, C, (done, s) => s >= p.r ? `Success #${p.r} on trial ${done}  →  X = ${done}` : `Trial ${done}  ·  successes: ${s} of ${p.r}`); },
    result: tr => `X = ${tr.value} trials`,
  };

  M.poisson = {
    title: 'count random arrivals in one time unit',
    explain: 'Events (customers, emails, decays) arrive at random, on average λ per time unit, with independent exponential gaps between them. The clock runs for one unit, and the number of arrivals is a Poisson value.',
    trial: ({ lambda }) => {
      const times = []; let s = S.rexp(lambda);
      while (s < 1) { times.push(s); s += S.rexp(lambda); }
      return { times, value: times.length, dur: 2800 };
    },
    draw(c, W, H, tr, t, p, C) {
      const x0 = 30, x1 = W - 30, y = H * 0.58, now = cl(t / 0.92);
      const X = s => x0 + s * (x1 - x0);
      box(c, x0, y - 26, (x1 - x0) * now, 52, 6, C.panel2);
      ln(c, x0, y, x1, y, C.muted, 1.5);
      for (let k = 0; k <= 4; k++) { const x = X(k / 4); ln(c, x, y, x, y + 5, C.muted, 1); txt(c, (k / 4).toString(), x, y + 16, { size: 10.5, color: C.muted, align: 'center' }); }
      txt(c, 'time', x1, y + 30, { size: 11, color: C.muted, align: 'right' });
      const seen = tr.times.filter(s => s <= now);
      let prev = 0;
      seen.forEach((s, i) => {
        const x = X(s), age = cl((now - s) * 8);
        dot(c, x, y - 4 - 14 * (1 - age), 6, C.main);
        if (seen.length <= 14 && i > 0) {
          const xm = (X(prev) + x) / 2;
          ln(c, X(prev), y + 30 - 6, x, y + 30 - 6, C.alt, 1, [2, 2]);
          if (x - X(prev) > 34) txt(c, (s - prev).toFixed(2), xm, y + 40 - 6, { size: 9.5, color: C.alt, align: 'center' });
        }
        prev = s;
      });
      ln(c, X(now), y - 34, X(now), y + 8, C.alt, 2);
      txt(c, `Arrivals so far: ${seen.length}`, 16, 20, { size: 15, weight: 600, color: C.text });
      txt(c, 'dashed orange: gaps between arrivals (exponential)', W - 16, 20, { size: 11, color: C.muted, align: 'right' });
    },
    result: tr => `X = ${tr.value} arrivals`,
  };

  M.hypergeometric = {
    title: 'draw from an urn without putting balls back',
    explain: 'The urn holds N balls, K of them green ("success"). Draw n balls without replacement and count the green ones. Each draw changes what is left for the next.',
    trial: ({ N, K, n }) => {
      const idx = Array.from({ length: N }, (_, i) => i);
      for (let i = N - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      const drawn = idx.slice(0, n);
      return { drawn, value: drawn.filter(i => i < K).length, dur: Math.min(4000, 600 + n * 140) };
    },
    draw(c, W, H, tr, t, p, C) {
      const shown = Math.floor(t * (p.n + 1));
      const taken = new Set(tr.drawn.slice(0, shown));
      const urnW = Math.min(W * 0.55, 380);
      box(c, 12, 34, urnW, H - 46, 14, C.panel2, C.grid);
      txt(c, `Urn: N = ${p.N}, green K = ${p.K}`, 16, 18, { size: 12, color: C.muted });
      const g = grid(p.N, 20, 40, urnW - 16, H - 58, 9);
      for (let i = 0; i < p.N; i++) {
        const [x, y] = g.pos[i];
        if (taken.has(i)) dot(c, x, y, g.r, null, C.grid, 1);
        else dot(c, x, y, g.r, i < p.K ? C.ok : C.muted);
      }
      const hx = urnW + 34;
      const got = tr.drawn.slice(0, shown);
      const greens = got.filter(i => i < p.K).length;
      txt(c, `Drawn: ${got.length} of ${p.n}  ·  green: ${greens}`, hx, 18, { size: 14, weight: 600, color: C.text });
      const hg = grid(p.n, hx, 34, W - hx - 12, H - 46, 11);
      got.forEach((i, j) => dot(c, hg.pos[j][0], hg.pos[j][1], hg.r, i < p.K ? C.ok : C.muted));
    },
    result: tr => `X = ${tr.value} green`,
  };

  M.discreteuniform = {
    title: 'spin a fair spinner',
    explain: 'A spinner with one equal slice for every whole number from a to b. Each slice is equally likely, so the bars come out flat.',
    trial: ({ a, b }) => { const m = b - a + 1, k = Math.floor(Math.random() * m); return { k, value: a + k, turns: 3 + Math.random(), dur: 1700 }; },
    draw(c, W, H, tr, t, p, C) {
      const m = p.b - p.a + 1, cx = Math.min(W / 2, H * 0.8), cy = H / 2 + 4, R = Math.min(H / 2 - 14, 110);
      const slice = 2 * Math.PI / m;
      const target = -Math.PI / 2 - (tr.k + 0.5) * slice; // pointer at top
      const ang = target - 2 * Math.PI * tr.turns * (1 - ease(t / 0.95));
      for (let i = 0; i < m; i++) {
        c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, ang + i * slice, ang + (i + 1) * slice); c.closePath();
        c.fillStyle = i % 2 ? C.panel2 : C.panel; c.fill(); c.strokeStyle = C.grid; c.lineWidth = 1; c.stroke();
        if (m <= 30) { const a2 = ang + (i + 0.5) * slice; txt(c, String(p.a + i), cx + Math.cos(a2) * R * 0.75, cy + Math.sin(a2) * R * 0.75, { size: m > 16 ? 9 : 12, color: C.text, align: 'center', weight: 600 }); }
      }
      c.beginPath(); c.moveTo(cx - 9, cy - R - 12); c.lineTo(cx + 9, cy - R - 12); c.lineTo(cx, cy - R + 6); c.closePath(); c.fillStyle = C.alt; c.fill();
      dot(c, cx, cy, 5, C.text);
      if (t >= 0.97) txt(c, `X = ${tr.value}`, cx + R + 30, cy, { size: 22, weight: 700, color: C.alt });
    },
    result: tr => `X = ${tr.value}`,
  };

  // ------------------------------------------------------------ continuous
  M.uniform = {
    title: 'drop a dart anywhere on the interval',
    explain: 'A dart lands somewhere between a and b with no spot favored over any other. The landing point is a uniform value. Faint marks show earlier landings.',
    trial: ({ a, b }) => ({ value: a + Math.random() * (b - a), dur: 900 }),
    draw(c, W, H, tr, t, p, C, v, recent) {
      const y = H - 34, map = axis(c, v, 24, W - 24, y, C);
      ln(c, map(p.a), y, map(p.b), y, C.main, 6);
      recentMarks(c, recent, map, y - 4, C);
      const x = map(tr.value), yy = 20 + (y - 26) * ease(t / 0.8);
      c.beginPath(); c.moveTo(x, yy + 8); c.lineTo(x - 6, yy - 6); c.lineTo(x + 6, yy - 6); c.closePath(); c.fillStyle = C.alt; c.fill();
      if (t > 0.85) txt(c, `X = ${S.fmt(tr.value, 3)}`, x, y - 28, { size: 13, weight: 700, color: C.alt, align: 'center' });
    },
    result: tr => `X = ${S.fmt(tr.value, 3)}`,
  };

  M.normal = {
    title: 'add up many small random nudges',
    explain: 'A marker starts at μ and takes 40 steps down the screen. Each step nudges it a small random amount left or right. Where it lands is the sum of many small independent effects, which is (very nearly) normal. That is the Central Limit Theorem at work.',
    trial: ({ mu, sigma }) => {
      const a = sigma * Math.sqrt(3 / 40), xs = [mu];
      for (let i = 0; i < 40; i++) xs.push(xs[i] + (Math.random() * 2 - 1) * a);
      return { xs, value: xs[40], dur: 1900 };
    },
    draw(c, W, H, tr, t, p, C, v, recent) {
      const y1 = H - 32, y0 = 14, map = axis(c, v, 24, W - 24, y1, C);
      recentMarks(c, recent, map, y1 - 2, C);
      ln(c, map(p.mu), y0, map(p.mu), y1, C.grid, 1, [3, 4]);
      const steps = Math.floor(ease(t / 0.9) * 40);
      c.beginPath();
      for (let i = 0; i <= steps; i++) { const X = map(tr.xs[i]), Y = y0 + (y1 - y0 - 6) * i / 40; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }
      c.strokeStyle = C.main; c.lineWidth = 2; c.stroke();
      dot(c, map(tr.xs[steps]), y0 + (y1 - y0 - 6) * steps / 40, 5, C.alt);
      if (steps === 40) txt(c, `X = ${S.fmt(tr.value, 3)}`, map(tr.value) + 10, y1 - 22, { size: 13, weight: 700, color: C.alt });
    },
    result: tr => `X = ${S.fmt(tr.value, 3)}`,
  };

  function waitScene(c, W, H, tr, t, C, v, recent, opts) {
    const y = H * 0.55, map = axis(c, v, 24, W - 24, y + 24, C, { label: 'time' });
    recentMarks(c, recent, map, y + 22, C);
    const end = tr.value, now = Math.min(end, end * cl(t / 0.85));
    box(c, map(0), y - 14, Math.max(0, map(now) - map(0)), 28, 6, C.panel2);
    tr.events.forEach((s, i) => {
      if (s > now + 1e-12) return;
      const last = i === tr.events.length - 1;
      dot(c, map(s), y, last ? 8 : 6, last ? C.alt : C.main);
      if (tr.events.length > 1 && tr.events.length <= 20) txt(c, String(i + 1), map(s), y - 18, { size: 10.5, color: C.muted, align: 'center' });
    });
    ln(c, map(now), y - 24, map(now), y + 20, C.alt, 2);
    txt(c, opts.header(now, tr.events.filter(s => s <= now).length), 16, 20, { size: 15, weight: 600, color: C.text });
  }

  M.exponential = {
    title: 'wait for the next arrival',
    explain: 'Events happen at random at an average rate of λ per time unit. Start a stopwatch and wait for the next one. The waiting time is exponential. Faint marks show earlier waits.',
    trial: ({ lambda }) => { const T = S.rexp(lambda); return { events: [T], value: T, dur: 700 + 1500 * Math.min(1, T * lambda / 3) }; },
    draw(c, W, H, tr, t, p, C, v, recent) {
      waitScene(c, W, H, tr, t, C, v, recent, { header: (now, k) => k ? `Arrival after ${S.fmt(now, 3)} time units` : `Waiting… ${now.toFixed(2)}` });
    },
    result: tr => `X = ${S.fmt(tr.value, 3)}`,
  };

  M.gamma = {
    title: 'wait for α arrivals',
    explain: 'Same story as the exponential, but you wait for α arrivals instead of one. The total time is a sum of α exponential gaps, which is a gamma value. (The story needs α to be a whole number.)',
    exact: ({ alpha }) => Number.isInteger(alpha) || `Set α to a whole number (like ${Math.max(1, Math.round(alpha))}) to run this story; it needs a whole number of arrivals.`,
    trial: ({ alpha, beta }) => {
      const k = Math.max(1, Math.round(alpha)), ev = []; let s = 0;
      for (let i = 0; i < k; i++) { s += S.rexp(beta); ev.push(s); }
      return { events: ev, value: s, dur: Math.min(3400, 900 + 220 * k) };
    },
    draw(c, W, H, tr, t, p, C, v, recent) {
      waitScene(c, W, H, tr, t, C, v, recent, { header: (now, k) => k === tr.events.length ? `Arrival #${k} at time ${S.fmt(now, 3)}` : `Arrivals so far: ${k} of ${tr.events.length}` });
    },
    result: tr => `X = ${S.fmt(tr.value, 3)}`,
  };

  M.beta = {
    title: 'throw darts, pick the α-th smallest',
    explain: 'Drop α + β − 1 darts uniformly on [0, 1] and sort them. The α-th dart from the left is a Beta(α, β) value, so larger α pushes it right and larger β pushes it left. (The story needs whole-number α and β.)',
    exact: ({ alpha, beta }) => (Number.isInteger(alpha) && Number.isInteger(beta)) || 'Set α and β to whole numbers to run this story.',
    trial: ({ alpha, beta }) => {
      const a = Math.max(1, Math.round(alpha)), b = Math.max(1, Math.round(beta));
      const xs = Array.from({ length: a + b - 1 }, () => Math.random());
      const sorted = xs.slice().sort((u, w) => u - w);
      return { xs, a, value: sorted[a - 1], dur: Math.min(3200, 900 + xs.length * 80) };
    },
    draw(c, W, H, tr, t, p, C, v, recent) {
      const y = H - 38, map = axis(c, v, 24, W - 24, y, C);
      recentMarks(c, recent, map, y - 2, C);
      const n = tr.xs.length, shown = t / 0.75 * n;
      tr.xs.forEach((x, i) => { const f = cl(shown - i); if (f > 0) dot(c, map(x), 30 + (y - 38) * ease(f), 5, C.main); });
      if (t > 0.8) {
        const sorted = tr.xs.slice().sort((u, w) => u - w);
        sorted.forEach((x, i) => { if (i < tr.a) txt(c, String(i + 1), map(x), y - 22, { size: 10, color: i === tr.a - 1 ? C.alt : C.muted, align: 'center', weight: 700 }); });
        dot(c, map(tr.value), y - 8, 8, null, C.alt, 2.5);
        txt(c, `${tr.a}${tr.a === 1 ? 'st' : tr.a === 2 ? 'nd' : tr.a === 3 ? 'rd' : 'th'} smallest of ${n}: X = ${S.fmt(tr.value, 3)}`, 16, 18, { size: 14, weight: 600, color: C.text });
      } else txt(c, `Dropping ${n} darts…`, 16, 18, { size: 14, weight: 600, color: C.text });
    },
    result: tr => `X = ${S.fmt(tr.value, 3)}`,
  };

  M.chisq = {
    title: 'square k random normal values and add them up',
    explain: 'Draw k standard normal numbers Z₁ … Zₖ (top row). Square each one and lay the squares end to end (bottom). The total length is a chi-square value. Big values need several large Z’s at once.',
    trial: ({ k }) => { const zs = Array.from({ length: k }, () => S.rnorm()); return { zs, value: zs.reduce((s, z) => s + z * z, 0), dur: Math.min(3600, 800 + k * 160) }; },
    draw(c, W, H, tr, t, p, C, v, recent) {
      const k = tr.zs.length, shown = Math.min(k, Math.floor(t / 0.9 * (k + 0.5)));
      const zMap = axis(c, { xmin: -3.5, xmax: 3.5 }, 24, W - 24, 52, C, { ticks: 7, label: 'Z values' });
      const y = H - 34, map = axis(c, v, 24, W - 24, y, C, { label: 'sum of squares' });
      recentMarks(c, recent, map, y - 2, C);
      let acc = 0;
      for (let i = 0; i < shown; i++) {
        const z = tr.zs[i];
        dot(c, zMap(z), 40, 5, i === shown - 1 ? C.alt : C.main);
        const x0 = map(acc), x1 = map(acc + z * z);
        box(c, x0, y - 30, Math.max(1, x1 - x0), 22, 3, i % 2 ? C.main : C.ok);
        acc += z * z;
      }
      txt(c, `${shown} of ${k} squared  ·  running total ${acc.toFixed(2)}`, 16, 14, { size: 13, weight: 600, color: C.text });
    },
    result: tr => `X = ${S.fmt(tr.value, 3)}`,
  };

  M.t = {
    title: 'standardize a small sample’s mean using its own SD',
    explain: 'Take ν + 1 values from a normal population whose true mean is 0. Compute the sample mean x̄ and sample SD s, then t = x̄ / (s/√n). Because s is itself noisy and sometimes too small, t lands in the tails more often than a z-score would.',
    exact: ({ nu }) => Number.isInteger(nu) || 'Set ν to a whole number to run this story (the sample size is ν + 1).',
    trial: ({ nu }) => {
      const n = Math.max(2, Math.round(nu) + 1), xs = Array.from({ length: n }, () => S.rnorm());
      const m = xs.reduce((a, b) => a + b, 0) / n, s = Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1));
      return { xs, m, s, n, value: m / (s / Math.sqrt(n)), z: m * Math.sqrt(n), dur: Math.min(3000, 1200 + n * 40) };
    },
    draw(c, W, H, tr, t, p, C, v, recent) {
      const dm = axis(c, { xmin: -3.5, xmax: 3.5 }, 24, W - 24, 70, C, { label: 'sample values (true mean 0)' });
      const shown = Math.floor(cl(t / 0.5) * tr.n);
      tr.xs.slice(0, shown).forEach((x, i) => dot(c, dm(x), 58 - (i % 3) * 7, 4, C.main));
      if (t > 0.55) {
        ln(c, dm(tr.m), 30, dm(tr.m), 66, C.alt, 2.5);
        ln(c, dm(tr.m - tr.s), 34, dm(tr.m + tr.s), 34, C.sd, 2);
        txt(c, `x̄ = ${tr.m.toFixed(2)},  s = ${tr.s.toFixed(2)}`, 16, 14, { size: 13, weight: 600, color: C.text });
      }
      const y = H - 30, map = axis(c, v, 24, W - 24, y, C, { label: 't statistic' });
      recentMarks(c, recent, map, y - 2, C);
      if (t > 0.8) {
        dot(c, map(tr.value), y - 10, 6, C.alt);
        txt(c, `t = ${tr.value.toFixed(2)}  (with the true σ it would be z = ${tr.z.toFixed(2)})`, W / 2, y - 30, { size: 12.5, weight: 600, color: C.text, align: 'center' });
      }
    },
    result: tr => `t = ${tr.value.toFixed(3)}`,
  };

  M.f = {
    title: 'compare the spread of two samples',
    explain: 'Two groups are drawn from the same normal population: d₁ + 1 values in group A and d₂ + 1 in group B. F is the ratio of their sample variances, s²_A / s²_B. It hovers around 1, since the populations really are equally spread.',
    trial: ({ d1, d2 }) => {
      const g = n => { const xs = Array.from({ length: n }, () => S.rnorm()), m = xs.reduce((a, b) => a + b, 0) / n; return { xs, m, v: xs.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1) }; };
      const A = g(d1 + 1), B = g(d2 + 1);
      return { A, B, value: A.v / B.v, dur: 2000 };
    },
    draw(c, W, H, tr, t, p, C, v, recent) {
      const dm = axis(c, { xmin: -3.5, xmax: 3.5 }, 70, W - 24, 92, C, { ticks: 7 });
      const row = (G2, y, name, col, f) => {
        txt(c, name, 16, y, { size: 12, weight: 600, color: C.muted });
        const k = Math.floor(f * G2.xs.length);
        G2.xs.slice(0, k).forEach(x => dot(c, dm(x), y, 3.5, col));
        if (f >= 1) { const s = Math.sqrt(G2.v); ln(c, dm(G2.m - s), y + 9, dm(G2.m + s), y + 9, col, 2); }
      };
      row(tr.A, 34, 'Group A', C.main, cl(t / 0.35));
      row(tr.B, 64, 'Group B', C.ok, cl((t - 0.3) / 0.35));
      const y = H - 28, map = axis(c, v, 24, W - 24, y, C, { label: 'F = s²A / s²B' });
      recentMarks(c, recent, map, y - 2, C);
      if (t > 0.75) { dot(c, map(tr.value), y - 10, 6, C.alt); txt(c, `F = ${tr.A.v.toFixed(2)} / ${tr.B.v.toFixed(2)} = ${tr.value.toFixed(2)}`, W / 2, y - 28, { size: 13, weight: 600, color: C.text, align: 'center' }); }
    },
    result: tr => `F = ${tr.value.toFixed(3)}`,
  };

  M.lognormal = {
    title: 'grow by random percentages',
    explain: 'Start at e^μ… no, start at 1 and apply 30 random growth factors in a row, like a stock price or a population, multiplying (not adding) each time. The final size is log-normal. Notice how a few lucky runs end up far to the right.',
    trial: ({ mu, sigma }) => {
      const ls = [0];
      for (let i = 0; i < 30; i++) ls.push(ls[i] + mu / 30 + sigma / Math.sqrt(30) * S.rnorm());
      return { xs: ls.map(Math.exp), value: Math.exp(ls[30]), dur: 1900 };
    },
    draw(c, W, H, tr, t, p, C, v, recent) {
      const y1 = H - 32, y0 = 14, map = axis(c, v, 24, W - 24, y1, C);
      recentMarks(c, recent, map, y1 - 2, C);
      const steps = Math.floor(ease(t / 0.9) * 30);
      c.save(); c.beginPath(); c.rect(20, 0, W - 40, H); c.clip();
      c.beginPath();
      for (let i = 0; i <= steps; i++) { const X = map(tr.xs[i]), Y = y0 + (y1 - y0 - 6) * i / 30; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }
      c.strokeStyle = C.main; c.lineWidth = 2; c.stroke();
      dot(c, map(tr.xs[steps]), y0 + (y1 - y0 - 6) * steps / 30, 5, C.alt);
      c.restore();
      txt(c, `size ×${(tr.xs[steps] / tr.xs[Math.max(0, steps - 1)]).toFixed(2)} this step  ·  now ${S.fmt(tr.xs[steps], 3)}`, 16, 12, { size: 12, color: C.muted });
    },
    result: tr => `X = ${S.fmt(tr.value, 3)}`,
  };
  M.lognormal.explain = 'Start at 1 and apply 30 random growth factors in a row, like a stock price or a bacteria colony that grows by a random percentage each step. Multiplying (not adding) many random factors gives a log-normal size. A few lucky runs end up far to the right.';

  M.weibull = {
    title: 'a part wears out until it fails',
    explain: 'Each part has a hidden toughness threshold (orange line). As time passes its accumulated risk (blue bar) builds up, and the part fails when the bar reaches the threshold. With k > 1 risk builds faster and faster (wear-out). With k < 1 most of the risk comes early.',
    trial: ({ k, lambda }) => { const E = S.rexp(1); return { E, value: lambda * Math.pow(E, 1 / k), dur: 1900 }; },
    draw(c, W, H, tr, t, p, C, v, recent) {
      const y = H - 30, map = axis(c, v, 24, W - 24, y, C, { label: 'time' });
      recentMarks(c, recent, map, y - 2, C);
      const now = tr.value * cl(t / 0.85), Hc = Math.pow(now / p.lambda, p.k);
      const failed = t >= 0.85;
      // bulb
      const bx = 40, by = 50;
      dot(c, bx, by, 20, failed ? C.panel2 : C.sim, C.grid);
      txt(c, failed ? 'failed' : 'working', bx, by + 32, { size: 11, color: C.muted, align: 'center' });
      // cumulative risk bar vs threshold
      const x0 = 90, x1 = W - 30, scaleMax = Math.max(tr.E * 1.3, 1.5), bm = h => x0 + (x1 - x0) * Math.min(1, h / scaleMax);
      box(c, x0, by - 12, x1 - x0, 24, 6, C.panel2, C.grid);
      box(c, x0, by - 12, bm(Hc) - x0, 24, 6, C.main);
      ln(c, bm(tr.E), by - 20, bm(tr.E), by + 20, C.alt, 2.5);
      txt(c, 'accumulated risk', x0, by - 24, { size: 11, color: C.muted });
      txt(c, 'threshold', bm(tr.E), by + 28, { size: 11, color: C.alt, align: 'center' });
      const hz = p.k / p.lambda * Math.pow(Math.max(now, 1e-6) / p.lambda, p.k - 1);
      txt(c, `time ${now.toFixed(2)}  ·  current failure rate ${S.fmt(hz, 3)}`, x0, 14, { size: 12.5, weight: 600, color: C.text });
      ln(c, map(now), y - 20, map(now), y, failed ? C.alt : C.main, 2);
    },
    result: tr => `X = ${S.fmt(tr.value, 3)}`,
  };

  M.cauchy = {
    title: 'shine a randomly aimed flashlight at a wall',
    explain: 'A flashlight sits at distance γ from a long wall, opposite the point x₀. It is spun to a random angle (pointing toward the wall), and X is where the beam hits. Near-parallel angles send the spot extremely far away.',
    trial: ({ x0, gamma }) => { const th = (Math.random() - 0.5) * Math.PI; return { th, value: x0 + gamma * Math.tan(th), dur: 1400 }; },
    draw(c, W, H, tr, t, p, C, v, recent) {
      const y = H - 30, map = axis(c, v, 24, W - 24, y, C, { label: 'wall' });
      recentMarks(c, recent, map, y - 2, C);
      const ppu = (W - 48) / (v.xmax - v.xmin), lx = map(p.x0), ly = Math.max(16, y - p.gamma * ppu);
      const th = tr.th * ease(t / 0.8);
      const dx = Math.sin(th), dy = Math.cos(th);
      const hitX = lx + (y - ly) * dx / dy;
      c.save(); c.beginPath(); c.rect(0, 0, W, y); c.clip();
      c.globalAlpha = 0.35; ln(c, lx, ly, hitX, y, C.sim, 7); c.globalAlpha = 1; ln(c, lx, ly, hitX, y, C.sim, 2);
      c.restore();
      ln(c, lx, ly, lx, y, C.grid, 1, [3, 3]);
      txt(c, 'γ', lx + 6, (ly + y) / 2, { size: 12, color: C.muted });
      box(c, lx - 9, ly - 9, 18, 18, 4, C.text);
      if (t > 0.82) {
        if (hitX >= 24 && hitX <= W - 24) dot(c, hitX, y, 6, C.alt);
        else txt(c, hitX < 24 ? '◀ off the chart' : 'off the chart ▶', hitX < 24 ? 26 : W - 26, y - 14, { size: 12, weight: 700, color: C.alt, align: hitX < 24 ? 'left' : 'right' });
        txt(c, `X = ${S.fmt(tr.value, 3)}`, 16, 16, { size: 15, weight: 700, color: C.alt });
      }
    },
    result: tr => `X = ${S.fmt(tr.value, 3)}`,
  };

  M.laplace = {
    title: 'the difference between two exponential waits',
    explain: 'Two people each wait for their own bus; both waits are exponential with mean b. X = μ + (A’s wait − B’s wait). Usually the waits are similar, giving the sharp peak at μ, but sometimes one is much longer, giving the heavy tails.',
    trial: ({ mu, b }) => { const A = S.rexp(1 / b), B = S.rexp(1 / b); return { A, B, value: mu + A - B, dur: 2000 }; },
    draw(c, W, H, tr, t, p, C, v, recent) {
      const span = Math.max(tr.A, tr.B, 3 * p.b), now = span * cl(t / 0.6);
      const x0 = 80, x1 = W - 24, tm = s => x0 + (x1 - x0) * s / span;
      [['A', tr.A, 22, C.main], ['B', tr.B, 50, C.ok]].forEach(([name, T, y, col]) => {
        txt(c, `wait ${name}`, 16, y, { size: 12, weight: 600, color: C.muted });
        box(c, x0, y - 7, Math.max(0, tm(Math.min(now, T)) - x0), 14, 4, col);
        if (now >= T) txt(c, T.toFixed(2), tm(T) + 6, y, { size: 11, color: C.text });
      });
      const y = H - 30, map = axis(c, v, 24, W - 24, y, C);
      recentMarks(c, recent, map, y - 2, C);
      if (t > 0.7) {
        ln(c, map(p.mu), y - 22, map(tr.value), y - 22, C.alt, 2);
        dot(c, map(tr.value), y - 10, 6, C.alt);
        txt(c, `X = μ + (${tr.A.toFixed(2)} − ${tr.B.toFixed(2)}) = ${tr.value.toFixed(2)}`, W / 2, y - 38, { size: 13, weight: 600, color: C.text, align: 'center' });
      }
    },
    result: tr => `X = ${S.fmt(tr.value, 3)}`,
  };

  M.pareto = {
    title: 'grow exponentially until a random stop',
    explain: 'Something starts at size xₘ and grows exponentially (×e every time unit), like a viral post or a growing firm. Growth stops at a random exponential time with rate α. Most stop early and stay small, but a few run a long time and become huge.',
    trial: ({ xm, alpha }) => { const T = S.rexp(alpha); return { T, value: xm * Math.exp(T), dur: 700 + 1500 * Math.min(1, T * alpha / 3) }; },
    draw(c, W, H, tr, t, p, C, v, recent) {
      const y = H - 30, map = axis(c, v, 24, W - 24, y, C, { label: 'final size' });
      recentMarks(c, recent, map, y - 2, C);
      const now = tr.T * cl(t / 0.85), size = p.xm * Math.exp(now);
      box(c, map(0), y - 34, Math.max(2, Math.min(W - 24, map(size)) - map(0)), 22, 4, t >= 0.85 ? C.alt : C.main);
      txt(c, `time ${now.toFixed(2)}  ·  size ${S.fmt(size, 3)}${t >= 0.85 ? '  ·  stopped!' : ''}`, 16, 18, { size: 14, weight: 600, color: C.text });
      if (map(size) > W - 24) txt(c, 'off the chart ▶', W - 26, y - 50, { size: 12, weight: 700, color: C.alt, align: 'right' });
    },
    result: tr => `X = ${S.fmt(tr.value, 3)}`,
  };

  // ------------------------------------------------------------ runner widget
  G.mountMech = function (container, d, api) {
    const m = M[d.id];
    if (!m) return null;
    container.innerHTML = `
      <div class="plot-head"><h3>See how it works: ${m.title}</h3></div>
      <p class="mech-explain">${m.explain}</p>
      <canvas class="mech-canvas" aria-label="Animation of how a ${d.short} value is generated"></canvas>
      <div class="row gap wrap mech-controls">
        <button class="btn primary" data-run="1">Run once</button>
        <button class="btn" data-run="10">Run 10</button>
        <button class="btn" data-run="100">Run 100 (fast)</button>
        <label class="check"><input type="checkbox" class="mech-auto"> Keep running</label>
        <span class="mech-status small muted"></span>
      </div>
      <p class="mech-note small"></p>`;
    const canvas = container.querySelector('canvas'), ctx = canvas.getContext('2d');
    const status = container.querySelector('.mech-status'), note = container.querySelector('.mech-note');
    const autoBox = container.querySelector('.mech-auto');
    let cur = null, queue = 0, speed = 1, raf = 0, recent = [], preview = null, C = palette();
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const exactMsg = () => { const e = m.exact ? m.exact(api.params()) : true; return e === true ? '' : e; };
    function size() {
      const dpr = window.devicePixelRatio || 1, w = canvas.clientWidth || 600, h = canvas.clientHeight || 230;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return [w, h];
    }
    function paint(tr, t) {
      const [W, H] = size();
      ctx.clearRect(0, 0, W, H);
      try { m.draw(ctx, W, H, tr, t, api.params(), C, api.view(), recent); } catch (e) { /* keep the page alive */ console.error(e); }
    }
    function idle() { preview = preview || m.trial(api.params(), api.view()); paint(preview, 0); }
    function finish(tr) {
      recent.push(tr.value); if (recent.length > 400) recent.shift();
      api.push([tr.value]);
      status.textContent = `Last result: ${m.result(tr)}`;
    }
    function frame(ts) {
      raf = 0;
      if (!cur) {
        if (queue <= 0 && !autoBox.checked) { return; }
        if (queue > 0) queue--;
        const tr = m.trial(api.params(), api.view());
        cur = { tr, start: ts, dur: reduce ? 1 : tr.dur / (autoBox.checked && queue <= 0 ? 1.4 : speed) };
      }
      const t = Math.min(1, (ts - cur.start) / cur.dur);
      paint(cur.tr, t);
      if (t >= 1) { finish(cur.tr); preview = cur.tr; cur = null; if (queue <= 0 && !autoBox.checked) { paint(preview, 1); return; } }
      raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    function run(n) {
      const msg = exactMsg();
      if (msg) { note.textContent = msg; return; }
      C = palette();
      if (n >= 100) { // generate most instantly, animate the last one quickly
        const p = api.params(), v = api.view(), vals = [];
        for (let i = 0; i < n - 1; i++) { const tr = m.trial(p, v); vals.push(tr.value); recent.push(tr.value); }
        if (recent.length > 400) recent = recent.slice(-400);
        api.push(vals);
        queue += 1; speed = 3;
      } else { queue += n; speed = n > 1 ? 3 : 1; }
      kick();
    }
    container.querySelectorAll('[data-run]').forEach(b => b.addEventListener('click', () => run(+b.dataset.run)));
    autoBox.addEventListener('change', () => { if (autoBox.checked) { const msg = exactMsg(); if (msg) { autoBox.checked = false; note.textContent = msg; return; } C = palette(); kick(); } });
    window.addEventListener('resize', () => { if (!cur) idle(); });

    const api2 = {
      reset() { // parameters changed
        cancelAnimationFrame(raf); raf = 0; cur = null; queue = 0; recent = []; preview = null;
        note.textContent = exactMsg(); status.textContent = ''; C = palette();
        idle();
        if (autoBox.checked && !exactMsg()) kick(); else autoBox.checked = autoBox.checked && !exactMsg();
      },
      clear() { recent = []; status.textContent = ''; if (!cur) idle(); },
      stop() { cancelAnimationFrame(raf); raf = 0; autoBox.checked = false; },
    };
    note.textContent = exactMsg();
    requestAnimationFrame(idle);
    return api2;
  };
})();
