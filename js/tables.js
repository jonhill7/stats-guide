/* Critical-value tables (z, t, chi-square, F) with an interactive lookup. */
(function () {
  'use strict';
  const G = window.GUIDE, S = window.Stats, P = window.Plot;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const DISTS = {
    z: { name: 'Standard normal (z)', d: () => G.byId.normal, p: () => ({ mu: 0, sigma: 1 }), sym: true },
    t: { name: 'Student’s t', d: () => G.byId.t, p: s => ({ nu: s.df1 }), sym: true, df: ['Degrees of freedom'] },
    chisq: { name: 'Chi-square (χ²)', d: () => G.byId.chisq, p: s => ({ k: s.df1 }), df: ['Degrees of freedom'] },
    f: { name: 'F', d: () => G.byId.f, p: s => ({ d1: s.df1, d2: s.df2 }), df: ['Numerator df (d₁)', 'Denominator df (d₂)'] },
  };
  const q = (key, s, prob) => { const D = DISTS[key]; return D.d().quantile(prob, D.p(s)); };
  const cdf = (key, s, x) => { const D = DISTS[key]; return D.d().cdf(x, D.p(s)); };
  const pdf = (key, s, x) => { const D = DISTS[key]; return D.d().pdf(x, D.p(s)); };
  const f3 = x => (Math.abs(x) >= 100 ? x.toFixed(1) : x.toFixed(3)).replace(/^-/, '−');

  G.pages.tables = function (main) {
    const st = { dist: 't', df1: 10, df2: 20, tail: 'two', alpha: 0.05, stat: null };
    main.innerHTML = `<article class="prose-page wide"><h1>Critical-value tables</h1>
      <p class="lead">Look up the cutoffs used in hypothesis tests and confidence intervals, or turn a test statistic into a p-value. Click any table cell to see it on the plot.</p>
      <div class="card lookup no-gloss-controls">
        <h2>Lookup</h2>
        <div class="lookup-grid">
          <div class="lookup-controls">
            <label class="field">Distribution<select id="tbDist">${Object.entries(DISTS).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</select></label>
            <div class="row gap wrap" id="dfBox"></div>
            <label class="field">Rejection region<select id="tbTail">
              <option value="upper">Upper tail (right)</option><option value="lower">Lower tail (left)</option><option value="two">Two-sided (both tails)</option></select></label>
            <label class="field">Significance level α<input type="number" id="tbAlpha" min="0.0001" max="0.5" step="0.005" value="0.05"></label>
            <div class="row gap wrap">${[0.1, 0.05, 0.025, 0.01, 0.001].map(a => `<button class="btn" data-alpha="${a}">${a}</button>`).join('')}</div>
            <div class="tb-result" id="tbResult" aria-live="polite"></div>
            <label class="field">Have a test statistic? Enter it for the p-value<input type="number" id="tbStat" step="any" placeholder="e.g. 2.3"></label>
            <div class="tb-result" id="tbP"></div>
          </div>
          <div><div id="tbPlot"></div><div class="legend"><span><i style="background:var(--c2)"></i>Rejection region (area α)</span><span><i style="background:var(--c-sd)"></i>Your statistic</span></div></div>
        </div>
      </div>
      <div class="tabs" role="tablist">
        <button class="tab" data-tab="ztab" role="tab">z table (normal CDF)</button>
        <button class="tab" data-tab="ttab" role="tab">t table</button>
        <button class="tab" data-tab="ctab" role="tab">χ² table</button>
        <button class="tab" data-tab="ftab" role="tab">F table</button>
      </div>
      <div class="card table-scroll tabpanel" id="ztab"></div>
      <div class="card table-scroll tabpanel" id="ttab"></div>
      <div class="card table-scroll tabpanel" id="ctab"></div>
      <div class="card table-scroll tabpanel" id="ftab"></div>
      <div class="card prose"><h2>How to read these</h2>
        <ul><li><b>One-sided vs two-sided.</b> A two-sided test at α = 0.05 puts 0.025 in each tail, so its cutoff is the one-sided 0.025 value (1.96 for z).</li>
        <li><b>Confidence intervals.</b> A 95% interval uses the two-sided 0.05 critical value: x̄ ± t* · s/√n.</li>
        <li><b>Degrees of freedom.</b> One-sample t: n − 1. Chi-square goodness of fit: categories − 1. Two-way table: (rows − 1)(columns − 1). One-way ANOVA F: (groups − 1, N − groups).</li>
        <li class="adv"><b>Exactness.</b> Values are computed on the fly from the regularized incomplete gamma and beta functions, so the lookup works for any α and any degrees of freedom, not only the rows printed here.</li></ul></div>
    </article>`;

    const chart = new P.Chart($('#tbPlot'), { height: 300 });

    function dfInputs() {
      const D = DISTS[st.dist];
      $('#dfBox').innerHTML = (D.df || []).map((lab, i) => `<label class="field">${lab}<input type="number" min="1" step="1" value="${i ? st.df2 : st.df1}" data-df="${i}"></label>`).join('');
      $$('[data-df]').forEach(inp => inp.addEventListener('input', () => {
        const v = Math.max(1, Math.round(+inp.value || 1)); if (+inp.dataset.df) st.df2 = v; else st.df1 = v; draw();
      }));
      // chi-square and F are not symmetric; two-sided still allowed (α/2 in each tail)
    }
    function crit() {
      const a = st.alpha;
      if (st.tail === 'upper') return [null, q(st.dist, st, 1 - a)];
      if (st.tail === 'lower') return [q(st.dist, st, a), null];
      return [q(st.dist, st, a / 2), q(st.dist, st, 1 - a / 2)];
    }
    function range() {
      if (st.dist === 'z') return [-4, 4];
      if (st.dist === 't') { const w = st.df1 < 3 ? 8 : 5; return [-w, w]; }
      if (st.dist === 'chisq') return [0, Math.max(q('chisq', st, 0.999), 5)];
      return [0, Math.max(q('f', st, 0.995), 3)];
    }
    function draw() {
      const [lo, hi] = crit();
      const [xmin, xmax] = range();
      const pts = []; let ymax = 0;
      for (let i = 0; i <= 400; i++) { const x = xmin + (xmax - xmin) * i / 400, y = pdf(st.dist, st, x); pts.push([x, y]); if (isFinite(y)) ymax = Math.max(ymax, y); }
      ymax = Math.min(ymax, 1.5);
      const layers = [];
      if (lo != null) layers.push({ kind: 'area', pts: pts.filter(p => p[0] <= lo).concat([[lo, pdf(st.dist, st, lo)]]), color: 'var(--c2)', opacity: 0.55 });
      if (hi != null) layers.push({ kind: 'area', pts: [[hi, pdf(st.dist, st, hi)]].concat(pts.filter(p => p[0] >= hi)), color: 'var(--c2)', opacity: 0.55 });
      layers.push({ kind: 'line', pts, color: 'var(--c1)', width: 2.4 });
      if (lo != null) layers.push({ kind: 'vline', x: lo, color: 'var(--c2)', label: f3(lo) });
      if (hi != null) layers.push({ kind: 'vline', x: hi, color: 'var(--c2)', label: f3(hi) });
      if (st.stat != null) layers.push({ kind: 'vline', x: st.stat, color: 'var(--c-sd)', dash: '0', width: 2.5 });
      chart.render({ xmin, xmax, ymin: 0, ymax: ymax * 1.12, layers, xlabel: st.dist === 'z' ? 'z' : st.dist === 't' ? 't' : st.dist === 'chisq' ? 'χ²' : 'F',
        hover: x => ({ x, y: pdf(st.dist, st, x), lines: [`x = ${S.fmt(x, 3)}`, `P(X ≤ x) = ${cdf(st.dist, st, x).toFixed(4)}`, `P(X ≥ x) = ${(1 - cdf(st.dist, st, x)).toFixed(4)}`] }),
        onClick: x => { st.stat = +x.toFixed(2); $('#tbStat').value = st.stat; draw(); } });
      const name = { z: 'z', t: `t(${st.df1})`, chisq: `χ²(${st.df1})`, f: `F(${st.df1}, ${st.df2})` }[st.dist];
      let txt;
      if (st.tail === 'upper') txt = `Reject if ${name} ≥ <b>${f3(hi)}</b>`;
      else if (st.tail === 'lower') txt = `Reject if ${name} ≤ <b>${f3(lo)}</b>`;
      else txt = `Reject if ${name} ≤ <b>${f3(lo)}</b> or ≥ <b>${f3(hi)}</b>` + (DISTS[st.dist].sym ? ` &nbsp;(i.e. |stat| ≥ ${f3(hi)}; ${Math.round((1 - st.alpha) * 1000) / 10}% CI uses ±${f3(hi)})` : '');
      $('#tbResult').innerHTML = txt + `<div class="small muted">Each shaded tail has area ${st.tail === 'two' ? st.alpha / 2 : st.alpha}.</div>`;
      if (st.stat != null) {
        const F = cdf(st.dist, st, st.stat);
        let pv = st.tail === 'upper' ? 1 - F : st.tail === 'lower' ? F : 2 * Math.min(F, 1 - F);
        pv = Math.min(1, pv);
        $('#tbP').innerHTML = `${st.tail === 'two' ? 'Two-sided' : st.tail === 'upper' ? 'Upper-tail' : 'Lower-tail'} p-value = <b>${pv < 1e-4 ? pv.toExponential(2) : pv.toFixed(4)}</b> ${pv <= st.alpha ? `<span class="pill bad">reject at α = ${st.alpha}</span>` : `<span class="pill ok">do not reject at α = ${st.alpha}</span>`}`;
      } else $('#tbP').innerHTML = '<span class="small muted">Tip: click the plot to drop a statistic there.</span>';
    }

    function set(o) {
      Object.assign(st, o);
      $('#tbDist').value = st.dist; $('#tbTail').value = st.tail; $('#tbAlpha').value = st.alpha; $('#tbStat').value = st.stat == null ? '' : st.stat;
      dfInputs(); draw();
      $('.lookup').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    $('#tbDist').addEventListener('change', e => { st.dist = e.target.value; dfInputs(); draw(); });
    $('#tbTail').addEventListener('change', e => { st.tail = e.target.value; draw(); });
    $('#tbAlpha').addEventListener('input', e => { const a = +e.target.value; if (a > 0 && a < 1) { st.alpha = a; draw(); } });
    $('#tbStat').addEventListener('input', e => { const v = parseFloat(e.target.value); st.stat = Number.isNaN(v) ? null : v; draw(); });
    $$('[data-alpha]').forEach(b => b.addEventListener('click', () => { st.alpha = +b.dataset.alpha; $('#tbAlpha').value = st.alpha; draw(); }));

    // ---------------- tables
    const ztab = $('#ztab');
    {
      const cols = Array.from({ length: 10 }, (_, i) => i / 100);
      const rows = []; for (let r = -34; r <= 34; r++) rows.push(r);
      let h = '<h2>Standard normal table</h2><p class="small muted">Each cell is Φ(z) = P(Z ≤ z), the area to the left of z. Row gives z to one decimal; column adds the second decimal (for negative rows, it subtracts).</p><table class="ctable"><tr><th>z</th>' + cols.map(c => `<th>${c.toFixed(2)}</th>`).join('') + '</tr>';
      for (const r of rows) {
        const neg = r < 0 || (r === 0 && false);
        const label = (r / 10).toFixed(1);
        h += `<tr><th>${r === 0 ? '0.0' : label.replace('-', '−')}</th>` + cols.map(c => { const z = +(neg ? r / 10 - c : r / 10 + c).toFixed(2); return `<td data-z="${z}">${S.normCdf(z).toFixed(4)}</td>`; }).join('') + '</tr>';
        if (r === -1) h += `<tr><th>−0.0</th>` + cols.map(c => { const z = +(-c).toFixed(2); return `<td data-z="${z}">${S.normCdf(z).toFixed(4)}</td>`; }).join('') + '</tr>';
      }
      ztab.innerHTML = h + '</table>';
      ztab.addEventListener('click', e => { const td = e.target.closest('td[data-z]'); if (td) set({ dist: 'z', tail: 'lower', stat: +td.dataset.z }); });
    }
    const ttab = $('#ttab');
    {
      const a1 = [0.10, 0.05, 0.025, 0.01, 0.005, 0.001, 0.0005];
      const dfs = [...Array.from({ length: 30 }, (_, i) => i + 1), 40, 50, 60, 80, 100, 120, Infinity];
      let h = '<h2>t table</h2><p class="small muted">Cells are t* with the given area to the right. Use the two-tailed row for two-sided tests and the confidence row for intervals.</p><table class="ctable"><tr><th>One-tail α</th>' + a1.map(a => `<th>${a}</th>`).join('') + '</tr>' +
        '<tr><th>Two-tail α</th>' + a1.map(a => `<th>${+(2 * a).toFixed(4)}</th>`).join('') + '</tr>' +
        '<tr><th>Confidence</th>' + a1.map(a => `<th>${+((1 - 2 * a) * 100).toFixed(1)}%</th>`).join('') + '</tr>';
      for (const df of dfs) {
        h += `<tr><th>df = ${df === Infinity ? '∞ (z)' : df}</th>` + a1.map(a => {
          const v = df === Infinity ? q('z', {}, 1 - a) : q('t', { df1: df }, 1 - a);
          return `<td data-df="${df}" data-a="${a}">${v.toFixed(3)}</td>`;
        }).join('') + '</tr>';
      }
      ttab.innerHTML = h + '</table>';
      ttab.addEventListener('click', e => { const td = e.target.closest('td[data-a]'); if (!td) return; const df = +td.dataset.df; set(df === Infinity ? { dist: 'z', tail: 'upper', alpha: +td.dataset.a, stat: null } : { dist: 't', df1: df, tail: 'upper', alpha: +td.dataset.a, stat: null }); });
    }
    const ctab = $('#ctab');
    {
      const areas = [0.995, 0.99, 0.975, 0.95, 0.90, 0.10, 0.05, 0.025, 0.01, 0.005];
      const dfs = [...Array.from({ length: 30 }, (_, i) => i + 1), 40, 50, 60, 70, 80, 90, 100];
      let h = '<h2>Chi-square table</h2><p class="small muted">Cells are χ² values with the given area to the right. Tests usually use the right tail (0.10 to 0.005 columns).</p><table class="ctable"><tr><th>Area to the right</th>' + areas.map(a => `<th>${a}</th>`).join('') + '</tr>';
      for (const df of dfs) h += `<tr><th>df = ${df}</th>` + areas.map(a => `<td data-df="${df}" data-a="${a}">${f3(q('chisq', { df1: df }, 1 - a))}</td>`).join('') + '</tr>';
      ctab.innerHTML = h + '</table>';
      ctab.addEventListener('click', e => { const td = e.target.closest('td[data-a]'); if (!td) return; const a = +td.dataset.a; set(a <= 0.5 ? { dist: 'chisq', df1: +td.dataset.df, tail: 'upper', alpha: a, stat: null } : { dist: 'chisq', df1: +td.dataset.df, tail: 'lower', alpha: +(1 - a).toFixed(4), stat: null }); });
    }
    const ftab = $('#ftab');
    function fTable(alpha) {
      const d1s = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 24, 30, 40, 60, 120];
      const d2s = [...Array.from({ length: 30 }, (_, i) => i + 1), 40, 60, 120];
      let h = `<h2>F table</h2><div class="row gap wrap">${[0.10, 0.05, 0.025, 0.01].map(a => `<button class="btn ${a === alpha ? 'primary' : ''}" data-fa="${a}">α = ${a}</button>`).join('')}</div>
        <p class="small muted">Cells are the upper-tail critical value F* with area α to the right. Columns: numerator df d₁. Rows: denominator df d₂.</p><table class="ctable"><tr><th>d₂ \\ d₁</th>` + d1s.map(d => `<th>${d}</th>`).join('') + '</tr>';
      for (const d2 of d2s) h += `<tr><th>${d2}</th>` + d1s.map(d1 => `<td data-d1="${d1}" data-d2="${d2}">${f3(q('f', { df1: d1, df2: d2 }, 1 - alpha))}</td>`).join('') + '</tr>';
      ftab.innerHTML = h + '</table>';
      $$('[data-fa]', ftab).forEach(b => b.addEventListener('click', () => fTable(+b.dataset.fa)));
      ftab.onclick = e => { const td = e.target.closest('td[data-d1]'); if (td) set({ dist: 'f', df1: +td.dataset.d1, df2: +td.dataset.d2, tail: 'upper', alpha, stat: null }); };
    }
    let fBuilt = false;

    function showTab(id) {
      $$('.tab', main).forEach(b => b.setAttribute('aria-selected', b.dataset.tab === id));
      $$('.tabpanel', main).forEach(p => { p.hidden = p.id !== id; });
      if (id === 'ftab' && !fBuilt) { fBuilt = true; fTable(0.05); }
    }
    $$('.tab', main).forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
    showTab('ttab');
    $('#tbDist').value = st.dist; $('#tbTail').value = st.tail; dfInputs(); draw();
  };
})();
