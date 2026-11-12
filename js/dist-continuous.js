/* Continuous distributions: definitions, math and explanatory content. */
(function () {
  'use strict';
  const S = window.Stats, add = d => window.GUIDE.dists.push(d);
  const LN2PI = Math.log(2 * Math.PI);

  // ---------------------------------------------------------------- Uniform
  add({
    id: 'uniform', name: 'Uniform', type: 'continuous',
    notation: R`X \sim \mathcal{U}(a, b)`,
    tagline: 'Every value in an interval is equally likely. Flat density, straight-line CDF.',
    params: [
      { key: 'a', tex: 'a', min: -5, max: 5, step: 0.1, value: 0, desc: 'Lower end of the interval.' },
      { key: 'b', tex: 'b', min: -4.9, max: 10, step: 0.1, value: 1, desc: 'Upper end of the interval.' },
    ],
    constrain: (p, changed) => { if (p.b <= p.a) { if (changed === 'a') p.b = +(p.a + 0.1).toFixed(2); else p.a = +(p.b - 0.1).toFixed(2); } },
    lower: ({ a }) => a, upper: ({ b }) => b,
    pdf: (x, { a, b }) => (x >= a && x <= b) ? 1 / (b - a) : 0,
    cdf: (x, { a, b }) => x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a),
    quantile: (q, { a, b }) => a + q * (b - a),
    sample: ({ a, b }) => a + Math.random() * (b - a),
    mean: ({ a, b }) => (a + b) / 2,
    variance: ({ a, b }) => (b - a) ** 2 / 12,
    skewness: () => 0, kurtosis: () => -1.2,
    mode: () => 'any value in [a, b]',
    view: ({ a, b }) => { const w = b - a; return [a - 0.3 * w, b + 0.3 * w]; },
    formulas: [
      ['support', 'Support', R`x \in [a, b]`],
      ['pdf', 'PDF', R`f(x) = \dfrac{1}{b-a}`],
      ['cdf', 'CDF', R`F(x) = \dfrac{x-a}{b-a}, \quad a \le x \le b`],
      ['mean', 'Mean', R`E[X] = \dfrac{a+b}{2}`],
      ['var', 'Variance', R`\operatorname{Var}(X) = \dfrac{(b-a)^2}{12}`],
      ['kurt', 'Excess kurtosis', R`-\tfrac{6}{5}`, 1],
      ['mgf', 'MGF', R`M_X(t) = \dfrac{e^{tb}-e^{ta}}{t(b-a)}\ (t\ne0),\quad M_X(0)=1`, 1],
      ['entropy', 'Entropy', R`\ln(b-a)`, 1],
    ],
    intuition: R`<p>Pick a point "completely at random" between \(a\) and \(b\). No part of the interval is favored, so the density is a flat line at height \(1/(b-a)\). It has to be that height so the total area (width × height) is 1.</p>
      <p>Probability is simply length: the chance of landing in a sub-interval equals its length divided by \(b-a\). Notice the density can be bigger than 1 (try \(a = 0, b = 0.5\)). A density is <i>not</i> a probability; only areas under it are.</p>`,
    examples: [
      'You arrive at a random time for a bus that comes every 10 minutes: your wait is U(0, 10).',
      'Rounding error when a measurement is rounded to the nearest unit: roughly U(−0.5, 0.5).',
      'A computer’s random number generator, U(0, 1), the starting point for simulating everything else.',
      'Under a true null hypothesis, a (continuous) p-value is U(0, 1).',
    ],
    deep: R`<p><b>Probability integral transform.</b> If \(X\) is continuous with CDF \(F\), then \(F(X) \sim \mathcal U(0,1)\). Conversely, if \(U \sim \mathcal U(0,1)\), then \(F^{-1}(U)\) has CDF \(F\). That is <i>inverse-transform sampling</i>, and it is why the uniform is the root of every simulation. It also underlies copulas and the uniformity of p-values under \(H_0\).</p>
      <p><b>Order statistics.</b> For \(U_1,\dots,U_n\) iid \(\mathcal U(0,1)\), the \(k\)-th smallest is \(\text{Beta}(k, n-k+1)\), with mean \(k/(n+1)\). The spacings are exchangeable.</p>
      <p><b>Estimation.</b> For \(\mathcal U(0,\theta)\) the MLE is \(\max X_i\), which is biased. \(\frac{n+1}{n}\max X_i\) is the UMVUE. The support depends on \(\theta\), so the usual regularity conditions fail and the estimator converges at rate \(1/n\) rather than \(1/\sqrt n\).</p>
      <p><b>Maximum entropy.</b> On a bounded interval with no other constraints, the uniform has the largest entropy.</p>`,
  });

  // ---------------------------------------------------------------- Normal
  add({
    id: 'normal', name: 'Normal (Gaussian)', short: 'Normal', type: 'continuous',
    notation: R`X \sim N(\mu, \sigma^2)`,
    tagline: 'The bell curve. Sums and averages of many small independent effects end up here.',
    params: [
      { key: 'mu', tex: R`\mu`, min: -10, max: 10, step: 0.1, value: 0, desc: 'Mean: where the center of the bell sits (location).' },
      { key: 'sigma', tex: R`\sigma`, min: 0.1, max: 5, step: 0.05, value: 1, desc: 'Standard deviation: how spread out the bell is (scale).' },
    ],
    lower: () => -Infinity, upper: () => Infinity,
    pdf: (x, { mu, sigma }) => S.normPdf((x - mu) / sigma) / sigma,
    cdf: (x, { mu, sigma }) => S.normCdf((x - mu) / sigma),
    sample: ({ mu, sigma }) => mu + sigma * S.rnorm(),
    mean: ({ mu }) => mu, variance: ({ sigma }) => sigma * sigma,
    skewness: () => 0, kurtosis: () => 0, mode: ({ mu }) => mu,
    view: ({ mu, sigma }) => [mu - 4 * sigma, mu + 4 * sigma],
    formulas: [
      ['support', 'Support', R`x \in \mathbb{R}`],
      ['pdf', 'PDF', R`f(x) = \dfrac{1}{\sigma\sqrt{2\pi}}\exp\!\left(-\dfrac{(x-\mu)^2}{2\sigma^2}\right)`],
      ['cdf', 'CDF', R`F(x) = \Phi\!\left(\dfrac{x-\mu}{\sigma}\right) = \tfrac12\left[1 + \operatorname{erf}\!\left(\dfrac{x-\mu}{\sigma\sqrt2}\right)\right]`],
      ['mean', 'Mean', R`E[X] = \mu`],
      ['var', 'Variance', R`\operatorname{Var}(X) = \sigma^2`],
      ['z', 'Standardizing', R`Z = \dfrac{X-\mu}{\sigma} \sim N(0,1)`],
      ['skew', 'Skewness', R`0`, 1],
      ['kurt', 'Excess kurtosis', R`0`, 1],
      ['mgf', 'MGF', R`M_X(t) = \exp\!\left(\mu t + \tfrac12\sigma^2 t^2\right)`, 1],
      ['cf', 'Characteristic fn.', R`\varphi_X(t) = \exp\!\left(i\mu t - \tfrac12\sigma^2 t^2\right)`, 1],
      ['entropy', 'Entropy', R`\tfrac12\ln(2\pi e\sigma^2)`, 1],
    ],
    intuition: R`<p>The normal distribution is the symmetric bell curve. Two numbers describe it completely: the mean \(\mu\) (where the peak is) and the standard deviation \(\sigma\) (how wide it is). Slide \(\mu\) and the whole curve shifts without changing shape. Slide \(\sigma\) and it stretches out and gets flatter, since the area must stay 1.</p>
      <p><b>The 68–95–99.7 rule.</b> About 68% of values fall within 1σ of the mean, 95% within 2σ, and 99.7% within 3σ. Check it with the probability calculator: set the range to \(\mu \pm \sigma\).</p>
      <p><b>Why it is everywhere.</b> When a quantity is the sum of many small, independent influences (genes and nutrition for height, many tiny errors in a measurement), the total tends to be normal. This is the <b>Central Limit Theorem</b>, and it is why sample averages are approximately normal even when the data aren't. See the CLT lab.</p>
      <p><b>z-scores.</b> \(z = (x - \mu)/\sigma\) says how many standard deviations a value is from the mean, so every normal distribution can be converted to the standard normal \(N(0,1)\).</p>`,
    examples: [
      'Adult heights within a population; birth weights.',
      'Measurement errors of a well-calibrated instrument.',
      'Standardized test scores (often scaled to be normal on purpose).',
      'The sampling distribution of a sample mean (via the CLT): the basis of confidence intervals and z-tests.',
      'Noise in signals; daily changes in many physical quantities.',
    ],
    deep: R`<p><b>Central limit theorem.</b> If \(X_i\) are iid with mean \(\mu\) and finite variance \(\sigma^2\), then \(\sqrt n(\bar X_n - \mu)/\sigma \Rightarrow N(0,1)\). Lindeberg–Feller relaxes the iid condition, and Berry–Esseen bounds the error by \(C\rho/(\sigma^3\sqrt n)\) with \(\rho = E|X-\mu|^3\).</p>
      <p><b>Closure.</b> Linear combinations of independent normals are normal: \(aX + bY \sim N(a\mu_X + b\mu_Y,\ a^2\sigma_X^2 + b^2\sigma_Y^2)\). Jointly normal vectors are characterized by mean and covariance, and for them zero correlation ⇔ independence. That equivalence fails for merely marginally normal variables.</p>
      <p><b>Sampling theory.</b> For iid normal data, \(\bar X\) and \(S^2\) are independent (this <i>characterizes</i> the normal), with \(\bar X \sim N(\mu, \sigma^2/n)\) and \((n-1)S^2/\sigma^2 \sim \chi^2_{n-1}\). Hence \(\frac{\bar X - \mu}{S/\sqrt n} \sim t_{n-1}\). That's the chain normal → χ² → t → F behind classical inference.</p>
      <p><b>Maximum entropy & cumulants.</b> Among all densities on \(\mathbb R\) with given mean and variance, the normal maximizes entropy. All cumulants beyond the second are zero. It is a two-parameter exponential family with sufficient statistics \((\sum x_i, \sum x_i^2)\), and is self-conjugate for its mean (posterior precision = prior precision + data precision).</p>
      <p><b>Tails.</b> Mills ratio: \(1 - \Phi(z) \sim \phi(z)/z\) as \(z\to\infty\). Tails decay like \(e^{-z^2/2}\), much faster than t, Laplace, or Cauchy, so normal models badly understate extreme events in heavy-tailed data.</p>`,
    pitfalls: ['Not everything is normal. Incomes, waiting times, and stock crashes are skewed or heavy-tailed.', R`\(N(\mu, \sigma^2)\) usually means variance σ², but some texts and software (e.g. R’s <code>dnorm</code>) take the standard deviation σ. Check which.`],
  });

  // ---------------------------------------------------------------- Exponential
  add({
    id: 'exponential', name: 'Exponential', type: 'continuous',
    notation: R`X \sim \text{Exp}(\lambda)`,
    tagline: 'Waiting time until the next event when events occur at a constant rate. Memoryless.',
    params: [{ key: 'lambda', tex: R`\lambda`, min: 0.1, max: 5, step: 0.05, value: 1, desc: 'Rate: average number of events per unit time. The mean wait is 1/λ.' }],
    lower: () => 0, upper: () => Infinity,
    pdf: (x, { lambda }) => x < 0 ? 0 : lambda * Math.exp(-lambda * x),
    cdf: (x, { lambda }) => x <= 0 ? 0 : 1 - Math.exp(-lambda * x),
    quantile: (q, { lambda }) => -Math.log(1 - q) / lambda,
    sample: ({ lambda }) => S.rexp(lambda),
    mean: ({ lambda }) => 1 / lambda, variance: ({ lambda }) => 1 / (lambda * lambda),
    skewness: () => 2, kurtosis: () => 6, mode: () => 0,
    formulas: [
      ['support', 'Support', R`x \in [0, \infty)`],
      ['pdf', 'PDF', R`f(x) = \lambda e^{-\lambda x}`],
      ['cdf', 'CDF', R`F(x) = 1 - e^{-\lambda x}`],
      ['mean', 'Mean', R`E[X] = \dfrac{1}{\lambda}`],
      ['var', 'Variance', R`\operatorname{Var}(X) = \dfrac{1}{\lambda^2}`],
      ['median', 'Median', R`\dfrac{\ln 2}{\lambda}`],
      ['skew', 'Skewness', R`2`, 1],
      ['kurt', 'Excess kurtosis', R`6`, 1],
      ['mgf', 'MGF', R`M_X(t) = \dfrac{\lambda}{\lambda - t},\quad t < \lambda`, 1],
      ['hazard', 'Hazard rate', R`h(x) = \dfrac{f(x)}{1-F(x)} = \lambda`, 1],
      ['entropy', 'Entropy', R`1 - \ln\lambda`, 1],
    ],
    intuition: R`<p>Customers arrive at a shop at an average rate of \(\lambda\) per minute, independently of each other. How long until the next one walks in? That waiting time is exponential. Short waits are most common, and long waits get exponentially rarer. The average wait is \(1/\lambda\): two customers a minute means a half-minute wait on average.</p>
      <p><b>Memoryless.</b> If you've already waited 5 minutes, the extra time you'll wait has exactly the same distribution as if you'd just arrived. The process doesn't "remember" how long it has been. That's right for radioactive atoms, which don't age, but wrong for light bulbs, which wear out (see Weibull).</p>
      <p>The exponential is the continuous cousin of the geometric distribution, and it describes the gaps between events in a Poisson process.</p>`,
    examples: [
      'Time until the next customer, phone call, or website request.',
      'Time until a radioactive atom decays (half-life = ln 2 / λ).',
      'Lifetime of components that fail from random shocks rather than wear.',
      'Distance between mutations along a DNA strand.',
    ],
    deep: R`<p><b>Memorylessness</b> \(P(X > s+t \mid X > s) = P(X > t)\) characterizes the exponential among continuous distributions. Equivalently, the hazard \(h(x) = \lambda\) is constant.</p>
      <p><b>Minimums and competing risks.</b> If \(X_i \sim \text{Exp}(\lambda_i)\) independently, then \(\min_i X_i \sim \text{Exp}(\sum\lambda_i)\) and \(P(X_j \text{ is the min}) = \lambda_j/\sum\lambda_i\). This drives continuous-time Markov chains and the Gillespie algorithm.</p>
      <p><b>Sums and scaling.</b> \(\sum_{i=1}^\alpha X_i \sim \text{Gamma}(\alpha, \lambda)\) (Erlang). \(cX \sim \text{Exp}(\lambda/c)\). \(\text{Exp}(1/2) = \chi^2_2\). If \(U\sim\mathcal U(0,1)\), \(-\ln U/\lambda \sim \text{Exp}(\lambda)\).</p>
      <p><b>Inference.</b> MLE \(\hat\lambda = 1/\bar X\) (biased; \((n-1)/\sum X_i\) is unbiased). \(2\lambda\sum X_i \sim \chi^2_{2n}\) gives exact intervals. The Gamma prior is conjugate. With right-censored survival data the MLE becomes (number of events)/(total time at risk).</p>
      <p><b>Parametrization.</b> Rate \(\lambda\) here. SciPy and some texts use scale \(\beta = 1/\lambda\) (mean \(\beta\)).</p>`,
    pitfalls: ['Rate vs scale: Exp(2) can mean mean 1/2 or mean 2 depending on the source.', 'Memorylessness rarely holds for things that age or wear out.'],
  });

  // ---------------------------------------------------------------- Gamma
  add({
    id: 'gamma', name: 'Gamma', type: 'continuous',
    notation: R`X \sim \text{Gamma}(\alpha, \beta)`,
    tagline: 'Waiting time for several events; a flexible model for positive, right-skewed quantities.',
    params: [
      { key: 'alpha', tex: R`\alpha`, min: 0.2, max: 30, step: 0.1, value: 2, desc: 'Shape: how many events you wait for (need not be a whole number). Controls the skew.' },
      { key: 'beta', tex: R`\beta`, min: 0.1, max: 5, step: 0.05, value: 1, desc: 'Rate: events per unit time. Larger β squeezes the distribution toward 0 (scale θ = 1/β).' },
    ],
    lower: () => 0, upper: () => Infinity,
    pdf: (x, { alpha, beta }) => x < 0 ? 0 : x === 0 ? (alpha < 1 ? Infinity : alpha === 1 ? beta : 0) : Math.exp(alpha * Math.log(beta) + (alpha - 1) * Math.log(x) - beta * x - S.lgamma(alpha)),
    cdf: (x, { alpha, beta }) => x <= 0 ? 0 : S.gammp(alpha, beta * x),
    sample: ({ alpha, beta }) => S.rgamma(alpha, beta),
    mean: ({ alpha, beta }) => alpha / beta, variance: ({ alpha, beta }) => alpha / (beta * beta),
    skewness: ({ alpha }) => 2 / Math.sqrt(alpha), kurtosis: ({ alpha }) => 6 / alpha,
    mode: ({ alpha, beta }) => alpha >= 1 ? (alpha - 1) / beta : 0,
    formulas: [
      ['support', 'Support', R`x \in (0, \infty)`],
      ['pdf', 'PDF', R`f(x) = \dfrac{\beta^\alpha}{\Gamma(\alpha)}\, x^{\alpha-1} e^{-\beta x}`],
      ['cdf', 'CDF', R`F(x) = \dfrac{\gamma(\alpha, \beta x)}{\Gamma(\alpha)} = P(\alpha, \beta x)`],
      ['mean', 'Mean', R`E[X] = \dfrac{\alpha}{\beta}`],
      ['var', 'Variance', R`\operatorname{Var}(X) = \dfrac{\alpha}{\beta^2}`],
      ['mode', 'Mode', R`\dfrac{\alpha - 1}{\beta}\ \ (\alpha \ge 1)`],
      ['skew', 'Skewness', R`\dfrac{2}{\sqrt\alpha}`, 1],
      ['kurt', 'Excess kurtosis', R`\dfrac{6}{\alpha}`, 1],
      ['mgf', 'MGF', R`M_X(t) = \left(1 - \dfrac{t}{\beta}\right)^{-\alpha},\quad t < \beta`, 1],
      ['entropy', 'Entropy', R`\alpha - \ln\beta + \ln\Gamma(\alpha) + (1-\alpha)\psi(\alpha)`, 1],
    ],
    intuition: R`<p>If the exponential is the wait for <i>one</i> event, the gamma (with whole-number \(\alpha\)) is the wait for \(\alpha\) events: add up \(\alpha\) independent exponential waiting times. Waiting for 5 customers takes about 5 times as long as waiting for one, and the total is less erratic relative to its size.</p>
      <p>Play with the <b>shape</b> \(\alpha\). Below 1 the curve shoots up at 0. At 1 it is exactly the exponential. Above 1 it has a hump. For large \(\alpha\) it becomes nearly a symmetric bell (CLT again). The <b>rate</b> \(\beta\) only rescales the x-axis.</p>
      <p>Outside of waiting times, the gamma is a general-purpose model for anything positive and right-skewed: rainfall totals, insurance claims, or the time a project takes.</p>`,
    examples: [
      'Total time to serve the next 5 customers.',
      'Daily or monthly rainfall amounts.',
      'Sizes of insurance claims; loads on structures.',
      'Bayesian prior for a Poisson rate or a normal precision (1/σ²).',
    ],
    deep: R`<p><b>Parametrizations.</b> Shape–rate \((\alpha,\beta)\) here (common in Bayesian stats). Shape–scale \((k,\theta)\) with \(\theta = 1/\beta\) is common in engineering and in R (<code>dgamma(x, shape, rate)</code> or <code>scale=</code>) and SciPy (<code>gamma(a, scale)</code>).</p>
      <p><b>Additivity & scaling.</b> \(\text{Gamma}(\alpha_1,\beta) + \text{Gamma}(\alpha_2,\beta) = \text{Gamma}(\alpha_1+\alpha_2,\beta)\) for independent terms, and \(cX \sim \text{Gamma}(\alpha, \beta/c)\). Special cases: \(\text{Exp}(\beta) = \text{Gamma}(1,\beta)\), \(\chi^2_k = \text{Gamma}(k/2, 1/2)\), and Erlang for integer \(\alpha\).</p>
      <p><b>Beta connection.</b> For independent \(X\sim\text{Gamma}(\alpha,\beta)\), \(Y\sim\text{Gamma}(\gamma,\beta)\): \(X/(X+Y) \sim \text{Beta}(\alpha,\gamma)\), independent of \(X+Y\) (Lukacs’ theorem characterizes the gamma by this independence). Normalizing \(k\) independent gammas gives a Dirichlet.</p>
      <p><b>Conjugacy.</b> Gamma is conjugate for the Poisson rate, the exponential rate, and the normal precision. A Gamma–Poisson mixture is negative binomial. The inverse-gamma (for \(1/X\)) is conjugate for a normal variance.</p>
      <p><b>Inference.</b> The sufficient statistics are \((\sum x_i, \sum\ln x_i)\). The MLE for \(\alpha\) solves \(\ln\alpha - \psi(\alpha) = \ln\bar x - \overline{\ln x}\) (no closed form), and then \(\hat\beta = \hat\alpha/\bar x\). Gamma GLMs (log link) model positive data with constant coefficient of variation.</p>`,
    overlays: [
      { label: 'Normal approximation', target: 'normal', map: ({ alpha, beta }) => ({ mu: alpha / beta, sigma: Math.sqrt(alpha) / beta }) },
    ],
  });

  // ---------------------------------------------------------------- Beta
  add({
    id: 'beta', name: 'Beta', type: 'continuous',
    notation: R`X \sim \text{Beta}(\alpha, \beta)`,
    tagline: 'A distribution for probabilities and proportions: values between 0 and 1.',
    params: [
      { key: 'alpha', tex: R`\alpha`, min: 0.1, max: 30, step: 0.1, value: 2, desc: 'Pulls mass toward 1. Think "successes + 1".' },
      { key: 'beta', tex: R`\beta`, min: 0.1, max: 30, step: 0.1, value: 5, desc: 'Pulls mass toward 0. Think "failures + 1".' },
    ],
    lower: () => 0, upper: () => 1,
    pdf: (x, { alpha, beta }) => {
      if (x < 0 || x > 1) return 0;
      if (x === 0) return alpha < 1 ? Infinity : alpha === 1 ? beta : 0;
      if (x === 1) return beta < 1 ? Infinity : beta === 1 ? alpha : 0;
      return Math.exp((alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - S.lbeta(alpha, beta));
    },
    cdf: (x, { alpha, beta }) => S.betai(alpha, beta, x),
    sample: ({ alpha, beta }) => S.rbeta(alpha, beta),
    mean: ({ alpha, beta }) => alpha / (alpha + beta),
    variance: ({ alpha, beta }) => alpha * beta / ((alpha + beta) ** 2 * (alpha + beta + 1)),
    skewness: ({ alpha: a, beta: b }) => 2 * (b - a) * Math.sqrt(a + b + 1) / ((a + b + 2) * Math.sqrt(a * b)),
    kurtosis: ({ alpha: a, beta: b }) => 6 * ((a - b) ** 2 * (a + b + 1) - a * b * (a + b + 2)) / (a * b * (a + b + 2) * (a + b + 3)),
    mode: ({ alpha: a, beta: b }) => (a > 1 && b > 1) ? (a - 1) / (a + b - 2) : (a === 1 && b === 1) ? 'any value in [0, 1]' : (a <= 1 && b > 1) ? 0 : (a > 1 && b <= 1) ? 1 : '0 and 1 (U-shape)',
    view: () => [0, 1],
    formulas: [
      ['support', 'Support', R`x \in [0, 1]`],
      ['pdf', 'PDF', R`f(x) = \dfrac{x^{\alpha-1}(1-x)^{\beta-1}}{B(\alpha,\beta)},\quad B(\alpha,\beta) = \dfrac{\Gamma(\alpha)\Gamma(\beta)}{\Gamma(\alpha+\beta)}`],
      ['cdf', 'CDF', R`F(x) = I_x(\alpha, \beta)`],
      ['mean', 'Mean', R`E[X] = \dfrac{\alpha}{\alpha+\beta}`],
      ['var', 'Variance', R`\operatorname{Var}(X) = \dfrac{\alpha\beta}{(\alpha+\beta)^2(\alpha+\beta+1)}`],
      ['mode', 'Mode', R`\dfrac{\alpha-1}{\alpha+\beta-2}\ \ (\alpha,\beta>1)`],
      ['skew', 'Skewness', R`\dfrac{2(\beta-\alpha)\sqrt{\alpha+\beta+1}}{(\alpha+\beta+2)\sqrt{\alpha\beta}}`, 1],
      ['mgf', 'MGF', R`M_X(t) = {}_1F_1(\alpha;\, \alpha+\beta;\, t) = 1 + \sum_{k\ge1}\Big(\prod_{r=0}^{k-1}\dfrac{\alpha+r}{\alpha+\beta+r}\Big)\dfrac{t^k}{k!}`, 1],
    ],
    intuition: R`<p>The beta lives on [0, 1], so it is natural for describing an unknown <b>proportion or probability</b>, such as a player's true free-throw percentage.</p>
      <p>A handy way to read the parameters: \(\text{Beta}(\alpha,\beta)\) is like having seen about \(\alpha - 1\) successes and \(\beta - 1\) failures. The mean is \(\alpha/(\alpha+\beta)\), and bigger \(\alpha+\beta\) means more "evidence", so the curve is narrower and more confident. Try \(\text{Beta}(2,2)\) versus \(\text{Beta}(20,20)\).</p>
      <p>The shapes are very varied: flat (\(1,1\) is uniform), humped, J-shaped, or U-shaped when both parameters are below 1. Explore them with the sliders.</p>`,
    examples: [
      'Your uncertainty about a basketball player’s true shooting percentage.',
      'Click-through rates in A/B testing (Bayesian approach).',
      'Proportion of a day spent on some activity; fraction of a surface covered.',
      'Project-task durations in PERT scheduling (rescaled beta).',
    ],
    deep: R`<p><b>Conjugate prior for the binomial.</b> Prior \(p \sim \text{Beta}(\alpha,\beta)\) and data \(k\) successes in \(n\) trials give posterior \(\text{Beta}(\alpha+k, \beta+n-k)\). The posterior mean \(\frac{\alpha+k}{\alpha+\beta+n}\) is a weighted average of the prior mean and \(k/n\). Common default priors: uniform \(\text{Beta}(1,1)\) and Jeffreys \(\text{Beta}(\tfrac12,\tfrac12)\) (the arcsine law). The marginal of \(k\) is beta-binomial.</p>
      <p><b>Constructions.</b> \(X/(X+Y)\) for independent \(\text{Gamma}(\alpha,\theta)\) and \(\text{Gamma}(\beta,\theta)\). The \(k\)-th order statistic of \(n\) uniforms is \(\text{Beta}(k, n-k+1)\). If \(X\sim F(d_1,d_2)\), \(\frac{d_1X}{d_1X+d_2}\sim\text{Beta}(d_1/2, d_2/2)\). The Dirichlet is its multivariate generalization, with Beta marginals.</p>
      <p><b>CDF identities.</b> \(I_p(k, n-k+1) = P(\text{Bin}(n,p) \ge k)\), which gives Clopper–Pearson exact binomial intervals from beta quantiles.</p>
      <p><b>Mean–precision form.</b> With \(\mu = \alpha/(\alpha+\beta)\), \(\phi = \alpha+\beta\): \(\operatorname{Var} = \mu(1-\mu)/(1+\phi)\). This parametrization is used in beta regression for rates and proportions.</p>`,
  });

  // ---------------------------------------------------------------- Chi-square
  add({
    id: 'chisq', name: 'Chi-square', type: 'continuous',
    notation: R`X \sim \chi^2_k`,
    tagline: 'The sum of k squared standard normals. The workhorse of goodness-of-fit and variance tests.',
    params: [{ key: 'k', tex: 'k', min: 1, max: 60, step: 1, value: 3, int: true, desc: 'Degrees of freedom: how many independent squared normals are added up.' }],
    lower: () => 0, upper: () => Infinity,
    pdf: (x, { k }) => x < 0 ? 0 : x === 0 ? (k < 2 ? Infinity : k === 2 ? 0.5 : 0) : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.LN2 - S.lgamma(k / 2)),
    cdf: (x, { k }) => x <= 0 ? 0 : S.gammp(k / 2, x / 2),
    sample: ({ k }) => S.rchisq(k),
    mean: ({ k }) => k, variance: ({ k }) => 2 * k,
    skewness: ({ k }) => Math.sqrt(8 / k), kurtosis: ({ k }) => 12 / k,
    mode: ({ k }) => Math.max(k - 2, 0),
    formulas: [
      ['support', 'Support', R`x \in [0, \infty)`],
      ['pdf', 'PDF', R`f(x) = \dfrac{1}{2^{k/2}\Gamma(k/2)}\, x^{k/2-1} e^{-x/2}`],
      ['cdf', 'CDF', R`F(x) = P\!\left(\tfrac k2, \tfrac x2\right)`],
      ['def', 'Definition', R`\textstyle\sum_{i=1}^k Z_i^2,\quad Z_i \overset{iid}{\sim} N(0,1)`],
      ['mean', 'Mean', R`E[X] = k`],
      ['var', 'Variance', R`\operatorname{Var}(X) = 2k`],
      ['skew', 'Skewness', R`\sqrt{8/k}`, 1],
      ['kurt', 'Excess kurtosis', R`12/k`, 1],
      ['mgf', 'MGF', R`M_X(t) = (1-2t)^{-k/2},\quad t < \tfrac12`, 1],
    ],
    intuition: R`<p>Take \(k\) independent standard normal numbers, square each one, and add them up. The total follows a chi-square distribution with \(k\) <b>degrees of freedom</b>. Squares are never negative, so the distribution lives on \(x \ge 0\), and since each \(Z^2\) averages 1, the mean is exactly \(k\).</p>
      <p>In practice, chi-square shows up as a measure of "total squared surprise". In a goodness-of-fit test you add up \(\frac{(\text{observed} - \text{expected})^2}{\text{expected}}\) over categories. If the model is right, that sum is roughly chi-square, and a value far out in the right tail is evidence the model is wrong.</p>
      <p>With few degrees of freedom it is strongly right-skewed. As \(k\) grows it slides right and becomes bell-shaped.</p>`,
    examples: [
      'Testing if a die is fair: compare observed counts of 1–6 with the expected counts.',
      'Testing independence in a two-way table (e.g. gender × preferred candidate).',
      'Confidence interval for a population variance: \((n-1)s^2/\sigma^2 \sim \chi^2_{n-1}\).',
      'Likelihood-ratio tests in large samples (Wilks’ theorem).',
    ],
    deep: R`<p><b>Gamma special case.</b> \(\chi^2_k = \text{Gamma}(k/2, \text{rate } 1/2)\), so chi-squares add: \(\chi^2_a + \chi^2_b = \chi^2_{a+b}\) for independent terms. \(\chi^2_2 = \text{Exp}(1/2)\).</p>
      <p><b>Quadratic forms (Cochran).</b> If \(Z \sim N_n(0, I)\) and \(A\) is a symmetric idempotent matrix of rank \(r\), then \(Z^\top AZ \sim \chi^2_r\). Degrees of freedom are the dimension of the subspace you project onto. That's why estimating \(\mu\) by \(\bar X\) "uses up" one: \(\sum(X_i-\bar X)^2/\sigma^2 \sim \chi^2_{n-1}\). Residual sums of squares in regression are \(\sigma^2\chi^2_{n-p}\).</p>
      <p><b>Asymptotics.</b> Pearson's \(X^2 = \sum (O-E)^2/E\) and the deviance \(G^2 = 2\sum O\ln(O/E)\) are asymptotically \(\chi^2\) with df = (free cells) − (estimated parameters). Wilks: \(-2\ln\Lambda \Rightarrow \chi^2_{q}\) for \(q\) restrictions under regularity conditions. For large \(k\), \(\sqrt{2X} - \sqrt{2k-1} \approx N(0,1)\), and the Wilson–Hilferty cube-root approximation is better still.</p>
      <p><b>Noncentral.</b> If \(Z_i \sim N(\mu_i, 1)\), \(\sum Z_i^2 \sim \chi^2_k(\lambda)\) with \(\lambda = \sum\mu_i^2\). This governs the power of chi-square and F tests.</p>`,
    overlays: [
      { label: 'Normal approximation', target: 'normal', map: ({ k }) => ({ mu: k, sigma: Math.sqrt(2 * k) }) },
    ],
  });

  // ---------------------------------------------------------------- Student t
  add({
    id: 't', name: 'Student’s t', type: 'continuous',
    notation: R`T \sim t_\nu`,
    tagline: 'A bell curve with heavier tails, for inference about a mean when σ is estimated.',
    params: [{ key: 'nu', tex: R`\nu`, min: 0.5, max: 100, step: 0.5, value: 3, desc: 'Degrees of freedom (usually n − 1). Smaller ν gives heavier tails; ν → ∞ gives the normal.' }],
    lower: () => -Infinity, upper: () => Infinity,
    pdf: (x, { nu }) => Math.exp(S.lgamma((nu + 1) / 2) - S.lgamma(nu / 2) - 0.5 * Math.log(nu * Math.PI) - (nu + 1) / 2 * Math.log(1 + x * x / nu)),
    cdf: (x, { nu }) => { const ib = S.betai(nu / 2, 0.5, nu / (nu + x * x)); return x >= 0 ? 1 - 0.5 * ib : 0.5 * ib; },
    sample: ({ nu }) => S.rnorm() / Math.sqrt(S.rchisq(nu) / nu),
    mean: ({ nu }) => nu > 1 ? 0 : NaN,
    variance: ({ nu }) => nu > 2 ? nu / (nu - 2) : nu > 1 ? Infinity : NaN,
    skewness: ({ nu }) => nu > 3 ? 0 : NaN,
    kurtosis: ({ nu }) => nu > 4 ? 6 / (nu - 4) : nu > 2 ? Infinity : NaN,
    mode: () => 0,
    view: () => [-5, 5],
    formulas: [
      ['support', 'Support', R`x \in \mathbb{R}`],
      ['pdf', 'PDF', R`f(x) = \dfrac{\Gamma\!\left(\frac{\nu+1}{2}\right)}{\sqrt{\nu\pi}\,\Gamma\!\left(\frac{\nu}{2}\right)}\left(1+\dfrac{x^2}{\nu}\right)^{-\frac{\nu+1}{2}}`],
      ['cdf', 'CDF', R`F(x) = 1 - \tfrac12 I_{\nu/(\nu+x^2)}\!\left(\tfrac\nu2, \tfrac12\right),\ \ x \ge 0`],
      ['def', 'Definition', R`T = \dfrac{Z}{\sqrt{V/\nu}},\ \ Z\sim N(0,1),\ V \sim \chi^2_\nu`],
      ['mean', 'Mean', R`0\ \ (\nu > 1)`],
      ['var', 'Variance', R`\dfrac{\nu}{\nu-2}\ \ (\nu > 2);\ \ \infty\ (1<\nu\le2)`],
      ['skew', 'Skewness', R`0\ \ (\nu > 3)`, 1],
      ['kurt', 'Excess kurtosis', R`\dfrac{6}{\nu-4}\ \ (\nu > 4)`, 1],
      ['mgf', 'MGF', R`\text{does not exist}`, 1],
    ],
    intuition: R`<p>Suppose you want a confidence interval for a population mean, but you don't know the population standard deviation, so you estimate it from your sample. With a small sample that estimate is shaky, and sometimes it comes out too small, making your z-score look more extreme than it should. The t distribution accounts for that extra uncertainty. It's a bell curve with <b>fatter tails</b>, so t-based intervals are wider than z-based ones.</p>
      <p>Degrees of freedom \(\nu\) (usually \(n - 1\)) measure how much information went into estimating σ. Turn on the normal overlay and slide \(\nu\) up: by about 30 the two are almost identical. At \(\nu = 1\) the tails are so heavy that it becomes the Cauchy distribution, which doesn't even have a mean.</p>
      <p>The name comes from William Gosset, who published under the pen name "Student" in 1908 because his employer, the Guinness brewery, didn't want competitors to know it was using statistics.</p>`,
    examples: [
      'Confidence intervals and tests for a mean with a small sample (one-sample, paired, and two-sample t-tests).',
      'Testing whether a regression coefficient is zero.',
      'Robust modeling: replacing normal errors with t errors to downweight outliers.',
      'Finance: modeling returns with heavier tails than the normal.',
    ],
    deep: R`<p><b>Construction.</b> \(T = Z/\sqrt{V/\nu}\) with independent \(Z\sim N(0,1)\), \(V\sim\chi^2_\nu\). For normal data, \(\frac{\bar X-\mu}{S/\sqrt n}\sim t_{n-1}\) exactly, because \(\bar X\) and \(S^2\) are independent.</p>
      <p><b>Scale mixture of normals.</b> If \(\tau \sim \text{Gamma}(\nu/2, \nu/2)\) and \(X\mid\tau \sim N(0, 1/\tau)\), then \(X\sim t_\nu\). This explains the heavy tails, makes EM/Gibbs fitting of robust t-regression easy, and is why the t is the posterior predictive (and marginal posterior of \(\mu\)) in a normal model with unknown variance under the standard prior.</p>
      <p><b>Tails and moments.</b> \(f(x) \sim C|x|^{-(\nu+1)}\), a polynomial tail, so \(E|T|^r < \infty\) iff \(r < \nu\). \(T^2 \sim F(1,\nu)\). The limits are \(t_\nu \Rightarrow N(0,1)\) as \(\nu\to\infty\) and \(t_1 = \text{Cauchy}(0,1)\).</p>
      <p><b>Location–scale version.</b> \(X = \mu + \sigma T\) gives the three-parameter t, widely used as a likelihood for robust estimation (\(\nu\) around 3–7 is common).</p>`,
    pitfalls: ['The t-procedures assume roughly normal data (or a large enough n). Heavy skew with a tiny sample can still mislead.'],
    overlays: [
      { label: 'Standard normal N(0,1)', target: 'normal', map: () => ({ mu: 0, sigma: 1 }) },
    ],
  });

  // ---------------------------------------------------------------- F
  add({
    id: 'f', name: 'F (Fisher–Snedecor)', short: 'F', type: 'continuous',
    notation: R`X \sim F(d_1, d_2)`,
    tagline: 'A ratio of two scaled chi-squares. Used to compare variances, in ANOVA, and in regression F-tests.',
    params: [
      { key: 'd1', tex: R`d_1`, min: 1, max: 60, step: 1, value: 5, int: true, desc: 'Numerator degrees of freedom (e.g. number of groups − 1).' },
      { key: 'd2', tex: R`d_2`, min: 1, max: 100, step: 1, value: 20, int: true, desc: 'Denominator degrees of freedom (e.g. total sample size − number of groups).' },
    ],
    lower: () => 0, upper: () => Infinity,
    pdf: (x, { d1, d2 }) => {
      if (x < 0) return 0;
      if (x === 0) return d1 < 2 ? Infinity : d1 === 2 ? 1 : 0;
      return Math.exp(0.5 * (d1 * Math.log(d1 * x) + d2 * Math.log(d2) - (d1 + d2) * Math.log(d1 * x + d2)) - Math.log(x) - S.lbeta(d1 / 2, d2 / 2));
    },
    cdf: (x, { d1, d2 }) => x <= 0 ? 0 : S.betai(d1 / 2, d2 / 2, d1 * x / (d1 * x + d2)),
    sample: ({ d1, d2 }) => (S.rchisq(d1) / d1) / (S.rchisq(d2) / d2),
    mean: ({ d2 }) => d2 > 2 ? d2 / (d2 - 2) : Infinity,
    variance: ({ d1, d2 }) => d2 > 4 ? 2 * d2 * d2 * (d1 + d2 - 2) / (d1 * (d2 - 2) ** 2 * (d2 - 4)) : d2 > 2 ? Infinity : NaN,
    skewness: ({ d1, d2 }) => d2 > 6 ? (2 * d1 + d2 - 2) * Math.sqrt(8 * (d2 - 4)) / ((d2 - 6) * Math.sqrt(d1 * (d1 + d2 - 2))) : NaN,
    kurtosis: ({ d1, d2 }) => d2 > 8 ? 12 * (d1 * (5 * d2 - 22) * (d1 + d2 - 2) + (d2 - 4) * (d2 - 2) ** 2) / (d1 * (d2 - 6) * (d2 - 8) * (d1 + d2 - 2)) : NaN,
    mode: ({ d1, d2 }) => d1 > 2 ? (d1 - 2) / d1 * d2 / (d2 + 2) : 0,
    view: p => [0, Math.max(3, window.GUIDE.byId.f.quantile(0.99, p))],
    formulas: [
      ['support', 'Support', R`x \in [0, \infty)`],
      ['pdf', 'PDF', R`f(x) = \dfrac{1}{x\,B\!\left(\frac{d_1}{2},\frac{d_2}{2}\right)}\sqrt{\dfrac{(d_1x)^{d_1}\, d_2^{d_2}}{(d_1x+d_2)^{d_1+d_2}}}`],
      ['cdf', 'CDF', R`F(x) = I_{\frac{d_1x}{d_1x+d_2}}\!\left(\tfrac{d_1}{2}, \tfrac{d_2}{2}\right)`],
      ['def', 'Definition', R`\dfrac{U_1/d_1}{U_2/d_2},\ \ U_i \sim \chi^2_{d_i}\ \text{indep.}`],
      ['mean', 'Mean', R`\dfrac{d_2}{d_2-2}\ \ (d_2>2)`],
      ['var', 'Variance', R`\dfrac{2d_2^2(d_1+d_2-2)}{d_1(d_2-2)^2(d_2-4)}\ \ (d_2>4)`],
      ['mode', 'Mode', R`\dfrac{d_1-2}{d_1}\cdot\dfrac{d_2}{d_2+2}\ \ (d_1>2)`, 1],
      ['skew', 'Skewness', R`\dfrac{(2d_1+d_2-2)\sqrt{8(d_2-4)}}{(d_2-6)\sqrt{d_1(d_1+d_2-2)}}\ \ (d_2>6)`, 1],
      ['mgf', 'MGF', R`\text{does not exist}`, 1],
    ],
    intuition: R`<p>The F distribution is what you get when you divide one variance estimate by another. If two groups really have the same spread, the ratio of their sample variances should be near 1, and the F distribution tells you how far from 1 it can drift by chance.</p>
      <p>In <b>ANOVA</b> the numerator measures how far apart the group means are and the denominator measures the noise within groups. A large F (far right tail) says the group means differ by more than noise alone would explain.</p>
      <p>It has two degrees-of-freedom parameters, one for the numerator and one for the denominator. With both large, the distribution concentrates near 1.</p>`,
    examples: [
      'One-way ANOVA: do the means of 4 fertilizer groups differ?',
      'Overall F-test in multiple regression: does any predictor matter?',
      'Comparing nested regression models (does adding these 3 variables help?).',
      'Testing equality of two population variances.',
    ],
    deep: R`<p><b>Definition and symmetries.</b> \(F = \frac{U_1/d_1}{U_2/d_2}\) for independent chi-squares. \(1/F \sim F(d_2,d_1)\), so lower quantiles come from upper ones: \(F_{\alpha}(d_1,d_2) = 1/F_{1-\alpha}(d_2,d_1)\). \(t_\nu^2 \sim F(1,\nu)\).</p>
      <p><b>Beta link.</b> \(\frac{d_1F}{d_1F + d_2} \sim \text{Beta}(d_1/2, d_2/2)\), which gives the incomplete-beta CDF. As \(d_2\to\infty\), \(d_1F \Rightarrow \chi^2_{d_1}\).</p>
      <p><b>Linear models.</b> For nested Gaussian linear models with \(q\) restrictions, \(F = \frac{(\text{RSS}_0 - \text{RSS}_1)/q}{\text{RSS}_1/(n-p)} \sim F(q, n-p)\) under \(H_0\). The numerator and denominator are independent because they're projections onto orthogonal subspaces (Cochran). Under \(H_1\) the statistic is noncentral F, which determines power.</p>
      <p><b>Robustness warning.</b> The F-test for equal variances is very sensitive to non-normality (unlike ANOVA's F for means). Levene's or Brown–Forsythe tests are preferred in practice.</p>`,
  });

  // ---------------------------------------------------------------- Lognormal
  add({
    id: 'lognormal', name: 'Log-normal', type: 'continuous',
    notation: R`X \sim \text{LogNormal}(\mu, \sigma^2)`,
    tagline: 'A variable whose logarithm is normal. Products of many positive factors end up here.',
    params: [
      { key: 'mu', tex: R`\mu`, min: -2, max: 3, step: 0.05, value: 0, desc: 'Mean of ln X. The median of X is e^μ.' },
      { key: 'sigma', tex: R`\sigma`, min: 0.1, max: 2, step: 0.05, value: 0.5, desc: 'SD of ln X. Controls skewness: bigger σ gives a longer right tail.' },
    ],
    lower: () => 0, upper: () => Infinity,
    pdf: (x, { mu, sigma }) => x <= 0 ? 0 : S.normPdf((Math.log(x) - mu) / sigma) / (x * sigma),
    cdf: (x, { mu, sigma }) => x <= 0 ? 0 : S.normCdf((Math.log(x) - mu) / sigma),
    sample: ({ mu, sigma }) => Math.exp(mu + sigma * S.rnorm()),
    mean: ({ mu, sigma }) => Math.exp(mu + sigma * sigma / 2),
    variance: ({ mu, sigma }) => (Math.exp(sigma * sigma) - 1) * Math.exp(2 * mu + sigma * sigma),
    skewness: ({ sigma }) => { const e = Math.exp(sigma * sigma); return (e + 2) * Math.sqrt(e - 1); },
    kurtosis: ({ sigma }) => { const s2 = sigma * sigma; return Math.exp(4 * s2) + 2 * Math.exp(3 * s2) + 3 * Math.exp(2 * s2) - 6; },
    mode: ({ mu, sigma }) => Math.exp(mu - sigma * sigma),
    view: p => [0, window.GUIDE.byId.lognormal.quantile(0.99, p)],
    formulas: [
      ['support', 'Support', R`x \in (0, \infty)`],
      ['pdf', 'PDF', R`f(x) = \dfrac{1}{x\sigma\sqrt{2\pi}}\exp\!\left(-\dfrac{(\ln x-\mu)^2}{2\sigma^2}\right)`],
      ['cdf', 'CDF', R`F(x) = \Phi\!\left(\dfrac{\ln x - \mu}{\sigma}\right)`],
      ['mean', 'Mean', R`E[X] = e^{\mu + \sigma^2/2}`],
      ['var', 'Variance', R`\operatorname{Var}(X) = (e^{\sigma^2}-1)\,e^{2\mu+\sigma^2}`],
      ['median', 'Median / mode', R`e^{\mu}\ \ /\ \ e^{\mu-\sigma^2}`],
      ['skew', 'Skewness', R`(e^{\sigma^2}+2)\sqrt{e^{\sigma^2}-1}`, 1],
      ['kurt', 'Excess kurtosis', R`e^{4\sigma^2}+2e^{3\sigma^2}+3e^{2\sigma^2}-6`, 1],
      ['moments', 'Raw moments', R`E[X^n] = e^{n\mu + n^2\sigma^2/2}`, 1],
      ['mgf', 'MGF', R`\text{infinite for all } t>0`, 1],
    ],
    intuition: R`<p>The normal distribution comes from <i>adding</i> many small effects. The log-normal comes from <i>multiplying</i> many small effects. A stock that goes up 2% one day, down 1% the next, and so on is being multiplied by random factors, and the product ends up log-normal. Taking logs turns products into sums, so \(\ln X\) is normal.</p>
      <p>That gives a curve that's always positive with a long right tail: most values are moderate, with occasional very large ones. Notice that mode < median < mean. The mean gets pulled up by the rare huge values.</p>
      <p>Careful: \(\mu\) and \(\sigma\) are the mean and SD of \(\ln X\), not of \(X\) itself.</p>`,
    examples: [
      'Personal incomes (except the very top, which is closer to Pareto).',
      'Stock prices under the Black–Scholes model.',
      'Sizes of particles, droplets, or cities; concentrations of pollutants.',
      'Time to complete tasks; length of comments in a forum; latency of web requests.',
    ],
    deep: R`<p><b>Multiplicative CLT.</b> If \(X = \prod_{i=1}^n Y_i\) with iid positive \(Y_i\) and \(\operatorname{Var}(\ln Y)<\infty\), then \(\ln X\) is asymptotically normal. Gibrat's law of proportional growth gives log-normal firm and city sizes.</p>
      <p><b>Moments vs. MGF.</b> All moments \(E[X^n] = e^{n\mu + n^2\sigma^2/2}\) are finite, but \(E[e^{tX}] = \infty\) for every \(t > 0\). The log-normal is also not determined by its moments: Heyde (1963) gave a different density with the same moment sequence. This is a standard counterexample in courses on moment problems.</p>
      <p><b>Estimation.</b> Work on the log scale: \(\hat\mu = \overline{\ln x}\), \(\hat\sigma^2 = \frac1n\sum(\ln x_i - \hat\mu)^2\). Naively back-transforming \(e^{\hat\mu}\) estimates the median, not the mean. The mean needs \(e^{\hat\mu + \hat\sigma^2/2}\) (with bias corrections for small samples). Products of independent log-normals are log-normal, and \(X^a\) is log-normal too.</p>
      <p><b>Finance.</b> Geometric Brownian motion \(dS = \mu S\,dt + \sigma S\,dW\) gives \(S_t\) log-normal with \(\ln S_t \sim N(\ln S_0 + (\mu - \sigma^2/2)t,\ \sigma^2 t)\). The \(-\sigma^2/2\) is the Itô correction (volatility drag).</p>`,
    pitfalls: ['μ and σ describe ln X. The mean of X is e^(μ + σ²/2), not e^μ.'],
  });

  // ---------------------------------------------------------------- Weibull
  add({
    id: 'weibull', name: 'Weibull', type: 'continuous',
    notation: R`X \sim \text{Weibull}(k, \lambda)`,
    tagline: 'Lifetimes whose failure rate can rise or fall with age. The standard model in reliability.',
    params: [
      { key: 'k', tex: 'k', min: 0.3, max: 6, step: 0.05, value: 1.5, desc: 'Shape. k < 1: failure rate falls with age ("infant mortality"). k = 1: constant (exponential). k > 1: wear-out.' },
      { key: 'lambda', tex: R`\lambda`, min: 0.2, max: 5, step: 0.05, value: 1, desc: 'Scale: the characteristic life. 63.2% of items have failed by time λ.' },
    ],
    lower: () => 0, upper: () => Infinity,
    pdf: (x, { k, lambda }) => x < 0 ? 0 : x === 0 ? (k < 1 ? Infinity : k === 1 ? 1 / lambda : 0) : (k / lambda) * Math.pow(x / lambda, k - 1) * Math.exp(-Math.pow(x / lambda, k)),
    cdf: (x, { k, lambda }) => x <= 0 ? 0 : 1 - Math.exp(-Math.pow(x / lambda, k)),
    quantile: (q, { k, lambda }) => lambda * Math.pow(-Math.log(1 - q), 1 / k),
    sample: ({ k, lambda }) => lambda * Math.pow(-Math.log(S.runif()), 1 / k),
    mean: ({ k, lambda }) => lambda * S.gamma(1 + 1 / k),
    variance: ({ k, lambda }) => lambda * lambda * (S.gamma(1 + 2 / k) - S.gamma(1 + 1 / k) ** 2),
    skewness: ({ k }) => { const g = i => S.gamma(1 + i / k); return S.fromRaw(g(1), g(2), g(3), g(4)).skewness; },
    kurtosis: ({ k }) => { const g = i => S.gamma(1 + i / k); return S.fromRaw(g(1), g(2), g(3), g(4)).kurtosis; },
    mode: ({ k, lambda }) => k > 1 ? lambda * Math.pow((k - 1) / k, 1 / k) : 0,
    formulas: [
      ['support', 'Support', R`x \in [0, \infty)`],
      ['pdf', 'PDF', R`f(x) = \dfrac{k}{\lambda}\left(\dfrac{x}{\lambda}\right)^{k-1} e^{-(x/\lambda)^k}`],
      ['cdf', 'CDF', R`F(x) = 1 - e^{-(x/\lambda)^k}`],
      ['hazard', 'Hazard rate', R`h(x) = \dfrac{k}{\lambda}\left(\dfrac{x}{\lambda}\right)^{k-1}`],
      ['mean', 'Mean', R`E[X] = \lambda\,\Gamma(1 + 1/k)`],
      ['var', 'Variance', R`\lambda^2\left[\Gamma(1+2/k) - \Gamma(1+1/k)^2\right]`],
      ['median', 'Median', R`\lambda(\ln 2)^{1/k}`],
      ['moments', 'Raw moments', R`E[X^n] = \lambda^n\,\Gamma(1+n/k)`, 1],
      ['mgf', 'MGF', R`\textstyle\sum_{n\ge0} \frac{t^n\lambda^n}{n!}\Gamma(1+n/k)\ \ (k\ge1)`, 1],
    ],
    intuition: R`<p>How long will a machine part last? It depends on how its <b>risk of failing changes with age</b>, and the Weibull's shape \(k\) captures exactly that:</p>
      <ul><li>\(k < 1\): early failures. Items that survive the first stretch are the sturdy ones, so risk drops over time (defects show up early).</li>
      <li>\(k = 1\): constant risk, which is the exponential distribution.</li>
      <li>\(k > 1\): wear-out. The older it is, the more likely to fail soon (bearings, tires, people).</li></ul>
      <p>Around \(k \approx 3.5\) the shape looks quite normal. The scale \(\lambda\) is the "characteristic life": regardless of \(k\), about 63% of items fail before time \(\lambda\).</p>`,
    examples: [
      'Lifetimes of ball bearings, electronics, and mechanical parts.',
      'Wind speed distributions, used for siting wind turbines (k ≈ 2).',
      'Strength of brittle materials (weakest-link theory).',
      'Survival analysis: time to an event in medical studies.',
    ],
    deep: R`<p><b>Transformation.</b> If \(E\sim\text{Exp}(1)\), \(X = \lambda E^{1/k}\) is Weibull, so \((X/\lambda)^k\) is standard exponential. The Weibull plot \(\ln(-\ln(1-\hat F))\) against \(\ln x\) is linear with slope \(k\), a classic graphical diagnostic.</p>
      <p><b>Extreme values.</b> The (reversed) Weibull is one of the three extreme-value limit types (Fisher–Tippett–Gnedenko). The minimum of many iid positive variables with a power-law lower tail is Weibull. That's the weakest-link explanation for material strength.</p>
      <p><b>Survival models.</b> Hazard \(h(x)\propto x^{k-1}\) is monotone, so the Weibull can't produce a bathtub curve on its own (mixtures or the exponentiated Weibull can). It's the only family that is both a proportional-hazards and an accelerated-failure-time model. The MLE has no closed form for \(k\), but the profile likelihood in \(k\) is one-dimensional and well behaved.</p>`,
    overlays: [
      { label: 'Exponential with the same mean', target: 'exponential', map: ({ k, lambda }) => ({ lambda: 1 / (lambda * S.gamma(1 + 1 / k)) }) },
    ],
  });

  // ---------------------------------------------------------------- Cauchy
  add({
    id: 'cauchy', name: 'Cauchy', type: 'continuous',
    notation: R`X \sim \text{Cauchy}(x_0, \gamma)`,
    tagline: 'Looks like a bell curve, but its tails are so heavy that it has no mean. A famous counterexample.',
    params: [
      { key: 'x0', tex: R`x_0`, min: -5, max: 5, step: 0.1, value: 0, desc: 'Location: the median and the peak.' },
      { key: 'gamma', tex: R`\gamma`, min: 0.1, max: 4, step: 0.05, value: 1, desc: 'Scale: half the width of the peak at half its height. Half the mass lies in x₀ ± γ.' },
    ],
    lower: () => -Infinity, upper: () => Infinity,
    pdf: (x, { x0, gamma }) => 1 / (Math.PI * gamma * (1 + ((x - x0) / gamma) ** 2)),
    cdf: (x, { x0, gamma }) => 0.5 + Math.atan((x - x0) / gamma) / Math.PI,
    quantile: (q, { x0, gamma }) => x0 + gamma * Math.tan(Math.PI * (q - 0.5)),
    sample: ({ x0, gamma }) => x0 + gamma * Math.tan(Math.PI * (S.runif() - 0.5)),
    mean: () => NaN, variance: () => NaN, skewness: () => NaN, kurtosis: () => NaN,
    mode: ({ x0 }) => x0,
    view: ({ x0, gamma }) => [x0 - 8 * gamma, x0 + 8 * gamma],
    formulas: [
      ['support', 'Support', R`x \in \mathbb{R}`],
      ['pdf', 'PDF', R`f(x) = \dfrac{1}{\pi\gamma\left[1 + \left(\frac{x-x_0}{\gamma}\right)^2\right]}`],
      ['cdf', 'CDF', R`F(x) = \dfrac12 + \dfrac1\pi\arctan\!\left(\dfrac{x-x_0}{\gamma}\right)`],
      ['mean', 'Mean', R`\text{undefined}`],
      ['var', 'Variance', R`\text{undefined}`],
      ['median', 'Median / mode', R`x_0`],
      ['iqr', 'Interquartile range', R`2\gamma`],
      ['mgf', 'MGF', R`\text{does not exist}`, 1],
      ['cf', 'Characteristic fn.', R`\varphi_X(t) = e^{i x_0 t - \gamma|t|}`, 1],
      ['entropy', 'Entropy', R`\ln(4\pi\gamma)`, 1],
    ],
    intuition: R`<p>Stand a flashlight 1 meter from a long wall and spin it to a random angle. Where the beam hits the wall follows a Cauchy distribution. Most hits land near the middle, but when the angle is close to parallel the spot shoots off enormously far.</p>
      <p>Those rare, gigantic values make the Cauchy famous: <b>it has no average</b>. Use the simulator and draw samples. Every so often a value lands so far away that it drags the sample mean somewhere else, and adding more data doesn't fix it. The law of large numbers needs a finite mean, and the Cauchy doesn't have one.</p>
      <p>The median \(x_0\) is perfectly well defined, though, so the median is the right summary here.</p>`,
    examples: [
      'Physics: the shape of spectral lines and resonances (the Lorentzian line shape).',
      'The ratio of two independent standard normal measurements.',
      'The flashlight (or "lighthouse") problem.',
      'Stress-testing statistical methods: a classic "what if there’s no mean?" example.',
    ],
    deep: R`<p><b>Stability.</b> If \(X_1,\dots,X_n\) are iid \(\text{Cauchy}(x_0,\gamma)\), then \(\bar X_n\) is again \(\text{Cauchy}(x_0,\gamma)\). Averaging gains nothing. The characteristic function shows it immediately: \(\varphi(t/n)^n = \varphi(t)\). The Cauchy is the \(\alpha = 1\) symmetric stable law. The LLN and CLT fail because \(E|X| = \infty\).</p>
      <p><b>Constructions.</b> \(Z_1/Z_2\) for independent standard normals; \(\tan(\pi(U - \tfrac12))\) for uniform \(U\); Student's t with 1 degree of freedom. If \(X\sim\text{Cauchy}(0,1)\) then \(1/X\) is also \(\text{Cauchy}(0,1)\).</p>
      <p><b>Estimation.</b> The sample median is consistent, with asymptotic variance \(\pi^2\gamma^2/(4n)\). The MLE solves a polynomial equation that can have several roots. Fisher information for \(x_0\) is \(1/(2\gamma^2)\), so the median's efficiency is \(8/\pi^2 \approx 0.81\).</p>`,
    pitfalls: ['A sample from a Cauchy looks “almost normal” plus a few wild outliers. Deleting the outliers hides the real behavior.'],
    overlays: [
      { label: 'Normal with the same center and scale', target: 'normal', map: ({ x0, gamma }) => ({ mu: x0, sigma: gamma }) },
    ],
  });

  // ---------------------------------------------------------------- Laplace
  add({
    id: 'laplace', name: 'Laplace', type: 'continuous',
    notation: R`X \sim \text{Laplace}(\mu, b)`,
    tagline: 'Two exponentials back to back: a sharp peak with heavier tails than the normal.',
    params: [
      { key: 'mu', tex: R`\mu`, min: -5, max: 5, step: 0.1, value: 0, desc: 'Location: center, mean, median and mode.' },
      { key: 'b', tex: 'b', min: 0.1, max: 4, step: 0.05, value: 1, desc: 'Scale: the mean absolute distance from μ.' },
    ],
    lower: () => -Infinity, upper: () => Infinity,
    pdf: (x, { mu, b }) => Math.exp(-Math.abs(x - mu) / b) / (2 * b),
    cdf: (x, { mu, b }) => x < mu ? 0.5 * Math.exp((x - mu) / b) : 1 - 0.5 * Math.exp(-(x - mu) / b),
    quantile: (q, { mu, b }) => q < 0.5 ? mu + b * Math.log(2 * q) : mu - b * Math.log(2 - 2 * q),
    sample: ({ mu, b }) => mu + S.rexp(1 / b) - S.rexp(1 / b),
    mean: ({ mu }) => mu, variance: ({ b }) => 2 * b * b, skewness: () => 0, kurtosis: () => 3,
    mode: ({ mu }) => mu,
    view: ({ mu, b }) => [mu - 7 * b, mu + 7 * b],
    formulas: [
      ['support', 'Support', R`x \in \mathbb{R}`],
      ['pdf', 'PDF', R`f(x) = \dfrac{1}{2b}\exp\!\left(-\dfrac{|x-\mu|}{b}\right)`],
      ['cdf', 'CDF', R`F(x) = \begin{cases}\frac12 e^{(x-\mu)/b} & x<\mu\\ 1 - \frac12 e^{-(x-\mu)/b} & x\ge\mu\end{cases}`],
      ['mean', 'Mean', R`E[X] = \mu`],
      ['var', 'Variance', R`\operatorname{Var}(X) = 2b^2`],
      ['skew', 'Skewness', R`0`, 1],
      ['kurt', 'Excess kurtosis', R`3`, 1],
      ['mgf', 'MGF', R`M_X(t) = \dfrac{e^{\mu t}}{1 - b^2t^2},\quad |t| < 1/b`, 1],
      ['entropy', 'Entropy', R`\ln(2eb)`, 1],
    ],
    intuition: R`<p>Glue two exponential curves together, one facing each way, and you get the Laplace ("double exponential") distribution. Compared with a normal curve of the same spread it has a <b>pointier peak</b> and <b>fatter tails</b>: more values very close to the center, and more far-out values too.</p>
      <p>The normal uses squared distance from the center, \((x-\mu)^2\). The Laplace uses plain absolute distance \(|x-\mu|\). That one change is why the best estimate of its center is the <b>median</b> rather than the mean.</p>`,
    examples: [
      'Daily changes in stock prices or exchange rates (sharper peak and heavier tails than normal).',
      'Differential privacy: Laplace noise added to statistics to protect individuals.',
      'Errors in least-absolute-deviation (median) regression.',
      'Differences between two similar measurements, e.g. two judges’ scores.',
    ],
    deep: R`<p><b>Constructions.</b> The difference of two iid \(\text{Exp}(1/b)\) variables is \(\text{Laplace}(0,b)\). It is also a scale mixture of normals: \(X\mid V \sim N(\mu, V)\) with \(V \sim \text{Exp}(1/(2b^2))\).</p>
      <p><b>L1 connections.</b> The MLE of \(\mu\) is the sample median (minimizing \(\sum|x_i-\mu|\)), and \(\hat b\) is the mean absolute deviation from it. Laplace errors make LAD (median) regression the MLE. A Laplace prior on regression coefficients makes the MAP estimate the <b>lasso</b>, and the Bayesian lasso uses the normal scale-mixture form for Gibbs sampling.</p>
      <p><b>Differential privacy.</b> Adding \(\text{Laplace}(0, \Delta f/\varepsilon)\) noise to a query with L1-sensitivity \(\Delta f\) gives \(\varepsilon\)-differential privacy, because the density ratio between shifted Laplaces is bounded by \(e^{\varepsilon}\).</p>`,
    overlays: [
      { label: 'Normal with the same variance', target: 'normal', map: ({ mu, b }) => ({ mu, sigma: Math.SQRT2 * b }) },
    ],
  });

  // ---------------------------------------------------------------- Pareto
  add({
    id: 'pareto', name: 'Pareto', type: 'continuous',
    notation: R`X \sim \text{Pareto}(x_m, \alpha)`,
    tagline: 'The power law behind the 80/20 rule: a few huge values dominate the total.',
    params: [
      { key: 'xm', tex: R`x_m`, min: 0.5, max: 5, step: 0.1, value: 1, desc: 'Minimum possible value (scale).' },
      { key: 'alpha', tex: R`\alpha`, min: 0.5, max: 6, step: 0.05, value: 2, desc: 'Tail index. Smaller α gives a heavier tail; the mean is infinite if α ≤ 1 and the variance if α ≤ 2.' },
    ],
    lower: ({ xm }) => xm, upper: () => Infinity,
    pdf: (x, { xm, alpha }) => x < xm ? 0 : alpha * Math.pow(xm, alpha) / Math.pow(x, alpha + 1),
    cdf: (x, { xm, alpha }) => x <= xm ? 0 : 1 - Math.pow(xm / x, alpha),
    quantile: (q, { xm, alpha }) => xm * Math.pow(1 - q, -1 / alpha),
    sample: ({ xm, alpha }) => xm * Math.pow(S.runif(), -1 / alpha),
    mean: ({ xm, alpha }) => alpha > 1 ? alpha * xm / (alpha - 1) : Infinity,
    variance: ({ xm, alpha }) => alpha > 2 ? xm * xm * alpha / ((alpha - 1) ** 2 * (alpha - 2)) : alpha > 1 ? Infinity : NaN,
    skewness: ({ alpha: a }) => a > 3 ? 2 * (1 + a) / (a - 3) * Math.sqrt((a - 2) / a) : NaN,
    kurtosis: ({ alpha: a }) => a > 4 ? 6 * (a ** 3 + a * a - 6 * a - 2) / (a * (a - 3) * (a - 4)) : NaN,
    mode: ({ xm }) => xm,
    view: p => [0, Math.min(p.xm * 12, window.GUIDE.byId.pareto.quantile(0.97, p))],
    formulas: [
      ['support', 'Support', R`x \in [x_m, \infty)`],
      ['pdf', 'PDF', R`f(x) = \dfrac{\alpha\, x_m^\alpha}{x^{\alpha+1}}`],
      ['cdf', 'CDF', R`F(x) = 1 - \left(\dfrac{x_m}{x}\right)^{\alpha}`],
      ['mean', 'Mean', R`\dfrac{\alpha x_m}{\alpha-1}\ \ (\alpha>1)`],
      ['var', 'Variance', R`\dfrac{x_m^2\,\alpha}{(\alpha-1)^2(\alpha-2)}\ \ (\alpha>2)`],
      ['median', 'Median', R`x_m\,2^{1/\alpha}`],
      ['skew', 'Skewness', R`\dfrac{2(1+\alpha)}{\alpha-3}\sqrt{\dfrac{\alpha-2}{\alpha}}\ \ (\alpha>3)`, 1],
      ['mgf', 'MGF', R`\text{does not exist for } t>0`, 1],
      ['lorenz', 'Top-share', R`\text{Share of total held by top } q: \ q^{1-1/\alpha}`, 1],
    ],
    intuition: R`<p>In many systems a small number of items account for most of the total: the richest few hold most of the wealth, a handful of websites get most of the traffic. The Pareto distribution models this <b>"rich get richer"</b> pattern.</p>
      <p>The tail falls off like a power \(x^{-\alpha}\), far more slowly than the normal's or the exponential's, so extreme values are not just possible but expected. With \(\alpha \approx 1.16\), the top 20% hold 80% of the total: the famous 80/20 rule.</p>
      <p>Lower \(\alpha\) and watch the summary panel: at \(\alpha \le 2\) the variance becomes infinite, and at \(\alpha \le 1\) even the mean is infinite.</p>`,
    examples: [
      'Wealth and top incomes (Vilfredo Pareto’s original observation, 1896).',
      'City populations, file sizes on disk, website traffic.',
      'Sizes of large insurance losses, earthquakes, and wildfires.',
      'Word frequencies in a language (the discrete cousin, Zipf’s law).',
    ],
    deep: R`<p><b>Exponential link.</b> \(\ln(X/x_m) \sim \text{Exp}(\alpha)\), so the MLE is \(\hat\alpha = n/\sum\ln(x_i/x_m)\). In practice only the tail is Pareto, and the Hill estimator applies this to the top \(k\) order statistics.</p>
      <p><b>Scale invariance.</b> \(P(X > cx \mid X > x) = c^{-\alpha}\) for every \(x\): the tail looks the same at every scale. The mean excess \(E[X - u \mid X > u] = u/(\alpha-1)\) grows linearly in \(u\), whereas for the exponential it is constant. That's a useful diagnostic plot.</p>
      <p><b>Extreme value theory.</b> Pareto-type (regularly varying) tails are the domain of attraction of the Fréchet law for maxima. Peaks over high thresholds follow the generalized Pareto distribution (Pickands–Balkema–de Haan), which is the basis of tail-risk modeling in finance and hydrology.</p>
      <p><b>Inequality.</b> The Lorenz curve is \(L(F) = 1 - (1-F)^{1-1/\alpha}\) and the Gini coefficient is \(1/(2\alpha-1)\).</p>`,
    pitfalls: ['Sample means from Pareto data with α near 1–2 converge painfully slowly, so a few observations can dominate.', 'Straight lines on log–log plots are suggestive but weak evidence of a power law. Compare with the log-normal.'],
  });
})();
