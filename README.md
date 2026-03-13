# okLCh Ramp Studio

A single-file, zero-dependency browser tool for generating perceptually uniform UI color ramps using the **okLCh colorspace**, with hex output and multiple export formats.

---

## Overview

Traditional color ramps built in HSL or HSB are perceptually uneven — steps that look visually equal in the color picker may appear dramatically different in weight on screen. okLCh solves this by working in a colorspace modeled on human vision, where equal numeric steps produce equal perceived differences.

okLCh Ramp Studio generates ramps where every stop is defined by:

- **L** — lightness (0 = black, 1 = white), perceptually uniform
- **C** — chroma (colorfulness), automatically shaped by a curve
- **h** — hue angle (0–360°)

All output is converted to sRGB hex for direct use in CSS, design tools, or config files.

---

## Usage

Open `oklch-ramp-studio.html` in any modern browser. No build step, no server, no dependencies. Works on desktop and mobile.

Click any swatch or hex chip to copy that value to the clipboard. Use the Export buttons to generate structured output.

---

## Interface

### Light / Dark Mode

A **DARK / LIGHT** toggle in the header switches the entire page chrome — all backgrounds, borders, text, and UI surfaces — between a near-black dark theme and an off-white light theme via CSS custom property overrides. This lets you evaluate ramp swatches against the same kind of surface they'll actually appear on in your product.

### Ramp Display

The hero swatch row and hex strip at the top render **dark to light, left to right** — matching the X axis of the curve canvas below, where L = 0 (black) is on the left and L = 1 (white) is on the right. Click or tap any swatch to copy its hex value to the clipboard.

---

## Controls

### Hue & Chroma

| Control | Description |
|---|---|
| **Hue** | Base hue angle in degrees (0–360). The slider track renders a live perceptual hue gradient. |
| **Saturation** | A multiplier applied to the entire chroma curve. 1.0 = curve as-is; values below 1 produce more neutral/muted ramps; values above 1 push toward maximum chroma. |
| **Chroma Peak** | The maximum chroma value reached at the apex of the curve. Higher values produce more vivid mid-tones. |
| **Peak at L** | The lightness value at which chroma peaks. 0.55 biases the most vivid color slightly above mid-gray, which tends to feel natural. Shift toward 0.3–0.4 for ramps that pop in dark UI; toward 0.6–0.7 for light UI. |
| **Low shelf** | Steepens the curve's rolloff near the dark end — the chroma-vs-luminance curve "angles more sharply toward zero" near black. At 0 the rolloff uses the default √t shoulder. At 1 the chroma stays near peak through the dark midtones and drops abruptly only right at the cut point, like a low-shelf EQ filter cutting steeply below the shelf frequency. |
| **High shelf** | Same as Low shelf, applied to the light end of the curve. Steepens the rolloff toward white. |
| **Bandwidth** | Widens the chroma peak into a flat plateau centered on Peak at L. Analogous to a low Q (wide bandwidth) peak in audio EQ: rather than chroma cresting at a single luminance value and immediately declining, it stays at maximum across a range of steps on either side of the peak. At 0 the peak is a single point; at 0.5 the plateau spans half the full L range. |
| **Low cut** | Sets the luminance value at which chroma drops to absolute zero on the dark side (default 0 = pure black). Raising this rolls off chroma entirely below the threshold, like a high-pass filter silencing low frequencies — useful for keeping the darkest steps in your ramp truly neutral regardless of saturation or shelf settings. |
| **High cut** | Sets the luminance value at which chroma drops to absolute zero on the light side (default 1 = pure white). Lowering this rolls off chroma entirely above the threshold, keeping the lightest steps neutral. |

The **curve canvas** below these controls visualizes the actual chroma-vs-lightness shape, dark on the left and light on the right, with each ramp step plotted as a colored dot. Cut boundaries are marked with dashed vertical lines; the bandwidth plateau is shaded.

### Lightness Range & Steps

| Control | Description |
|---|---|
| **Light end** | Lightness of the lightest stop (step 50). Default 0.97 ≈ near-white. |
| **Dark end** | Lightness of the darkest stop (step 950). Default 0.12 ≈ very dark. |
| **Steps** | Number of stops in the ramp. Odd values only (3–21). Stop keys are distributed evenly across a 50–950 scale (e.g. 11 steps → 50, 140, 230 … 950). |
| **Hue shift** | Applies a linear hue rotation from the lightest to darkest stop. +20° on a blue ramp, for example, will push darks slightly toward purple and lights toward cyan — mimicking the natural appearance of pigment. Set to 0 for a clean, hue-stable ramp. |

