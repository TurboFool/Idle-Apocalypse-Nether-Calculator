# Antigravity Project Rules & Guidelines: Idle Apocalypse Nether Costs Calculator

This configuration file defines mandatory developer and agent guidelines for working on the **Idle Apocalypse - Nether Costs Calculator** repository.

---

## 🏛️ 1. Core Architecture & Constraints

1. **Single-File Architecture**:
   - The primary application logic, styles, markup, and assets must live in `nether_costs.html`.
   - **Zero External Dependencies**: Do not introduce npm runtime dependencies, external script tags (e.g. CDNs, remote polyfills), or external CSS frameworks.
   - **100% Offline Capability**: The application must run completely self-contained in any browser without an internet connection or web server.
2. **Asset Handling**:
   - WebP image assets stored in `assets/` must be embedded into `nether_costs.html` as Base64 Data URIs (`data:image/webp;base64,...`) within the `ICONS` object.
   - When assets are updated, run `scratch/inject_base64.ps1` and verify with `scratch/verify_base64.ps1`.
3. **State Persistence**:
   - User state is stored in browser `localStorage` under `idle_apoc_nether_costs_state_v2`.
   - Ensure backward compatibility or clean schema migration for any state structure additions.

---

## 🌿 2. Git Branching, Versioning & Push Policy

1. **Branch & Push Rules**:
   - **Strict `dev` Branch Target**: All feature work, bug fixes, and experiments must be performed on and pushed to the `dev` branch.
   - **Do NOT push to `main`** unless the user explicitly instructs you to perform a release merge or push to `main`.
   - Before pushing or committing, verify active branch (`git branch --show-current`).
2. **Version Promotion & Tags**:
   - Pre-release versions on `dev` must follow the format `vX.Y.Z-beta.N` (e.g. `v1.0.1-beta.1`).
   - Official production releases on `main` use clean Semantic Versioning `vX.Y.Z`.
   - Always synchronize the version string in JavaScript (`const APP_VERSION = "vX.Y.Z";` in `nether_costs.html`), which updates `<span id="app-version">`.
3. **Commit Message Standards**:
   - Follow Conventional Commits format:
     - `feat: ...` for new user-facing features or calculations
     - `fix: ...` for bug fixes
     - `docs: ...` for documentation updates
     - `style: ...` for layout, styling, and aesthetic adjustments
     - `refactor: ...` for code reorganization without behavior changes
     - `test: ...` for test scripts and verification routines
     - `chore: ...` for asset injection, maintenance, or configuration

---

## 📚 3. Documentation Synchronization Protocol

1. **Mandatory Specification Updates**:
   - Whenever any functional change, UI modification, math formula adjustment, or architectural refactor is made, **always update `PROJECT_MASTER.md`** immediately to keep documentation in sync.
   - `PROJECT_MASTER.md` is the single source of truth for calculations, algorithms, UI palettes, and developer workflows.
2. **Public Documentation Updates**:
   - Update `README.md` whenever public instructions, features, or user guides change.

---

## 🌐 4. Modern Web Guidance Standard

1. **Mandatory Pre-Implementation Check**:
   - Before implementing or modifying HTML, CSS, DOM interactions, or client-side JavaScript APIs, consult the `modern-web-guidance` skill:
     ```sh
     npx.cmd -y modern-web-guidance@latest search "<query>"
     npx.cmd -y modern-web-guidance@latest retrieve "<id>"
     ```
2. **Native Web & Baseline Standards**:
   - Prefer modern, native Web Platform features that are **Baseline Widely Available** (e.g., native `<dialog>`, HTML Popover API, CSS `:has()`, Container Queries, native CSS nesting, CSS custom properties, dynamic viewport units).
   - Never compromise the **zero-dependency single-file offline constraint**—adapt Modern Web Guidance recommendations to pure vanilla HTML/CSS/JS without external CDN script imports.

---

## 🧪 5. Testing & Verification Procedures

1. **Math Logic Verification**:
   - Before committing changes affecting cascading summon logic, deficits, or creature drop yields, run the standalone math test runner:
     ```sh
     cscript //nologo scratch/test_math.js
     ```
2. **Asset Integrity Verification**:
   - If asset icons or base64 strings are modified, verify matching binary hashes:
     ```powershell
     powershell -File scratch/verify_base64.ps1
     ```
3. **Browser Testing & Visual Inspection**:
   - Verify layout responsiveness on both desktop and mobile viewports.
   - Verify toast notifications, localStorage save/load, import/export JSON, and theme rendering.
