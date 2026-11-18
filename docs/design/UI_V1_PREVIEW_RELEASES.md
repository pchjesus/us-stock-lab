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

## 2026-11-18 · Stage 3 ratios + analysis/backtest UI preview
- Design branch: `design/ui-v1-rebuild`
- Verified design commit SHA: `24b9621da3b63eccd026b49306378c00b856627e`
- Exception to feature freeze: read-only PER/PBR/ROE company reference and dated NYU Stern illustrative sector benchmarks, five companies only. Synthetic prices and order engine remain untouched.
- Visual changes: responsive quote/reference cards; more legible analysis and BT1 comparison layouts.
- Strict accounting boundary: no account/order/RPC/auth/financial calculation change or Supabase migration.
- QA: https://github.com/pchjesus/us-stock-lab/actions/runs/44230447668 — production build, design 20/20, UI 452/452, auth 54/54, release 6/6, UX0 3/3 all PASS.
- Main production app is rebuilt unmodified at site root, UI v1 preview under `/preview/ui-v1/`; no merge of the design app code into main.
- Preview: https://pchjesus.github.io/us-stock-lab/preview/ui-v1/?ui=v1#stock/AAPL
- The preview can share browser origin local account/auth state with production; do not submit real test actions on the preview account.

## 2026-11-18 · Stage 4 learning, support and overview valuation preview
- Verified design source SHA: `2bd996745f6694e9016db6bc0080b5e175a1d219`, branch `design/ui-v1-rebuild`.
- Revised valuation position: PER/PBR/ROE and sector reference reside in the **company overview tab after business/verified results**, not beneath the synthetic quote and not in other tabs.
- Visual-only renovation: learning selection/progress/lesson filters, sample-only experience lab, calendar, empty-news and official-resource cards, settings/account/auth sections.
- Source: `src/design/v1/sections.css` scoped to `?ui=v1`; old app keeps original layout, all data and calculation engines unchanged.
- GitHub Actions QA: https://github.com/pchjesus/us-stock-lab/actions/runs/44232992283 **SUCCESS** — build; new focused 28/28; full UI 460/460; auth 54/54; release 6/6; UX0 3/3.
- Pages root remains built from production main, design branch is built separately under `/preview/ui-v1/`; only docs/ops metadata is updated on main. The design branch remains a Draft PR #32.
- Preview: https://pchjesus.github.io/us-stock-lab/preview/ui-v1/?ui=v1#stock/AAPL
- The preview is not a separate browser origin; local demo account and auth context can be shared. Do not test order/account reset actions against real user data.

## 2026-11-18 · Stage 5 Atlas-driven course reader and discoverable settings
- **QA-verified design branch** `design/ui-v1-rebuild`, HEAD `8fd05f7e73ab421c460d2a3bab1ef95c07fc440d`.
- User feedback: old 10 expanded accordion lessons were excessively tall. New opt-in v1 route renders a left 10-chapter navigator and **one lesson at a time**. Mobile uses a chapter select; the selected content appears below. Lesson content divides into **개념 / 사례 / 실습 / 퀴즈**, source references stay expandable. Arrow/Home/End navigation, prior/next lesson links, original questions/progress/answers/guided practice, no data migrations.
- Underlying design research: `pchjesus/design-kkakgi` Atlas SRC-19 split workspace, SRC-24 list versus accordion, SRC-14 tab state and SRC-25 chart context. No third-party code/assets copied.
- Chart learning lab also reorders existing controls and chart presentation, without modifying indicator calculations or synthetic prices.
- **Settings is now a named entry in the desktop left sidebar**, separate from login; mobile has a labeled header link. Collapsed rail still exposes Settings via icon and title.
- QA PASS: https://github.com/pchjesus/us-stock-lab/actions/runs/44237826332 — production build, new design 38/38, full UI 470/470, auth 54/54, release 6/6, UX0 3/3.
- Unchanged main application is built at GitHub Pages root; updated design source deployed only beneath `/preview/ui-v1/`. Draft PR #32 remains unmerged; this markdown change is purely an operations trigger.
- Preview: https://pchjesus.github.io/us-stock-lab/preview/ui-v1/?ui=v1#learn/lessons
- Shared-browser-origin warning: login and local demo account may share state. Review presentation only; avoid virtual orders/account resets unless using disposable test data.
