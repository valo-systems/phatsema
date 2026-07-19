# Phatsema web logo assets

Generated from `PHATSEMA-PROJECTS-LOGO.png`. The supplied file is a raster image,
so these files are optimized raster derivatives rather than a replacement for an
editable vector master.

## Recommended files

- **Top-left portal header:** `header/logo-header-40px.png`
- **High-density header:** `header/logo-header-40px@2x.png`, displayed at 40px high
- **Compact/mobile navigation:** `mark/logo-mark-color.png`
- **Dark navigation:** `logo/logo-full-reversed.png`
- **Dark footer, one color:** `logo/logo-full-white.png`
- **Browser favicon:** `favicon/favicon.ico`
- **Apple home-screen icon:** `favicon/apple-touch-icon.png`
- **PWA icons:** `favicon/android-chrome-192x192.png` and
  `favicon/android-chrome-512x512.png`
- **PWA maskable icon:** `favicon/maskable-icon-512x512.png`
- **Link preview:** `social/open-graph-logo-card-1200x630.png`

## HTML

```html
<link rel="icon" href="/assets/brand/favicon/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32"
      href="/assets/brand/favicon/favicon-32x32.png">
<link rel="apple-touch-icon"
      href="/assets/brand/favicon/apple-touch-icon.png">
```

For a standard light portal header:

```html
<img
  src="/assets/brand/header/logo-header-40px.png"
  srcset="/assets/brand/header/logo-header-40px@2x.png 2x"
  height="40"
  alt="Phatsema Projects & Supplies"
>
```

Keep clear space around the logo and do not stretch, recolor, rotate, or place the
full wordmark at tiny sizes. Use the compact mark below roughly 120px of available
horizontal space.
