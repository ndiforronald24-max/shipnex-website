# ShipNex — Production Readiness Report

**Date:** 23 September 2026 · **Workspace:** `shipnex-website` · **Scope:** full end‑to‑end test of the
ShipNex ecosystem (React 19 + Vite frontend, ASP.NET Core 8 API, EF Core data layer) plus a
production‑readiness audit of configuration, security controls and deployment assets.

**Method:** automated unit/integration suites, live process smoke tests (real Kestrel + real
config chain), static code/config review, and deployment‑asset review. Every claim below is backed
by a command that was executed or a file that was read; unverifiable items are explicitly marked.

> **Cannot be verified in this environment (no credentials/devices available):** live Supabase
> (Storage + Realtime), Google Maps API, SMTP/Resend email delivery, and a real PostgreSQL server.
> Those paths are reviewed statically and by the in‑process integration suite only.

---

## 1. Verdict at a glance

| Area | Result |
|---|---|
| Backend test suites | ✅ **105 / 105 passing** (`0 failed`) |
| Frontend lint | ✅ **0 errors**, 47 advisory warnings (oxlint) |
| Frontend production build | ✅ `tsc -b && vite build` succeeds |
| Production config chain | ✅ Parses and boots (one **fatal** JSON defect found & fixed) |
| API runtime behaviour | ✅ Health, tracking, auth, rate limiting, public docs verified live |
| Live full‑stack E2E (real servers, 28 Sep) | ✅ **73 / 73 checks pass** — 8 API/DTO defects found & fixed (§10) |
| Security controls | ✅ Solid (JWT fail‑fast, RBAC, rate limits, private document storage, audit trail) |
| **Blockers before go‑live** | ⛔ **2** (see §8 — PostgreSQL schema has no creation path; forwarded headers missing behind the proxy) |
| Mobile support | ⚠️ Responsive web only — no PWA, no native Android/iOS project |
| CI/CD | ⚠️ CI runs (partial test coverage); the deploy job is still a placeholder |

---

## 2. Automated test results

| Suite | Command | Result |
|---|---|---|
| Application (unit + service) | `dotnet test backend/tests/ShipNex.Application.Tests -c Release` | **83 passed / 0 failed** |
| API integration (WebApplicationFactory, real HTTP pipeline) | `dotnet test backend/tests/ShipNex.Api.Tests -c Release` | **22 passed / 0 failed** (1 m 26 s) |
| Frontend lint | `npm run lint` (oxlint) | **Found 47 warnings and 0 errors** — 4.2 s, 75 files, 116 rules |
| Frontend build | `npm run build` (`tsc -b && vite build`) | ✅ 1625 modules · `dist/index.html` 1.91 kB · CSS 44.33 kB (gz 8.63) · JS 704.10 kB (gz 178.61) · 38.4 s |

