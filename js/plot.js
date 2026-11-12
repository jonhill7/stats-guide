/* Tiny SVG plotting library: axes, lines, areas, bars, histograms, hover readout. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function niceStep(range, count) {
    const raw = range / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  }
  function ticks(min, max, count, integer) {
    let step = niceStep(max - min, count);
    if (integer) step = Math.max(1, Math.round(step));
    const out = [];
    const start = Math.ceil(min / step - 1e-9) * step;
    for (let v = start; v <= max + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return { ticks: out, step };
  }
  function label(v, step) {
    if (Math.abs(v) >= 1e5) return v.toExponential(0);
    const dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
    return v.toFixed(Math.min(dec, 6)).replace(/^-/, '−');
  }

  class Chart {
    constructor(container, opts) {
      opts = opts || {};
      const narrow = !opts.width && container.clientWidth > 0 && container.clientWidth < 520;
      this.W = opts.width || (narrow ? 420 : 640);
      this.H = Math.round((opts.height || 300) * (narrow ? 0.85 : 1));
      this.m = Object.assign({ l: 54, r: 14, t: 14, b: 36 }, opts.margin || {});
      this.svg = el('svg', { viewBox: `0 0 ${this.W} ${this.H}`, class: 'chart', preserveAspectRatio: 'xMidYMid meet' });
      container.appendChild(this.svg);
      this.cid = 'clip' + Math.random().toString(36).slice(2);
      this.spec = null;
    }
    sx(x) { return this.m.l + (x - this.xmin) / (this.xmax - this.xmin) * (this.W - this.m.l - this.m.r); }
    sy(y) { return this.H - this.m.b - (y - this.ymin) / (this.ymax - this.ymin) * (this.H - this.m.t - this.m.b); }
    ix(px) { return this.xmin + (px - this.m.l) / (this.W - this.m.l - this.m.r) * (this.xmax - this.xmin); }
    cy(y) { // clamp y for drawing so huge values do not produce giant coordinates
      if (!isFinite(y)) y = this.ymax * 10;
      return this.sy(Math.max(this.ymin - (this.ymax - this.ymin), Math.min(y, this.ymax * 10)));
    }
    path(pts) {
      let d = '', pen = false;
      for (const [x, y] of pts) {
        if (y === null || Number.isNaN(y)) { pen = false; continue; }
        d += (pen ? 'L' : 'M') + this.sx(x).toFixed(2) + ',' + this.cy(y).toFixed(2);
        pen = true;
      }
      return d;
    }
    render(spec) {
      this.spec = spec;
      const svg = this.svg;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      Object.assign(this, { xmin: spec.xmin, xmax: spec.xmax, ymin: spec.ymin || 0, ymax: spec.ymax });
      const { m, W, H } = this;
      const pw = W - m.l - m.r, ph = H - m.t - m.b;
      const defs = el('defs', null, svg);
      const cp = el('clipPath', { id: this.cid }, defs);
      el('rect', { x: m.l, y: m.t - 1, width: pw, height: ph + 1 }, cp);

      // grid + axes
      const g = el('g', { class: 'axes' }, svg);
      const xt = ticks(this.xmin, this.xmax, spec.xticks || 8, spec.integerX);
      const yt = ticks(this.ymin, this.ymax, spec.yticks || 5);
      for (const v of yt.ticks) {
        const y = this.sy(v);
        el('line', { x1: m.l, x2: W - m.r, y1: y, y2: y, class: 'grid' }, g);
        const t = el('text', { x: m.l - 6, y: y + 4, class: 'tick', 'text-anchor': 'end' }, g);
        t.textContent = label(v, yt.step);
      }
      for (const v of xt.ticks) {
        const x = this.sx(v);
        el('line', { x1: x, x2: x, y1: m.t, y2: H - m.b, class: 'grid' }, g);
        const t = el('text', { x, y: H - m.b + 16, class: 'tick', 'text-anchor': 'middle' }, g);
        t.textContent = label(v, xt.step);
      }
      el('line', { x1: m.l, x2: W - m.r, y1: this.sy(Math.max(0, this.ymin)), y2: this.sy(Math.max(0, this.ymin)), class: 'axis' }, g);
      if (spec.xlabel) { const t = el('text', { x: m.l + pw / 2, y: H - 4, class: 'axis-label', 'text-anchor': 'middle' }, g); t.textContent = spec.xlabel; }
      if (spec.ylabel) { const t = el('text', { x: 12, y: m.t + ph / 2, class: 'axis-label', 'text-anchor': 'middle', transform: `rotate(-90 12 ${m.t + ph / 2})` }, g); t.textContent = spec.ylabel; }

      const plot = el('g', { 'clip-path': `url(#${this.cid})` }, svg);
      for (const L of spec.layers || []) this.layer(plot, L);

      // labels for vlines drawn unclipped on top
      for (const L of spec.layers || []) {
        if (L.kind === 'vline' && L.label && L.x >= this.xmin && L.x <= this.xmax) {
          const t = el('text', { x: this.sx(L.x) + 3, y: m.t + 11, class: 'vlabel', style: `fill:${L.color}` }, svg);
          t.textContent = L.label;
        }
      }

      // hover layer
      this.hoverG = el('g', { class: 'hover', style: 'display:none' }, svg);
      const ov = el('rect', { x: m.l, y: m.t, width: pw, height: ph, fill: 'transparent', class: 'overlay' }, svg);
      const pos = ev => {
        const r = this.svg.getBoundingClientRect();
        const px = (ev.clientX - r.left) / r.width * this.W;
        return this.ix(px);
      };
      ov.addEventListener('pointermove', ev => this.hover(pos(ev)));
      ov.addEventListener('pointerleave', () => { this.hoverG.style.display = 'none'; });
      ov.addEventListener('click', ev => { if (spec.onClick) spec.onClick(pos(ev)); });
    }
    layer(parent, L) {
      const c = L.color || 'var(--c1)';
      switch (L.kind) {
        case 'area': {
          if (!L.pts.length) return;
          const base = this.sy(0);
          let d = `M${this.sx(L.pts[0][0])},${base}`;
          for (const [x, y] of L.pts) d += `L${this.sx(x).toFixed(2)},${this.cy(y).toFixed(2)}`;
          d += `L${this.sx(L.pts[L.pts.length - 1][0])},${base}Z`;
          el('path', { d, style: `fill:${c};opacity:${L.opacity == null ? 0.25 : L.opacity}` }, parent);
          break;
        }
        case 'line':
          el('path', { d: this.path(L.pts), class: 'series', style: `stroke:${c};stroke-width:${L.width || 2.2}px${L.dash ? ';stroke-dasharray:' + L.dash : ''}` }, parent);
          break;
        case 'bars': {
          const w = L.width || 0.7;
          for (const [x, y] of L.data) {
            if (!(y > 0)) continue;
            const hl = L.highlight && L.highlight(x);
            const x0 = this.sx(x - w / 2), x1 = this.sx(x + w / 2);
            const y0 = this.cy(y), yb = this.sy(0);
            el('rect', { x: x0, y: y0, width: Math.max(0.6, x1 - x0), height: Math.max(0, yb - y0), rx: 1.5,
              style: `fill:${hl ? (L.hcolor || 'var(--shade)') : c};opacity:${L.opacity == null ? 0.85 : L.opacity}` }, parent);
          }
          break;
        }
        case 'hist':
          for (const b of L.bins) {
            if (!(b.y > 0)) continue;
            const x0 = this.sx(b.x0), x1 = this.sx(b.x1), y0 = this.cy(b.y), yb = this.sy(0);
            el('rect', { x: x0, y: y0, width: Math.max(0.5, x1 - x0), height: Math.max(0, yb - y0), class: 'histbar',
              style: `fill:${c};stroke:${c}` }, parent);
          }
          break;
        case 'steps': { // discrete CDF
          for (let i = 0; i < L.data.length; i++) {
            const [k, F] = L.data[i];
            const xn = i + 1 < L.data.length ? L.data[i + 1][0] : this.xmax;
            el('line', { x1: this.sx(k), x2: this.sx(xn), y1: this.sy(F), y2: this.sy(F), class: 'series', style: `stroke:${c};stroke-width:2.2px` }, parent);
            if (i > 0) el('line', { x1: this.sx(k), x2: this.sx(k), y1: this.sy(L.data[i - 1][1]), y2: this.sy(F), class: 'series', style: `stroke:${c};stroke-width:1px;stroke-dasharray:2 3;opacity:.6` }, parent);
            if (L.dots !== false) el('circle', { cx: this.sx(k), cy: this.sy(F), r: 2.8, style: `fill:${c}` }, parent);
          }
          break;
        }
        case 'points':
          for (const [x, y] of L.pts) {
            if (!(y > 0) && !L.zeros) continue;
            if (L.stem) el('line', { x1: this.sx(x), x2: this.sx(x), y1: this.sy(0), y2: this.cy(y), style: `stroke:${c};stroke-width:1.2px` }, parent);
            el('circle', { cx: this.sx(x), cy: this.cy(y), r: L.r || 3.5, style: `fill:${L.hollow ? 'var(--panel)' : c};stroke:${c};stroke-width:1.6px` }, parent);
          }
          break;
        case 'vline':
          el('line', { x1: this.sx(L.x), x2: this.sx(L.x), y1: this.m.t, y2: this.H - this.m.b, style: `stroke:${c};stroke-width:${L.width || 1.4}px;stroke-dasharray:${L.dash || '5 4'}` }, parent);
          break;
        case 'hline':
          el('line', { x1: this.sx(L.x0 == null ? this.xmin : L.x0), x2: this.sx(L.x1 == null ? this.xmax : L.x1), y1: this.sy(L.y), y2: this.sy(L.y), style: `stroke:${c};stroke-width:${L.width || 1.4}px;stroke-dasharray:${L.dash || '5 4'}` }, parent);
          break;
        case 'bracket': { // vertical bracket between two y values at x
          const x = this.sx(L.x), y0 = this.sy(L.y0), y1 = this.sy(L.y1);
          el('path', { d: `M${x - 5},${y0}H${x}V${y1}H${x - 5}`, style: `fill:none;stroke:${c};stroke-width:2px` }, parent);
          break;
        }
      }
    }
    hover(x) {
      const spec = this.spec;
      if (!spec || !spec.hover) return;
      const h = spec.hover(x);
      const g = this.hoverG;
      while (g.firstChild) g.removeChild(g.firstChild);
      if (!h) { g.style.display = 'none'; return; }
      g.style.display = '';
      const px = this.sx(h.x);
      el('line', { x1: px, x2: px, y1: this.m.t, y2: this.H - this.m.b, class: 'crosshair' }, g);
      if (h.y != null && isFinite(h.y) && h.y <= this.ymax) el('circle', { cx: px, cy: this.sy(h.y), r: 4.5, class: 'hoverdot' }, g);
      const lines = h.lines;
      const lh = 16, padX = 8;
      const tw = Math.max(...lines.map(s => s.length)) * 6.9 + padX * 2;
      const th = lines.length * lh + 8;
      let bx = px + 12;
      if (bx + tw > this.W - this.m.r) bx = px - 12 - tw;
      const by = this.m.t + 4;
      el('rect', { x: bx, y: by, width: tw, height: th, rx: 6, class: 'tipbox' }, g);
      lines.forEach((s, i) => {
        const t = el('text', { x: bx + padX, y: by + 16 + i * lh, class: 'tiptext' }, g);
        t.textContent = s;
      });
    }
  }

  // Minimal thumbnail renderer (no axes)
  function thumb(container, d, p) {
    const W = 160, H = 70;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'thumb', preserveAspectRatio: 'none' }, container);
    const v = d.fit(p);
    const sx = x => 4 + (x - v.xmin) / (v.xmax - v.xmin) * (W - 8);
    const sy = y => H - 4 - Math.min(y, v.ymax) / v.ymax * (H - 10);
    if (d.discrete) {
      for (let k = Math.ceil(v.xmin); k <= v.xmax; k++) {
        const y = d.pmf(k, p); if (!(y > 0)) continue;
        const w = Math.max(1.5, (W - 8) / (v.xmax - v.xmin) * 0.65);
        el('rect', { x: sx(k) - w / 2, y: sy(y), width: w, height: H - 4 - sy(y), class: 'thumb-bar' }, svg);
      }
    } else {
      const pts = d.curve(p, v, 120);
      let path = `M${sx(pts[0][0])},${H - 4}`;
      for (const [x, y] of pts) path += `L${sx(x).toFixed(1)},${sy(isFinite(y) ? y : v.ymax).toFixed(1)}`;
      path += `L${sx(pts[pts.length - 1][0])},${H - 4}Z`;
      el('path', { d: path, class: 'thumb-area' }, svg);
    }
    return svg;
  }

  window.Plot = { Chart, thumb, el };
})();
