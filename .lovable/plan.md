

# Fix: Deploy `discover-dealer-site` Edge Function

## Problem
The `discover-dealer-site` edge function exists in code (`supabase/functions/discover-dealer-site/index.ts`) but:
1. It's **not registered** in `supabase/config.toml` (missing `verify_jwt = false`)
2. It was **never deployed** to Lovable Cloud

The same issue likely applies to `track-dealer-run` and `structure-dealer-page`.

## Fix

### 1. Add all missing edge functions to `supabase/config.toml`
Add entries for `discover-dealer-site`, `track-dealer-run`, and `structure-dealer-page` with `verify_jwt = false`.

### 2. Deploy all edge functions
Deploy `discover-dealer-site`, `track-dealer-run`, and `structure-dealer-page` to Lovable Cloud.

### 3. Verify
Test `discover-dealer-site` with a sample request to confirm it responds.

