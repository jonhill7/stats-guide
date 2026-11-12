/* Discrete distributions: definitions, math and explanatory content. */
(function () {
  'use strict';
  const S = window.Stats, add = d => window.GUIDE.dists.push(d);
  const lc = S.lchoose;

  // ---------------------------------------------------------------- Bernoulli
  add({
    id: 'bernoulli', name: 'Bernoulli', type: 'discrete',
    notation: R`X \sim \text{Bernoulli}(p)`,
    tagline: 'A single yes/no trial. The atom that most discrete distributions are built from.',
    params: [{ key: 'p', tex: 'p', min: 0, max: 1, step: 0.01, value: 0.3, desc: 'Probability of success (X = 1).' }],
    lower: () => 0, upper: () => 1,
    pmf: (k, { p }) => k === 0 ? 1 - p : k === 1 ? p : 0,
    sample: ({ p }) => Math.random() < p ? 1 : 0,
    mean: ({ p }) => p,
    variance: ({ p }) => p * (1 - p),
    skewness: ({ p }) => (1 - 2 * p) / Math.sqrt(p * (1 - p)),
    kurtosis: ({ p }) => (1 - 6 * p * (1 - p)) / (p * (1 - p)),
    mode: ({ p }) => p > 0.5 ? 1 : p < 0.5 ? 0 : '0 and 1',
    view: () => [0, 1],
    formulas: [
      ['support', 'Support', R`k \in \{0, 1\}`],
      ['pdf', 'PMF', R`P(X=k) = p^k (1-p)^{1-k}`],
      ['cdf', 'CDF', R`F(k) = \begin{cases} 0 & k<0 \\ 1-p & 0 \le k < 1 \\ 1 & k \ge 1\end{cases}`],
      ['mean', 'Mean', R`E[X] = p`],
      ['var', 'Variance', R`\operatorname{Var}(X) = p(1-p)`],
      ['skew', 'Skewness', R`\dfrac{1-2p}{\sqrt{p(1-p)}}`, 1],
      ['kurt', 'Excess kurtosis', R`\dfrac{1-6p(1-p)}{p(1-p)}`, 1],
      ['mgf', 'MGF', R`M_X(t) = 1 - p + p e^{t}`, 1],
      ['cf', 'Characteristic fn.', R`\varphi_X(t) = 1 - p + p e^{it}`, 1],
      ['entropy', 'Entropy', R`-p\ln p - (1-p)\ln(1-p)`, 1],
    ],
    intuition: R`<p>Flip a (possibly unfair) coin once. Call heads a "success" and record \(X = 1\); tails is a "failure" and \(X = 0\). That is a Bernoulli random variable. The single parameter \(p\) is the chance of success.</p>
      <p>Because \(X\) is either 0 or 1, its average value is just \(p\): if 30% of free throws go in, the long-run average of the 0/1 outcomes is 0.3. The variance \(p(1-p)\) is largest when \(p = 0.5\), when the outcome is hardest to predict, and shrinks to 0 when the result is certain.</p>`,
    examples: [
      'Whether one free throw goes in.',
      'Whether a single patient responds to a treatment.',
      'Whether a website visitor clicks an ad.',
      'Any yes/no survey answer, coded as 1/0.',
    ],
    deep: R`<p><b>Indicator variables.</b> For any event \(A\), the indicator \(\mathbf{1}_A\) is Bernoulli with \(p = P(A)\), so \(E[\mathbf{1}_A] = P(A)\). Writing counts as sums of indicators (and using linearity of expectation, which needs no independence) is one of the most useful tricks in probability.</p>
      <p><b>Exponential family.</b> \(P(X=k) = \exp\{k\,\eta - \ln(1+e^{\eta})\}\) with natural parameter \(\eta = \ln\frac{p}{1-p}\), the log-odds. The canonical link of a Bernoulli GLM is therefore the logit, which gives logistic regression.</p>
      <p><b>Inference.</b> For iid \(X_1,\dots,X_n\) the MLE is \(\hat p = \bar X\), which is unbiased with variance \(p(1-p)/n\). The Fisher information is \(I(p) = 1/[p(1-p)]\). The Beta distribution is the conjugate prior: a \(\text{Beta}(\alpha,\beta)\) prior becomes \(\text{Beta}(\alpha + \sum x_i,\ \beta + n - \sum x_i)\).</p>`,
    pitfalls: ['"Success" is just a label for the outcome coded 1. It need not be a good thing (a defective part can be the "success").'],
  });

  // ---------------------------------------------------------------- Binomial
  add({
    id: 'binomial', name: 'Binomial', type: 'discrete',
    notation: R`X \sim \text{Bin}(n, p)`,
    tagline: 'The number of successes in a fixed number of independent yes/no trials.',
    params: [
      { key: 'n', tex: 'n', min: 1, max: 100, step: 1, value: 10, int: true, desc: 'Number of trials (fixed in advance).' },
      { key: 'p', tex: 'p', min: 0, max: 1, step: 0.01, value: 0.5, desc: 'Probability of success on each trial.' },
    ],
    lower: () => 0, upper: ({ n }) => n,
    pmf: (k, { n, p }) => {
      if (k < 0 || k > n || k !== Math.floor(k)) return 0;
      if (p === 0) return k === 0 ? 1 : 0;
      if (p === 1) return k === n ? 1 : 0;
      return Math.exp(lc(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
    },
    sample: ({ n, p }) => S.rbinom(n, p),
    mean: ({ n, p }) => n * p,
    variance: ({ n, p }) => n * p * (1 - p),
    skewness: ({ n, p }) => (1 - 2 * p) / Math.sqrt(n * p * (1 - p)),
    kurtosis: ({ n, p }) => (1 - 6 * p * (1 - p)) / (n * p * (1 - p)),
    mode: ({ n, p }) => { const m = (n + 1) * p; return (Number.isInteger(m) && m > 0 && m <= n) ? `${m - 1} and ${m}` : Math.min(n, Math.floor(m)); },
    formulas: [
      ['support', 'Support', R`k \in \{0, 1, \dots, n\}`],
      ['pdf', 'PMF', R`P(X=k) = \binom{n}{k} p^k (1-p)^{n-k}`],
      ['cdf', 'CDF', R`F(k) = \sum_{i=0}^{\lfloor k \rfloor} \binom{n}{i} p^i (1-p)^{n-i} = I_{1-p}(n-k,\, k+1)`],
      ['mean', 'Mean', R`E[X] = np`],
      ['var', 'Variance', R`\operatorname{Var}(X) = np(1-p)`],
      ['skew', 'Skewness', R`\dfrac{1-2p}{\sqrt{np(1-p)}}`, 1],
      ['kurt', 'Excess kurtosis', R`\dfrac{1-6p(1-p)}{np(1-p)}`, 1],
      ['mgf', 'MGF', R`M_X(t) = \left(1 - p + p e^{t}\right)^n`, 1],
      ['pgf', 'PGF', R`G_X(s) = (1-p+ps)^n`, 1],
    ],
    intuition: R`<p>Repeat a yes/no experiment \(n\) times and count the successes. A quick checklist for when the binomial model applies is <b>BINS</b>:</p>
      <ul><li><b>B</b>inary: each trial is success or failure.</li><li><b>I</b>ndependent: one trial doesn't affect another.</li><li><b>N</b>umber of trials is fixed in advance.</li><li><b>S</b>ame probability \(p\) on every trial.</li></ul>
      <p>The formula has two parts. \(p^k(1-p)^{n-k}\) is the probability of one particular sequence with \(k\) successes, and \(\binom{n}{k}\) counts how many such sequences there are. Try sliding \(p\): the hump sits near \(np\), and it is symmetric only when \(p = 0.5\). Increase \(n\) and the shape becomes more and more bell-like, which is the Central Limit Theorem at work.</p>`,
    examples: [
      'Number of heads in 20 coin flips.',
      'Number of defective items in a sample of 50 from a large production run.',
      'How many of 10 patients recover, if each recovers with probability 0.7.',
      'Number of "yes" answers in a poll of 1,000 randomly chosen voters.',
    ],
    deep: R`<p><b>Construction.</b> \(X = \sum_{i=1}^n B_i\) with \(B_i \overset{iid}{\sim} \text{Bernoulli}(p)\). Linearity gives \(E[X] = np\), and independence gives \(\operatorname{Var}(X) = np(1-p)\). Sums of independent binomials with a common \(p\) are binomial: \(\text{Bin}(n_1,p) + \text{Bin}(n_2,p) = \text{Bin}(n_1+n_2,p)\).</p>
      <p><b>Approximations.</b> (1) <i>Normal:</i> by the de Moivre–Laplace theorem, \((X-np)/\sqrt{np(1-p)} \Rightarrow N(0,1)\). It is usually adequate when \(np(1-p) \gtrsim 10\), and a continuity correction (\(P(X \le k) \approx \Phi\big((k + 0.5 - np)/\sigma\big)\)) helps. (2) <i>Poisson:</i> if \(n\to\infty\), \(p\to 0\) with \(np = \lambda\), then \(X \Rightarrow \text{Poisson}(\lambda)\) (law of rare events). Use the overlays to compare both.</p>
      <p><b>Inference.</b> MLE \(\hat p = X/n\). The Wald interval \(\hat p \pm z\sqrt{\hat p(1-\hat p)/n}\) has poor coverage near 0 or 1. Prefer Wilson or Clopper–Pearson (exact, via the Beta–binomial CDF identity \(P(X \ge k) = I_p(k, n-k+1)\)). With a \(\text{Beta}(\alpha,\beta)\) prior the posterior is \(\text{Beta}(\alpha+k,\beta+n-k)\).</p>
      <p><b>Overdispersion.</b> If \(p\) varies between units, counts are more variable than \(np(1-p)\). The beta-binomial or a quasi-binomial GLM handles that.</p>`,
    pitfalls: [
      'Sampling without replacement from a small population breaks independence. Use the hypergeometric when the sample is more than about 5% of the population.',
      'The number of trials must be fixed. "Flip until you get 3 heads" is negative binomial, not binomial.',
    ],
    overlays: [
      { label: 'Normal approximation', target: 'normal', map: ({ n, p }) => ({ mu: n * p, sigma: Math.sqrt(n * p * (1 - p)) || 1e-6 }) },
      { label: 'Poisson approximation', target: 'poisson', map: ({ n, p }) => ({ lambda: Math.max(1e-6, n * p) }) },
    ],
  });

  // ---------------------------------------------------------------- Geometric
  add({
    id: 'geometric', name: 'Geometric', type: 'discrete',
    notation: R`X \sim \text{Geom}(p)`,
    tagline: 'How many trials it takes to get the first success.',
    params: [{ key: 'p', tex: 'p', min: 0.02, max: 0.98, step: 0.01, value: 0.25, desc: 'Probability of success on each trial.' }],
    lower: () => 1, upper: () => Infinity,
    pmf: (k, { p }) => (k >= 1 && k === Math.floor(k)) ? Math.pow(1 - p, k - 1) * p : 0,
    cdf: (x, { p }) => x < 1 ? 0 : 1 - Math.pow(1 - p, Math.floor(x)),
    sample: ({ p }) => S.rgeom(p),
    mean: ({ p }) => 1 / p,
    variance: ({ p }) => (1 - p) / (p * p),
    skewness: ({ p }) => (2 - p) / Math.sqrt(1 - p),
    kurtosis: ({ p }) => 6 + p * p / (1 - p),
    mode: () => 1,
    formulas: [
      ['support', 'Support', R`k \in \{1, 2, 3, \dots\}`],
      ['pdf', 'PMF', R`P(X=k) = (1-p)^{k-1} p`],
      ['cdf', 'CDF', R`F(k) = 1 - (1-p)^{\lfloor k \rfloor}`],
      ['mean', 'Mean', R`E[X] = \dfrac{1}{p}`],
      ['var', 'Variance', R`\operatorname{Var}(X) = \dfrac{1-p}{p^2}`],
      ['median', 'Median', R`\left\lceil \dfrac{-1}{\log_2(1-p)} \right\rceil`, 1],
      ['skew', 'Skewness', R`\dfrac{2-p}{\sqrt{1-p}}`, 1],
      ['kurt', 'Excess kurtosis', R`6 + \dfrac{p^2}{1-p}`, 1],
      ['mgf', 'MGF', R`M_X(t) = \dfrac{p e^t}{1-(1-p)e^t},\quad t < -\ln(1-p)`, 1],
      ['entropy', 'Entropy', R`\dfrac{-(1-p)\ln(1-p) - p \ln p}{p}`, 1],
    ],
    intuition: R`<p>Keep trying until you succeed, and count the attempts, including the successful one. To need exactly \(k\) tries you must fail \(k-1\) times and then succeed, which is why \(P(X = k) = (1-p)^{k-1}p\). Every bar is \((1-p)\) times the one before it, so the bars shrink geometrically. That is where the name comes from.</p>
      <p>On average you need \(1/p\) tries: with a 1-in-6 chance of rolling a six, you wait 6 rolls on average. The most likely single outcome is always \(k = 1\), even when \(p\) is small.</p>
      <p><b>Memoryless:</b> if you have already failed 10 times, the chance you need more than 3 additional tries is exactly the same as it was at the start. The coin has no memory, so past failures don't make a success "due".</p>`,
    examples: [
      'Number of die rolls until the first six.',
      'Number of sales calls until the first sale.',
      'Number of attempts to pass a driving test.',
      'In networking, the number of transmissions until a packet gets through.',
    ],
    deep: R`<p><b>Memorylessness.</b> \(P(X > m + n \mid X > m) = P(X > n)\). The geometric is the <i>only</i> memoryless distribution on the positive integers; its continuous counterpart is the exponential. In fact if \(T \sim \text{Exp}(\lambda)\) then \(\lceil T \rceil \sim \text{Geom}(1 - e^{-\lambda})\).</p>
      <p><b>Two conventions.</b> This page counts trials (support \(1,2,\dots\)). Many texts and software (R's <code>dgeom</code>, SciPy's <code>nbinom</code>) count failures before the first success, \(Y = X - 1\) on \(0,1,2,\dots\), with mean \((1-p)/p\). Always check which one a formula uses.</p>
      <p><b>Inference.</b> For iid observations the MLE is \(\hat p = 1/\bar X\). The geometric is the special case \(r = 1\) of the negative binomial, and the sum of \(r\) iid geometrics is \(\text{NB}(r,p)\). It also has maximum entropy among distributions on \(\{1,2,\dots\}\) with a given mean.</p>`,
    pitfalls: ['The "gambler’s fallacy": a long losing streak does not make success more likely next time.', 'Check whether a source counts trials (starts at 1) or failures (starts at 0).'],
    overlays: [
      { label: 'Exponential (continuous analog)', target: 'exponential', map: ({ p }) => ({ lambda: -Math.log(1 - p) }), shift: 0.5 },
    ],
  });

  // ---------------------------------------------------------------- Negative binomial
  add({
    id: 'negbinomial', name: 'Negative Binomial', type: 'discrete',
    notation: R`X \sim \text{NB}(r, p)`,
    tagline: 'How many trials it takes to reach r successes. Also the go-to model for overdispersed counts.',
    params: [
      { key: 'r', tex: 'r', min: 1, max: 30, step: 1, value: 3, int: true, desc: 'Number of successes you are waiting for.' },
      { key: 'p', tex: 'p', min: 0.05, max: 0.95, step: 0.01, value: 0.4, desc: 'Probability of success on each trial.' },
    ],
    lower: ({ r }) => r, upper: () => Infinity,
    pmf: (k, { r, p }) => (k >= r && k === Math.floor(k)) ? Math.exp(lc(k - 1, r - 1) + r * Math.log(p) + (k - r) * Math.log(1 - p)) : 0,
    cdf: (x, { r, p }) => { const k = Math.floor(x); return k < r ? 0 : S.betai(r, k - r + 1, p); },
    sample: ({ r, p }) => { let s = 0; for (let i = 0; i < r; i++) s += S.rgeom(p); return s; },
    mean: ({ r, p }) => r / p,
    variance: ({ r, p }) => r * (1 - p) / (p * p),
    skewness: ({ r, p }) => (2 - p) / Math.sqrt(r * (1 - p)),
    kurtosis: ({ r, p }) => 6 / r + p * p / (r * (1 - p)),
    mode: ({ r, p }) => r > 1 ? r + Math.floor((r - 1) * (1 - p) / p) : 1,
    formulas: [
      ['support', 'Support', R`k \in \{r, r+1, r+2, \dots\}`],
      ['pdf', 'PMF', R`P(X=k) = \binom{k-1}{r-1} p^r (1-p)^{k-r}`],
      ['cdf', 'CDF', R`F(k) = I_p(r,\, k - r + 1)`],
      ['mean', 'Mean', R`E[X] = \dfrac{r}{p}`],
      ['var', 'Variance', R`\operatorname{Var}(X) = \dfrac{r(1-p)}{p^2}`],
      ['skew', 'Skewness', R`\dfrac{2-p}{\sqrt{r(1-p)}}`, 1],
      ['kurt', 'Excess kurtosis', R`\dfrac{6}{r} + \dfrac{p^2}{r(1-p)}`, 1],
      ['mgf', 'MGF', R`M_X(t) = \left(\dfrac{p e^t}{1-(1-p)e^t}\right)^{r},\quad t < -\ln(1-p)`, 1],
    ],
    intuition: R`<p>The geometric distribution asks "how long until the first success?". The negative binomial asks "how long until the \(r\)-th success?". To finish on trial \(k\), the last trial must be a success, and exactly \(r-1\) of the earlier \(k-1\) trials must be successes. That's where \(\binom{k-1}{r-1}\) comes from.</p>
      <p>Waiting for \(r\) successes is like waiting for the first success \(r\) times in a row, so the mean is \(r \times \frac1p\). Set \(r = 1\) and you get back the geometric distribution.</p>
      <p>Compare with the binomial: there the number of <i>trials</i> is fixed and the number of successes is random. Here the number of <i>successes</i> is fixed and the number of trials is random.</p>`,
    examples: [
      'Number of at-bats a baseball player needs to get 3 hits.',
      'Number of doors a scout must knock on to sell 5 boxes of cookies.',
      'Number of wells to drill before finding 2 productive ones.',
      'Counts that vary more than a Poisson allows: parasites per fish, insurance claims per driver, gene read counts (RNA-seq).',
    ],
    deep: R`<p><b>Conventions.</b> The "failures" version counts \(Y = X - r\) failures before the \(r\)-th success: \(P(Y=y) = \binom{y+r-1}{y}p^r(1-p)^y\), mean \(r(1-p)/p\). Written with the Gamma function, \(r\) need not be an integer, and \(\binom{y+r-1}{y} = \frac{\Gamma(y+r)}{y!\,\Gamma(r)}\).</p>
      <p><b>Gamma–Poisson mixture.</b> If \(\Lambda \sim \text{Gamma}(r, \text{rate}=\frac{p}{1-p})\) and \(Y\mid\Lambda \sim \text{Poisson}(\Lambda)\), then \(Y\) is NB (failures version). Reparametrizing by mean \(\mu\) gives \(\operatorname{Var}(Y) = \mu + \mu^2/r\). The extra \(\mu^2/r\) is overdispersion relative to Poisson, and \(r \to \infty\) recovers the Poisson. This is the basis of NB regression (e.g. DESeq2, <code>glm.nb</code>).</p>
      <p><b>Duality with the binomial.</b> \(P(X \le k) = P(\text{Bin}(k,p) \ge r)\): needing at most \(k\) trials means at least \(r\) successes in the first \(k\). This gives the incomplete-beta form of the CDF.</p>`,
    pitfalls: ['Software defines NB in several ways (trials vs failures; \((r,p)\) vs \((\mu, \text{size})\)). Check the mean formula before plugging in numbers.'],
    overlays: [
      { label: 'Normal approximation', target: 'normal', map: ({ r, p }) => ({ mu: r / p, sigma: Math.sqrt(r * (1 - p)) / p }) },
    ],
  });

  // ---------------------------------------------------------------- Poisson
  add({
    id: 'poisson', name: 'Poisson', type: 'discrete',
    notation: R`X \sim \text{Poisson}(\lambda)`,
    tagline: 'Counts of events that happen independently at a constant average rate.',
    params: [{ key: 'lambda', tex: R`\lambda`, min: 0.1, max: 50, step: 0.1, value: 4, desc: 'Average number of events per interval (both the mean and the variance).' }],
    lower: () => 0, upper: () => Infinity,
    pmf: (k, { lambda }) => (k >= 0 && k === Math.floor(k)) ? Math.exp(-lambda + k * Math.log(lambda) - S.lgamma(k + 1)) : 0,
    cdf: (x, { lambda }) => x < 0 ? 0 : S.gammq(Math.floor(x) + 1, lambda),
    sample: ({ lambda }) => S.rpois(lambda),
    mean: ({ lambda }) => lambda,
    variance: ({ lambda }) => lambda,
    skewness: ({ lambda }) => 1 / Math.sqrt(lambda),
    kurtosis: ({ lambda }) => 1 / lambda,
    mode: ({ lambda }) => Number.isInteger(lambda) ? `${lambda - 1} and ${lambda}` : Math.floor(lambda),
    formulas: [
      ['support', 'Support', R`k \in \{0, 1, 2, \dots\}`],
      ['pdf', 'PMF', R`P(X=k) = \dfrac{\lambda^k e^{-\lambda}}{k!}`],
      ['cdf', 'CDF', R`F(k) = e^{-\lambda}\sum_{i=0}^{\lfloor k\rfloor} \dfrac{\lambda^i}{i!} = Q(\lfloor k\rfloor + 1, \lambda)`],
      ['mean', 'Mean', R`E[X] = \lambda`],
      ['var', 'Variance', R`\operatorname{Var}(X) = \lambda`],
      ['skew', 'Skewness', R`\lambda^{-1/2}`, 1],
      ['kurt', 'Excess kurtosis', R`\lambda^{-1}`, 1],
      ['mgf', 'MGF', R`M_X(t) = \exp\{\lambda(e^{t}-1)\}`, 1],
      ['pgf', 'PGF', R`G_X(s) = e^{\lambda(s-1)}`, 1],
    ],
    intuition: R`<p>Use the Poisson when you are counting how many times something happens in a fixed stretch of time or space, the events happen independently, and they occur at a steady average rate \(\lambda\). There is no fixed upper limit on the count.</p>
      <p>One way to see it: chop an hour into thousands of tiny slices, each with a tiny chance of containing an event. The count is then binomial with huge \(n\) and tiny \(p\), and \(np = \lambda\). In that limit the binomial becomes the Poisson. (Try the Poisson approximation overlay on the Binomial page.)</p>
      <p>A distinctive fact: the mean and the variance are <b>both</b> \(\lambda\). Small \(\lambda\) gives a lopsided, right-skewed shape piled up near 0. As \(\lambda\) grows the shape becomes a symmetric bell.</p>`,
    examples: [
      'Number of emails you receive in an hour.',
      'Number of typos on a page, or flaws in a meter of fabric.',
      'Goals scored by a team in a soccer match.',
      'Radioactive decays detected per second; calls arriving at a call center per minute.',
      'Classic: Prussian cavalry deaths from horse kicks per corps per year (Bortkiewicz, 1898).',
    ],
    deep: R`<p><b>Poisson process.</b> If events occur with independent increments at rate \(\lambda\), the count in an interval of length \(t\) is \(\text{Poisson}(\lambda t)\), and the gaps between events are iid \(\text{Exp}(\lambda)\). Superposition: \(\text{Poisson}(\lambda_1) + \text{Poisson}(\lambda_2) = \text{Poisson}(\lambda_1+\lambda_2)\) for independent counts. Thinning (keep each event with probability \(q\)) gives \(\text{Poisson}(q\lambda)\).</p>
      <p><b>Conditioning.</b> If \(X_i \sim \text{Poisson}(\lambda_i)\) independently, then given \(\sum X_i = n\), \((X_1,\dots,X_k)\) is Multinomial\((n, \lambda_i/\sum\lambda_j)\). This links Poisson and multinomial likelihoods for contingency tables (log-linear models).</p>
      <p><b>Inference.</b> MLE \(\hat\lambda = \bar X\) (efficient, sufficient). The Gamma\((\alpha,\beta)\) prior is conjugate, with posterior Gamma\((\alpha + \sum x_i,\ \beta + n)\). In a Poisson GLM the canonical link is \(\log\). Since \(E = \operatorname{Var}\), a variance much larger than the mean signals <i>overdispersion</i>; consider the negative binomial. \(\sqrt{X}\) is approximately variance-stabilizing (\(\operatorname{Var}\sqrt X \approx 1/4\)).</p>
      <p><b>Exact CDF link.</b> \(P(X \le k) = P(\text{Gamma}(k+1, 1) > \lambda)\). This relationship gives exact confidence intervals for \(\lambda\) via chi-square quantiles.</p>`,
    pitfalls: ['Events must be independent with a constant rate. Clustered events (e.g. contagious disease cases) usually show variance > mean.', 'Too many zeros compared with Poisson suggests a zero-inflated model.'],
    overlays: [
      { label: 'Normal approximation', target: 'normal', map: ({ lambda }) => ({ mu: lambda, sigma: Math.sqrt(lambda) }) },
    ],
  });

  // ---------------------------------------------------------------- Hypergeometric
  add({
    id: 'hypergeometric', name: 'Hypergeometric', type: 'discrete',
    notation: R`X \sim \text{Hypergeometric}(N, K, n)`,
    tagline: 'Successes in a sample drawn without replacement from a finite population.',
    params: [
      { key: 'N', tex: 'N', min: 2, max: 200, step: 1, value: 52, int: true, desc: 'Population size (e.g. 52 cards in a deck).' },
      { key: 'K', tex: 'K', min: 0, max: 200, step: 1, value: 13, int: true, maxFrom: 'N', desc: 'Number of “success” items in the population (e.g. 13 hearts).' },
      { key: 'n', tex: 'n', min: 1, max: 200, step: 1, value: 5, int: true, maxFrom: 'N', desc: 'Number drawn without replacement (e.g. a 5-card hand).' },
    ],
    constrain: p => { p.K = Math.min(p.K, p.N); p.n = Math.min(p.n, p.N); },
    lower: ({ N, K, n }) => Math.max(0, n + K - N), upper: ({ K, n }) => Math.min(n, K),
    pmf: (k, { N, K, n }) => {
      if (k !== Math.floor(k) || k < Math.max(0, n + K - N) || k > Math.min(n, K)) return 0;
      return Math.exp(lc(K, k) + lc(N - K, n - k) - lc(N, n));
    },
    sample: ({ N, K, n }) => { let good = K, tot = N, k = 0; for (let i = 0; i < n; i++) { if (Math.random() * tot < good) { k++; good--; } tot--; } return k; },
    mean: ({ N, K, n }) => n * K / N,
    variance: ({ N, K, n }) => N > 1 ? n * (K / N) * (1 - K / N) * (N - n) / (N - 1) : 0,
    numericMoments: true,
    mode: ({ N, K, n }) => Math.floor((n + 1) * (K + 1) / (N + 2)),
    formulas: [
      ['support', 'Support', R`\max(0, n+K-N) \le k \le \min(n, K)`],
      ['pdf', 'PMF', R`P(X=k) = \dfrac{\binom{K}{k}\binom{N-K}{n-k}}{\binom{N}{n}}`],
      ['mean', 'Mean', R`E[X] = n\dfrac{K}{N}`],
      ['var', 'Variance', R`\operatorname{Var}(X) = n\dfrac{K}{N}\dfrac{N-K}{N}\cdot\dfrac{N-n}{N-1}`],
      ['skew', 'Skewness', R`\dfrac{(N-2K)(N-1)^{1/2}(N-2n)}{[nK(N-K)(N-n)]^{1/2}(N-2)}`, 1],
      ['mgf', 'MGF', R`\dfrac{\binom{N-K}{n}}{\binom{N}{n}}\,{}_2F_1(-n,-K;N-K-n+1;e^{t})`, 1],
    ],
    intuition: R`<p>A deck has \(N = 52\) cards, \(K = 13\) of which are hearts. Deal \(n = 5\) cards. How many hearts do you get? Because dealt cards don't go back in the deck, each draw changes the odds for the next one. This is <b>sampling without replacement</b>.</p>
      <p>The formula is pure counting: choose \(k\) of the \(K\) hearts, choose the other \(n-k\) cards from the \(N-K\) non-hearts, and divide by the total number of possible hands.</p>
      <p>The average is \(n \cdot K/N\), the same as the binomial with \(p = K/N\). The spread is a bit smaller, by the factor \(\frac{N-n}{N-1}\). Make \(N\) large while keeping \(K/N\) fixed, and it becomes indistinguishable from the binomial (try the overlay).</p>`,
    examples: [
      'Number of hearts in a 5-card poker hand.',
      'Lottery: how many of your 6 numbers match the 6 drawn from 49.',
      'Quality control: defective items in a sample of 20 from a lot of 200.',
      'Capture–recapture: tagged fish in a second catch, used to estimate population size.',
      'Fisher’s exact test for 2×2 tables.',
    ],
    deep: R`<p><b>Finite population correction.</b> The factor \(\frac{N-n}{N-1}\) shrinks the binomial variance. It matters in survey sampling: the standard error of a sample proportion is \(\sqrt{\frac{p(1-p)}{n}\cdot\frac{N-n}{N-1}}\). When \(n = N\) (a census), the variance is 0.</p>
      <p><b>Exchangeability.</b> Writing \(X = \sum_{i=1}^n \mathbf 1\{\text{draw } i \text{ is a success}\}\), each indicator has mean \(K/N\), but the indicators are negatively correlated: \(\operatorname{Cov} = -\frac{K(N-K)}{N^2(N-1)}\). Summing the covariance terms gives the variance formula.</p>
      <p><b>Fisher’s exact test.</b> Conditioning a 2×2 table on both margins makes the top-left cell hypergeometric under independence. The p-value sums hypergeometric probabilities of tables as or more extreme. The multivariate hypergeometric generalizes to more than two categories.</p>
      <p><b>Capture–recapture.</b> Mark \(K\) animals, later capture \(n\), and observe \(k\) marked. The Lincoln–Petersen estimator is \(\hat N = Kn/k\) (Chapman's version, \(\frac{(K+1)(n+1)}{k+1}-1\), reduces bias).</p>`,
    pitfalls: ['If the sample is under about 5% of the population, the binomial is a fine (simpler) approximation.'],
    overlays: [
      { label: 'Binomial (with replacement)', target: 'binomial', map: ({ N, K, n }) => ({ n, p: K / N }) },
    ],
  });

  // ---------------------------------------------------------------- Discrete uniform
  add({
    id: 'discreteuniform', name: 'Discrete Uniform', type: 'discrete',
    notation: R`X \sim \mathcal{U}\{a, \dots, b\}`,
    tagline: 'Every whole number from a to b is equally likely. A fair die.',
    params: [
      { key: 'a', tex: 'a', min: -10, max: 20, step: 1, value: 1, int: true, desc: 'Smallest possible value.' },
      { key: 'b', tex: 'b', min: -10, max: 30, step: 1, value: 6, int: true, desc: 'Largest possible value.' },
    ],
    constrain: (p, changed) => { if (p.b < p.a) { if (changed === 'a') p.b = p.a; else p.a = p.b; } },
    lower: ({ a }) => a, upper: ({ b }) => b,
    pmf: (k, { a, b }) => (k >= a && k <= b && k === Math.floor(k)) ? 1 / (b - a + 1) : 0,
    cdf: (x, { a, b }) => x < a ? 0 : x >= b ? 1 : (Math.floor(x) - a + 1) / (b - a + 1),
    sample: ({ a, b }) => a + Math.floor(Math.random() * (b - a + 1)),
    mean: ({ a, b }) => (a + b) / 2,
    variance: ({ a, b }) => ((b - a + 1) ** 2 - 1) / 12,
    skewness: () => 0,
    kurtosis: ({ a, b }) => { const n = b - a + 1; return n > 1 ? -6 * (n * n + 1) / (5 * (n * n - 1)) : NaN; },
    mode: ({ a, b }) => a === b ? a : 'every value',
    view: ({ a, b }) => [a - 1, b + 1],
    formulas: [
      ['support', 'Support', R`k \in \{a, a+1, \dots, b\},\ \ m = b-a+1`],
      ['pdf', 'PMF', R`P(X=k) = \dfrac{1}{m}`],
      ['cdf', 'CDF', R`F(k) = \dfrac{\lfloor k \rfloor - a + 1}{m}`],
      ['mean', 'Mean', R`E[X] = \dfrac{a+b}{2}`],
      ['var', 'Variance', R`\operatorname{Var}(X) = \dfrac{m^2-1}{12}`],
      ['kurt', 'Excess kurtosis', R`-\dfrac{6(m^2+1)}{5(m^2-1)}`, 1],
      ['mgf', 'MGF', R`M_X(t) = \dfrac{e^{at} - e^{(b+1)t}}{m(1-e^{t})}`, 1],
      ['entropy', 'Entropy', R`\ln m`, 1],
    ],
    intuition: R`<p>The simplest possible distribution: \(m = b - a + 1\) outcomes, all equally likely, each with probability \(1/m\). A fair six-sided die is \(\mathcal U\{1,\dots,6\}\).</p>
      <p>The mean is the midpoint \((a+b)/2\). For a die that's 3.5, a value you can never actually roll, which is a good reminder that an "expected value" is a long-run average and need not be a likely outcome.</p>`,
    examples: [
      'Rolling a fair die; spinning a fair spinner with numbered sections.',
      'Picking a random digit 0–9, or a random winner from a numbered list.',
      'Random number generators: the building block for simulating every other distribution.',
    ],
    deep: R`<p><b>German tank problem.</b> Serial numbers \(1,\dots,N\) are observed on \(k\) captured tanks, with maximum \(M\). The MLE \(\hat N = M\) is biased low. The minimum-variance unbiased estimator is \(\hat N = M + \frac{M}{k} - 1\) (\(M\) is complete and sufficient, so Lehmann–Scheffé applies). In WWII, this estimate was far more accurate than intelligence reports.</p>
      <p><b>Maximum entropy.</b> Among distributions on \(m\) points, the uniform maximizes entropy (\(\ln m\)). This is the formal version of "no reason to prefer any outcome."</p>
      <p><b>Sums.</b> The sum of two independent dice is triangular on \(2..12\); sums of many converge to normal (try a sum in the CLT lab with a uniform source).</p>`,
    overlays: [
      { label: 'Continuous uniform analog', target: 'uniform', map: ({ a, b }) => ({ a: a - 0.5, b: b + 0.5 }) },
    ],
  });
})();
