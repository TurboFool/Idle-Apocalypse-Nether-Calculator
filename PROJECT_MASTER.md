# Idle Apocalypse - Nether Costs Calculator (Project Master Document)

This master document describes the scope, design philosophy, technical architecture, mathematical model, UI standards, versioning conventions, and developer guidelines for the **Idle Apocalypse - Nether Costs Calculator**.

It is designed to give any human developer, new LLM assistant, or contributor an immediate and complete understanding of the project's intent and codebase.

---

## 📌 1. Project Scope & Intent

### Core Purpose
The **Idle Apocalypse Nether Costs Calculator** is a standalone, browser-based companion tool for the mobile game *Idle Apocalypse*. 

In the endgame "Nether Expansion", players must summon Nether creatures (**Netherlings**, **Nether Demons**, and **Nether Mountains**) to obtain special resources (**Nether Flames**, **Nether Crystals**, and **Nether Stars**). These resources are required to unlock endgame goals like Nether Scrolls, Doomsday Device (DDD) upgrades, and Lesley Shop trades.

Summoning higher-tier creatures requires lower-tier Nether resources (e.g. Demons require Flames, Mountains require Crystals). Because summoning a creature produces resources that feed into the next creature tier, calculating how many total creatures and base Orbs are needed is a multi-step **cascading calculation**.

This calculator automates the entire cascade math, tracks on-hand inventory, factors in game modifiers (Nether Pie & Bounty), and provides quick action controls to track progress.

### Primary Goals & Constraints
1. **Self-Contained & 100% Offline**: The entire application lives inside a single file (`nether_costs.html`). It has **zero build tools** and **zero external runtime script dependencies**.
2. **Instant & Fast**: Loads instantaneously in any mobile or desktop browser without a server setup.
3. **Data Security & Privacy**: User data stays 100% in browser `localStorage`. Import/Export features allow JSON backups.
4. **Rich Aesthetic Experience**: Dark fantasy UI with glowing accent colors, custom typography, micro-animations, and responsive card layouts.

---

## 🏗️ 2. Architecture & Technical Design

### File & Directory Structure
```text
Idle Apocalypse Nether Costs/
├── GEMINI.md                 # Antigravity agent & project guidelines configuration
├── nether_costs.html         # Single-file application (HTML + CSS + JS + Base64 WebP Assets)
├── README.md                 # Public repository README
├── PROJECT_MASTER.md         # Master technical specification & developer guide (this document)
├── assets/                   # Source WebP icons for game items
│   ├── orb.webp
│   ├── flame.webp
├── manifest.json             # PWA web app manifest
├── sw.js                     # PWA Service Worker (Network-First navigation, Cache-First assets)
│   ├── crystal.webp
│   ├── star.webp
│   ├── netherling.webp
│   ├── demon.webp
│   └── mountain.webp
├── reference/                # Game spreadsheets & template code samples
│   ├── Idle Apocalypse Nether Raw Data.xlsx
│   └── code_sample.html
└── scratch/                  # Maintenance & developer verification scripts
    ├── inject_base64.ps1     # Encodes WebP assets to Base64 in nether_costs.html
    ├── verify_base64.ps1     # Validates Base64 strings against assets/ binary hashes
    ├── test_math.js          # Standalone JScript cascade math test runner
    └── find_scrolls.ps1      # Wiki document parser
```

### Single-File Application Architecture
- **HTML Document**: Structured into Header (Sticky navbar), Left Panel (Modifiers, Inventory, Calculator Summary with unified Creature Summons & Yields), Right Panel (Goals Checklist Grid), and Floating Modals/Toasts.
- **Embedded CSS**: Defined inside `<style>` tags in `<head>`. Uses CSS variables for color themes and glows.
- **Embedded Base64 Assets**: Stored in JavaScript object `ICONS` as WebP Data URIs (`data:image/webp;base64,...`).
- **State Store (`state`)**: A single global JavaScript object holding all reactive state:
  ```javascript
  let state = {
      onHand: { orbs: 0, flames: 0, crystals: 0, stars: 0 },
      completedGoals: {},   // Map goal ID -> boolean
      selectedGoals: {},    // Map goal ID -> boolean
      pieLevel: 0,          // Nether Pie level (0-3)
      bountyEnabled: false, // Bounty upgrade (+1 drop)
      shinySkins: {         // Golden creature skin upgrades (+3 drop yield each)
          netherling: false,
          demon: false,
          mountain: false
      },
      hideCompleted: false, // UI filter
      autoDeductOnAchieve: false, // Auto-deduct costs from inventory on achieve
      activeCategory: "All",// Category tab filter ("All", "Creatures", "Scrolls", "DDD", "Lesley", "Custom")
      searchQuery: "",      // Checklist search text
      modifiersExpanded: true,
      transientGoal: {
          active: false,
          collapsed: true,  // Collapsed by default
          cost: { orbs: 0, flames: 0, crystals: 0, stars: 0 },
          creatures: { netherling: 0, demon: 0, mountain: 0 }
      },
      customGoals: []       // Reusable saved custom goals with progress tracking & complementary settings
  };
  ```
