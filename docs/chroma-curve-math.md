# Chroma Curve — Mathematical Specification

The visualizer computes chroma `C` as a function of lightness `L` using a 5-point monotone cubic Hermite spline, scaled by a saturation multiplier. All wave-shaping controls feed into this single closed-form expression.

---

## Parameters

| Symbol | UI control | Domain |
|--------|-----------|--------|
| `L` | Lightness (input) | [0, 1] |
| `Lₒ` | Dark anchor (`curveDark`) | [0, 1] |
| `L₄` | Light anchor (`curveLight`) | [0, 1] |
| `Lₚ` | Peak L | (Lₒ, L₄) |
| `Cₚ` | Peak chroma (`peakChroma`) | ≥ 0 |
| `Lₗ` | Left knee L (`lKneeL`) | (Lₒ, Lₚ) |
| `Cₗ` | Left knee C (`lKneeC`) | ≥ 0 |
| `Lᵣ` | Right knee L (`rKneeL`) | (Lₚ, L₄) |
| `Cᵣ` | Right knee C (`rKneeC`) | ≥ 0 |
| `Q` | Peak Q (`peakQ`) | > 0 |
| `s` | Saturation multiplier (`sat`) | ≥ 0 |
| `p` | Compression % (`compPct`) | [0, 100] |

---

## Step 1 — Q-adjusted knee positions

Peak Q scales the shoulder widths symmetrically around the peak:

```
L₁ = clamp( Lₚ − (Lₚ − Lₗ) / Q,  Lₒ + 0.01,  Lₚ − 0.001 )
L₃ = clamp( Lₚ + (Lᵣ − Lₚ) / Q,  Lₚ + 0.001, L₄ − 0.01  )
```

- `Q = 1` → `L₁ = Lₗ`, `L₃ = Lᵣ` (knees unchanged)
- `Q > 1` → shoulders narrow toward peak (sharper)
- `Q < 1` → shoulders widen away from peak (flatter)

The peak position `Lₚ` and anchors `Lₒ, L₄` are unaffected by Q.

---

## Step 2 — Five control knots

```
x = [ Lₒ,  L₁,  Lₚ,  L₃,  L₄ ]
y = [  0,  Cₗ,  Cₚ,  Cᵣ,   0  ]
```

`Cₗ` and `Cᵣ` are clamped to ≥ 0 before use.

---

## Step 3 — Monotone cubic Hermite spline

### 3a. Segment slopes

```
δᵢ = (yᵢ₊₁ − yᵢ) / (xᵢ₊₁ − xᵢ),   i = 0…3
```

### 3b. Initial tangent slopes at knots

```
m₀ = δ₀
m₄ = δ₃
mᵢ = (δᵢ₋₁ + δᵢ) / 2,   i = 1, 2, 3
```

### 3c. Fritsch-Carlson monotonicity enforcement

Applied per segment (i = 0…3) to prevent overshoot:

```
if δᵢ = 0:
    mᵢ = mᵢ₊₁ = 0
else:
    a = mᵢ / δᵢ
    b = mᵢ₊₁ / δᵢ
    h = √(a² + b²)
    if h > 3:
        mᵢ   ← (a / h) · 3 · δᵢ
        mᵢ₊₁ ← (b / h) · 3 · δᵢ
```

### 3d. Piecewise cubic Hermite evaluation

On interval `i` where `xᵢ ≤ L < xᵢ₊₁`:

```
Δx = xᵢ₊₁ − xᵢ
t  = (L − xᵢ) / Δx          ∈ [0, 1)

S(L) = (2t³ − 3t² + 1) · yᵢ
     + (t³ − 2t² + t)  · Δx · mᵢ
     + (−2t³ + 3t²)    · yᵢ₊₁
     + (t³ − t²)       · Δx · mᵢ₊₁
```

The four terms are the standard cubic Hermite basis functions h₀₀, h₁₀, h₀₁, h₁₁.

---

## Step 4 — Chroma output

```
C(L) = 0                    if L ≤ Lₒ  or  L ≥ L₄
C(L) = s · max(0, S(L))     otherwise
```

---

## Step 5 — Gamut compression (post-curve)

Let `Cₘₐₓ(L, h)` be the maximum in-gamut chroma at lightness `L` and hue `h`. If `C(L) > Cₘₐₓ`:

```
C_final = Cₘₐₓ + (C − Cₘₐₓ) · (1 − p / 100)
```

| `p` | Behaviour |
|-----|-----------|
| 0   | No compression; out-of-gamut values pass through |
| 100 | Hard clip to `Cₘₐₓ` |
| 50  | Half the excess above the gamut ceiling is retained |

---

## Closed-form summary

For `L ∈ (Lₒ, L₄)`:

```
C(L) = s · max( 0, H( L ; {Lₒ, L₁(Q), Lₚ, L₃(Q), L₄}, {0, Cₗ, Cₚ, Cᵣ, 0} ) )

where
  L₁(Q) = Lₚ − (Lₚ − Lₗ) / Q
  L₃(Q) = Lₚ + (Lᵣ − Lₚ) / Q
```

`H(·)` is the monotone cubic Hermite interpolant with Fritsch-Carlson tangents over the five knots. The knot chroma values `{0, Cₗ, Cₚ, Cᵣ, 0}` are fixed; `Q` only moves the shoulder knot positions horizontally.

---

## "Smooth" post-processing (discrete only)

When the **Smooth** toggle is on, a `[0.25, 0.5, 0.25]` Gaussian kernel is applied to the *discrete sampled chroma values* after gamut mapping, with unimodal monotone enforcement (non-decreasing dark→peak, non-increasing peak→light). This affects the sampled ramp steps only — it does not alter the analytic `C(L)` above.

---

## Implementation locations (index.html)

| Function | ~Line |
|----------|-------|
| `buildMonotoneCubicSpline()` | 1390 |
| `chromaCurve()` | 1422 |
| `compressGamutMap()` | 1350 |
| Smooth/monotone post-pass | 1643 |
