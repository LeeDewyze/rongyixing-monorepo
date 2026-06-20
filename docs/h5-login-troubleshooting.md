# H5 Login Troubleshooting (Password Login)

This document summarizes issues encountered while wiring the H5 password login flow (`LoginByRyx` → `GetWebSocketUrl`) and how to diagnose similar failures in local development.

## Login flow (overview)

1. **POST** `LoginByRyx` (`ApiLoginUrl-Home-Login`)
   - Resolves to `VITE_LOGIN_URL` (e.g. `http://ronglv-feature.rtesp.com/Jyx/LoginByRyx`).
   - Returns a `Ticket` on success.

2. **POST** `/Home/Proxy` with `ApiHomeUrl-Identity-GetWebSocketUrl`
   - Uses the `Ticket` from step 1.
   - Returns a WebSocket URL stored in session for later API calls.

Both steps use beeant-style form fields (`Method`, `Data`, `Timestamp`, `Token`, `Sign`, `Domain`, etc.).

## Sign algorithm

Sign is computed as:

```
Sign = md5(Data + Timestamp + Token)
```

- `Data` for signed requests (including login) is `JSON.stringify(payload)` before hashing.
- `Token` is the app-level token from `/Home/Setting` (or `VITE_API_TOKEN` when set).
- `Timestamp` is UTC+8 unix seconds.

If Sign validation fails, the API returns:

```json
{ "Code": "...", "Message": "凭证错误,sign:xxxxxxxx" }
```

If Sign passes but credentials are wrong:

```json
{ "Code": "LoginError", "Message": "用户名或密码错误" }
```

**Rule of thumb:** `凭证错误` = Sign / Token / request shape problem. `用户名或密码错误` = Sign is OK; check account/password.

## Local dev: why the browser shows `localhost:5173`

In development, the app intentionally posts to same-origin paths to avoid CORS:

| What you see in DevTools | What actually happens |
|--------------------------|------------------------|
| `http://localhost:5173/Jyx/LoginByRyx` | Vite proxies `/Jyx` → `ronglv-feature.rtesp.com` |
| `http://localhost:5173/Home/Proxy` | Vite proxies `/Home` → `app.rtesp.com` (or `VITE_API_BASE_URL`) |

`rewriteDevProxyUrl` in `apps/h5/src/lib/api.ts` rewrites absolute login URLs to relative paths (e.g. `/Jyx/LoginByRyx`) so the Vite dev proxy can forward them.

**Seeing `localhost:5173` in the Network tab is expected and correct.**

## Root cause: wrong Vite `/Jyx` proxy target

### Symptom

- Login fails with `凭证错误,sign:...` even though Token and Sign logic appear correct.
- Direct HTTP calls to `http://ronglv-feature.rtesp.com/Jyx/LoginByRyx` succeed (Sign OK, wrong password only).
- Requests through `http://localhost:5173/Jyx/LoginByRyx` fail or return unexpected responses.

### Cause

`VITE_FEATURE_RONGlv_URL` was set to the **full login URL** instead of the **origin only**:

```bash
# Wrong — includes path; breaks Vite proxy path joining
VITE_FEATURE_RONGlv_URL=http://ronglv-feature.rtesp.com/Jyx/LoginByRyx

# Correct — origin only
VITE_FEATURE_RONGlv_URL=http://ronglv-feature.rtesp.com
```

Vite's `/Jyx` proxy uses this value as `server.proxy["/Jyx"].target`. When the target includes a path, the proxied URL is assembled incorrectly (e.g. duplicated path segments), so the request never reaches the real `LoginByRyx` endpoint. This surfaced as Sign/credential errors in the UI.

### Fix

1. Set in `.env.development` / `.env.development.local`:

   ```bash
   VITE_FEATURE_RONGlv_URL=http://ronglv-feature.rtesp.com
   VITE_LOGIN_URL=http://ronglv-feature.rtesp.com/Jyx/LoginByRyx
   ```

