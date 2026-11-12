/* Numerical helpers: special functions, quantiles, random samplers, formatting. */
(function () {
  'use strict';
  const S = {};

  // ---- Gamma family (Lanczos approximation, g = 7) ----
  const LZ = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];

  S.lgamma = function (x) {
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - S.lgamma(1 - x);
    x -= 1;
    let a = LZ[0];
    const t = x + 7.5;
    for (let i = 1; i < 9; i++) a += LZ[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  };
  S.gamma = function (x) {
    if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * S.gamma(1 - x));
    return Math.exp(S.lgamma(x));
  };
  S.lbeta = (a, b) => S.lgamma(a) + S.lgamma(b) - S.lgamma(a + b);
  S.lchoose = (n, k) => S.lgamma(n + 1) - S.lgamma(k + 1) - S.lgamma(n - k + 1);

  const EPS = 1e-15, FPMIN = 1e-300;

  // Regularized lower incomplete gamma P(a, x)
  S.gammp = function (a, x) {
    if (x <= 0) return 0;
    if (!isFinite(x)) return 1;
    const lg = -x + a * Math.log(x) - S.lgamma(a);
    if (x < a + 1) {
      let ap = a, sum = 1 / a, del = sum;
      for (let n = 0; n < 2000; n++) {
        ap += 1; del *= x / ap; sum += del;
        if (Math.abs(del) < Math.abs(sum) * EPS) break;
      }
      return Math.min(1, sum * Math.exp(lg));
    }
    return Math.max(0, 1 - gcf(a, x, lg));
  };
  function gcf(a, x, lg) {
    let b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
    for (let i = 1; i < 2000; i++) {
      const an = -i * (i - a);
      b += 2; d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; const del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return Math.exp(lg) * h;
  }
  // Regularized upper incomplete gamma Q(a, x), accurate in the tail
  S.gammq = function (a, x) {
    if (x <= 0) return 1;
    if (!isFinite(x)) return 0;
    if (x < a + 1) return 1 - S.gammp(a, x);
    return gcf(a, x, -x + a * Math.log(x) - S.lgamma(a));
  };

  function betacf(a, b, x) {
    const qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; let h = d;
    for (let m = 1; m < 2000; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; const del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  // Regularized incomplete beta I_x(a, b)
  S.betai = function (a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(-S.lbeta(a, b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  };

  S.normCdf = z => z < 0 ? 0.5 * S.gammq(0.5, z * z / 2) : 1 - 0.5 * S.gammq(0.5, z * z / 2);
  S.normPdf = z => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);

  // ---- Quantiles ----
  S.quantileCont = function (cdf, q, lo, hi) {
    if (q <= 0) return lo;
    if (q >= 1) return hi;
    let a, b;
    if (isFinite(lo)) a = lo;
    else { a = -1; let n = 0; while (cdf(a) > q && n++ < 80) a *= 2; }
    if (isFinite(hi)) b = hi;
    else { let s = Math.max(1, Math.abs(a)); b = a + s; let n = 0; while (cdf(b) < q && n++ < 80) { s *= 2; b = a + s; } }
    for (let i = 0; i < 200; i++) {
      const m = (a + b) / 2;
      if (cdf(m) < q) a = m; else b = m;
      if (b - a < 1e-11 * Math.max(1, Math.abs(m))) break;
    }
    return (a + b) / 2;
  };

  // Moments of a discrete distribution computed by direct summation
  S.discreteMoments = function (pmf, lo, hi) {
    let m1 = 0, tot = 0;
    for (let k = lo; k <= hi; k++) { const w = pmf(k); tot += w; m1 += k * w; }
    const mean = m1 / tot;
    let c2 = 0, c3 = 0, c4 = 0;
    for (let k = lo; k <= hi; k++) {
      const w = pmf(k) / tot, d = k - mean;
      c2 += w * d * d; c3 += w * d * d * d; c4 += w * d * d * d * d;
    }
    return { mean, variance: c2, skewness: c2 > 0 ? c3 / Math.pow(c2, 1.5) : NaN, kurtosis: c2 > 0 ? c4 / (c2 * c2) - 3 : NaN };
  };

  // Skewness and excess kurtosis from raw moments m1..m4
  S.fromRaw = function (m1, m2, m3, m4) {
    const v = m2 - m1 * m1;
    const c3 = m3 - 3 * m1 * m2 + 2 * m1 * m1 * m1;
    const c4 = m4 - 4 * m1 * m3 + 6 * m1 * m1 * m2 - 3 * m1 * m1 * m1 * m1;
    return { variance: v, skewness: c3 / Math.pow(v, 1.5), kurtosis: c4 / (v * v) - 3 };
  };

  // ---- Random samplers ----
  const U = () => { let u = 0; while (u === 0) u = Math.random(); return u; }; // (0,1)
  S.runif = U;
  S.rnorm = () => Math.sqrt(-2 * Math.log(U())) * Math.cos(2 * Math.PI * Math.random());
  S.rexp = rate => -Math.log(U()) / rate;
  S.rgamma = function (a, rate) {
    if (a < 1) return S.rgamma(1 + a, rate) * Math.pow(U(), 1 / a);
    const d = a - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x, v;
      do { x = S.rnorm(); v = 1 + c * x; } while (v <= 0);
      v = v * v * v;
      const u = U();
      if (u < 1 - 0.0331 * x * x * x * x) return d * v / rate;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v / rate;
    }
  };
  S.rbeta = (a, b) => { const x = S.rgamma(a, 1), y = S.rgamma(b, 1); return x / (x + y); };
  S.rchisq = k => S.rgamma(k / 2, 0.5);
  S.rpois = function (l) {
    let n = 0;
    while (l > 30) { n += S.rpois(30); l -= 30; }
    const L = Math.exp(-l); let k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return n + k - 1;
  };
  S.rbinom = (n, p) => { let k = 0; for (let i = 0; i < n; i++) if (Math.random() < p) k++; return k; };
  S.rgeom = p => p >= 1 ? 1 : Math.max(1, Math.ceil(Math.log(U()) / Math.log(1 - p)));

  // ---- Formatting ----
  S.fmt = function (x, digits) {
    digits = digits || 4;
    if (x === undefined || x === null) return '—';
    if (typeof x === 'string') return x;
    if (Number.isNaN(x)) return 'undefined';
    if (x === Infinity) return '∞';
    if (x === -Infinity) return '−∞';
    if (x === 0 || Math.abs(x) < 1e-10) return '0';
    const ax = Math.abs(x);
    let s;
    if (ax >= 1e6 || ax < 1e-4) s = x.toExponential(digits - 2).replace(/e\+?/, '×10^');
    else s = String(Number(x.toPrecision(digits)));
    return s.replace(/^-/, '−');
  };
  S.fmtP = function (p) {
    if (p > 0 && p < 1e-4) return p.toExponential(2).replace(/e\+?/, '×10^');
    if (p < 1 && p > 1 - 1e-4) return '1 − ' + (1 - p).toExponential(2).replace(/e\+?/, '×10^');
    return p.toFixed(4);
  };

  window.Stats = S;
  window.GUIDE = { dists: [], relations: [] };
  window.R = String.raw;
})();