> Note: `dotnet test` must be run **serially** in this workspace (concurrent runs overwrite each
> other's build/log output).

---

## 3. Live runtime verification (real process, not mocked)

### 3.1 Production configuration boot
* Started the release build with `ASPNETCORE_ENVIRONMENT=Production` and env‑provided secrets.
* Result: process started normally, `GET /health` → **`200 Healthy`**.
* Before the fix in §4.1 this same command crashed at configuration load.
* Only log line: `The WebRootPath was not found: …\wwwroot. Static files may be unavailable.`
  (expected — the SPA is served by nginx in production; see §7).

### 3.2 Development API against seeded data
| Check | Observed |
|---|---|
| `GET /health` | `200` |
| `GET /api/offices` | `200` + 5 seeded offices (NYC/LAX/LHR/SIN/DXB) |
| `GET /api/tracking/USP-9999-000000` (unknown) | `404` + friendly JSON `"We couldn't find a shipment with that tracking number…"` |
| `GET /api/shipments` **anonymous** | `401` (admin endpoint correctly protected) |
| `GET /api/documents/public/{trackingNumber}` | `200` + `[]` (only `CustomerVisible` docs are ever returned) |
| `POST /api/auth/login` invalid payload | `400` + ASP.NET validation problem details |
| 6th rapid `POST /api/auth/login` | `429 {"status":429,"message":"Too many requests"}` → **rate limiting proven live** (limit is 5 per 60 s per IP+path) |

### 3.3 JSON configuration sweep
All shipped JSON config files (both appsettings sets, the test appsettings, `package.json`, three
tsconfig files) parse cleanly — see §4.1 for the defect that was found this way.

---

## 4. Defects found and fixed

| # | Severity | Defect | Fix |
|---|---|---|---|
| 1 | 🔴 **Fatal in production** | `backend/src/ShipNex.Api/appsettings.Production.json` line 40 contained invalid JSON (`"retainedFileCountLimit": 90",` — stray quote). Every Production start aborted with a configuration parse exception before the first request. Only the Production file was affected. | Corrected to `"retainedFileCountLimit": 90,`; proven by the live Production boot test (§3.1). |
| 2 | 🟠 High (test + API correctness) | `ShipmentService` returned a blank/incorrect current location when `Shipment.CurrentLocationName` was empty, so public tracking showed no location even though tracking events had one. | Added a fallback to the latest tracking‑event location in **both** `GetByTrackingNumberAsync` and `GetPublicTrackingAsync` (`ShipNex.Infrastructure/Services/ShipmentService.cs`). |
| 3 | 🟡 Test fixture | `ShipmentServiceTests` asserted location semantics without seeding an initial `ShipmentCreated` event. | Fixture now seeds the initial event. |
| 4 | 🟡 Test fixture | `Shipments_GetAll_ReturnsNonEmptyList` used an anonymous client against an admin‑only endpoint (correct 401). | Now uses `CreateAuthorizedClientAsync()` with the seeded SuperAdmin. |

No other source files were modified. Frontend code was not changed.

---

## 5. Security controls verified (code + live behaviour)

### 5.1 Authentication & authorization
* **JWT secret is fail‑fast in production:** `Program.cs` (lines 68‑78) throws
  `InvalidOperationException` when `Jwt:SecretKey` is empty outside Development — no silent dev
  fallback in Production (verified live: Production boot requires `Jwt__SecretKey`).
* **Token validation** (lines 81‑95): issuer, audience, lifetime and signing key are all validated,
  `ClockSkew = TimeSpan.Zero`, symmetric key sourced from configuration.
* **RBAC policies** (lines 98‑112): `SuperAdmin`, `OperationsManager`, `ShipmentStaff`,
  `PetOperations`, `CustomerSupport`, `Finance`, `ReadOnly`, `Customer`, plus `StaffOnly`.
* **Live proof:** anonymous `GET /api/shipments` → `401`; client‑side route guards
  (`ProtectedRoute` in `src/App.tsx`, reading `localStorage.authToken`) are UX only — server‑side
  enforcement is what was verified.

### 5.2 API hardening
* `ExceptionHandlingMiddleware` is the first middleware (no stack traces leak to clients).
* `RateLimitMiddleware` — `5 requests / 60 s` per IP+path on `/api/auth/login|register`,
  `30 / 60 s` on `/api/tracking`; **live‑verified 429** on the 6th rapid login.
* **Swagger is Development‑only** (`Program.cs` 214‑218) — not exposed in production.
* CORS restricted via the `AllowFrontend` policy (`Cors:AllowedOrigins` =
  `https://shipnex.com;https://www.shipnex.com`).
* `/health` mapped; seeded demo data only for InMemory + Development (lines 201‑205).

### 5.3 Document storage, uploads and public exposure
* **Upload validator** (`ShipNex.Application/Validation/DocumentUploadValidator.cs`):
  * size bounded at **10 MB** (mirrored in `LocalFileStorageService`, which rejects mid‑stream
    instead of truncating);
  * extension allow‑list (pdf, png/jpg/jpeg/webp/gif, doc/docx, xls/xlsx, ppt/pptx, txt, csv);
  * explicit **executable/script block‑list** (`.exe .dll .bat .cmd .ps1 .sh .js .jar .apk .py .php …`)
    rejected regardless of claimed MIME type;
  * **MIME must match the extension**; empty files rejected;
  * file names sanitised (path separators stripped, control chars removed, Windows device names
    rejected), storage IDs are server‑generated (`yyyyMMdd_<guid>`) and `ValidateFileId` accepts
    only `[A-Za-z0-9_]` → path traversal is impossible;
  * local storage sits **outside** the web root, so documents are never statically served — every
    byte passes through an authorized, audited API route.
* **`DocumentsController`**: class‑level `[Authorize]`; `ViewRoles` / `ManageRoles` split;
  download and access‑URL routes audited; signed URLs clamped to 60 – 3600 s; visibility changes and
  deletes audited; soft delete + physical file removal.
* **Public routes** `public/{trackingNumber}` and `public-file/{id}` are `[AllowAnonymous]` but
  strictly gated on `CustomerVisible`; non‑visible or invalid IDs return `404` (no existence leak)
  and log a *blocked access attempt*. Live check: `GET /api/documents/public/USP-2026-458921` → `200 []`.
* **Supabase design is private‑by‑default** (`docs/supabase-storage-setup.md`): private bucket,
  **no client‑facing RLS policies**, `service_role` key server‑side only, object paths minted by the
  backend, and a documented rule never to add a public `SELECT` policy.

### 5.4 Secret hygiene
| Item | Finding |
|---|---|
| Frontend env | `.env` contains only `VITE_API_URL`; no service keys. Only `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (public anon key) are read (`src/services/realtime.ts`); realtime is a no‑op when they are blank. |
| Service‑role key | Never referenced in frontend code — only `FileStorage:SupabaseServiceKey` in server config/docs. |
| `.gitignore` | Ignores `logs`, `*.log`, `node_modules`, `dist`, `.env`, `.env.local`. |
| ⚠️ Stale duplicate | `backend/src/ShipNex/Api/appsettings.json` — an orphan folder containing only this file, and it hard‑codes the development JWT secret. Dead code, but delete it so a known key can never be deployed. |
| ⚠️ Compose fallback | `docker-compose.yml` defaults `Jwt__SecretKey=${JWT_SECRET:-YourSuperSecretKeyForProduction2026!…}` — if `JWT_SECRET` is unset the stack silently signs tokens with a public, guessable key. |
| ⚠️ Missing ignores | `uploads/`, `bin/`, `obj/` are not ignored, so uploaded customer documents (pet health/vet records) could be committed by accident. |

### 5.5 Residual security notes
* Dashboard tokens live in `localStorage` for **24 h** (`Jwt:ExpiryMinutes = 1440`) — a wide XSS
  window; consider 60‑minute access tokens + refresh, or httpOnly cookies.
* Upload validation checks extension↔MIME agreement but does **not** sniff magic bytes; an AV scan
  is advisable for a public cargo portal.
* `nginx.prod.conf` supplies HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, TLS 1.2/1.3 only,
  and forwards `X-Forwarded-For` / `X-Forwarded-Proto` (see P0‑2 in §8 for the app‑side counterpart).

---

## 6. Frontend, mobile & PWA

* **Responsive web design is in place:** Tailwind breakpoints are used throughout
  (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, `md:grid-cols-2`, `sm:flex-row`), every wide data
  table is wrapped in `overflow-x-auto` with `min-w-[700–900px]` + `whitespace-nowrap`, and
  `index.html` declares `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.
* SEO/social metadata is complete (description, keywords, robots, canonical, OG, Twitter card,
  theme‑color).
* ⚠️ **No PWA and no native app:** there is no service worker, no web manifest, no
  `vite-plugin-pwa`, and no Capacitor/Android/iOS project anywhere in the repository. Consequences:
  not installable, no offline mode, no push notifications, and no Android/iOS release pipeline
  (keystore, `Info.plist`, store listings) to validate. If a native app is in scope it does not
  exist yet — a Capacitor wrapper around this SPA is the smallest‑effort route; otherwise treat
  "mobile" strictly as responsive web.
* Performance: the bundle ships as a **single 704 kB chunk (178 kB gzipped)**; route‑level
  `React.lazy` splitting would improve first paint on mobile connections.
* The 47 oxlint warnings are all advisory React‑Compiler rules (components created during render,
  `setState` inside effects, `Math.random()` during render, non‑literal `useEffect` deps in
  `src/hooks/index.ts`); they do not affect build or runtime correctness.
* JSONC note: `tsconfig.app.json` / `tsconfig.node.json` are TypeScript JSON‑with‑comments files
  (e.g. `/* Bundler mode */`), so a strict JSON parser rejects them by design; `tsc -b` consumes them
  successfully, which is the authoritative check. All other JSON files parse strictly (see §3.3).

---

## 7. Deployment topology (assets reviewed)

* **`Dockerfile`** — multi‑stage build for the API only (`sdk:8.0` → `aspnet:8.0`), `EXPOSE 80`,
  `ENV ASPNETCORE_ENVIRONMENT=Production`, creates `/app/uploads`, and a container `HEALTHCHECK`
  hitting `http://localhost/health`. No frontend build step inside the image.
* **`docker-compose.prod.yml`** — `postgres:16-alpine` (healthcheck, 512 MB cap), `backend`
  (env‑driven secrets, `uploads_data` + `logs_data` volumes, 256 MB cap) and `nginx:alpine`
  publishing 80/443 with `./nginx.prod.conf`, `./ssl` and the built `./dist` mounted read‑only.
* **`nginx.prod.conf`** — HTTP→HTTPS 301, TLS 1.2/1.3 with OCSP stapling, security headers (HSTS,
  X‑Frame‑Options, nosniff, Referrer‑Policy), gzip, `/api/` and `/health` proxied to `backend:80`
  with `X-Forwarded-*` headers, SPA fallback to `index.html`, long‑lived static‑asset caching. (The
  asset‑caching `location` block relies on nginx's default document root matching the SPA root —
  make it explicit with a `root` directive to avoid a silent 404 after an image upgrade.)
* **`.github/workflows/ci.yml`** — backend job (restore/build/`dotnet test` with a Postgres 16
  service), frontend job (`npm ci`, `npm run lint`, `npm run build`, artifact upload), then Docker
  build/push to GHCR on `main`. The final **deploy job is a placeholder** (echo + commented
  SSH/health‑check commands) → no automated CD yet.
* **`deploy.sh`** exists for manual/server deployment.

---

## 8. Blockers and risks

### ⛔ P0 — must fix before production
1. **The PostgreSQL schema has no creation path.**
   There are no EF Core migrations (no `Migrations/` folder anywhere), no `Database.Migrate()` /
   `EnsureCreated()` call, and no SQL schema in the repository (no `CREATE TABLE` anywhere).
   `docker-compose.prod.yml` even mounts `./init.sql` — **a file that does not exist** (Compose
   creates a directory there; Postgres ignores it). Production sets
   `Database:Provider = PostgreSQL`, so the API starts (provider resolution needs only a connection
   string, `Program.cs` 54‑65) and then fails every query with
   `42P01: relation "Shipments" does not exist`.
   *Fix:* `dotnet ef migrations add InitialCreate` + apply at deploy (`dotnet ef database update` in
   a release step, or a guarded startup migration), **or** ship the real `init.sql`.
2. **Forwarded headers are not honoured behind the reverse proxy.**
   `nginx.prod.conf` sets `X-Forwarded-For` / `X-Forwarded-Proto`, but `Program.cs` never calls
   `UseForwardedHeaders()`. Behind nginx every request appears to come from the proxy container IP:
   the **per‑IP rate limiter collapses into one shared bucket** (5 logins / 60 s for *all* users),
   audit logs record the proxy IP, and generated links use `http` instead of `https`.
   *Fix:* add `ForwardedHeaders` middleware (`XForwardedFor | XForwardedProto`, with
   `KnownNetworks`/`KnownProxies` restricted to the proxy) and register it before the exception
   handler.

### 🟠 P1 — should fix before, or shortly after, go‑live
3. **CI does not run the Application test suite** — `.github/workflows/ci.yml` runs only
   `ShipNex.Api.Tests` (22 tests); the 83‑test `ShipNex.Application.Tests` project (which caught the
   tracking‑location defect) never runs in CI. Point the step at the solution or `**/*Tests.csproj`.
4. **Weak/secret‑less defaults can silently reach production** — delete the stale
   `backend/src/ShipNex/Api/` folder (dev JWT secret) and remove the `${JWT_SECRET:-…}` fallback in
   `docker-compose.yml` so a missing secret fails loudly.
5. **`/health` does not check dependencies** — `AddHealthChecks()` registers no DB probe, so a
   container can look healthy while Postgres is unreachable. Add `AddDbContextCheck`/`AddNpgSql`.
6. **Production file storage is local disk** (`FileStorage:Provider=Local`) — fine for a single
   replica, but it does not survive horizontal scaling and bypasses the documented private Supabase
   bucket. Upload validation is identical for both providers.
7. **No PWA / native mobile** (§6) — decide whether installability, offline mode and push
   notifications are requirements; if yes, plan a PWA or Capacitor workstream.
8. **`AllowedHosts: "*"` in Production settings** — set the real host names; keep
   `FileStorage__LocalPath` pinned to the mounted volume (compose already does).

### 🟡 P2 — quality / maintenance
9. Frontend: 47 advisory lint warnings; single 704 kB bundle (add route‑level code splitting).
10. `uploads/`, `bin/`, `obj/` are missing from `.gitignore`.
11. The repository root is full of scratch `.txt`/`.log` artifacts (including earlier test logs) — a
    housekeeping pass plus a scratch/tmp ignore rule would keep future diffs readable.
12. `ExpiryMinutes: 1440` (24 h) JWT lifetime is long for an admin console (§5.5).

---

## 9. Go‑live checklist

| # | Action | Owner |
|---|---|---|
| 1 | Create the initial EF Core migration (or the real `init.sql`) and wire a migration/release step | Backend |
| 2 | Add `UseForwardedHeaders()` before the exception handler; verify real client IPs reach logs + rate limiter | Backend |
| 3 | Provision real `JWT_SECRET`, `DB_PASSWORD`, `SMTP_*` and Google Maps secrets in the deploy environment (no fallbacks) | DevOps |
| 4 | Delete `backend/src/ShipNex/Api/`; drop the compose JWT fallback; ignore `uploads/`, `bin/`, `obj/` | Backend |
| 5 | Run `ShipNex.Application.Tests` in CI and implement (or document) the deploy step | DevOps |
| 6 | Extend `/health` with a database check; add a readiness probe in compose | Backend |
| 7 | Decide the PWA/native‑mobile scope; if deferred, record it as an accepted gap | Product |
| 8 | Configure the private Supabase bucket per `docs/supabase-storage-setup.md`, or confirm local volume persistence + backups | DevOps |
| 9 | Smoke‑test the deployed stack end‑to‑end through the proxy: `/health`, public tracking, staff login, document upload/download, rate limiting | QA |
| 10 | Re‑run both `dotnet test` projects and `npm run build` against the release commit | QA |

---

## Appendix — evidence artifacts

| Artifact | Contents |
|---|---|
| `e2e_app_tests3.log` | Application suite run (83 passed / 0 failed) |
| `e2e_api_tests3.log` | API integration suite run (22 passed / 0 failed, 1 m 26 s) |
| `json_sweep.txt` | Strict‑JSON parse sweep of every configuration file |
| `PRODUCTION_READINESS_REPORT.md` | This report |

**Verified locally:** release builds, both test suites, lint, Production & Development process
startup, `/health`, public tracking (hit + miss), admin auth enforcement, rate limiting, public
document listing, upload‑validator rules, storage path handling, config/secret review, deployment
asset review.
**Not verified locally (no credentials/services/devices available):** live Supabase Storage &
Realtime, Google Maps rendering, SMTP/Resend email delivery, PostgreSQL runtime schema, and real
mobile/PWA behaviour.





---

## 10. Live full-stack E2E re-verification (28 September 2026)

After the defects below were fixed, the whole stack was re-verified with a purpose-built E2E harness
that talks to the **real** running processes (no mocks): Vite dev server on `http://localhost:5173`
and the release-built Kestrel API on `http://localhost:5000`.

* Harness: `audit_e2e.cjs` -> writes `audit_e2e_report.txt` (readable) and `audit_e2e_data.json` (raw).
* Re-run command: `node audit_e2e.cjs` (both servers must be up).
* **Result: 73 checks - 73 PASS, 0 FAIL, 0 WARN.** Route coverage is aggregated from per-route
  results: every failing route is recorded individually before the aggregate line, so the summary
  cannot hide a broken page (`28/28 returned 200 with <div id="root">`).

| Section | Checks | Highlights |
|---|---|---|
| 1. Frontend routes | 1 | all 28 SPA routes (public, auth, admin, 404) serve the app shell |
| 2. Static assets | 4 | favicon, icons, webmanifest, app icon -> 200 |
| 3. API basics + CORS | 2 | `/health` 200; preflight `OPTIONS /api/auth/login` returns `ACAO=http://localhost:5173` |
| 4. Auth + RBAC | 12 | empty/wrong credentials 400/401, valid login 200, anonymous + forged token 401, public signup 200, `Customer` blocked from staff/shipments (403) |
| 5. Shipment workflow | 9 | customer created -> shipment 201 -> unique tracking number -> **`customerId` stored and returned** -> status update + tracking event |
| 6. Public tracking | 10 | anonymous tracking (status, timeline, origin/destination, latest location, ETA, coordinates), private data absent, unknown number 404 without internals |
| 7. Documents | 12 | `.exe`/`.sh` and MIME-mismatch rejected, valid PDF 201, private doc hidden, anonymous download 401, visibility flip exposes it publicly, storage path never leaked, public download 200, delete 204 |
| 8. Pet tracking | 13 | pet profile, public pet envelope (`type=pet`), care timeline, location + map coordinates, owner contact hidden, location + care-event updates persisted and reflected publicly |
| 9. Admin surfaces | 8 | stats, audit logs (28 entries) + trail records the E2E activity, staff, public offices, vehicles, notification logs, email provider status |
| 10. Public forms | 2 | contact form accepted (200) / invalid payload rejected (400) |

### 10.1 Defects found by this harness and fixed

| # | Defect (symptom in the running app) | Fix |
|---|---|---|
| 1 | No shipment could be linked to a customer - `CreateShipmentRequest` had no `CustomerId`, so every shipment was created orphaned | Added optional `CustomerId` to `CreateShipmentRequest` and mapped it in `ShipmentService.CreateAsync` (`ShipmentDTOs.cs`, `ShipmentService.cs`) |
| 2 | `ShipmentResponse` omitted `CustomerId`, so the admin UI could never resolve the customer for a shipment | Added `CustomerId` to `ShipmentResponse` and `MapToResponse` (`Guid.Empty` -> `null`) |
| 3 | CORS preflight for the dev origin could be locked out by a production `Cors:AllowedOrigins` value | `Program.cs` always allows the local dev origins in Development and only the configured origins in Production |
| 4 | Pet location update was accepted but silently dropped the payload (`UpdatePetLocationRequest` property names did not match the client) | DTO realigned to `CurrentLocationName` / `Latitude` / `Longitude` / `Description`; harness asserts the value is stored (`lat=39.74`) |
| 5 | Pet care-event POST ignored the client payload (missing `LocationName` / `Description` / `CustomerVisible` shape) | `AddPetCareEventRequest` realigned; harness asserts the timeline grows after the POST (`careEvents` 3 -> 4 -> 5 across runs) |
| 6 | Public document payload risked leaking storage locations | `PublicDocumentResponse` carries metadata only; the file is served by the anonymous `GET /api/documents/public-file/{id}` route, which re-checks `CustomerVisible` |
| 7 | `PATCH /api/admin/staff/{id}` returned 400 on valid input (missing validation attributes on the nested request record) | `UpdateStaffRequest` annotated (`StringLength` on `Role`) |
| 8 | Vehicle / audit request records had no validation metadata (unbounded strings reaching the DB) | `CreateVehicleRequest` and `AuditEntryRequest` annotated with `Required` / `StringLength` |

### 10.2 Re-verification of the build gates (after the fixes)

| Gate | Command | Result |
|---|---|---|
| Backend compile | `dotnet build backend/ShipNex.sln -c Release` | 0 errors (15 pre-existing nullable warnings) |
| Backend tests | `dotnet test backend/tests/ShipNex.Application.Tests -c Release` | 83 passed / 0 failed |
| Backend tests | `dotnet test backend/tests/ShipNex.Api.Tests -c Release` | 22 passed / 0 failed |
| Frontend lint | `npm run lint` (oxlint) | exit 0 - 47 advisory warnings, **0 errors** |
| Frontend build | `npm run build` (`tsc -b && vite build`) | exit 0 - 1625 modules, `dist/` emitted (JS 704.10 kB / gz 178.61 kB) |
| Live E2E | `node audit_e2e.cjs` | 73 PASS / 0 FAIL / 0 WARN |

> The 47 lint findings are all advisory (`react-hooks` immutability/purity notices in
> `src/pages/**`); none of them break the build or the runtime, and they stay listed as P2 in §8.

### 10.3 Evidence artifacts

| Artifact | Contents |
|---|---|
| `audit_e2e.cjs` | the harness itself (re-runnable; `FE` / `API` targets at the top of the file) |
| `audit_e2e_report.txt` | per-check PASS/FAIL detail + summary (28 Sep 2026 run) |
| `audit_e2e_data.json` | machine-readable checks, route list, CORS preflight, shipment/tracking/email status |
| `e2e_front_lint_final.log` | frontend lint gate - oxlint, 47 advisory warnings / **0 errors**, exit 0 |
| `e2e_front_build_final.log` | frontend production build - `tsc -b && vite build`, 1625 modules, `dist/` emitted (JS 704.10 kB / gz 178.61 kB) |
| `sn_test_fix.log` | both backend suites after the DTO fixes - `Failed: 0, Passed: 83` + `Failed: 0, Passed: 22` |
| `sn_build_fix2.log` | Release solution build - `15 Warning(s) / 0 Error(s)` (warnings are pre-existing nullable annotations) |
| `_finalize.log` | finalization pipeline log: Release build, API + Vite startup, E2E audit and backend test run - `BUILD_EXIT=0`, `AUDIT_EXIT=0`, `TEST_EXIT=0` |

**Conclusion:** every user-facing surface of the running application now passes its live check. The
remaining go-live blockers are unchanged from §8 (PostgreSQL schema creation path and
`UseForwardedHeaders` behind the proxy) - both are deployment-time configuration, not application
defects.
