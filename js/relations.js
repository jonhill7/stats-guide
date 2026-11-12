/* Relationships between distributions (used by the map and each distribution page). */
(function () {
  'use strict';
  const G = window.GUIDE;

  G.relKinds = {
    special: { label: 'Special case', color: 'var(--k-special)' },
    sum: { label: 'Sum of independent copies', color: 'var(--k-sum)' },
    transform: { label: 'Transformation / construction', color: 'var(--k-transform)' },
    limit: { label: 'Limit / approximation', color: 'var(--k-limit)' },
    bayes: { label: 'Bayesian conjugacy / mixture', color: 'var(--k-bayes)' },
    analog: { label: 'Discrete ↔ continuous analog', color: 'var(--k-analog)' },
  };

  // Hand-placed node positions on a 1120 × 780 canvas
  G.mapNodes = {
    discreteuniform: [100, 70], bernoulli: [330, 110], uniform: [840, 70],
    hypergeometric: [100, 250], binomial: [330, 250], geometric: [590, 130], beta: [1030, 190],
    negbinomial: [590, 290], poisson: [470, 400], exponential: [840, 330], weibull: [1030, 330], pareto: [1030, 450],
    normal: [300, 540], gamma: [840, 470], laplace: [1030, 580],
    lognormal: [90, 540], chisq: [600, 600],
    cauchy: [90, 720], t: [330, 720], f: [700, 720],
  };

  const r = (from, to, kind, short, text, curve) => G.relations.push({ from, to, kind, short, text, curve: curve || 0 });

  r('bernoulli', 'binomial', 'sum', 'sum of n trials', R`The sum of \(n\) independent Bernoulli\((p)\) variables is Binomial\((n,p)\). Binomial\((1,p)\) = Bernoulli\((p)\).`);
  r('bernoulli', 'geometric', 'transform', 'trials until 1st success', R`Counting independent Bernoulli\((p)\) trials until the first success gives Geometric\((p)\).`);
  r('hypergeometric', 'binomial', 'limit', 'N → ∞', R`As the population \(N\to\infty\) with \(K/N = p\) fixed, sampling without replacement behaves like sampling with replacement: Hypergeometric\((N,K,n)\to\) Binomial\((n,p)\). Fine when \(n \le 0.05N\).`);
  r('binomial', 'poisson', 'limit', 'n → ∞, np = λ', R`Law of rare events: as \(n\to\infty\), \(p\to0\) with \(np=\lambda\) fixed, Binomial\((n,p)\to\) Poisson\((\lambda)\).`);
  r('binomial', 'normal', 'limit', 'CLT', R`De Moivre–Laplace: Binomial\((n,p)\approx N\big(np,\ np(1-p)\big)\) when \(np(1-p)\gtrsim 10\).`);
  r('poisson', 'normal', 'limit', 'λ → ∞', R`For large \(\lambda\), Poisson\((\lambda)\approx N(\lambda, \lambda)\).`);
  r('geometric', 'negbinomial', 'sum', 'sum of r', R`The sum of \(r\) independent Geometric\((p)\) variables is NB\((r,p)\). NB\((1,p)\) = Geometric\((p)\).`);
  r('geometric', 'exponential', 'analog', 'continuous analog', R`Both are memoryless. If \(T\sim\) Exp\((\lambda)\) then \(\lceil T\rceil \sim\) Geometric\((1-e^{-\lambda})\); conversely a geometric count of tiny time steps converges to an exponential time.`);
  r('poisson', 'exponential', 'transform', 'gaps between events', R`In a Poisson process with rate \(\lambda\), counts in time \(t\) are Poisson\((\lambda t)\) and the waiting times between events are iid Exp\((\lambda)\).`);
  r('exponential', 'gamma', 'sum', 'sum of α', R`The sum of \(\alpha\) independent Exp\((\lambda)\) variables is Gamma\((\alpha,\lambda)\). Gamma\((1,\lambda)\) = Exp\((\lambda)\).`);
  r('gamma', 'chisq', 'special', 'α = k/2, β = 1/2', R`\(\chi^2_k\) = Gamma\((k/2,\ \text{rate } 1/2)\).`);
  r('exponential', 'chisq', 'special', 'χ²₂ = Exp(½)', R`\(\chi^2_2\) = Exp\((1/2)\), an exponential with mean 2.`);
  r('normal', 'chisq', 'transform', 'sum of squares', R`If \(Z_1,\dots,Z_k \overset{iid}{\sim} N(0,1)\), then \(\sum Z_i^2 \sim \chi^2_k\).`);
  r('normal', 't', 'transform', 'Z / √(V/ν)', R`\(T = Z/\sqrt{V/\nu}\) with independent \(Z\sim N(0,1)\), \(V\sim\chi^2_\nu\) has a \(t_\nu\) distribution.`, 28);
  r('chisq', 't', 'transform', 'denominator', R`The chi-square provides the denominator in \(T = Z/\sqrt{V/\nu}\), \(V \sim \chi^2_\nu\).`);
  r('t', 'normal', 'limit', 'ν → ∞', R`As \(\nu\to\infty\), \(t_\nu \to N(0,1)\). By \(\nu\approx30\) they are hard to tell apart.`, 28);
  r('t', 'cauchy', 'special', 'ν = 1', R`\(t_1\) = Cauchy\((0,1)\).`);
  r('chisq', 'f', 'transform', 'ratio', R`\(F = \dfrac{U_1/d_1}{U_2/d_2}\) with independent \(U_i\sim\chi^2_{d_i}\) has an \(F(d_1,d_2)\) distribution.`);
  r('t', 'f', 'transform', 'T²', R`If \(T\sim t_\nu\), then \(T^2 \sim F(1,\nu)\).`);
  r('normal', 'lognormal', 'transform', 'exp(·)', R`If \(Y\sim N(\mu,\sigma^2)\), then \(e^Y \sim\) LogNormal\((\mu,\sigma^2)\). Equivalently, \(\ln X\) is normal.`);
  r('normal', 'cauchy', 'transform', 'Z₁ / Z₂', R`The ratio of two independent standard normals is Cauchy\((0,1)\).`);
  r('exponential', 'weibull', 'transform', 'λE^{1/k}', R`If \(E\sim\) Exp\((1)\), then \(\lambda E^{1/k}\sim\) Weibull\((k,\lambda)\). Weibull\((1,\lambda)\) = Exp\((1/\lambda)\).`);
  r('exponential', 'laplace', 'transform', 'difference', R`The difference of two independent Exp\((1/b)\) variables is Laplace\((0,b)\).`);
  r('exponential', 'pareto', 'transform', 'x_m·e^E', R`If \(E\sim\) Exp\((\alpha)\), then \(x_m e^{E}\sim\) Pareto\((x_m,\alpha)\); equivalently \(\ln(X/x_m)\sim\) Exp\((\alpha)\).`);
  r('uniform', 'exponential', 'transform', '−ln(U)/λ', R`Inverse-transform sampling: if \(U\sim\mathcal U(0,1)\), then \(-\ln(U)/\lambda \sim\) Exp\((\lambda)\). (Any distribution can be made from a uniform via \(F^{-1}(U)\).)`);
  r('uniform', 'beta', 'special', 'Beta(1,1)', R`Beta\((1,1)\) = \(\mathcal U(0,1)\). The \(k\)-th smallest of \(n\) iid uniforms is Beta\((k, n-k+1)\).`);
  r('gamma', 'beta', 'transform', 'X/(X+Y)', R`If \(X\sim\) Gamma\((\alpha,\theta)\) and \(Y\sim\) Gamma\((\beta,\theta)\) are independent, \(X/(X+Y)\sim\) Beta\((\alpha,\beta)\).`);
  r('beta', 'binomial', 'bayes', 'conjugate prior', R`A Beta\((\alpha,\beta)\) prior on \(p\), updated with \(k\) successes in \(n\) binomial trials, gives the posterior Beta\((\alpha+k,\ \beta+n-k)\).`);
  r('gamma', 'poisson', 'bayes', 'conjugate prior', R`A Gamma\((\alpha,\beta)\) prior on a Poisson rate, updated with counts \(x_1..x_n\), gives the posterior Gamma\((\alpha+\sum x_i,\ \beta+n)\).`);
  r('gamma', 'negbinomial', 'bayes', 'Poisson–Gamma mixture', R`A Poisson count whose rate is itself Gamma-distributed is negative binomial. That is how the NB models overdispersed counts.`);
  r('discreteuniform', 'uniform', 'analog', 'continuous analog', R`The continuous uniform is the continuous analog of the discrete uniform. If \(K\sim\mathcal U\{1..m\}\) then \(K/m\) approaches \(\mathcal U(0,1)\) as \(m\to\infty\).`, -40);
})();
