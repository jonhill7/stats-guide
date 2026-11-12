# Distributions Guide

An interactive, visual guide to 20 major probability distributions, for everyone from intro-stats students to grad students.

**To use it, open `index.html` in any modern browser.** It needs no install, build step, or internet connection, because KaTeX is bundled in `lib/`.

## What's inside
- **20 distributions.** Discrete: Bernoulli, Binomial, Geometric, Negative Binomial, Poisson, Hypergeometric, Discrete Uniform. Continuous: Uniform, Normal, Exponential, Gamma, Beta, Chi-square, Student's t, F, Log-normal, Weibull, Cauchy, Laplace, Pareto.
- **Every distribution page has:**
  - parameter sliders with live PMF/PDF and CDF plots (axes can be locked so you can watch the shape change)
  - hover readouts
  - a probability calculator (shaded area, plus the F(b) − F(a) bracket on the CDF) and a percentile finder
  - a sampling simulator that overlays a histogram
  - approximation overlays (e.g. the normal approximation to the binomial)
  - a live summary of mean, SD, median, mode, skewness and kurtosis
  - sections on intuition, examples, formulas, a deep dive, pitfalls and related distributions
- **Intro / Advanced toggle.** Intro covers intuition and core formulas. Advanced adds MGFs and characteristic functions, higher moments, derivations, inference, conjugacy and limit theorems.
- **Other pages:**
  - Basics primer
  - "Which distribution?" chooser
  - Interactive relationship map
  - Central Limit Theorem lab
  - Formula cheat sheet

## Files
- `js/dist-discrete.js` and `js/dist-continuous.js` hold each distribution's math and text. Edit these to add or change content.
- `js/relations.js` holds the relationship map's edges and node positions.
- `js/stats.js` has the special functions (gamma, incomplete gamma/beta), quantiles and random samplers.
- `js/plot.js` is a small SVG charting helper. `js/app.js` and `js/pages.js` contain the UI.
