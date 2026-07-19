# Branding

Brand assets are stored in `apps/web/src/assets/brand`.

## Preferred assets

| Use | File |
|---|---|
| Root README and light presentation | `logo/logo-full-color-transparent.png` |
| Dark navigation | `logo/logo-full-reversed.png` |
| Compact navigation | `mark/logo-mark-color.png` |
| Standard login header | `header/logo-header-40px.png` |
| High-density login header | `header/logo-header-40px@2x.png` |
| Browser icon | files in `apps/web/public` |
| Link preview | `social/open-graph-logo-card-1200x630.png` |

The supplied master is raster artwork, so the repository contains optimised raster derivatives rather than an editable vector replacement.

## Usage

- Keep the logo aspect ratio.
- Preserve clear space around the mark.
- Use reversed or white artwork on dark surfaces.
- Do not recolour, rotate, stretch, or add effects.
- Use the compact mark when the full wordmark would become unreadable.
- Keep alt text meaningful and omit decorative duplication.

Portal colours and spacing are defined as tokens in `apps/web/src/styles/app.css`. New interface work should use those tokens instead of approximating the brand with arbitrary values.
