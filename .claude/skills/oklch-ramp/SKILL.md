---
name: oklch-ramp
description: Generate a perceptually uniform OKLCH color ramp for UI design systems. Invoke when the user asks for a color palette, color ramp, color scale, or Tailwind/CSS/SCSS colors for a specific hue or color name.
argument-hint: "[color or hue] [options]"
---

Generate an OKLCH color ramp using the bundled Node.js script.

## Step 1 — Parse the request

Interpret $ARGUMENTS and resolve these parameters:

| Parameter | Default | Notes |
|---|---|---|
| `--hue` | 250 | 0–360°. Infer from name: red≈25, orange≈55, yellow≈95, lime≈135, green≈145, teal≈185, cyan≈205, sky≈225, blue≈250, indigo≈270, violet≈285, purple≈295, pink≈340, rose≈15 |
| `--steps` | 11 | Odd integer 3–21. "9-step" → 9, "full scale" → 11 |
| `--saturation` | 1.0 | 0–2.0. "muted"/"pastel" → 0.5, "vivid"/"vibrant" → 1.4 |
| `--peakChroma` | 0.18 | 0.05–0.4. Max chroma at the curve apex |
| `--peakL` | 0.55 | 0–1. "dark UI" → 0.4, "light UI" → 0.65 |
| `--lightEnd` | 0.97 | Lightness of the lightest stop (step 50) |
| `--darkEnd` | 0.12 | Lightness of the darkest stop (step 950) |
| `--hueShift` | 0 | Degrees of hue rotation across the ramp. "warm shadows" → 15, "cool shadows" → -15 |
| `--spacing` | linear | `linear` \| `parabolic` \| `adjusted` |
| `--gamut` | smart | `smart` \| `naive` \| `compress` |
| `--compRatio` | 4 | Used only with `--gamut compress`. Range 1.5–20 |
| `--format` | css | `css` \| `json` \| `scss` \| `tailwind` \| `hex` |
| `--name` | color | Prefix for CSS variable / key name |

## Step 2 — Run the script

```bash
node ${CLAUDE_SKILL_DIR}/scripts/generate-ramp.js \
  --hue HUE \
  --steps STEPS \
  --saturation SAT \
  --peakChroma PEAK_CHROMA \
  --peakL PEAK_L \
  --lightEnd LIGHT_END \
  --darkEnd DARK_END \
  --hueShift HUE_SHIFT \
  --spacing SPACING \
  --gamut GAMUT \
  --compRatio COMP_RATIO \
  --format FORMAT \
  --name NAME
```

For multiple ramps (e.g. a full design system), run the script once per hue, keeping shared params consistent across calls.

## Step 3 — Present the output

- Wrap the output in the appropriate fenced code block (` ```css `, ` ```json `, ` ```js `, etc.)
- If stderr reports gamut-mapped stops, briefly note it (e.g. "9 of 11 stops were gamut-mapped")
- If the user didn't specify a format, default to `css` and offer to re-run in another format

## Examples

```
/oklch-ramp blue
/oklch-ramp red --format tailwind --name danger
/oklch-ramp 250 --steps 9 --saturation 0.7 --name brand
/oklch-ramp teal --hueShift -10 --peakL 0.45 --format json
/oklch-ramp purple --gamut compress --compRatio 6
```