### L Spacing

Controls how lightness values are distributed across the ramp. All three modes anchor the lightest and darkest stops at the same L values — only the placement of the intermediate stops changes.

| Mode | Behavior |
|---|---|
| **LINEAR** | Equal spacing between every L value. Simple and predictable; a good default when you want evenly distributed stops. |
| **PARABOLIC** | Steps concentrate near the lightest and darkest extremes, with wider gaps in the midtones. Implemented as a cosine ease-in/out curve (`0.5 − 0.5·cos(π·t)`). Because chroma peaks in the midtones, this places fewer stops where chroma variation is highest and more stops near the neutral extremes — useful when you need fine-grained light and dark shades for surfaces and text while accepting coarser midtone resolution. |
| **ADJUSTED** | Applies a gamma-like correction (`t^0.77`) derived from the Munsell value scale, which models perceived equal lightness steps in human vision. The result compresses the dark end slightly relative to the light end, producing stops that feel more equidistant when viewed. Recommended when perceptual uniformity matters most — for example, accessible neutral ramps or UI grays where banding is noticeable. |

The curve canvas updates in real time to show dot positions for the active spacing mode.

### Gamut Handling

okLCh can describe colors that lie outside the sRGB triangle. The gamut toggle offers three modes:

| Mode | Behavior |
|---|---|
| **SMART** | Binary-searches for the highest chroma value at the same L and h that still fits in sRGB. Hue and lightness are fully preserved. Recommended for design systems requiring clean, predictable output. |
| **NAIVE** | Clips RGB channels directly after conversion. Fast and simple, but out-of-gamut colors will shift in both hue and lightness. Useful for seeing how much of a ramp is theoretically outside sRGB. |
| **COMP** | Chroma-space ratio compression. For each step, the maximum in-gamut chroma at that exact L and h is found via binary search. If the requested chroma exceeds this ceiling, the excess is retained but attenuated by the compression ratio rather than hard-cut. Because hue is never touched, the result preserves more of the original saturation intent while introducing only a small lightness drift — and because the gamut ceiling varies by hue angle, the effect is uneven across the ramp, producing character that changes as you move the Hue slider. |

**Ratio** (COMP mode only, 1.5:1 to 20:1): Controls how aggressively excess chroma is attenuated. Low ratios like 2:1 retain most of the excess — more character, more drift. High ratios like 16:1 approach hard-clip behavior, converging toward NAIVE. The 3:1–6:1 range tends to be most useful.

Each step shows a **✓** (in gamut) or **⚠** (compressed/clipped) chip below the controls.

### Color System View

Disabled by default. When toggled **ON**, reveals a two-part interface for visualizing your primary ramp alongside up to 11 additional hues — all sharing the same curve settings.

**Controls:**

| Control | Description |
|---|---|
| **ON / OFF toggle** | Enables the system view panel and the visualization matrix below the controls. |
| **Additional hues** | Slider (1–11) setting how many companion ramps to display. Increasing the count auto-fills new slots with hues distributed evenly around the wheel relative to the primary hue (at offsets of 120°, 240°, 60°, 180°, etc.). Decreasing it removes slots from the end without disturbing existing entries. |
| **Hue cards** | One card per additional hue. Each card contains a midtone color dot preview (updates live), an optional text label, a degree input (0–360), and a mini hue-wheel slider. The number input and slider stay in sync. |

**Visualization matrix:**

A full-width ramp grid rendered below the controls. Each row represents one ramp — the primary (marked with an accent border) appears first, followed by additional hues in card order. All rows share the same lightness range, step count, chroma curve, hue shift, and gamut mode as the primary, so every ramp is directly comparable on those axes; only the base hue differs.

Column headers show step keys. Hover any swatch cell to see its hex value in a tooltip; click to copy it to the clipboard.

---

## Step Key Convention

Steps follow the Tailwind / Radix convention:

```
50 · 140 · 230 · 320 · 410 · 500 · 590 · 680 · 770 · 860 · 950
```

For an 11-step ramp. The lightest stop is always `50` and the darkest is always `950`, with intermediate keys distributed linearly. Fewer or more steps compress or expand the key distribution accordingly.

---

## Export Formats

Click any export button to generate output and copy it to the clipboard. The textarea is also directly selectable. The ramp name (top-right input) is used as the variable/key name in all formats.

