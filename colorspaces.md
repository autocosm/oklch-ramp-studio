# Comparing Color Spaces

## A brief history

**CIELAB** (and its cylindrical form, **CIELCH**) was introduced by the CIE in 1976 as the first widely adopted attempt to create a *perceptually uniform* color space — one where equal numeric distances correspond to equal perceived color differences. It replaced earlier models like Munsell (which required physical samples) with a mathematical formulation derived from opponent-process color theory, using a cube-root–based lightness function and opponent `a*`/`b*` channels.

For two decades CIELAB was the standard for color science, ICC profiles, and industrial color management. It is still embedded in every ICC-aware application, every PDF renderer, and every print workflow.

## The problems with CIELAB

Despite its longevity, CIELAB has known perceptual non-uniformities that have been documented since the 1980s:

- **Hue linearity** — perceived hue does not travel in straight lines through the `a*b*` plane. Blues in particular curve sharply toward purple as chroma increases, so a blue ramp with rising chroma will appear to shift hue even with a fixed `h°` value.
- **Chroma–lightness coupling** — changing chroma at a fixed `L*` can noticeably shift perceived lightness, particularly in the blue and yellow regions. This makes it difficult to build ramps where every stop feels the same visual weight.
- **Achromatic axis instability** — very desaturated colors near the neutral axis can produce slight tints in CIELAB due to the cube-root compression behaving differently near zero, causing grays to appear slightly warm or cool.

These issues were tolerable for color *difference* measurements (CIEDE2000 patches them with correction factors) but they create visible problems when generating UI color ramps, where the goal is a smooth, hue-stable, perceptually uniform gradient.

## Why OKLab was created

