# UI v1 — PER, PBR, ROE & US industry benchmarks (2026-11-18)

## Scope and data boundary

Feature request exception to the earlier feature freeze: add **read-only reference PER/PBR/ROE** to the company detail screen while the UI renovation proceeds. This must not modify virtual-trading synthetic prices, account/ledger, market-hours, backtest or portfolio metrics, company SEC evidence observations, or ETF product semantics.

The existing app's 8 trading symbols use generated **synthetic prices** from `src/data.ts`, which are NOT suitable numerators for real market valuation ratios. The snapshots in `src/valuationSnapshots.ts` are **separate third-party market reference data** and are never passed to `quote()`, order RPCs, portfolio valuation, TWR, or MDD. There is no real-time quote integration and these fixed figures **do not refresh automatically**.

### Company reference values (provider checked November 18, 2026)

Provider: Stock Analysis statistics pages, which credit S&P Global Market Intelligence. The display labels the reference as 2026-11-17 market close, with a separate verification date 2026-11-18, which does not imply continuous intraday updating.

| Symbol | Trailing PER (x) | PBR (x) | ROE (%) | Reference |
| --- | ---: | ---: | ---: | --- |
| AAPL | 39.19 | 45.62 | 142.26 | https://stockanalysis.com/stocks/aapl/statistics/ |
| MSFT | 26.43 | 7.99 | 34.22 | https://stockanalysis.com/stocks/msft/statistics/ |
| NVDA | 19.66 | 16.47 | 117.21 | https://stockanalysis.com/stocks/nvda/statistics/ |
| AMZN | 20.84 | 4.54 | 27.42 | https://stockanalysis.com/stocks/amzn/statistics/ |
| GOOGL | 14.63 | 5.22 | 44.29 | https://stockanalysis.com/stocks/googl/statistics/ |

We deliberately **do not back-calculate** the provider's supplied ratios using the app's incomplete SEC share-count and period records, nor substitute FY2025 net income for FY2026 price/EPS without matching dates. This is an independent externally published reference, not SEC-certified reported output. The original company 219 verified/reporting observations and 8-symbol synthetic price universe stay untouched.

### U.S. peer-sector reference (NYU Stern / Aswath Damodaran January 2026)

The source is NYU Stern's published U.S. industry table. PER is the **Trailing PE** column, PBR is **PBV**, and ROE is **unadjusted ROE**. Industry groups are editorial **illustrative sector mappings**, not certified SEC SIC equals Damodaran group. The industrial mapping is therefore explicitly disclosed, and users are not shown valuation rankings, +/- overvaluation bars, percentage-difference scores, or recommendations. The company and sector dates differ by ~10 months and methodologies also differ.

| Symbol | Illustrative industry name | Firms | Trailing PE (x) | PBV (x) | ROE (%) |
| --- | --- | ---: | ---: | ---: | ---: |
| AAPL | Computers/Peripherals | 36 | 81.13 | 34.08 | -0.17 |
| MSFT | Software (System & Application) | 309 | 79.17 | 9.14 | 29.62 |
| NVDA | Semiconductor | 66 | 100.18 | 13.31 | 31.36 |
| AMZN | Retail (General) | 23 | 51.00 | 7.19 | 26.05 |
| GOOGL | Advertising | 52 | 44.43 | 4.55 | -1.34 |

**Important analytical limitations:** negative ROE or unusually high PER/PBV is not a typo and must not be silently normalized. A sector aggregate may contain loss-making firms, mixed valuations, negative equity, and sample-selection effects. Multi-business companies cannot be cleanly assigned to just one group. GOOGL's Alphabet and AMZN's Amazon are particularly diversified, so the grouping should be viewed as a broad learning reference rather than a valid exact peer universe. Users must compare ratio definitions and dates before inferring price vs intrinsic value.

For two identical dates and identical accounting definitions, lower PER/PBR still cannot by itself prove undervaluation. ROE may be inflated by leveraged capital structures and buybacks.

### What the UI actually provides

- Three accessible PER/PBR/ROE metric cards on **company detail v1 only**; existing company overview + financials/evidence/trade tabs remain intact.
- Each card shows company's sourced historical reference side-by-side with dated, **illustratively matched** NYU industry reference.
- A definition and caveat under each metric, explicit source links (new tab), exact sample count, verification date and method caveat.
- ETFs VOO/QQQ/SCHD remain excluded; their fund expenses, holdings, and distributions cannot be treated as single-corporation PER/PBR/ROE in this interface.
- No interactivity to purchase, score, infer value, or refresh. Raw copied figures are read-only references.

### Quality gates

Production feature-flag build, new valuation tests (all five stock cards and three ETFs, missing-value behavior, local account preservation, 320/390/768/1440px), original financial evidence tests and app-wide UI/Auth/Release/UX0 tests in GitHub Actions. The existing main/Pages remains unchanged until explicit permission to refresh the isolated preview path.

### References (APA 7th)

Damodaran, A. (2026, January). *PE ratio by sector (US)*. New York University Stern School of Business. https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/pedata.html

Damodaran, A. (2026, January). *Price and value to book ratio by sector (US)*. New York University Stern School of Business. https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/pbvdata.html

Damodaran, A. (2026, January). *Return on equity by sector (US)*. New York University Stern School of Business. https://pages.stern.nyu.edu/adamodar/New_Home_Page/datafile/roe.html

Stock Analysis. (2026, November 18). *Apple Inc. (AAPL) statistics & valuation*. https://stockanalysis.com/stocks/aapl/statistics/

Stock Analysis. (2026, November 18). *Microsoft Corporation (MSFT) statistics & valuation*. https://stockanalysis.com/stocks/msft/statistics/

Stock Analysis. (2026, November 18). *NVIDIA Corporation (NVDA) statistics & valuation*. https://stockanalysis.com/stocks/nvda/statistics/

Stock Analysis. (2026, November 18). *Amazon.com, Inc. (AMZN) statistics & valuation*. https://stockanalysis.com/stocks/amzn/statistics/

Stock Analysis. (2026, November 18). *Alphabet Inc. (GOOGL) statistics & valuation*. https://stockanalysis.com/stocks/googl/statistics/

U.S. Securities and Exchange Commission. (n.d.). *Beginners' guide to financial statements*. https://www.sec.gov/about/reports-publications/investorpubsbegfinstmtguide
