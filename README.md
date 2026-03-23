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

![12-hue color system — RED through GRAY, 15 stops each](samples/okLCH_ramps.png)

---

## Usage

Open `oklch-ramp-studio.html` in any modern browser. No build step, no server, no dependencies. Works on desktop and mobile.

Click any swatch or hex chip to copy that value to the clipboard. Use the Export buttons to generate structured output.

---

## Interface

### Light / Dark Mode

A **DARK / LIGHT** toggle in the header switches the entire page chrome — all backgrounds, borders, text, and UI surfaces — between a near-black dark theme and an off-white light theme via CSS custom property overrides. This lets you evaluate ramp swatches against the same kind of surface they'll actually appear on in your product.

### Contrast Check

An **OFF / WCAG / APCA** toggle in the header enables accessibility contrast checking on the swatch row. When active, each swatch displays a centered badge showing the contrast rating and value. The badge text color — black or white — is chosen by whichever achieves the higher contrast against that swatch, using the WCAG relative luminance formula. This also governs the color of the hex value label on each swatch while checking is active.

**WCAG mode** uses the WCAG 2.1 relative luminance formula and reports contrast as a ratio against white or black (whichever is higher):

| Badge | Contrast ratio | Meaning |
|---|---|---|
| **AAA** | ≥ 7:1 | Enhanced — passes all text sizes |
| **AA** | ≥ 4.5:1 | Minimum — passes normal text |
| **—** | < 4.5:1 | Fail — text on this stop requires care |

**APCA mode** uses the APCA 0.0.98G algorithm (the W3C candidate for WCAG 3.0) and reports contrast in Lc (Lightness Contrast) units. APCA models perceived contrast more accurately than WCAG 2.x, particularly for mid-tone colors and reversed-polarity text. The badge shows the Lc threshold level and the raw value (e.g. `75` / `87.3`):

| Badge | Lc value | Meaning |
|---|---|---|
| **75** | ≥ 75 | Passes for body text |
| **60** | ≥ 60 | Passes for large or bold text |
| **45** | ≥ 45 | Passes for large headings and UI elements |
| **—** | < 45 | Below minimum recommended threshold |

The second line of the badge (ratio or Lc value) is hidden at narrow viewport widths to avoid overlap with the hex label.

### Ramp Display

The hero swatch row at the top renders **dark to light, left to right** — matching the X axis of the curve canvas below, where L = 0 (black) is on the left and L = 1 (white) is on the right. Each swatch displays its hex value persistently, oriented vertically. Click or tap any swatch to copy its hex value to the clipboard.

---

## Controls

### Chroma Curve Canvas

A full-width interactive editor that sits above the control panels and serves as the primary control surface for the chroma curve. The canvas shows three layers of information simultaneously:

- **Solid curve** — the current chroma shape, filled below and stroked in violet. The x-axis is lightness (dark on the left, light on the right); the y-axis is chroma (0 at the bottom, 0.38 at the top).
- **Dashed ceiling** — the maximum in-gamut sRGB chroma at each lightness value for the active hue, sampled across the full L range. The ceiling adapts in real time to the Hue and Hue Shift settings, so it reflects the actual gamut boundary at whatever hue each step lands on. When the solid curve runs below the dashed line there is room to increase chroma; when it approaches or exceeds it, gamut mapping will engage.
- **Step diamonds** — each ramp stop is plotted as a colored diamond at its exact (L, C) position. Hovering or dragging any node subdues the diamonds to make the curve shape easier to read.

**Dragging nodes:** Each of the five control points is directly draggable on the canvas — no need to reach for the sliders.

| Node | Shape | Axes | Behaviour |
|---|---|---|---|
| **Dark** | Circle with vertical bar | L only | Sets the dark anchor of the chroma spline (where chroma reaches zero on the dark side). Horizontal drag only — chroma is always 0 here. |
| **L-Knee** | Circle | L and C | Controls the rise from the dark anchor toward the peak. Drag right to delay the rise; drag up to broaden the dark shoulder. |
| **Peak** | Circle | L and C | The chroma apex. Drag up/down to set the peak chroma; drag left/right to shift where it falls in lightness. |
| **R-Knee** | Circle | L and C | Controls the descent from the peak toward the light anchor. Mirrors L-Knee on the light side. |
| **Light** | Circle with vertical bar | L only | Sets the light anchor of the chroma spline. Horizontal drag only. |

