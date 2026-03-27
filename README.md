# okLCh Ramp Studio

`okLCh Ramp Studio` is a single-file browser tool for building perceptually uniform color ramps and exporting them as ready-to-use tokens.

It is designed for UI and design-system work where HSL-style ramps often feel uneven. You shape a ramp in perceptual lightness, chroma, and hue, then export sRGB hex values for CSS, JSON, SCSS, or Tailwind-style configs.

The interaction model is inspired by digital audio tools: the chroma curve behaves a bit like an EQ envelope, while gamut compression works like a gentler color-domain compressor that reins peaks back into range without flattening the whole signal.

<figure>
  <img src="samples/okLCH_ramps.png" alt="12-hue color system — RED through GRAY, 15 stops each">
  <figcaption>12-hue color system — RED through GRAY, 15 stops each</figcaption>
</figure>

## Quick start

Open [index.html](index.html) in a modern browser. There is no build step, no server, and no runtime dependency setup.

Click any swatch to copy its hex value. Use the export buttons to copy the full ramp in your preferred format.

## What it does

- Generates ramps in **OKLCH** by default, with support for **SRLCH**, **CIELCH**, **LCHUV**, **JzCzHz**, and **Munsell**
- Lets you shape chroma with an interactive curve editor
- Supports lightness spacing modes for different ramp behaviors
- Offers gamut compression controls for handling out-of-sRGB colors
- Includes optional contrast checking with **WCAG** or **APCA**
- Can preview a full multi-hue color system using the same curve settings

## Main controls

### Chroma curve

The curve editor is the main control surface. It defines how chroma rises from dark tones, peaks in the midrange, and falls back toward light tones. You can drag the five control points directly or adjust them through the node controls.

If you come from audio software, this will feel familiar: you are shaping a color response curve the way you might sculpt an EQ contour, deciding where the ramp stays restrained and where it blooms.

### Hue and saturation

- **Hue** sets the base hue angle
- **Saturation** scales the full chroma curve up or down
- **Hue Shift** rotates hue across the ramp so shadows and highlights can drift slightly
- **Smoothing** enforces a cleaner single-peak chroma shape when gamut limits create uneven clipping

### Color space and illuminant

You can switch between supported color spaces and preview the ramp under different reference illuminants. For most web and product work, **OKLCH** with **D65** is the best default.

If you want background on the available color spaces, use [docs/colorspaces.md](docs/colorspaces.md).

### Lightness and spacing

- **Steps** sets how many stops the ramp contains
- **Dark Step** and **Light Step** define the ramp endpoints
- **L Spacing** controls how intermediate lightness values are distributed

The available spacing modes are:

- **Linear** for even step placement
- **Parabolic** for more detail near the ends
- **Adjusted** for a more perceptual distribution
- **Arc** for spacing that follows the curve shape
- **Prism** for a fixed 21-step scale

### Gamut handling

Some requested colors fall outside sRGB. The **Compression** slider controls how aggressively the tool pulls those colors back into gamut, from harder clipping at the low end to stronger hue-and-lightness-preserving chroma reduction at the high end. In audio terms, it behaves a little like a compressor threshold and ratio combined: it tamps down overshoots instead of forcing the whole ramp to flatten.

## Color system view

The optional Color System View lets you preview the current ramp alongside additional hues that share the same settings. This is useful when building a coordinated palette rather than a single ramp.

<figure>
  <img src="samples/okLCH_saturations.png" alt="Saturation comparison — three levels per hue across the full Color System View">
  <figcaption>Saturation comparison — three levels per hue across the full Color System View</figcaption>
</figure>

## Output

The tool can export:

- CSS custom properties
- JSON
- SCSS maps
- Tailwind-style config objects
- Plain newline-separated hex values

## Documentation

This README stays intentionally short. For deeper reference:

- [docs/colorspaces.md](docs/colorspaces.md) explains the supported color spaces and illuminants
- [docs/chroma-curve-math.md](docs/chroma-curve-math.md) documents the spline, curve parameters, and gamut math

## Browser support

Requires a modern browser with:

- Canvas 2D API
- Clipboard API
- support for the CSS `oklch()` color function used in the hue slider track

The generated hex output is standard sRGB and is safe to use anywhere hex colors are accepted.

## File structure

The app is self-contained:

```text
index.html
README.md
LICENSE
docs/
samples/
```

## License

Released under the [MIT License](LICENSE).
