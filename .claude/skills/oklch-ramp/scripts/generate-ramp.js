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

function cielchToLinearRGB(L, C, h) {
  const hr = h * Math.PI / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const t0 = 6 / 29;
  const labF = t => t > t0 ? t * t * t : 3 * t0 * t0 * (t - 4 / 29);
  const X = 0.95047 * labF(fx);
  const Y = 1.00000 * labF(fy);
  const Z = 1.08883 * labF(fz);
  return [
    +3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z,
    -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z,
    +0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z
  ];
}

function srlchToLinearRGB(L, C, h) {
  const hr = h * Math.PI / 180;
  const a  = C * Math.cos(hr);
  const b  = C * Math.sin(hr);
  let x = 0.01 * L + 0.000904127 * a + 0.000456344 * b;
  let y = 0.01 * L - 0.000533159 * a - 0.000269178 * b;
  let z = 0.01 * L                   - 0.005800000 * b;
  const invF = t => t <= 0.08 ? t * (2700 / 24389) : Math.pow((t + 0.16) / 1.16, 3);
  x = invF(x); y = invF(y); z = invF(z);
  return [
    +5.435679 * x - 4.599131 * y + 0.163593 * z,
    -1.168090 * x + 2.327977 * y - 0.159798 * z,
    +0.037840 * x - 0.198564 * y + 1.160644 * z
  ];
}

const CIELCH_L_SCALE   = 100, CIELCH_C_SCALE   = 300;
const CIELCHUV_L_SCALE = 100, CIELCHUV_C_SCALE = 300;
const SRLCH_L_SCALE    = 100, SRLCH_C_SCALE    = 300;
const JZCZHZ_L_SCALE   = 1,   JZCZHZ_C_SCALE   = 0.5;

// CIELChUV (cylindrical CIELUV) → linear sRGB.  L in [0,100], C in [0,~170], h in degrees.
function cielchuvToLinearRGB(L, C, h) {
  if (L <= 0) return [0, 0, 0];
  const hr = h * Math.PI / 180;
  const uStar = C * Math.cos(hr);
  const vStar = C * Math.sin(hr);
  const fy = (L + 16) / 116;
  const t0 = 6 / 29;
  const labF = t => t > t0 ? t * t * t : 3 * t0 * t0 * (t - 4 / 29);
  const Y = labF(fy);
  const u_n = 0.19783001, v_n = 0.46831999;
  const uPrime = uStar / (13 * L) + u_n;
  const vPrime = vStar / (13 * L) + v_n;
  const X = 9 * Y * uPrime / (4 * vPrime);
  const Z = Y * (12 - 3 * uPrime - 20 * vPrime) / (4 * vPrime);
  return [
    +3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z,
    -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z,
    +0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z
  ];
}

// JzCzHz (cylindrical JzAzBz, Safdar 2017) → linear sRGB.
// Jz in [0, ~1] (D65 white ≈ 0.9999 at 203 cd/m²), Cz in [0, ~0.22], h in degrees.
function jzczhzToLinearRGB(Jz, Cz, h) {
  if (Jz <= 0) return [0, 0, 0];
  const hr = h * Math.PI / 180;
  const az = Cz * Math.cos(hr);
  const bz = Cz * Math.sin(hr);
  // Jz → Iz
  const d = -0.56, d0 = 1.6295499532821566e-11;
  const Iz = (Jz + d0) / (1 + d - d * (Jz + d0));
  // Iz,az,bz → L',M',S' (inverse M2, Safdar 2017)
  const Lp = Iz + 0.138605043271539 * az + 0.058047316156119 * bz;
  const Mp = Iz - 0.138605043271539 * az - 0.058047316156119 * bz;
  const Sp = Iz - 0.096019242067827 * az - 0.811891896056039 * bz;
  // Inverse PQ (ST 2084) → absolute LMS (cd/m²)
  const n = 0.15930175896, m = 78.84375;
  const c1 = 0.8359375, c2 = 18.8515625, c3 = 18.6875;
  const invPQ = x => {
    const xm = Math.pow(Math.max(x, 0), 1 / m);
    return 203 * Math.pow(Math.max(xm - c1, 0) / (c2 - c3 * xm), 1 / n);
  };
  const l = invPQ(Lp), ms = invPQ(Mp), s = invPQ(Sp);
  // Absolute LMS → absolute XYZ D65 (inverse M1, Safdar 2017)
  const X =  1.9242264357876067 * l - 1.0047923125953657 * ms + 0.037651404030618  * s;
  const Y =  0.3503167620949991 * l + 0.7264811939316552 * ms - 0.065384422948085  * s;
  const Z = -0.0909828109828475 * l - 0.3127282905230739 * ms + 1.5227665613052603 * s;
  // Absolute XYZ → relative XYZ (÷203), then D65 → linear sRGB
  const Xr = X / 203, Yr = Y / 203, Zr = Z / 203;
  return [
    +3.2404542 * Xr - 1.5371385 * Yr - 0.4985314 * Zr,
    -0.9692660 * Xr + 1.8760108 * Yr + 0.0415560 * Zr,
    +0.0556434 * Xr - 0.2040259 * Yr + 1.0572252 * Zr
  ];
}