- **Persistence Engine**: State is serialized to `localStorage` under key `idle_apoc_nether_costs_state_v2`. Backward compatibility is maintained via `sanitizeAndMergeState(parsed)`.
- **PWA & Service Worker Caching Architecture (`sw.js`)**:
  - **Navigation / HTML Documents (`Network-First`)**: Fetches fresh HTML over network to ensure newly deployed releases are applied immediately on app launch or refresh, caching the response and falling back to cache when offline.
  - **Static Assets (`Cache-First`)**: Embedded icons, manifest, and font assets are served instantly from cache, falling back to network.
  - **Liveness & Auto-Update**: `reg.update()` is called on every page load to detect `sw.js` changes immediately. When a new service worker installs, `skipWaiting()` and `clients.claim()` activate it, and `controllerchange` automatically reloads the page to present the new version.
  - **Cache Versioning**: `CACHE_NAME` in `sw.js` matches the current release (`nether-calc-cache-vX.Y.Z`).

---

## 🧮 3. Cascading Summon Math Algorithm

The core engine `calculateCosts()` computes resource requirements using top-down deficit resolution, factoring in both target resources and minimum creature summon requirements:

### 1. Dynamic Drop Rates Calculation
For each creature type $c$:
$$\text{Drop Yield}(c) = \text{BaseDrop}(c, \text{Level}) + \text{PieLevel} + (\text{BountyEnabled} ? 1 : 0) + (\text{ShinySkin}(c) ? 3 : 0)$$

- **Netherling Base Drops**: Lvl 1: 3, Lvl 2: 5, Lvl 3: 7 (Drops: Flames)
- **Nether Demon Base Drops**: Lvl 1: 2, Lvl 2: 3, Lvl 3: 4 (Drops: Crystals)
- **Nether Mountain Base Drops**: Lvl 1: 1, Lvl 2: 2 (Drops: Stars)
- **Shiny Skin Bonus**: +3 to drop yield for each creature with shiny skin enabled.

*Note: Creature levels automatically upgrade when the user marks their respective level goals as "Achieved" in the checklist.*

### 2. Top-Down Deficit & Summon Cascade
1. **Target Goal & Creature Aggregation**:
   - Sum `orbs`, `flames`, `crystals`, `stars` across all selected standard goals, saved custom goals, and active Quick Target.
   - Sum remaining target creature requirements across active targets:
     For each creature $c$:
     $$\text{Remaining Target}(c) = \max(0, \text{Target}(c) - (\text{TrackProgress} ? \text{Progress}(c) : 0))$$
     This guarantees that as creatures are summoned via `+Summon`, the remaining creature requirement decrements in real time, preventing resource requirement spikes.
2. **Stars Deficit $\rightarrow$ Mountain Summons**:
   $$\text{Star Deficit} = \max(0, \text{Target Stars} - \text{OnHand Stars})$$
   $$\text{Mountains For Stars} = \lceil \text{Star Deficit} / \text{Mountain Yield} \rceil$$
   $$\text{Mountains To Summon} = \max(\text{Target Mountains}, \text{Mountains For Stars})$$
   $$\text{Additional Crystals Required} = \text{Mountains To Summon} \times 12$$
