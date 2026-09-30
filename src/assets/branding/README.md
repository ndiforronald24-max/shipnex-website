# ShipNex Brand Assets

The official ShipNex logo is the wide blue banner. Its original is kept outside the
build at `brand-source/shipnex-banner-original-2078x757.png` (2078×757, opaque).

Derived assets live in `public/brand/` and are the only ones shipped:

| File | Size | Use |
|------|------|-----|
| `shipnex-wordmark-light.png` | 720×147 | **Primary.** White "Ship" + green "Nex" on transparent. For dark navy backgrounds (header, footer, admin sidebar). |
| `shipnex-wordmark.png` | 720×147 | Full-colour wordmark on transparent. For light backgrounds. |
| `shipnex-logo-transparent.png` | 1400×510 | Full lockup including the tagline, transparent. For light backgrounds. |
| `shipnex-banner.png` | 1400×510 | Full banner on brand blue. Used as the Open Graph / Twitter share image. |
| `favicon-32.png` | 128×128 | White paper plane on brand blue, rounded. Favicon + apple-touch-icon. |

### Regenerating

If a new banner arrives, drop it in `brand-source/` and re-run the keying script:
modal background colour is detected, converted to alpha, then a navy→white variant
is produced for dark backgrounds. Keep the "Ship" glyph light on navy; the raw
wordmark is dark navy and would be invisible against `#1a237e`.

## Logo Usage Guidelines

- **Dark backgrounds** (`#1a237e`, `#0d1b69`): use `shipnex-wordmark-light.png`
- **Light backgrounds** (white, light gray): use `shipnex-wordmark.png`
- **Never** stretch: always constrain by height with `w-auto object-contain`
- **Always** set `alt="ShipNex"` and explicit `width`/`height` to avoid layout shift

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Logo Blue | `#0073E3` | Banner background, favicon, manifest theme |
| Deep Navy | `#1a237e` | Primary, headers, footer |
| Deep Navy (dark) | `#0d1b69` | Top bar, footer background |
| Bright Green | `#76b82a` | "Nex" in the wordmark |
| Orange | `#ff6f00` | CTAs, highlights, badges |
| White | `#ffffff` | Backgrounds, text |

> **Note:** Do not modify or redesign the official ShipNex logo artwork itself. Only
> derive the light-on-dark and size variants described above.