function uiToLinearRGB(L, C, h, colorSpace) {
  if (colorSpace === 'cielch')   return cielchToLinearRGB(L * CIELCH_L_SCALE,     C * CIELCH_C_SCALE,   h);
  if (colorSpace === 'cielchuv') return cielchuvToLinearRGB(L * CIELCHUV_L_SCALE, C * CIELCHUV_C_SCALE, h);
  if (colorSpace === 'srlch')    return srlchToLinearRGB(L * SRLCH_L_SCALE,       C * SRLCH_C_SCALE,    h);
  if (colorSpace === 'jzczhz')   return jzczhzToLinearRGB(L * JZCZHZ_L_SCALE,     C * JZCZHZ_C_SCALE,   h);
  return oklchToLinearRGB(L, C, h);
}

function linearToSRGB(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function clamp01(x) { return Math.max(0, Math.min(1, x)); }

function isInGamut(r, g, b, eps = 0.001) {
  return r >= -eps && r <= 1 + eps && g >= -eps && g <= 1 + eps && b >= -eps && b <= 1 + eps;
}

function smartGamutMap(L, C, h, colorSpace) {
  let [r, g, b] = uiToLinearRGB(L, C, h, colorSpace);
  if (isInGamut(r, g, b)) return { r, g, b, clipped: false };
  let lo = 0, hi = C, mid;
  for (let i = 0; i < 24; i++) {
    mid = (lo + hi) / 2;
    [r, g, b] = uiToLinearRGB(L, mid, h, colorSpace);
    isInGamut(r, g, b) ? (lo = mid) : (hi = mid);
  }
  [r, g, b] = uiToLinearRGB(L, lo, h, colorSpace);
  return { r, g, b, clipped: true };
}

function findMaxChroma(L, h, colorSpace) {
  let lo = 0, hi = 0.5;
  let [r, g, b] = uiToLinearRGB(L, hi, h, colorSpace);
  if (isInGamut(r, g, b)) {
    while (isInGamut(...uiToLinearRGB(L, hi, h, colorSpace)) && hi < 1) hi *= 2;
  }
  let mid;
  for (let i = 0; i < 28; i++) {
    mid = (lo + hi) / 2;
    [r, g, b] = uiToLinearRGB(L, mid, h, colorSpace);
    isInGamut(r, g, b) ? (lo = mid) : (hi = mid);
  }
  return lo;
}

function compressGamutMap(L, C, h, ratio, colorSpace) {
  const maxC = findMaxChroma(L, h, colorSpace);
  if (C <= maxC) {
    const [r, g, b] = uiToLinearRGB(L, C, h, colorSpace);
    return { r, g, b, clipped: false };
  }
  const compressedC = maxC + (C - maxC) / ratio;
  const [r, g, b] = uiToLinearRGB(L, compressedC, h, colorSpace);
  return { r, g, b, clipped: true };
}

function colorToHex(L, C, h, mode, ratio = 4, colorSpace = 'oklch') {
  let r, g, b, clipped = false;
  if (mode === 'smart') {
    ({ r, g, b, clipped } = smartGamutMap(L, C, h, colorSpace));
  } else if (mode === 'compress') {
    ({ r, g, b, clipped } = compressGamutMap(L, C, h, ratio, colorSpace));
  } else {
    [r, g, b] = uiToLinearRGB(L, C, h, colorSpace);
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

// PrismColor fixed 23-stop L* scale.  weight = (100 − L*) × 10;
// weight 500 nudged to L*=49.75 for WCAG 4.5:1 against white; weight 999 = pure black.
const PRISM_KEYS = [0, 25, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450,
                    500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 999];
const PRISM_L    = [1.0, 0.975, 0.95, 0.925, 0.90, 0.85, 0.80, 0.75, 0.70,
                    0.65, 0.60, 0.55, 0.4975, 0.45, 0.40, 0.35, 0.30, 0.25,
                    0.20, 0.15, 0.10, 0.05, 0.0];

// Maps linear t ∈ [0,1] to redistributed t based on spacing mode.
// t=0 → light end, t=1 → dark end.
function remapT(t, mode) {
  if (mode === 'linear') return t;
  if (mode === 'parabolic') { const c = 0.5 - 0.5 * Math.cos(Math.PI * t); return 0.75 * c + 0.25 * t; }
  if (mode === 'adjusted') return Math.pow(t, 0.77);
  return t;
}

// ── RAMP GENERATION ─────────────────────────────────────────────────────────

function generateRamp(p) {
  const isPrism = (p.lSpacing || 'linear') === 'prismcolor';
  const swatches = [];
  for (let i = 0; i < p.steps; i++) {
    const tLinear = i / (p.steps - 1);
    const t = remapT(tLinear, p.lSpacing || 'linear');
    const L = isPrism ? PRISM_L[i] : p.lightEnd - t * (p.lightEnd - p.darkEnd);
    const hueAtStep = p.hue + p.hueShift * (t - 0.5) * 2;
    const C = chromaCurve(L, p.peakChroma, p.peakL, p.sat);
    const { hex, clipped } = colorToHex(L, C, hueAtStep, p.gamut, p.compRatio, p.colorSpace);
    const stepKey = isPrism ? PRISM_KEYS[i] : Math.round(tLinear * 900 + 50);
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
    lSpacing:   get('--spacing', 'linear'),    // linear | parabolic | adjusted | arc | prismcolor
    colorSpace: get('--colorSpace', 'oklch'), // oklch | cielch | cielchuv | srlch | jzczhz
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