3. **Crystals Deficit $\rightarrow$ Demon Summons**:
   $$\text{Total Crystals Needed} = \text{Target Crystals} + \text{Additional Crystals Required}$$
   $$\text{Crystal Deficit} = \max(0, \text{Total Crystals Needed} - \text{OnHand Crystals})$$
   $$\text{Demons For Crystals} = \lceil \text{Crystal Deficit} / \text{Demon Yield} \rceil$$
   $$\text{Demons To Summon} = \max(\text{Target Demons}, \text{Demons For Crystals})$$
   $$\text{Additional Flames Required} = \text{Demons To Summon} \times 10$$
   $$\text{Additional Orbs Required (Demons)} = \text{Demons To Summon} \times 3$$
4. **Flames Deficit $\rightarrow$ Netherling Summons**:
   $$\text{Total Flames Needed} = \text{Target Flames} + \text{Additional Flames Required}$$
   $$\text{Flame Deficit} = \max(0, \text{Total Flames Needed} - \text{OnHand Flames})$$
   $$\text{Netherlings For Flames} = \lceil \text{Flame Deficit} / \text{Netherling Yield} \rceil$$
   $$\text{Netherlings To Summon} = \max(\text{Target Netherlings}, \text{Netherlings For Flames})$$
   $$\text{Additional Orbs Required (Netherlings)} = \text{Netherlings To Summon} \times 1$$
5. **Orbs Deficit**:
   $$\text{Total Orbs Needed} = \text{Target Orbs} + \text{Demon Orbs Cost} + \text{Netherling Orbs Cost}$$
   $$\text{Orb Deficit} = \max(0, \text{Total Orbs Needed} - \text{OnHand Orbs})$$

---

## 🎨 4. UI & Design System Standards

### Palette & Themes
- **Background**: `#0d0a12` (Deep Void Dark)
- **Panel Background**: `#14101e` with border `rgba(168, 85, 247, 0.2)`
- **Accent Color**: `#8b5cf6` (Vibrant Nether Purple)
- **Resource Colors**:
  - **Orbs**: `#d8b4fe` (Glow: `rgba(168, 85, 247, 0.4)`)
  - **Flames**: `#ea580c` (Glow: `rgba(234, 88, 12, 0.4)`)
  - **Crystals**: `#06b6d4` (Glow: `rgba(6, 182, 212, 0.4)`)
  - **Stars**: `#eab308` (Glow: `rgba(234, 179, 8, 0.4)`)

### Typography
- **Headings / Titles**: `'Cinzel', serif` (Fantasy aesthetic)
- **Body Text**: `'Plus Jakarta Sans', sans-serif` (Modern sans-serif)
- **Numbers / Digits**: `'Space Mono', monospace` (Clean, aligned numbers)

### Control Features & Modern Web Architecture
1. **Header Toolbar**:
   - `Instructions`: Opens the native semantic modal dialog (`<dialog id="instructionsModal">`) using `.showModal()` with `::backdrop` styling and native `Esc`/backdrop-click dismissal.
   - `Export`: Downloads current state as `nether_costs_backup.json`.
   - `Import`: Loads state from a JSON backup file.
   - `Reset`: Clears state with user confirmation.
2. **Creature Action Buttons (`+` / `-`) & Live Progress Tracking**:
   - Located inside each creature card in **Creature Summons & Yields** (unified inside Nether Requirements).
   - `+` (Summon): Deducts creature costs and adds drop yields to on-hand inventory. When tracked custom goals are active, simultaneously increments creature progress on all active tracked goals.
   - `-` (Undo): Refunds creature costs and deducts drop yields from on-hand inventory, and decrements progress on tracked custom goals.
   - Dynamic `title` tooltips and descriptive `aria-label`s list exact costs and yields based on current modifier state.
3. **Custom Goal Real-Time Tracking & Steppers**:
   - **Live Progress Bars & Steppers**: Goal cards with creature requirements feature integrated progress bars (`role="progressbar"`) and `[-]` / `[+]` stepper buttons for fine-tuning.
   - **Simultaneous Multi-Goal Dispatch**: When multiple active custom goals require the same creature type, summoning increments progress across all of them concurrently.
   - **Goal Completion Confirmation Modal (`#goalCompleteConfirmModal`)**: When a summon or stepper action would bring the final creature requirement of a tracked custom goal to 100%, a native confirmation modal appears prompting the user to confirm completion and reset progress.
   - **Complementary / Surplus Goals**: Custom goals can be designated as complementary, meaning creature drops are surplus byproducts and are not consumed/deducted upon completion.
