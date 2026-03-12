#!/usr/bin/env node
// oklch-ramp generator — extracted from oklch-ramp-studio/index.html
// All math is identical to the browser tool; this is a pure CLI wrapper.

// ── COLOR MATH ──────────────────────────────────────────────────────────────

function oklchToLinearRGB(L, C, h) {
  const hr = h * Math.PI / 180;
  const a_ = C * Math.cos(hr);
  const b_ = C * Math.sin(hr);

  const l_ = L + 0.3963377774 * a_ + 0.2158037573 * b_;
  const m_ = L - 0.1055613458 * a_ - 0.0638541728 * b_;
  const s_ = L - 0.0894841775 * a_ - 1.2914855480 * b_;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  ];
}

function linearToSRGB(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function clamp01(x) { return Math.max(0, Math.min(1, x)); }

function isInGamut(r, g, b, eps = 0.001) {
  return r >= -eps && r <= 1 + eps && g >= -eps && g <= 1 + eps && b >= -eps && b <= 1 + eps;
}

function smartGamutMap(L, C, h) {
  let [r, g, b] = oklchToLinearRGB(L, C, h);
  if (isInGamut(r, g, b)) return { r, g, b, clipped: false };
  let lo = 0, hi = C, mid;
  for (let i = 0; i < 24; i++) {
    mid = (lo + hi) / 2;
    [r, g, b] = oklchToLinearRGB(L, mid, h);
    isInGamut(r, g, b) ? (lo = mid) : (hi = mid);
  }
  [r, g, b] = oklchToLinearRGB(L, lo, h);
  return { r, g, b, clipped: true };
}

function findMaxChroma(L, h) {
  let lo = 0, hi = 0.5;
  let [r, g, b] = oklchToLinearRGB(L, hi, h);
  if (isInGamut(r, g, b)) {
    while (isInGamut(...oklchToLinearRGB(L, hi, h)) && hi < 1) hi *= 2;
  }
  let mid;
  for (let i = 0; i < 28; i++) {
    mid = (lo + hi) / 2;
    [r, g, b] = oklchToLinearRGB(L, mid, h);
    isInGamut(r, g, b) ? (lo = mid) : (hi = mid);
  }
  return lo;
}

function compressGamutMap(L, C, h, ratio) {
  const maxC = findMaxChroma(L, h);
  if (C <= maxC) {
    const [r, g, b] = oklchToLinearRGB(L, C, h);
    return { r, g, b, clipped: false };
  }
  const compressedC = maxC + (C - maxC) / ratio;
  const [r, g, b] = oklchToLinearRGB(L, compressedC, h);
  return { r, g, b, clipped: true };
}

function oklchToHex(L, C, h, mode, ratio = 4) {
  let r, g, b, clipped = false;
  if (mode === 'smart') {
    ({ r, g, b, clipped } = smartGamutMap(L, C, h));
  } else if (mode === 'compress') {
    ({ r, g, b, clipped } = compressGamutMap(L, C, h, ratio));
  } else {
    [r, g, b] = oklchToLinearRGB(L, C, h);
    if (!isInGamut(r, g, b)) clipped = true;
  }
  r = linearToSRGB(clamp01(r));
  g = linearToSRGB(clamp01(g));
  b = linearToSRGB(clamp01(b));
  const toH = x => Math.round(clamp01(x) * 255).toString(16).padStart(2, '0');
  return { hex: `#${toH(r)}${toH(g)}${toH(b)}`, clipped };
}

function chromaCurve(L, peakC, peakL, satMult) {
  const t = L <= peakL ? L / peakL : (1 - L) / (1 - peakL);
  return satMult * peakC * Math.sqrt(Math.max(0, t));
}

// Maps linear t ∈ [0,1] to redistributed t based on spacing mode.
// t=0 → light end, t=1 → dark end.
function remapT(t, mode) {
  if (mode === 'linear') return t;
  if (mode === 'parabolic') return 0.5 - 0.5 * Math.cos(Math.PI * t);
  if (mode === 'adjusted') return Math.pow(t, 0.77);
  return t;
}

// ── RAMP GENERATION ─────────────────────────────────────────────────────────

function generateRamp(p) {
  const swatches = [];
  for (let i = 0; i < p.steps; i++) {
    const tLinear = i / (p.steps - 1);
    const t = remapT(tLinear, p.lSpacing || 'linear');
    const L = p.lightEnd - t * (p.lightEnd - p.darkEnd);
    const hueAtStep = p.hue + p.hueShift * (t - 0.5) * 2;
    const C = chromaCurve(L, p.peakChroma, p.peakL, p.sat);
    const { hex, clipped } = oklchToHex(L, C, hueAtStep, p.gamut, p.compRatio);
    const stepKey = Math.round(tLinear * 900 + 50);
    swatches.push({ L, C, h: hueAtStep, hex, clipped, step: stepKey, index: i });
  }
  return swatches;
}

// ── FORMATTERS ───────────────────────────────────────────────────────────────

function formatCSS(swatches, name) {
  const lines = [':root {'];
  // light → dark order (step 50 first, 950 last)
  [...swatches].reverse().forEach(s => {
    const clip = s.clipped ? ' /* gamut-mapped */' : '';
    lines.push(`  --${name}-${s.step}: ${s.hex};${clip}`);
  });
  lines.push('}');
  return lines.join('\n');
}

function formatJSON(swatches, name) {
  const obj = {};
  [...swatches].reverse().forEach(s => { obj[String(s.step)] = s.hex; });
  return JSON.stringify({ [name]: obj }, null, 2);
}

function formatSCSS(swatches, name) {
  const lines = [`$${name}: (`];
  [...swatches].reverse().forEach(s => {
    lines.push(`  "${s.step}": ${s.hex},`);
  });
  lines.push(');');
  return lines.join('\n');
}

function formatTailwind(swatches, name) {
  const lines = [`'${name}': {`];
  [...swatches].reverse().forEach(s => {
    lines.push(`  '${s.step}': '${s.hex}',`);
  });
  lines.push('}');
  return lines.join('\n');
}

function formatHex(swatches) {
  // darkest (950) → lightest (50)
  return swatches.map(s => `${s.step}\t${s.hex}`).join('\n');
}

// ── ARG PARSING ──────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const get = (flag, def) => {
    const i = args.indexOf(flag);
    return i !== -1 && args[i + 1] !== undefined ? args[i + 1] : def;
  };

  return {
    hue:        parseFloat(get('--hue', '250')),
    sat:        parseFloat(get('--saturation', '1.0')),
    peakChroma: parseFloat(get('--peakChroma', '0.18')),
    peakL:      parseFloat(get('--peakL', '0.55')),
    lightEnd:   parseFloat(get('--lightEnd', '0.97')),
    darkEnd:    parseFloat(get('--darkEnd', '0.12')),
    steps:      parseInt(get('--steps', '11'), 10),
    hueShift:   parseFloat(get('--hueShift', '0')),
    gamut:      get('--gamut', 'smart'),       // smart | naive | compress
    compRatio:  parseFloat(get('--compRatio', '4')),
    lSpacing:   get('--spacing', 'linear'),    // linear | parabolic | adjusted
    format:     get('--format', 'css'),        // css | json | scss | tailwind | hex
    name:       get('--name', 'color'),
  };
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

const p = parseArgs(process.argv);

// Validate steps is odd and in range
if (p.steps % 2 === 0) {
  process.stderr.write(`Warning: steps must be odd. Rounding ${p.steps} → ${p.steps + 1}\n`);
  p.steps += 1;
}

const swatches = generateRamp(p);
const clippedCount = swatches.filter(s => s.clipped).length;

let output;
switch (p.format) {
  case 'json':     output = formatJSON(swatches, p.name); break;
  case 'scss':     output = formatSCSS(swatches, p.name); break;
  case 'tailwind': output = formatTailwind(swatches, p.name); break;
  case 'hex':      output = formatHex(swatches); break;
  default:         output = formatCSS(swatches, p.name);
}

process.stdout.write(output + '\n');

if (clippedCount > 0) {
  process.stderr.write(`Note: ${clippedCount} of ${p.steps} stops were gamut-mapped (mode: ${p.gamut})\n`);
}
