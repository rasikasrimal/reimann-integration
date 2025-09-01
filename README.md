# Riemann Integral Visualizer

Interactive web app to explore Riemann sums and numerical integration methods. Built with Next.js, React, D3 and Framer Motion.

## Features
- Function expression parsing with Math.js
- Draggable interval endpoints and partition slider
- Left, Right, Midpoint, Upper, Lower, Trapezoid and Simpson methods
- Animated SVG plot with D3 and Framer Motion
- Numeric dashboard comparing sums to a high accuracy reference integral
- Export plot as PNG and table of rectangles as CSV
- Shareable URL reflecting current settings
- Light/Dark themes and accessible controls

## Getting Started

```bash
npm install
npm run dev
```
Visit `http://localhost:3000` in your browser.

### Build for production
```bash
npm run build
npm start
```

### Run tests
```bash
npm test
```

## Deployment

### Vercel
1. Push this repo to GitHub.
2. On Vercel, create a new project from the repo.
3. Build command: `npm run build`. Output directory: `out` (static export).

### Netlify
1. Push the repo to GitHub.
2. Create a new Netlify site from the repo.
3. Build command: `npm run build`. Publish directory: `out`.

## Usage
- Enter an expression like `sin(x)+1`, `x^2`, or `exp(-x*x)`.
- Drag the red handles or edit numbers for interval `[a,b]`.
- Adjust partition `n` with the slider or play button to animate.
- Toggle methods in the legend to compare sums.
- View numeric values and errors in the dashboard.
- Use the export buttons to save the current view.

## Tests
Basic tests for Riemann sum utilities live in `tests/riemann.test.js` and run with Vitest.

## License
MIT
