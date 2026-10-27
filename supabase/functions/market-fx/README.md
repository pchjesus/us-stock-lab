# Market FX (v0.5-A)
Read-only Frankfurter v2 blended USD/KRW daily reference. **Not spot FX and not a paper-trade execution price.**

Deployment prerequisites:
- `supabase functions deploy market-fx --no-verify-jwt` only after reviewing this function and configuring approved environment.
- Public function contains NO privileged keys, NO DB calls, no user data; CORS * is intentional because information is public.
- The endpoint uses volatile in-memory per-worker cache up to 6h; this is not shared globally. Client calls are limited to one per mounted card. API abuse protection requires monitoring if public launch.
- Only deploy after tests. Set `VITE_ENABLE_MARKET_FX=true` in the **public frontend build** to activate read-only display; otherwise it remains unavailable. Existing .env.example defaults to disabled.
- Production Pages remains unchanged until separately verified.

Sources: https://frankfurter.dev/ (v2 single pair /v2/rate/USD/KRW). Blended rates are free to use; per-provider direct queries have additional restrictions.
Failure policy: missing/invalid/older than 10 days/timeout/HTTP error => 503, never substitute a synthetic number.
No changes to `paper_prices`, `paper_order`, `paper_snapshot`, order hours, ledger, auth or RLS.
