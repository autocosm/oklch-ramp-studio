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

**Selecting nodes:** Click any node to select it. A contextual panel appears directly below the canvas showing precision slider and number controls for that node's parameters only. Click an empty area of the canvas to dismiss the panel. Drag interaction and selection work simultaneously — dragging a node also selects it.

| Node selected | Controls shown |
|---|---|
| **Dark** | Curve dark |
| **L-Knee** | L-Knee L, L-Knee C |
| **Peak** | Chroma Peak, Peak at L |
| **R-Knee** | R-Knee L, R-Knee C |
| **Light** | Curve light |

### Hue & Chroma

| Control | Description |
|---|---|
| **Hue** | Base hue angle in degrees (0–360). The slider track renders a live perceptual hue gradient. |
| **Saturation** | A multiplier applied to the entire chroma curve. 1.0 = curve as-is; values below 1 produce more neutral/muted ramps; values above 1 push toward maximum chroma. |

The remaining chroma curve controls (**Chroma Peak**, **Peak at L**, **L-Knee L/C**, **R-Knee L/C**, **Curve dark**, **Curve light**) appear in the node panel when the corresponding canvas node is selected — see above.

### Lightness Range & Steps

| Control | Description |
|---|---|
| **Ramp light** | Lightness of the lightest stop (step 50). Default 0.97 ≈ near-white. Independent of the chroma curve's light anchor — steps that fall outside the curve anchor range simply receive zero chroma. |
| **Ramp dark** | Lightness of the darkest stop (step 950). Default 0.12 ≈ very dark. Independent of the chroma curve's dark anchor. |
| **Steps** | Number of stops in the ramp. Odd values only (3–21). Stop keys are distributed evenly across a 50–950 scale (e.g. 11 steps → 50, 140, 230 … 950). |
| **Hue shift** | Applies a linear hue rotation from the lightest to darkest stop. +20° on a blue ramp, for example, will push darks slightly toward purple and lights toward cyan — mimicking the natural appearance of pigment. Set to 0 for a clean, hue-stable ramp. The dashed gamut ceiling on the canvas adapts to reflect the shifted hue at each lightness position. |

### L Spacing

Controls how lightness values are distributed across the ramp. All three modes anchor the lightest and darkest stops at the same L values — only the placement of the intermediate stops changes.

| Mode | Behavior |
|---|---|
| **LINEAR** | Equal spacing between every L value. Simple and predictable; a good default when you want evenly distributed stops. |
| **PARABOLIC** | Steps concentrate near the lightest and darkest extremes, with wider gaps in the midtones. Implemented as a cosine ease-in/out curve (`0.5 − 0.5·cos(π·t)`). Because chroma peaks in the midtones, this places fewer stops where chroma variation is highest and more stops near the neutral extremes — useful when you need fine-grained light and dark shades for surfaces and text while accepting coarser midtone resolution. |
| **ADJUSTED** | Applies a gamma-like correction (`t^0.77`) derived from the Munsell value scale, which models perceived equal lightness steps in human vision. The result compresses the dark end slightly relative to the light end, producing stops that feel more equidistant when viewed. Recommended when perceptual uniformity matters most — for example, accessible neutral ramps or UI grays where banding is noticeable. |

The canvas updates in real time to show diamond positions for the active spacing mode.

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

Column headers show step keys. Hover any swatch cell to see its hex value in a tooltip; click to copy it to the clipboard. Swatch cells do not expand on hover.

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
| **Peak** | `(Peak at L, Chroma Peak)` — the chroma apex, scaled by Saturation. |
| **R-Knee** | `(R-Knee L, R-Knee C)` — shapes the descent from peak toward the light anchor. Mirrors the role of the left knee on the light side. |
| **Light anchor** | Fixed at `(curveLight, 0)` — the lightness at which chroma reaches zero on the light side. |

The ordering constraint `curveDark < L-Knee L < Peak at L < R-Knee L < curveLight` is enforced at render time, so the curve always has a valid shape regardless of slider positions.

### Gamut ceiling overlay

The canvas draws a **dashed white line** showing the maximum in-gamut sRGB chroma at each lightness value for the current hue. This ceiling is computed via binary search across the full L range (0–1) and updates live as you move the Hue or Hue Shift sliders. When Hue Shift is non-zero, each L position on the ceiling reflects the shifted hue that the corresponding ramp step would actually use, so the ceiling accurately represents the gamut constraint that will apply at that step. The ceiling provides an at-a-glance read of how much headroom the chroma curve has before gamut mapping engages.

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