2. `apps/h5/vite.config.ts` now normalizes the proxy target via `getFeatureRonglvOrigin()` — it extracts `.origin` from `VITE_FEATURE_RONGlv_URL` or falls back to `VITE_LOGIN_URL`, so a full URL in env is less likely to break the proxy again.

3. **Restart** `pnpm dev:h5` after changing `vite.config.ts` or env files.

### Verification

After the fix, a probe request through the dev proxy should return `LoginError` (wrong password), not `凭证错误` or HTTP 404:

```bash
# Through Vite proxy — expect LoginError if Sign is valid
curl -X POST http://localhost:5173/Jyx/LoginByRyx \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "Method=ApiLoginUrl-Home-Login&..."
```

## Other issues investigated (not the final root cause)

| Topic | Finding |
|-------|---------|
| **Token mismatch (.com vs .cn)** | For `app.rtesp.com` + `appId=com.ronglvonline.app`, `/Home/Setting` returns Token `41C21104DE0D4A0B8FE4229C822576B4` and Domain `rtesp.com`. This matches our env; Token was not the blocker once proxy was fixed. |
| **`Device` / `DeviceName` in login Data** | Sign algorithm accepts login payloads with or without these fields. Restoring them aligns with legacy app behavior but was not required to pass Sign validation. |
| **`VITE_API_MODE=mock` vs `proxy`** | Removing `.env.development.local` can switch from mock to proxy and hit real APIs. Ensure mode and env URLs match the target environment. |
| **`VITE_API_BASE_URL` protocol** | `app.rtesp.com` uses **http**, not https. Wrong protocol can cause `ECONNREFUSED` for `/Home/Proxy`. |
| **Login vs Proxy environment** | `LoginByRyx` (feature ronglv) and `/Home/Proxy` (app base) must belong to the same environment; a ticket from test login is invalid on production proxy. |

## Recommended dev env (rtesp.com test)

```bash
VITE_API_BASE_URL=http://app.rtesp.com
VITE_API_MODE=proxy
VITE_API_DOMAIN=rtesp.com
VITE_API_TOKEN=41C21104DE0D4A0B8FE4229C822576B4
VITE_LOGIN_URL=http://ronglv-feature.rtesp.com/Jyx/LoginByRyx
VITE_FEATURE_RONGlv_URL=http://ronglv-feature.rtesp.com
```

Omit `VITE_API_TOKEN` to load Token dynamically from `GET /Home/Setting?appId=com.ronglvonline.app` instead.

## Quick diagnostic checklist

1. **Restart dev server** after env or `vite.config.ts` changes.
2. **Network tab:** login URL should be `localhost:5173/Jyx/LoginByRyx` in dev (proxied).
3. **Response message:** `凭证错误` → Sign/Token/proxy; `用户名或密码错误` → credentials.
4. **`VITE_FEATURE_RONGlv_URL`:** must be origin only, no `/Jyx/...` path.
5. **`VITE_API_BASE_URL`:** use `http://` for `app.rtesp.com`.
6. **Same environment** for login host and `VITE_API_BASE_URL` / Domain.
7. **Direct probe:** POST to `http://ronglv-feature.rtesp.com/Jyx/LoginByRyx` with computed Sign; if that works but localhost fails, suspect Vite proxy config.

## Related code

| Area | Location |
|------|----------|
| Dev URL rewrite | `apps/h5/src/lib/api.ts` — `rewriteDevProxyUrl` |
| Vite proxy | `apps/h5/vite.config.ts` — `getFeatureRonglvOrigin`, `/Jyx`, `/Home` |
| Static Token / LoginUrl | `apps/h5/src/lib/env.ts` — `getStaticApiConfig` |
| Login URL resolution | `packages/api/src/proxy/resolve-url.ts` |
| Sign | `packages/api/src/proxy/sign.ts` — `computeSign` |
| Login hook | `apps/h5/src/hooks/useAuth.ts` |
