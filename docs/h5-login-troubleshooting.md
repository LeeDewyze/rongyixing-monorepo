# H5 Login Troubleshooting (Password Login)

This document summarizes issues encountered while wiring the H5 password login flow (`LoginByRyx` → `GetWebSocketUrl`) and how to diagnose similar failures in local development.

## Login flow (overview)

1. **POST** `LoginByRyx` (`ApiLoginUrl-Home-Login`)
   - Resolves to `LoginUrl` from `/Home/Setting` (e.g. `http://ronglv-feature.rtesp.com/Jyx/LoginByRyx`).
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
- `Token` is the app-level token from `GET /Home/Setting?appId={appId}` (cached in `localStorage` key `ryx_api_config`).
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

## Root cause: Vite `/Jyx` proxy target mismatch

### Symptom

- Login fails with `凭证错误,sign:...` even though Token and Sign logic appear correct.
- Direct HTTP calls to `http://ronglv-feature.rtesp.com/Jyx/LoginByRyx` succeed (Sign OK, wrong password only).
- Requests through `http://localhost:5173/Jyx/LoginByRyx` fail or return unexpected responses.

### Cause

The dev server proxies `/Jyx` to a **hardcoded origin** in `apps/h5/vite.config.ts` (`DEV_JYX_PROXY_TARGET`, default `http://ronglv-feature.rtesp.com`). If `/Home/Setting` returns a `LoginUrl` on a different host, `rewriteDevProxyUrl` still sends the browser to `/Jyx/...` on localhost, but Vite forwards to the wrong backend.

### Fix

1. Confirm `LoginUrl` from `/Home/Setting` matches `DEV_JYX_PROXY_TARGET` (same origin).
2. If you point `VITE_API_BASE_URL` at another environment with a different login host, update `DEV_JYX_PROXY_TARGET` in `vite.config.ts` to that host's origin.
3. **Restart** `pnpm dev:h5` after changing `vite.config.ts`.

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

## ApiConfig bootstrap (Token source)

At app start (`main.tsx` → `bootstrapApi()`), non-mock mode fetches:

```
GET /Home/Setting?appId=com.ronglvonline.app
```

Response `Data.Token`, `Data.LoginUrl`, and `Data.Urls` are saved to `localStorage` (`ryx_api_config`) and used for all signed requests (`LoginByRyx`, `/Home/Proxy`, hotel, etc.).

`bootstrapApi()` wraps `loadApiConfig()` in **try-catch** so a network failure logs an error but does not block rendering. `ensureApiConfig()` retries on the first API call if Token is still missing.

Switching API mode via the DEV menu calls `resetApi()`, which clears `ryx_api_config` before reload to avoid stale Token from another environment.

**Clean up legacy env:** remove `VITE_API_TOKEN`, `VITE_LOGIN_URL`, and `VITE_FEATURE_RONGlv_URL` from `.env.development.local` if present — they are no longer read.

## Recommended dev env (rtesp.com test)

```bash
VITE_APP_ID=com.ronglvonline.app
VITE_API_BASE_URL=http://app.rtesp.com
VITE_API_MODE=proxy
VITE_API_DOMAIN=rtesp.com
```

Do **not** set `VITE_API_TOKEN` — Token comes from Setting at startup.

## This MacBook's local startup note

This machine is Apple Silicon (`arm64`), but `/usr/local/bin/node` is an `x86_64` Node binary from an Intel/Homebrew install. If `pnpm dev:h5` or `vite` starts failing with Rollup native package errors such as:

```text
Cannot find module @rollup/rollup-darwin-x64
```

start the app with the `arm64` Node from `nvm` instead of the default `/usr/local/bin/node`:

```bash
PATH=/Users/jiangjiankang/.nvm/versions/node/v24.11.1/bin:$PATH \
NPM_CONFIG_USERCONFIG=/Users/jiangjiankang/work/self/rongyixing/rongyixing-monorepo/.npmrc \
pnpm --filter @ryx/h5 exec vite --host 127.0.0.1 --port 5174
```

If the port is already occupied, stop the old process first, then restart it on `127.0.0.1:5174`.

If you want the whole shell session to use the correct runtime, run:

```bash
export PATH=/Users/jiangjiankang/.nvm/versions/node/v24.11.1/bin:$PATH
node -p "process.arch"
```

Expected result: `arm64`.

## Known limitations

| Case | Risk | Mitigation |
|------|------|------------|
| Bootstrap network failure | Token empty → Sign fails on first login | `ensureApiConfig` retries per request; check Network for `/Home/Setting` |
| Stale `ryx_api_config` after env switch | Wrong Token → `凭证错误` | DEV menu mode switch clears cache; or manually delete `ryx_api_config` |
| Cold start ~100ms | Brief blank screen before render | Acceptable for v1; splash loading can be added later |

## Quick diagnostic checklist

1. **Restart dev server** after env or `vite.config.ts` changes.
2. **Network tab:** login URL should be `localhost:5173/Jyx/LoginByRyx` in dev (proxied).
3. **Response message:** `凭证错误` → Sign/Token/proxy; `用户名或密码错误` → credentials.
4. **`DEV_JYX_PROXY_TARGET`:** in `vite.config.ts`, must match Setting `LoginUrl` origin.
5. **`VITE_API_BASE_URL`:** use `http://` for `app.rtesp.com`.
6. **Same environment** for login host and `VITE_API_BASE_URL` / Domain.
7. **Direct probe:** POST to `http://ronglv-feature.rtesp.com/Jyx/LoginByRyx` with computed Sign; if that works but localhost fails, suspect Vite proxy config.

## Related code

| Area | Location |
|------|----------|
| Dev URL rewrite | `apps/h5/src/lib/api.ts` — `rewriteDevProxyUrl` |
| Vite proxy | `apps/h5/vite.config.ts` — `DEV_JYX_PROXY_TARGET`, `/Jyx`, `/Home` |
| ApiConfig bootstrap | `apps/h5/src/lib/api.ts` — `bootstrapApi`, `clearApiConfigCache` |
| Login URL resolution | `packages/api/src/proxy/resolve-url.ts` |
| Sign | `packages/api/src/proxy/sign.ts` — `computeSign` |
| Login hook | `apps/h5/src/hooks/useAuth.ts` |
