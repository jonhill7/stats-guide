/* Level-specific content.
   High School: a worked example per distribution that loads into the plot.
   Grad School: estimation, information, conjugacy and software names. */
(function () {
  'use strict';
  const G = window.GUIDE;
  const X = {};

  // ---------------------------------------------------------------- High-school worked examples
  // set: parameter values; calc: probability-calculator settings applied by "Try it"
  X.bernoulli = { ex: {
    q: 'A basketball player makes 70% of her free throws. What is the chance she misses her next one?',
    set: { p: 0.7 }, calc: { mode: 'left', b: 0 },
    steps: ['Call a make a "success" (X = 1), so p = 0.7.', 'A miss is X = 0.', 'P(X = 0) = 1 − p = 1 − 0.7.'],
    ans: '0.30, a 30% chance of a miss.' } };
  X.binomial = { ex: {
    q: 'The same player (70%) shoots 10 free throws. What is the chance she makes at least 8?',
    set: { n: 10, p: 0.7 }, calc: { mode: 'right', a: 8 },
    steps: ['Check BINS: 2 outcomes, independent shots, 10 shots fixed, same 0.7 each time. So X ~ Bin(10, 0.7).',
      '"At least 8" means 8, 9 or 10, so add those three bars.',
      R`P(8) = \(\binom{10}{8}(0.7)^8(0.3)^2\) ≈ 0.2335, P(9) ≈ 0.1211, P(10) ≈ 0.0282.`],
    ans: '≈ 0.383, about a 38% chance.' } };
  X.geometric = { ex: {
    q: 'A salesperson closes 20% of calls. What is the chance the first sale comes on call 3 or sooner?',
    set: { p: 0.2 }, calc: { mode: 'left', b: 3 },
    steps: ['X = the number of calls until the first sale, with p = 0.2.',
      'Easier to flip it around: the first sale is later than call 3 only if the first 3 calls all fail, which has probability 0.8³ = 0.512.',
      'So P(X ≤ 3) = 1 − 0.512.'],
    ans: '0.488, just under a coin flip.' } };
  X.negbinomial = { ex: {
    q: 'The same salesperson (20%) needs 3 sales today. On average, how many calls will that take? What is the chance she is done within 10 calls?',
    set: { r: 3, p: 0.2 }, calc: { mode: 'left', b: 10 },
    steps: ['Average = r / p = 3 / 0.2 = 15 calls.',
      'Done within 10 calls means at least 3 sales among the first 10 calls.',
      'That is a binomial question: P(Bin(10, 0.2) ≥ 3) = 1 − [P(0) + P(1) + P(2)] = 1 − (0.107 + 0.268 + 0.302).'],
    ans: 'Mean 15 calls; P(X ≤ 10) ≈ 0.322.' } };
  X.poisson = { ex: {
    q: 'A help desk gets 4 calls an hour on average. What is the chance of 7 or more calls in the next hour?',
    set: { lambda: 4 }, calc: { mode: 'right', a: 7 },
    steps: ['Calls arrive independently at a steady rate, so X ~ Poisson(4).',
      R`For instance, the chance of a completely quiet hour is \(P(0) = e^{-4} \approx 0.018\).`,
      '"7 or more" = 1 − P(X ≤ 6) = 1 − 0.889.'],
    ans: '≈ 0.111, about 1 hour in 9.' } };
  X.hypergeometric = { ex: {
    q: 'You are dealt 5 cards from a shuffled deck. What is the chance you get at least 2 hearts?',
    set: { N: 52, K: 13, n: 5 }, calc: { mode: 'right', a: 2 },
    steps: ['52 cards, 13 hearts, 5 drawn without putting any back.',
      R`P(0 hearts) = \(\binom{13}{0}\binom{39}{5} / \binom{52}{5}\) ≈ 0.222 and P(1 heart) ≈ 0.411.`,
      'At least 2 = 1 − 0.222 − 0.411.'],
    ans: '≈ 0.367.' } };
  X.discreteuniform = { ex: {
    q: 'You roll a fair die. What is the chance of a 5 or a 6?',
    set: { a: 1, b: 6 }, calc: { mode: 'right', a: 5 },
    steps: ['6 equally likely faces, each with probability 1/6.', 'Two of them (5 and 6) count.'],
    ans: '2/6 = 1/3 ≈ 0.333.' } };
  X.uniform = { ex: {
    q: 'A bus comes every 10 minutes and you show up at a random time. What is the chance you wait more than 7 minutes?',
    set: { a: 0, b: 10 }, calc: { mode: 'right', a: 7 },
    steps: ['Your wait is equally likely to be anything from 0 to 10, so X ~ U(0, 10).',
      'Probability = length of the interval you care about ÷ total length.', 'From 7 to 10 is 3 minutes out of 10.'],
    ans: '0.30.' } };
  X.normal = { ex: {
    q: 'Women’s heights have mean 64 in and SD 2.5 in. What fraction are taller than 68 in?',
    set: { mu: 0, sigma: 1 }, calc: { mode: 'right', a: 1.6 },
    steps: ['Convert to a z-score: z = (68 − 64) / 2.5 = 1.6. A height of 68 in is 1.6 SDs above the mean.',
      'Every normal turns into the standard normal N(0, 1) this way, so we look up P(Z > 1.6).',
      'The plot is set to N(0, 1) with the area right of 1.6 shaded.'],
    ans: '≈ 0.055, about 5.5% of women.' } };
  X.exponential = { ex: {
    q: 'Customers arrive at 2 per minute on average. What is the chance you wait more than 1 minute for the next one?',
    set: { lambda: 2 }, calc: { mode: 'right', a: 1 },
    steps: ['The wait is Exp(λ = 2), with an average wait of 1/2 minute.', R`\(P(X > x) = e^{-\lambda x}\) for an exponential.`, R`\(e^{-2 \times 1} = e^{-2}\).`],
    ans: '≈ 0.135.' } };
  X.gamma = { ex: {
    q: 'Customers still arrive at 2 per minute. What is the chance the 3rd customer arrives within 1 minute?',
    set: { alpha: 3, beta: 2 }, calc: { mode: 'left', b: 1 },
    steps: ['Waiting for 3 arrivals at rate 2 gives X ~ Gamma(3, 2).',
      'Trick: "3rd arrival within 1 minute" means "at least 3 arrivals in that minute", and the count in a minute is Poisson(2).',
      'P(Poisson(2) ≥ 3) = 1 − (0.135 + 0.271 + 0.271).'],
    ans: '≈ 0.323.' } };
  X.beta = { ex: {
    q: 'A new player makes 7 of her first 10 shots. Starting from "no idea" (a flat belief), how sure can we be that her true shooting % is over 50%?',
    set: { alpha: 8, beta: 4 }, calc: { mode: 'right', a: 0.5 },
    steps: ['A flat starting belief is Beta(1, 1). Add the 7 makes to α and the 3 misses to β, giving Beta(8, 4).',
      'Its mean is 8 / 12 ≈ 0.67, a bit more cautious than 7/10.', 'Shade the area to the right of 0.5.'],
    ans: '≈ 0.887, about 89% sure she is better than 50%.' } };
  X.chisq = { ex: {
    q: 'You roll a die 60 times to test if it is fair, and your chi-square statistic is 12.0. Is that surprising for a fair die?',
    set: { k: 5 }, calc: { mode: 'right', a: 12 },
    steps: ['6 faces gives 6 − 1 = 5 degrees of freedom.', 'If the die is fair, the statistic follows χ² with 5 df, which averages 5.',
      'The p-value is the chance of 12 or more: the right-tail area.'],
    ans: '≈ 0.035. Under 5%, so there is fairly strong evidence the die is not fair.' } };
  X.t = { ex: {
    q: 'A sample of 10 gives t = 2.3 when testing whether the mean is 0. What is the two-sided p-value?',
    set: { nu: 9 }, calc: { mode: 'right', a: 2.3 },
    steps: ['n = 10, so df = n − 1 = 9.', 'The area to the right of 2.3 is about 0.0235.', 'Two-sided means counting both tails: 2 × 0.0235.'],
    ans: '≈ 0.047, just under 0.05.' } };
  X.f = { ex: {
    q: 'An ANOVA compares 4 groups with 24 people in total and gets F = 3.1. What is the p-value?',
    set: { d1: 3, d2: 20 }, calc: { mode: 'right', a: 3.1 },
    steps: ['Numerator df = groups − 1 = 3. Denominator df = people − groups = 20.', 'Under "no difference between groups", F follows F(3, 20).', 'The p-value is the right-tail area beyond 3.1.'],
    ans: '≈ 0.05, right at the usual cutoff.' } };
  X.lognormal = { ex: {
    q: 'Suppose incomes (in $10,000s) are log-normal with μ = 1.6 and σ = 0.5. What fraction earn more than $100,000?',
    set: { mu: 1.6, sigma: 0.5 }, calc: { mode: 'right', a: 10 },
    steps: [R`The median income is \(e^{1.6} \approx 4.95\), or about $49,500.`, '$100,000 is X = 10. Take logs: ln 10 ≈ 2.303.',
      'z = (2.303 − 1.6) / 0.5 ≈ 1.41, so P(Z > 1.41).'],
    ans: '≈ 0.080, about 8%.' } };
  X.weibull = { ex: {
    q: 'Bearings wear out with Weibull shape k = 2 and scale λ = 5 years. What is the chance one lasts more than 7 years?',
    set: { k: 2, lambda: 5 }, calc: { mode: 'right', a: 7 },
    steps: [R`For a Weibull, \(P(X > x) = e^{-(x/\lambda)^k}\).`, '(7/5)² = 1.96.', R`\(e^{-1.96}\).`],
    ans: '≈ 0.141.' } };
  X.cauchy = { ex: {
    q: 'A flashlight 1 m from a wall is spun randomly. What is the chance the spot lands more than 3 m from the center?',
    set: { x0: 0, gamma: 1 }, calc: { mode: 'right', a: 3 },
    steps: ['This is Cauchy(0, 1).', 'The plot shades the right side: P(X > 3) ≈ 0.102.', 'The left side is the same by symmetry, so double it.'],
    ans: '≈ 0.205. That is 1 in 5, far more than a normal would give.' } };
  X.laplace = { ex: {
    q: 'A stock’s daily change (in %) is roughly Laplace(0, 1). What is the chance of a drop worse than −3%?',
    set: { mu: 0, b: 1 }, calc: { mode: 'left', b: -3 },
    steps: [R`Left of center, \(F(x) = \tfrac12 e^{(x-\mu)/b}\).`, R`\(\tfrac12 e^{-3}\).`],
    ans: '≈ 0.025, about 1 trading day in 40. A normal with the same spread would give about 0.017.' } };
  X.pareto = { ex: {
    q: 'Among millionaires, wealth (in $M) is Pareto with xₘ = 1 and α = 1.5. What fraction have more than $5M?',
    set: { xm: 1, alpha: 1.5 }, calc: { mode: 'right', a: 5 },
    steps: [R`For a Pareto, \(P(X > x) = (x_m / x)^{\alpha}\).`, R`\((1/5)^{1.5} = 0.2^{1.5}\).`],
    ans: '≈ 0.089, about 9%.' } };

  // ---------------------------------------------------------------- Grad-school inference & software
  const inf = (id, o) => { X[id].inf = o; };
  inf('bernoulli', { mle: R`\(\hat p = \bar x\)`, info: R`\(I(p) = \dfrac{1}{p(1-p)}\)`, conj: 'Beta', suff: R`\(\sum x_i\)`, expfam: 'Yes (natural parameter: log-odds)', r: 'dbinom(x, 1, p)', py: 'scipy.stats.bernoulli(p)' });
  inf('binomial', { mle: R`\(\hat p = X/n\) (n known)`, info: R`\(I(p) = \dfrac{n}{p(1-p)}\)`, conj: 'Beta', suff: R`\(X\)`, expfam: 'Yes, for fixed n', r: 'dbinom(k, n, p)', py: 'scipy.stats.binom(n, p)' });
  inf('geometric', { mle: R`\(\hat p = 1/\bar x\)`, info: R`\(I(p) = \dfrac{1}{p^2(1-p)}\)`, conj: 'Beta', suff: R`\(\sum x_i\)`, expfam: 'Yes', r: 'dgeom(k - 1, p)  # R counts failures', py: 'scipy.stats.geom(p)  # counts trials' });
  inf('negbinomial', { mle: R`\(\hat p = r/\bar x\) (r known); r itself by numerical ML`, info: R`\(I(p) = \dfrac{r}{p^2(1-p)}\)`, conj: 'Beta (for p, r known)', suff: R`\(\sum x_i\) (r known)`, expfam: 'Yes, for fixed r', r: 'dnbinom(k - r, size = r, prob = p)  # failures', py: 'scipy.stats.nbinom(r, p) on k − r' });
  inf('poisson', { mle: R`\(\hat\lambda = \bar x\)`, info: R`\(I(\lambda) = 1/\lambda\)`, conj: 'Gamma', suff: R`\(\sum x_i\)`, expfam: 'Yes (canonical link: log)', r: 'dpois(k, lambda)', py: 'scipy.stats.poisson(mu)' });
  inf('hypergeometric', { mle: R`For \(N\) (capture–recapture): \(\hat N = \lfloor Kn/k \rfloor\); for \(K\): \(\lfloor (N+1)k/n \rfloor\)`, info: 'Not defined (integer parameters)', conj: 'Beta-binomial prior on K', suff: R`\(X\)`, expfam: 'No', r: 'dhyper(k, K, N - K, n)', py: 'scipy.stats.hypergeom(M=N, n=K, N=n)  # note the renaming' });
  inf('discreteuniform', { mle: R`\(\hat a = \min x_i,\ \hat b = \max x_i\)`, info: 'Not regular (support depends on parameters)', conj: 'Discrete Pareto for b', suff: R`\((\min x_i, \max x_i)\)`, expfam: 'No', r: 'sample(a:b, n, replace = TRUE); extraDistr::ddunif', py: 'scipy.stats.randint(a, b + 1)' });
  inf('uniform', { mle: R`\(\hat a = \min x_i,\ \hat b = \max x_i\) (rate \(1/n\))`, info: 'Not regular (support depends on parameters)', conj: R`Pareto for \(b\) when \(a = 0\)`, suff: R`\((\min x_i, \max x_i)\)`, expfam: 'No', r: 'dunif(x, a, b)', py: 'scipy.stats.uniform(loc=a, scale=b - a)' });
  inf('normal', { mle: R`\(\hat\mu = \bar x,\ \hat\sigma^2 = \frac1n\sum(x_i-\bar x)^2\)`, info: R`\(I(\mu,\sigma^2) = \operatorname{diag}\!\left(\frac{1}{\sigma^2}, \frac{1}{2\sigma^4}\right)\)`, conj: R`Normal (μ, σ² known); Normal–inverse-gamma (both)`, suff: R`\((\sum x_i, \sum x_i^2)\)`, expfam: 'Yes', r: 'dnorm(x, mean, sd)  # takes the SD', py: 'scipy.stats.norm(loc=mu, scale=sigma)' });
  inf('exponential', { mle: R`\(\hat\lambda = 1/\bar x\)`, info: R`\(I(\lambda) = 1/\lambda^2\)`, conj: 'Gamma', suff: R`\(\sum x_i\)`, expfam: 'Yes', r: 'dexp(x, rate)', py: 'scipy.stats.expon(scale=1/lam)' });
  inf('gamma', { mle: R`\(\ln\hat\alpha - \psi(\hat\alpha) = \ln\bar x - \overline{\ln x}\), then \(\hat\beta = \hat\alpha/\bar x\)`, info: R`\(\begin{pmatrix}\psi'(\alpha) & -1/\beta\\ -1/\beta & \alpha/\beta^2\end{pmatrix}\)`, conj: R`Gamma for \(\beta\) (α known)`, suff: R`\((\sum x_i, \sum \ln x_i)\)`, expfam: 'Yes', r: 'dgamma(x, shape, rate)', py: 'scipy.stats.gamma(a=alpha, scale=1/beta)' });
  inf('beta', { mle: R`Solve \(\psi(\alpha)-\psi(\alpha+\beta) = \overline{\ln x}\), \(\psi(\beta)-\psi(\alpha+\beta) = \overline{\ln(1-x)}\) numerically (method of moments to start)`, info: R`\(\begin{pmatrix}\psi'(\alpha)-\psi'(\alpha+\beta) & -\psi'(\alpha+\beta)\\ -\psi'(\alpha+\beta) & \psi'(\beta)-\psi'(\alpha+\beta)\end{pmatrix}\)`, conj: 'No convenient standard prior', suff: R`\((\sum\ln x_i, \sum\ln(1-x_i))\)`, expfam: 'Yes', r: 'dbeta(x, a, b)', py: 'scipy.stats.beta(a, b)' });
  inf('chisq', { mle: R`k is usually known; otherwise as for Gamma(k/2, 1/2)`, info: R`\(I(k) = \tfrac14\psi'(k/2)\)`, conj: '—', suff: R`\(\sum\ln x_i\)`, expfam: 'Yes', r: 'dchisq(x, df); qchisq(0.95, df)', py: 'scipy.stats.chi2(df)' });
  inf('t', { mle: R`Location–scale t: EM via the normal scale-mixture representation; ν by profile likelihood`, info: R`For location \(\mu\) with scale \(\sigma\): \(\dfrac{\nu+1}{(\nu+3)\sigma^2}\)`, conj: '—', suff: 'No fixed-dimension sufficient statistic', expfam: 'No', r: 'dt(x, df); qt(0.975, df)', py: 'scipy.stats.t(df)' });
  inf('f', { mle: 'Degrees of freedom are fixed by the design, not estimated', info: '—', conj: '—', suff: '—', expfam: 'No (for d₁, d₂)', r: 'df(x, df1, df2); pf(F, df1, df2, lower.tail = FALSE)', py: 'scipy.stats.f(dfn, dfd)' });
  inf('lognormal', { mle: R`\(\hat\mu = \overline{\ln x},\ \hat\sigma^2 = \frac1n\sum(\ln x_i - \hat\mu)^2\)`, info: R`Same as the normal for \((\mu, \sigma^2)\) on \(\ln x\)`, conj: R`Normal–inverse-gamma on \(\ln x\)`, suff: R`\((\sum\ln x_i, \sum\ln^2 x_i)\)`, expfam: 'Yes', r: 'dlnorm(x, meanlog, sdlog)', py: 'scipy.stats.lognorm(s=sigma, scale=np.exp(mu))' });
  inf('weibull', { mle: R`Solve \(\dfrac{\sum x_i^k\ln x_i}{\sum x_i^k} - \dfrac1k = \overline{\ln x}\) for \(k\); then \(\hat\lambda = \left(\frac1n\sum x_i^k\right)^{1/k}\)`, info: R`For \(\lambda\) with \(k\) known: \(k^2/\lambda^2\)`, conj: R`Inverse-gamma on \(\lambda^k\) (k known)`, suff: R`\(\sum x_i^k\) (k known)`, expfam: 'Only for fixed k', r: 'dweibull(x, shape = k, scale = lambda)', py: 'scipy.stats.weibull_min(c=k, scale=lam)' });
  inf('cauchy', { mle: 'Numerical; the likelihood for x₀ can have several local maxima (start from the median)', info: R`\(I(x_0) = I(\gamma) = \dfrac{1}{2\gamma^2}\)`, conj: '—', suff: 'Order statistics only', expfam: 'No', r: 'dcauchy(x, location, scale)', py: 'scipy.stats.cauchy(loc=x0, scale=gamma)' });
  inf('laplace', { mle: R`\(\hat\mu = \operatorname{median}(x),\ \hat b = \frac1n\sum|x_i - \hat\mu|\)`, info: R`\(I(\mu) = 1/b^2,\ I(b) = 1/b^2\)`, conj: R`Inverse-gamma for \(b\) (μ known)`, suff: R`\(\sum|x_i-\mu|\) (μ known)`, expfam: 'Only for fixed μ', r: 'extraDistr::dlaplace(x, mu, sigma = b)', py: 'scipy.stats.laplace(loc=mu, scale=b)' });
  inf('pareto', { mle: R`\(\hat x_m = \min x_i,\ \hat\alpha = n / \sum\ln(x_i/\hat x_m)\)`, info: R`\(I(\alpha) = 1/\alpha^2\)`, conj: R`Gamma for \(\alpha\) (xₘ known)`, suff: R`\((\min x_i, \sum\ln x_i)\)`, expfam: R`Only for fixed \(x_m\)`, r: 'extraDistr::dpareto(x, a = alpha, b = xm)', py: 'scipy.stats.pareto(b=alpha, scale=xm)' });

  for (const d of G.dists) Object.assign(d, X[d.id] || {});
})();
