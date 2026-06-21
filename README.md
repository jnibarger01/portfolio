# Jace Nibarger — Portfolio

Personal portfolio site for Jace Nibarger — service operations & customer-facing revenue leader.

A single-page, zero-build static site (HTML / CSS / vanilla JS). No framework, no toolchain — just open `index.html` or serve the folder.

## Sections
Hero · Performance metrics (animated count-up) · Selected work · About · Services · Contact

## Run locally
```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Structure
```
index.html      markup for all sections
styles.css      palette, layout, responsive breakpoints
script.js       count-up · canvas mesh · scroll-reveal · contact form
assets/         hero image + resume PDF
```

## Tech
- Fonts: Sora, Manrope, JetBrains Mono (Google Fonts)
- No dependencies, no build step — deploys to any static host (GitHub Pages, Netlify, Vercel)