4. **Auto-Deduct on Goal Achievement**:
   - Accessible checkbox toggle in the checklist toolbar: `[ ] Auto-deduct on achieve`.
   - When checking a goal as achieved: automatically subtracts resource costs from on-hand inventory down to 0 (floored at 0, displaying a warning toast if inventory was insufficient).
   - When unchecking (undo): refunds the exact resource cost back to inventory.
   - Creature summon costs are not double-deducted on custom goal completion since summon materials were already deducted live.
5. **Upgrades & Modifiers Panel**:
   - **Nether Pie & Bounty**: Sliders and toggles to dynamically adjust creature drop rates.
   - **Creature Upgrade Levels**: Segmented pill selectors (`[1][2][3]` for Netherlings & Demons, `[1][2]` for Mountains) with real-time base drop badges.
   - **Shiny Skins (Golden Upgrades)**: Checkbox toggle (`✨ Shiny (+3)`) for each creature, granting an additional +3 to cumulative drop yields when checked.
   - **Bidirectional Goal Synchronization**: Syncs creature levels bidirectionally between modifiers panel and checklist goals.
6. **Action Plan, Sequential Roadmap & Deficits Summary**:
   - **Renamed Deficits Header**: Labeled `Additional resources needed for goal(s):` displaying four real-time deficit counters.
   - **Prominent Status Banners**:
     - **Goal Not Yet Reachable** (`deficits.orbs > 0`): High-visibility warning banner.
     - **Goal Achievable!** (`deficits.orbs === 0` with summons needed): High-visibility success banner.
     - **Goal Ready to Claim!** (`deficits.orbs === 0` with 0 summons needed): High-visibility success banner.

   - **Chronological Action Roadmap**: Numbered sequential steps guiding the player from lowest tier to highest tier (Step 1: Netherlings $\rightarrow$ Step 2: Demons $\rightarrow$ Step 3: Mountains $\rightarrow$ Final Step: Claim Goal).
   - **Collapsible Detailed Math Breakdown**: Text toggle button (`Show/Hide Detailed Math Breakdown`) revealing step-by-step arithmetic rewritten in natural human-friendly language without dry "Deficit:" labels. Remembers expanded/collapsed preference across sessions in `localStorage`.
7. **Custom Goals & Controls**:
   - **Quick Target**: Collapsible card above checklist for immediate calculations without saving. Features Target toggle, Clear button, and "Save as Goal..." shortcut (which cleanly untargets and clears Quick Target to prevent double-counting).
   - **Saved Custom Goals**: Reusable user-defined goals filtered under `"Custom"` category tab. Supports creating via "+ Add Custom Goal" button or saving transient inputs. Includes individual editing and deletion with confirmation.
   - **Dual Cost & Creature Badges**: Goal cards display non-zero resource badges (Orbs, Flames, Crystals, Stars) and non-zero creature badges (Netherlings, Demons, Mountains).
   - **Responsive Search & Filter Toolbar**: Full-width search input with wrapped `.search-actions` ("+ Add Custom Goal", "Hide Completed", and "Auto-deduct on achieve" side-by-side).
8. **Modern CSS & Accessibility (A11y)**:
   - **`color-scheme: dark`**: Informs UA inputs, native scrollbars, and browser UI of the dark fantasy theme.
   - **Standard Scrollbars**: `scrollbar-color: #2b1f3c #09070c;` and `scrollbar-width: thin;` with `@supports not (scrollbar-color: auto)` fallback for legacy WebKit.
   - **Typography Layout**: `text-wrap: balance;` on headings (`h1-h4`) and `text-wrap: pretty;` on instructional body copy.
   - **Reduced Motion**: `@media (prefers-reduced-motion: reduce)` dampens glow animations and transition durations.
   - **Keyboard Navigation**: Glowing `:focus-visible` ring across all interactive buttons, inputs, and tabs.
   - **Screen Reader Announcements**: `#toastNotification` configured with `role="status"` and `aria-live="polite"`.
   - **Mobile Inputs**: On-hand inventory numeric fields specify `type="number"`, `inputmode="numeric"`, `step="1"`, `min="0"`, and `pattern="[0-9]*"`.

---

## 🔖 5. Versioning & Git Conventions