### CSS Custom Properties
```css
:root {
  --brand-50: #f4f2ff;
  --brand-140: #e2deff;
  /* … */
  --brand-950: #0e0a2e;
}
```

### JSON
```json
{
  "brand": {
    "50": "#f4f2ff",
    "140": "#e2deff"
  }
}
```

### SCSS Map
```scss
$brand: (
  "50": #f4f2ff,
  "140": #e2deff
);
```

### Tailwind Config
```js
// tailwind.config.js
'brand': {
  '50': '#f4f2ff',
  '140': '#e2deff',
},
```

### Copy All Hex
Newline-separated hex values, darkest to lightest. Paste directly into Figma's "Create styles from selection" or similar bulk-import workflows.

---

## The Chroma Curve

Rather than requiring manual chroma entry per stop, the studio uses a parametric chroma curve — an **audio-compressor-inspired shape** applied to the luminance axis.

The underlying metaphor: if you think of the lightness axis as frequency and the chroma value at each step as gain, the chroma curve is an EQ. The tent-shaped default curve is the signal. The shelf, bandwidth, and cut controls are the equalizer bands.

### Default shape

Chroma rises from zero at the dark cut point to a peak at `peakL`, then falls back to zero at the light cut point. This mirrors how pigment and natural color behaves and ensures dark and light extremes remain neutral regardless of saturation.

```
t = (L − lowCut) / (peakL − lowCut)      if L ≤ peakL
t = (highCut − L) / (highCut − peakL)    if L > peakL

C(L) = saturation × peakChroma × t^p
```

The exponent `p` defaults to 0.5 (square root), applying a shoulder that prevents an abrupt jump from the dark end.

### Shelf controls (Low shelf / High shelf)

In audio, a shelf filter boosts or cuts all frequencies below (low-shelf) or above (high-shelf) a given point. Here, the shelf controls change the **steepness of the chroma rolloff** near the dark and light endpoints.

At 0 — the default — the rolloff uses the `√t` shoulder. Increasing the shelf amount lowers the curve exponent toward `t^0.05`, producing a shape that holds near peak chroma through most of the ramp and drops steeply only right at the cut boundary. Think of it as compressing the "silence zone" to the very edge of the range — or visually, squaring off the sides of the tent.

Low shelf governs the dark side (L < peakL). High shelf governs the light side (L > peakL). They can be set independently.

### Bandwidth (Q)

In audio EQ, the Q factor controls how wide or narrow a peak is around the center frequency. Low Q = broad, rounded peak. High Q = sharp, narrow spike.

The **Bandwidth** control is the low-Q analog: it extends the chroma peak from a single point into a flat plateau centered on `peakL`. Steps that fall within the plateau get the full peak chroma; the rolloff (shaped by the shelf controls) only begins at the plateau edges.

At 0, Peak at L is a single point. At 0.3, the plateau spans 0.3 luminance units — about three full steps in an 11-step ramp. The curve canvas shades the plateau region.

### Cut controls (Low cut / High cut)

In audio, a high-pass filter silences everything below a cutoff frequency; a low-pass filter silences everything above. The **Low cut** and **High cut** controls do exactly this for chroma:

- **Low cut** — sets the luminance below which chroma is hard zero. Default 0 (pure black). Raising it clamps the darkest stops to neutral, regardless of shelf or saturation settings.
- **High cut** — sets the luminance above which chroma is hard zero. Default 1 (pure white). Lowering it clamps the lightest stops to neutral.

Cuts also shift the rolloff reference points: instead of the shelf curve stretching from L=0 to peakL, it stretches from `lowCut` to the plateau edge — so the shelf effect remains proportional as you move the cut.

---

## Browser Compatibility

Requires a browser with support for:
- `oklch()` CSS color function (for the hue slider track gradient) — Chrome 111+, Firefox 113+, Safari 15.4+
- Canvas 2D API
- Clipboard API (for copy-on-click; degrades silently if blocked)

All color math is implemented natively in JavaScript; no CSS `oklch()` is used for the actual swatch rendering, so the hex output is universally compatible.

---

## File Structure

Single self-contained HTML file. No dependencies, no build step, no network requests after initial Google Fonts load (which is optional and can be removed by substituting a local font stack).

```
oklch-ramp-studio.html   ← everything
README.md
LICENSE
```

---

## License

This project is released under the **MIT License**. See `LICENSE` for the full text.
