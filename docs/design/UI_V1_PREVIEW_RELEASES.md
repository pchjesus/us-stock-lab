# UI v1.0 preview publication log

This file is an operations marker. It is not imported into the application and has no effect on calculations, trading, account data, authentication, migrations, or production routes.

## 2026-11-18 · Stage 2 UX preview
- Design source branch: `design/ui-v1-rebuild`
- Audited code SHA before publishing: `3ef048660b3a4acedd1da20f2c9997678ba596c6`
- Design changes: aligned index/NYSE time strip, one-line regular trading hours, redesigned market discovery rows, a quote-first stock view, and clearer portfolio holdings/ledger layout
- Production `main` source remains the current stable app at site root; the separate design build is served only under `/preview/ui-v1/`
- Live preview link: https://pchjesus.github.io/us-stock-lab/preview/ui-v1/?ui=v1#home
- Triggering operation: an explicitly approved preview-only republish; **the design branch is not merged into main**
- The preview shares the browser origin with production and may share localStorage/auth state. Avoid test orders and account resets when reviewing the design.
- Browser build regression: https://github.com/pchjesus/us-stock-lab/actions/runs/44119167587
