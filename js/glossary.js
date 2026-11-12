/* Hover / tap definitions for statistics terms, applied to the text of every page. */
(function () {
  'use strict';
  const G = window.GUIDE;

  // [aliases, definition]. The first alias is the display name.
  const TERMS = [
    [['random variable', 'random variables'], 'A number whose value comes from a random process, like the number of heads in 10 flips or the time until the next bus.'],
    [['probability distribution', 'distribution', 'distributions'], 'The full description of a random variable: which values it can take and how likely each one is.'],
    [['parameter', 'parameters'], 'A setting that picks one member of a family of distributions, such as the mean μ and SD σ of a normal. Move the sliders to change them.'],
    [['PMF', 'probability mass function'], 'Probability mass function: for a discrete variable, the probability of each exact value, P(X = k). Shown as bars that add up to 1.'],
    [['PDF', 'probability density function', 'density curve', 'density'], 'Probability density function: for a continuous variable, a curve whose area over an interval is the probability of landing there. Its height alone is not a probability.'],
    [['CDF', 'cumulative distribution function'], 'Cumulative distribution function: F(x) = P(X ≤ x), the total probability at or below x. It rises from 0 to 1.'],
    [['expected value', 'mean'], 'The long-run average value if you repeated the random process many times. Also the balance point of the distribution.'],
    [['variance'], 'Average squared distance from the mean. It measures spread, in squared units.'],
    [['standard deviation', 'SD'], 'The square root of the variance: a typical distance from the mean, in the same units as the data.'],
    [['median'], 'The middle value: half the probability lies below it and half above.'],
    [['mode'], 'The most likely value: the peak of the PMF or PDF.'],
    [['skewness', 'skewed', 'right-skewed', 'skew'], 'Lopsidedness. Right-skewed means a long tail to the right (a few very large values). Symmetric distributions have skewness 0.'],
    [['kurtosis', 'excess kurtosis'], 'How heavy the tails are compared with a normal distribution. Excess kurtosis above 0 means more extreme values than a normal.'],
    [['percentile', 'quantile', 'quantiles', 'percentiles'], 'The value with a given share of the probability below it. The 95th percentile has 95% below it.'],
    [['z-score', 'z-scores', 'standardize', 'standardizing'], 'How many standard deviations a value is from the mean: z = (x − mean) / SD.'],
    [['standard normal'], 'The normal distribution with mean 0 and SD 1, written N(0, 1). Any normal becomes this one after converting to z-scores.'],
    [['independent', 'independence', 'independently'], 'Two random events are independent when knowing the result of one tells you nothing about the other.'],
    [['iid'], 'Independent and identically distributed: separate draws from the same distribution that don’t affect each other.'],
    [['trial', 'trials'], 'One repetition of a random experiment with a yes/no outcome, like one coin flip or one free throw.'],
    [['sample'], 'The data you actually observe: a subset drawn from a larger population or process.'],
    [['population'], 'The whole group (or the underlying process) you want to learn about, as opposed to the sample you measured.'],
    [['sample mean'], 'The average of the observed data, x̄. It estimates the true mean and gets more accurate with more data.'],
    [['histogram'], 'A bar chart of data where each bar counts how many values fall in a range.'],
    [['support'], 'The set of values a random variable can actually take, such as 0, 1, 2, … or all positive numbers.'],
    [['heavy tails', 'heavy-tailed', 'tails', 'tail'], 'The far ends of a distribution. Heavy tails mean extreme values happen much more often than a normal distribution would suggest.'],
    [['outlier', 'outliers'], 'A value far from the rest of the data.'],
    [['degrees of freedom'], 'A parameter of the t, chi-square and F distributions, usually tied to sample size (often n − 1). It counts how many independent pieces of information go into an estimate.'],
    [['p-value'], 'If the null hypothesis were true, the chance of a result at least as extreme as the one observed. Small p-values are evidence against the null.'],
    [['null hypothesis'], 'The "nothing interesting is going on" claim a test starts from, such as "the die is fair".'],
    [['critical value', 'critical values'], 'The cutoff a test statistic must pass to be "significant" at a chosen level α. It is a quantile of the test statistic’s distribution.'],
    [['confidence interval', 'confidence intervals'], 'A range built from data that captures the true value in a stated share (e.g. 95%) of repeated samples.'],
    [['Central Limit Theorem', 'CLT'], 'Averages (and sums) of many independent values are approximately normal, whatever the shape of the original distribution, as long as its variance is finite.'],
    [['law of large numbers'], 'As you collect more data, the sample average gets closer and closer to the true mean.'],
    [['memoryless', 'memorylessness'], 'Past waiting doesn’t change future waiting: having waited 10 minutes, the extra wait has the same distribution as a fresh start.'],
    [['overdispersion', 'overdispersed'], 'Count data that vary more than a Poisson model allows (variance larger than the mean).'],
    [['without replacement'], 'Each item drawn is set aside, so it can’t be drawn again and the odds change for the next draw.'],
    [['maximum likelihood', 'MLE'], 'An estimation method: choose the parameter values under which the observed data would have been most probable.'],
    [['conjugate prior'], 'In Bayesian statistics, a prior that produces a posterior from the same family after seeing data, so updating is just arithmetic on the parameters.'],
    [['MGF', 'moment generating function'], 'M(t) = E[e^{tX}]. Its derivatives at 0 give the moments (mean, E[X²], …), and it turns sums of independent variables into products.'],
    [['Fisher information'], 'How much information one observation carries about a parameter. 1 / (n × information) is the best achievable variance for an unbiased estimate (Cramér–Rao bound).'],
    [['sufficient statistic'], 'A summary of the data that keeps all the information about a parameter; once you know it, the rest of the data adds nothing.'],
  ];

  const lookup = new Map();
  const aliases = [];
  TERMS.forEach(([names, def], i) => names.forEach(n => { lookup.set(n.toLowerCase(), i); aliases.push(n); }));
  aliases.sort((a, b) => b.length - a.length);
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const RE = new RegExp(`(?<![\\w-])(${aliases.map(esc).join('|')})(?![\\w-])`, 'gi');
  // Acronyms only match in their exact case
  const caseSensitive = new Set(['PMF', 'PDF', 'CDF', 'SD', 'MLE', 'MGF', 'CLT']);

  const SKIP = 'a, button, label, th, select, option, input, textarea, code, pre, svg, canvas, h1, .katex, .term, .no-gloss, summary, .badge, .kind-chip, .legend, .hint, .tile, .dcard, .nav-item, .mech-status, .calc-result, .sim-stats';

  G.glossarize = function (root) {
    if (!root) return;
    const blocks = root.querySelectorAll('.card, .widget, .lead, .hero');
    const scopes = blocks.length ? blocks : [root];
    scopes.forEach(scope => {
      if (scope.closest('.no-gloss')) return;
      if (scope !== root && scope.parentElement && scope.parentElement.closest('.card, .widget, .lead, .hero')) return; // handled by its outer block
      const used = new Set();
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
        acceptNode: n => (n.nodeValue.trim().length < 3 || (n.parentElement && n.parentElement.closest(SKIP))) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
      });
      const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      for (const node of nodes) {
        const text = node.nodeValue;
        RE.lastIndex = 0;
        let m, last = 0, frag = null;
        while ((m = RE.exec(text))) {
          const word = m[1], key = lookup.get(word.toLowerCase());
          if (key == null || used.has(key)) continue;
          if (caseSensitive.has(word.toUpperCase()) && word !== word.toUpperCase()) continue;
          if (word.toLowerCase() === 'sd' && word !== 'SD') continue;
          used.add(key);
          frag = frag || document.createDocumentFragment();
          frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          const span = document.createElement('span');
          span.className = 'term'; span.tabIndex = 0; span.dataset.term = key; span.textContent = word;
          span.setAttribute('role', 'button'); span.setAttribute('aria-label', `${word}: show definition`);
          frag.appendChild(span);
          last = m.index + word.length;
        }
        if (frag) { frag.appendChild(document.createTextNode(text.slice(last))); node.parentNode.replaceChild(frag, node); }
      }
    });
  };

  // ---- single floating tooltip
  const tip = document.createElement('div');
  tip.className = 'gloss-tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
  document.body.appendChild(tip);
  let current = null;
  function show(el) {
    const i = +el.dataset.term, [names, def] = TERMS[i];
    tip.innerHTML = `<b>${names[0].charAt(0).toUpperCase() + names[0].slice(1)}</b><span>${def}</span>`;
    tip.hidden = false; current = el;
    const r = el.getBoundingClientRect(), tw = Math.min(320, window.innerWidth - 24);
    tip.style.maxWidth = tw + 'px';
    let left = Math.min(window.innerWidth - tw - 12, Math.max(12, r.left + r.width / 2 - tw / 2));
    tip.style.left = left + 'px';
    const th = tip.offsetHeight;
    const below = r.bottom + 8 + th < window.innerHeight;
    tip.style.top = (below ? r.bottom + 8 : r.top - th - 8) + 'px';
  }
  function hide() { tip.hidden = true; current = null; }
  document.addEventListener('mouseover', e => { const t = e.target.closest && e.target.closest('.term'); if (t) show(t); });
  document.addEventListener('mouseout', e => { const t = e.target.closest && e.target.closest('.term'); if (t && !t.contains(e.relatedTarget)) hide(); });
  document.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('term')) show(e.target); });
  document.addEventListener('focusout', e => { if (e.target.classList && e.target.classList.contains('term')) hide(); });
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('.term');
    if (t) { if (current === t && !tip.hidden) hide(); else show(t); } else if (!e.target.closest('.gloss-tip')) hide();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  window.addEventListener('scroll', hide, { passive: true });
  G.glossary = TERMS;
})();