**Selecting nodes:** A persistent tab row sits directly below the canvas, always showing all five nodes and their current parameter values at a glance. Click any tab — or click the corresponding node on the canvas — to select it. The selected tab highlights with an accent underline and its precision slider controls expand below the tab row. Click an empty area of the canvas to deselect; the tab row remains visible with the values still readable. Drag interaction and selection work simultaneously — dragging a node also selects it and activates its tab.

| Tab / Node | Values shown in tab | Controls shown when active |
|---|---|---|
| **Dark** | `L` | Curve dark |
| **L-Knee** | `L  C` | L-Knee L, L-Knee C |
| **Peak** | `L  C` | Peak L, Peak C, Peak Q |
| **R-Knee** | `L  C` | R-Knee L, R-Knee C |
| **Light** | `L` | Curve light |

### Hue & Chroma

| Control | Description |
|---|---|
| **Hue** | Base hue angle in degrees (0–360). The slider track renders a live perceptual hue gradient. |
| **Saturation** | A multiplier applied to the entire chroma curve. 1.0 = curve as-is; values below 1 produce more neutral/muted ramps; values above 1 push toward maximum chroma. |
| **Hue shift** | Applies a linear hue rotation from the lightest to darkest stop. +20° on a blue ramp, for example, will push darks slightly toward purple and lights toward cyan — mimicking the natural appearance of pigment. Set to 0 for a clean, hue-stable ramp. The dashed gamut ceiling on the canvas adapts to reflect the shifted hue at each lightness position. |
| **Smoothing** | When **YES**, enforces a unimodal adjusted-chroma shape across the ramp — one smooth rise to the peak, then a smooth descent, with no dips or secondary bumps. The sRGB gamut ceiling is non-monotone across lightness (it peaks in the mid-tones and dips near the dark and light extremes), which can cause the chroma curve to cross the ceiling at multiple points and produce several distinct clipped regions. A simple local blend at each clipping boundary fails to coordinate across these regions and can introduce new fluctuations. Instead, Smoothing applies global monotone enforcement: it finds the adjusted-chroma peak (apex), then scans outward in both directions, lowering any stop that would violate the non-decreasing (dark side) or non-increasing (light side) constraint. Because only downward adjustments are made, no stop is ever pushed above its individual gamut ceiling. A final `[0.25, 0.5, 0.25]` Gaussian pass softens any flat plateaus left by the enforcement step. Works at all Compression values. Default **NO**. |
| **Color space** | Controls which perceptual color model is used to convert L, C, h values into sRGB hex output. When any non-OKLCH space is active, the hue gradient and gamut ceiling overlay update to reflect that space's sRGB boundary. See [Comparing color spaces](colorspaces.md) for guidance.<ul><li><strong>OKLCH</strong> (default) — OKLab (Björn Ottosson, 2020).</li><li><strong>SRLCH</strong> — SRLAB2 cylindrical coordinates (Jan Behrens, 2011), scaling L × 100 and C × 300 to SRLAB2 natural units.</li><li><strong>CIELCH</strong> — CIE L*C*h° (CIELAB cylindrical), scaling identically.</li><li><strong>LCHUV</strong> — CIELChUV, the cylindrical form of CIELUV — the same L* definition as CIELAB but with u*/v* chromatic axes derived from the CIE 1976 UCS diagram, also scaling L × 100 and C × 300.</li><li><strong>JzCzHz</strong> — cylindrical form of JzAzBz (Safdar et al., 2017), a modern HDR-capable space built on the ST 2084 PQ transfer function. Jz maps directly to the UI L range [0, 1] (D65 white ≈ 0.9999); Cz is scaled by 0.5 to match the sRGB gamut range.</li></ul> |
| **Compression** | Sets how out-of-gamut colors are handled. **0%** clips RGB channels directly (fast, but shifts hue and lightness). **100%** binary-searches for the highest in-gamut chroma at the same L and h — hue and lightness fully preserved; recommended for design systems. **1–99%** applies partial chroma compression: the excess above the gamut ceiling is attenuated by the percentage, retaining some saturation intent with a small lightness drift. Mid values (40–80%) tend to be most useful for characterful ramps. |

The remaining chroma curve controls (**Peak L**, **Peak C**, **Peak Q**, **L-Knee L/C**, **R-Knee L/C**, **Curve dark**, **Curve light**) appear in the node tab row below the canvas — click the corresponding tab or canvas node to expand its controls.

### Lightness Range & Steps