### Versioning Format & Lifecycle
Follow Semantic Versioning (`MAJOR.MINOR.PATCH`):
- **Pre-Releases**: `vX.Y.Z-beta.N` (e.g., `v1.3.0-beta.1`) used on feature/dev iterations during testing phases.
- **Production Releases**: Clean `vX.Y.Z` (e.g., `v1.3.0`) used for official, non-beta production releases merged to `main`.

### Embedded Version Single Source of Truth
The version string is declared in JavaScript at the top of the `<script>` tag in `nether_costs.html`:
```javascript
const APP_VERSION = "v1.3.0-beta.1";
```
On page load (`DOMContentLoaded`), this value is assigned to the header element `<span id="app-version">`.

### Git Branching Model
- **`main`**: Stable production release branch. Holds official non-beta releases tagged with clean semantic tags (e.g. `v1.0.0`).
- **`dev`**: Active feature development and pre-release testing branch (`-beta.N` tags).

### Multi-Workstation & Multi-IDE Synchronization Policy
Because development and agent management occur across multiple computers and IDEs:
1. **New Conversation Check**: Always run `git fetch origin` and check `git status` when initiating a new session or switching workstations/IDEs.
2. **Inactivity / Resumption Check**: Check `git fetch origin` before initiating a new round of changes if significant time has elapsed (>1–2 hours) since the last local interaction.
3. **Reconciliation**: If remote commits are present on `origin/dev`, pull/fast-forward before making local modifications to avoid divergence or merge conflicts.

### Release Workflow & Documentation Standards
Whenever preparing a new version release:
1. **Version Promotion**:
   - For pre-releases: set `const APP_VERSION = "vX.Y.Z-beta.N";`
   - For official production releases: promote to `const APP_VERSION = "vX.Y.Z";` (removing pre-release suffixes).
2. **Commit and Push to Dev**:
   ```bash
   git checkout dev
   git add nether_costs.html PROJECT_MASTER.md
   git commit -m "Promote version to vX.Y.Z"
   git push origin dev
   ```
3. **Merge to Main**:
   ```bash
   git checkout main
   git merge dev
   git push origin main
   ```
4. **Create & Push Release Tag**:
   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin vX.Y.Z
   ```
5. **Release Notes Documentation**:
   - Generate a Markdown release notes document (`release_notes_vX.Y.Z.md`) detailing new features, architectural improvements, and bug fixes for GitHub release publishing.

---

## 🛠️ 6. Developer Guidelines & Asset Management

### Modifying Image Assets
If game icon WebP images in `assets/` are replaced or updated:
1. Execute the PowerShell injection script in the project root:
   ```powershell
   powershell -File scratch/inject_base64.ps1
   ```
2. Verify the Base64 encoding integrity:
   ```powershell
   powershell -File scratch/verify_base64.ps1
   ```

### Key Functions Reference (`nether_costs.html`)
| Function | Description |
| :--- | :--- |
| `calculateCosts()` | Solves cascading creature summons and resource deficits. |
| `getCreatureStats(key)` | Computes creature level and current drop yield including modifiers. |
| `summonCreature(key, multiplier)` | Executes summon (`multiplier=1`) or undo (`multiplier=-1`) inventory math. |
| `renderInventory()` | Re-renders On-Hand Resources cards. |
| `renderUpgradesPanel()` | Re-renders Modifiers and Creature Drop Yields cards with buttons/tooltips. |
| `renderCalculatorSummary()` | Re-renders Nether Requirements output, deficits, and cascade math log. |
| `renderGoalsList()` | Re-renders Target Goals Checklist grid with filter/search state. |
| `openInstructions()` / `closeInstructions()` | Controls display state of `#instructionsModal`. |
| `showToast(msg)` | Displays temporary action feedback banner at bottom right. |

### Antigravity Agent & Modern Web Standards
- Project rules and AI coding agent guidelines are defined in `GEMINI.md`.
- Multi-device git check policies (session start and elapsed time checks) ensure seamless handoffs between workstations.
- Always consult `modern-web-guidance` (`npx.cmd -y modern-web-guidance@latest search "<query>"`) prior to web UI implementations.
- Changes must be targeted to the `dev` branch only, unless explicit release merge to `main` is requested.
- `PROJECT_MASTER.md` must be updated on all functional, mathematical, and UI changes.

---

*This document serves as the permanent specification for the Idle Apocalypse Nether Costs Calculator project.*