In 2020, Björn Ottosson published [OKLab](https://bottosson.github.io/posts/oklab/) — a new perceptual color space designed specifically to address CIELAB's non-uniformities. The key insight was to fit the linear transform matrices not to theoretical opponent-process responses, but to empirical data from the [IPT color space](https://www.researchgate.net/publication/221677980) and modern color appearance datasets, using a least-squares optimization over a large set of perceived-equal-difference color pairs.

The result:

- **Straight hue lines** — perceived hue travels in nearly straight lines through the OKLab `ab` plane, so a fixed `h` in OKLCH holds its apparent color identity across a wide chroma range.
- **Decoupled chroma and lightness** — chroma changes at a fixed `L` produce minimal perceived lightness shift, making it reliable for ramp construction.
- **Minimal hue shift in blue** — the blue–purple skew that plagues CIELAB is largely eliminated.
- **Simple math** — the full transform is two 3×3 matrix multiplications and a cube root, with no correction factors or lookup tables.

OKLab was adopted into the CSS Color Level 4 specification as `oklch()` / `oklab()` in 2022 and is now natively supported by all major browsers.

## CIELUV and CIELChUV

CIELUV was published by the CIE in 1976 alongside CIELAB — both were attempts at perceptual uniformity, and neither was declared the winner. CIELAB uses opponent-process `a*`/`b*` axes derived from a cube-root compression of XYZ. CIELUV takes a different approach: it applies a projective transform of XYZ to the *CIE 1976 UCS chromaticity diagram* (`u'v'`), then scales by L\* to produce `u*`/`v*` opponent channels. The result is a different chromatic structure — CIELUV hue angles are not the same as CIELAB hue angles for the same physical color.

CIELUV was historically favored in the **lighting and illumination industry**, where additive color mixtures (light sources, displays, luminaires) are common and the projective chromaticity structure aligns better with how emitted light mixes. CIELAB became dominant in the **print and colorimetry industry**, where reflectance and subtractive mixing are primary. Both spaces share the same L\* definition and the same known non-uniformities in hue linearity and chroma–lightness coupling — they differ primarily in which chromatic axes they use to express color differences.

CIELChUV is the cylindrical projection: `C*_uv = sqrt(u*² + v*²)` and `h_uv = atan2(v*, u*)`. It is comparable to CIELCH in structure but with a different hue rotation and different gamut boundaries in the u\*v\* plane.

## JzAzBz and JzCzHz

In 2017, Safdar et al. published [JzAzBz](https://doi.org/10.1364/OE.25.015131) as a perceptual color space designed specifically for **high dynamic range (HDR) and wide gamut (WCG) content**. Where OKLab uses a cube-root nonlinearity calibrated for SDR displays, JzAzBz replaces it with the **ST 2084 Perceptual Quantizer (PQ)** transfer function — the same electro-optical transfer function used in HDR10 and Dolby Vision. The PQ function is optimized for the full luminance range of human vision (0.001 to 10,000 cd/m²), making JzAzBz perceptually uniform across a much wider brightness span than any CIE-derived space.

The input XYZ values are scaled to absolute luminance (in cd/m²) before applying the PQ function, using a reference white of 203 cd/m² — the standard "reference white" in the HDR10 PQ encoding system. For SDR content where Y = 1 corresponds to approximately 100–203 cd/m², this places sRGB white at Jz ≈ 0.9999. Jz therefore maps almost directly onto the UI's L slider range [0, 1] without additional scaling.

**JzCzHz** is the cylindrical projection: `Cz = sqrt(az² + bz²)` and `Hz = atan2(bz, az)`. It is analogous to OKLCH in structure but uses PQ-based lightness and a different set of cone-response matrices (M1 and M2 from the paper) designed to minimize hue–chroma coupling across the full luminance range.

For SDR ramp generation the practical differences from OKLCH are subtle, but JzCzHz can produce slightly different hue line shapes — particularly in the blue-cyan region — and the PQ lightness compression causes the dark end of ramps to behave differently from OKLab's cube-root compression at very low L values.

## Why SRLAB2 was created

In 2011, Jan Behrens published [SRLAB2](https://www.magnetkern.de/srlab2.html) as an intermediate position between CIELAB and the more recent perceptual models. Where CIELAB applies its cube-root nonlinearity to XYZ values scaled by the D65 reference white directly, SRLAB2 first passes those XYZ values through a re-optimized chromatic adaptation transform (based on CAT02 cone responses with Hunt-Pointer-Estevez primaries for the inverse). The resulting pre-nonlinearity values are a better substrate for the cube-root step, reducing the same blue–purple hue skew and chroma–lightness coupling that Ottosson later addressed in OKLab.

SRLAB2 retains the identical nonlinearity form as CIELAB and produces L\* values in the same 0–100 range with chroma in comparable units — making it a direct successor to CIELAB that is more perceptually uniform without departing entirely from the CIELAB framework the way OKLab does.

OKLab goes further — its linear transforms were fit empirically to perceptual difference data — and generally outperforms SRLAB2 on hue uniformity benchmarks. But SRLAB2 is a useful intermediate reference, especially when transitioning from a CIELAB workflow or cross-referencing against SRLAB2-based tools.

## When to use each

**Use OKLCH (default) when:**

- Building a production UI ramp. OKLCH gives the most predictable hue stability across the lightness range and is the correct choice for anything that will ship.
- Working with saturated hues, especially blues, teals, or purples — where CIELAB's hue skew is most pronounced.
- You want the chroma curve you've drawn to translate faithfully to perceived colorfulness at every step.
- Comparing or exporting alongside CSS `oklch()` values.

**Use CIELCH when:**

- You need to match or cross-reference colors defined in an existing CIELAB-based workflow — ICC profiles, colorimetry reports, print specifications.
- You want to see the historical CIELAB rendering of a ramp for comparison or academic purposes.
- Your target rendering pipeline internally uses CIELAB (some older design tools, colorimetric measurements, textile industry workflows).

**Use LCHUV when:**

- You need to cross-reference colors defined in a CIELUV-based workflow — display colorimetry, illumination engineering, or lighting-industry color specifications.
- You want to compare CIELUV's chromatic structure against CIELAB for the same ramp (the two spaces produce noticeably different hue distributions, particularly in the yellow-green and blue-cyan regions).
- Academic or research contexts where CIELUV is the reference standard.

**Use SRLCH when:**

- You want CIELAB's familiar L\*C\*h° framework and 0–100 L\* scale with reduced hue skew.
- Comparing against SRLAB2-based tools or validating an SRLAB2 implementation.
- Academic or research contexts where SRLAB2 is the reference standard.

**Use JzCzHz when:**

- Building ramps that will be used in an HDR or wide-gamut context (e.g., ramps for display-P3 or Rec. 2020 targets), where JzAzBz's PQ-based lightness is a better model of the display pipeline than a cube-root approximation.
- Comparing OKLCH output against a JzAzBz reference implementation to validate that both produce equivalent perceived neutrality and hue stability for a given SDR ramp.
- Academic or research contexts where JzAzBz is the reference standard, or when evaluating perceptual color spaces against HDR-aware datasets.
- Exploring JzCzHz hue angles as an alternative to OKLCH for saturated blue and cyan hues, where the two spaces can diverge measurably.

For most SDR web and product design work, the differences between OKLCH and CIELCH are subtle in the midtones but clearly visible at high chroma, particularly for blues and warm yellows. LCHUV produces a distinctly different hue distribution than CIELCH — the hue angles map differently to sRGB primaries — most visibly in the yellow-green and cyan regions. SRLCH produces ramps noticeably better than CIELCH and comparable to OKLCH, with the most visible improvement in the blue and violet hue range. JzCzHz is the most suitable choice for HDR pipelines and produces results comparable to OKLCH for SDR content, with minor differences in dark compression and blue-region hue paths. For production SDR UI work, OKLCH remains the recommended default.

The images below show full hue-spectrum matrices — every hue from 0° to 360° across the columns, ramp stops 50–950 down the rows — rendered first in **OKLCH** and then in **SRLCH**, each in dark and light mode:

![Full hue-spectrum matrix — OKLCH, dark and light mode](samples/okLCh-2026-01.png)

![Full hue-spectrum matrix with hex labels — OKLCH, dark and light mode](samples/okLCh-2026-02.png)

![Full hue-spectrum matrix — SRLCH, dark and light mode](samples/srLCH-2026-03.png)