| Control | Description |
|---|---|
| **Ramp light** | Lightness of the lightest stop (step 50). Default 0.97 ≈ near-white. Independent of the chroma curve's light anchor — steps that fall outside the curve anchor range simply receive zero chroma. |
| **Ramp dark** | Lightness of the darkest stop (step 950). Default 0.12 ≈ very dark. Independent of the chroma curve's dark anchor. |
| **Steps** | Number of stops in the ramp. Odd values only (3–21). Stop keys are distributed evenly across a 50–950 scale (e.g. 11 steps → 50, 140, 230 … 950). |

### L Spacing

Controls how lightness values are distributed across the ramp. The first four modes anchor the lightest and darkest stops at the same L values — only the placement of the intermediate stops changes. PRISM is a fixed-scale mode that overrides those anchors entirely.

| Mode | Behavior |
|---|---|
| **LINEAR** | Equal spacing between every L value. Simple and predictable; a good default when you want evenly distributed stops. |
| **PARABOLIC** | Steps concentrate near the lightest and darkest extremes, with wider gaps in the midtones. Implemented as a blended cosine ease-in/out (`75% cosine + 25% linear`). Because chroma peaks in the midtones, this places fewer stops where chroma variation is highest and more stops near the neutral extremes — useful when you need fine-grained light and dark shades for surfaces and text while accepting coarser midtone resolution. |
| **ADJUSTED** | Applies a gamma-like correction (`t^0.77`) derived from the Munsell value scale, which models perceived equal lightness steps in human vision. The result compresses the dark end slightly relative to the light end, producing stops that feel more equidistant when viewed. Recommended when perceptual uniformity matters most — for example, accessible neutral ramps or UI grays where banding is noticeable. |
| **ARC** | Divides the chroma curve into equal arc-length intervals, measuring distance as Euclidean in (L, C) space so that both lightness change and chroma change count toward the spacing. Stops are pulled toward regions of the curve that are steep in chroma (near the peak) and spread apart where the curve is flat (near the neutral extremes). Produces a ramp where each visual step feels like an equal-sized move along the shape of the curve itself. |
| **PRISM** | Uses the PrismColor fixed 21-stop weight scale, where each stop corresponds to a predetermined CIE L\* value. Stop keys use the PrismColor weight convention (25, 50 … 950) rather than the default 50–950 scale. Activating this mode locks Steps to 21 and sets Ramp dark, Ramp light, Curve dark, and Curve light to their full 0–1 range — those controls are disabled while PRISM is active. Switching to any other mode restores all previously set values. See [PrismColor weight scale](#prismcolor-weight-scale) below. |

The canvas updates in real time to show diamond positions for the active spacing mode.

#### PrismColor weight scale

PrismColor uses a **025–950 weight scale** with 21 discrete stops mapped linearly to CIE L\* values. The weight formula is `weight = (100 − L*) × 10`. Weight 500 is nudged from L\* 50 to L\* 49.75 so the swatch reliably passes WCAG 2.1 4.5:1 contrast against white.

| Weight | L\* | Weight | L\* | Weight | L\* |
|---|---|---|---|---|---|
| **025** | 97.5 | **300** | 70 | **650** | 35 |
| **050** | 95 | **350** | 65 | **700** | 30 |
| **075** | 92.5 | **400** | 60 | **750** | 25 |
| **100** | 90 | **450** | 55 | **800** | 20 |
| **150** | 85 | **500** | ~49.75 | **850** | 15 |
| **200** | 80 | **550** | 45 | **900** | 10 |
| **250** | 75 | **600** | 40 | **950** | 5 |

The first four stops use 2.5 L\* increments; the remainder use 5 L\* increments. Weight consistency is cross-hue: a weight-500 blue and a weight-500 red always share the same perceptual lightness (~L\* 50), which is the key differentiator from HSL/HSB-based tools.

### Gamut Handling

okLCh can describe colors that lie outside the sRGB triangle. The **Compression** slider (0–100%) selects how out-of-gamut colors are handled:

| Value | Behavior |
|---|---|
| **0%** | Clips RGB channels directly after conversion. Fast and simple, but out-of-gamut colors shift in both hue and lightness. Useful for seeing how much of a ramp is theoretically outside sRGB. |
| **1–99%** | Chroma-space partial compression. The maximum in-gamut chroma at each L and h is found via binary search. If the requested chroma exceeds this ceiling, the excess is attenuated by the percentage: `compressedC = maxC + (C − maxC) × (1 − pct/100)`. At 50%, half the excess is retained; at 90%, only 10% remains. Because hue is never touched, the result preserves more saturation intent with a small lightness drift. Low values (10–40%) retain most of the excess (more character, more drift); high values (80–99%) approach hard-clip behavior. The 40–70% range tends to be most useful. |
| **100%** | Binary-searches for the highest chroma value at the same L and h that still fits in sRGB. Hue and lightness are fully preserved. Recommended for design systems requiring clean, predictable output. |

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

Column headers show step keys. Hover any swatch cell to see its hex value in a tooltip; click to copy it to the clipboard. Swatch cells do not expand on hover.

The image above shows a 12-hue system (Red → Gray) as rendered by the Color System View. The saturation comparison below shows three saturation multiplier settings stacked per hue, illustrating how the **Saturation** slider scales the entire chroma curve up or down while keeping the curve shape intact:

![Saturation comparison — three levels per hue across the full Color System View](samples/okLCH_saturations.png)

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

Rather than requiring manual chroma entry per stop, the studio uses a **5-point monotone cubic spline** to describe the chroma-vs-lightness shape. The curve passes exactly through five control points and is anchored to zero chroma at both ends:

```
(curveDark, 0)   →   (lKneeL, lKneeC)   →   (peakL, peakC)   →   (rKneeL, rKneeC)   →   (curveLight, 0)
```

This directly models design intent: you choose where chroma rises, where it peaks, and how it falls — rather than dialing abstract EQ parameters.

### Curve anchors vs. ramp range

The **curve anchors** (Curve dark / Curve light) and the **ramp range** (Ramp dark / Ramp light) are independent settings:

- The curve anchors define where the chroma spline is forced to zero. They are the x-intercepts of the curve and correspond to the **Dark** and **Light** drag nodes on the canvas.
- The ramp range defines the L values of the actual stop endpoints (step 50 and step 950). Steps that fall outside the curve anchor range receive zero chroma automatically.

Keeping the two controls separate lets you, for example, position the dark anchor at L = 0.15 while extending the ramp down to L = 0.05 to include a near-black neutral stop.

### Interpolation

The curve is computed using the **Fritsch-Carlson monotone cubic Hermite spline** algorithm. Monotone interpolation guarantees the spline never overshoots between two adjacent control points, which means chroma cannot go negative or exceed the peak — even when the knee points are set asymmetrically.

### Control points

| Point | Controls |
|---|---|
| **Dark anchor** | Fixed at `(curveDark, 0)` — the lightness at which chroma reaches zero on the dark side. |
| **L-Knee** | `(L-Knee L, L-Knee C)` — shapes how quickly chroma rises from the dark anchor toward the peak. A low L position steepens the initial rise; a high C value broadens the dark shoulder. |
| **Peak** | `(Peak at L, Chroma Peak)` — the chroma apex, scaled by Saturation. **Peak Q** controls the bandwidth: how quickly chroma falls off on either side of the peak. Q = 1.0 is neutral (knee positions unchanged). Higher Q pulls the effective knee positions closer to the peak, sharpening the rolloff; lower Q pushes them farther apart, broadening it. The knee slider values are not modified — Q is applied internally when computing the spline. When the Peak node is selected, two tick marks on the canvas show the current effective bandwidth edges. |
| **R-Knee** | `(R-Knee L, R-Knee C)` — shapes the descent from peak toward the light anchor. Mirrors the role of the left knee on the light side. |
| **Light anchor** | Fixed at `(curveLight, 0)` — the lightness at which chroma reaches zero on the light side. |

The ordering constraint `curveDark < L-Knee L < Peak at L < R-Knee L < curveLight` is enforced at render time, so the curve always has a valid shape regardless of slider positions.

### Gamut ceiling overlay

The canvas draws a **dashed white line** showing the maximum in-gamut sRGB chroma at each lightness value for the current hue. This ceiling is computed via binary search across the full L range (0–1) and updates live as you move the Hue or Hue Shift sliders. When Hue Shift is non-zero, each L position on the ceiling reflects the shifted hue that the corresponding ramp step would actually use, so the ceiling accurately represents the gamut constraint that will apply at that step. The ceiling provides an at-a-glance read of how much headroom the chroma curve has before gamut mapping engages.

---

## Comparing color spaces

For a detailed history and analysis of each color space — OKLCH, CIELCH, LCHUV, SRLCH, and JzCzHz — including their design rationale, known tradeoffs, and guidance on when to use each, see [colorspaces.md](colorspaces.md).

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
