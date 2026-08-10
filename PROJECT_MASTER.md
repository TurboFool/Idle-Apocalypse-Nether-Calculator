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
├── nether_costs.html         # Single-file application (HTML + CSS + JS + Base64 WebP Assets)
├── README.md                 # Public repository README
├── PROJECT_MASTER.md         # Master technical specification & developer guide (this document)
├── assets/                   # Source WebP icons for game items
│   ├── orb.webp
│   ├── flame.webp
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
      hideCompleted: false, // UI filter
      activeCategory: "All",// Category tab filter
      searchQuery: "",      // Checklist search text
      modifiersExpanded: true
  };
  ```
- **Persistence Engine**: State is serialized to `localStorage` under key `idle_apoc_nether_costs_state_v2`.

---

## 🧮 3. Cascading Summon Math Algorithm

The core engine `calculateCosts()` computes resource requirements using top-down deficit resolution:

### 1. Dynamic Drop Rates Calculation
For each creature type $c$:
$$\text{Drop Yield}(c) = \text{BaseDrop}(c, \text{Level}) + \text{PieLevel} + (\text{BountyEnabled} ? 1 : 0)$$

- **Netherling Base Drops**: Lvl 1: 3, Lvl 2: 5, Lvl 3: 7 (Drops: Flames)
- **Nether Demon Base Drops**: Lvl 1: 2, Lvl 2: 3, Lvl 3: 4 (Drops: Crystals)
- **Nether Mountain Base Drops**: Lvl 1: 1, Lvl 2: 2 (Drops: Stars)

*Note: Creature levels automatically upgrade when the user marks their respective level goals as "Achieved" in the checklist.*

### 2. Top-Down Deficit & Summon Cascade
1. **Target Goal Aggregation**: Sum `orbs`, `flames`, `crystals`, `stars` for all selected, uncompleted target goals.
2. **Stars Deficit $\rightarrow$ Mountain Summons**:
   $$\text{Star Deficit} = \max(0, \text{Target Stars} - \text{OnHand Stars})$$
   $$\text{Mountains Needed} = \lceil \text{Star Deficit} / \text{Mountain Yield} \rceil$$
   $$\text{Additional Crystals Required} = \text{Mountains Needed} \times 12$$
3. **Crystals Deficit $\rightarrow$ Demon Summons**:
   $$\text{Total Crystals Needed} = \text{Target Crystals} + \text{Additional Crystals Required}$$
   $$\text{Crystal Deficit} = \max(0, \text{Total Crystals Needed} - \text{OnHand Crystals})$$
   $$\text{Demons Needed} = \lceil \text{Crystal Deficit} / \text{Demon Yield} \rceil$$
   $$\text{Additional Flames Required} = \text{Demons Needed} \times 10$$
   $$\text{Additional Orbs Required (Demons)} = \text{Demons Needed} \times 3$$
4. **Flames Deficit $\rightarrow$ Netherling Summons**:
   $$\text{Total Flames Needed} = \text{Target Flames} + \text{Additional Flames Required}$$
   $$\text{Flame Deficit} = \max(0, \text{Total Flames Needed} - \text{OnHand Flames})$$
   $$\text{Netherlings Needed} = \lceil \text{Flame Deficit} / \text{Netherling Yield} \rceil$$
   $$\text{Additional Orbs Required (Netherlings)} = \text{Netherlings Needed} \times 1$$
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

### Control Features
1. **Header Toolbar**:
   - `Instructions`: Opens the glassmorphic overlay modal (`#instructionsModal`).
   - `Export`: Downloads current state as `nether_costs_backup.json`.
   - `Import`: Loads state from a JSON backup file.
   - `Reset`: Clears state with user confirmation.
2. **Creature Action Buttons (`+` / `-`)**:
   - Located inside each creature card in **Creature Summons & Yields** (unified inside Nether Requirements).
   - `+` (Summon): Deducts creature costs and adds drop yields to on-hand inventory.
   - `-` (Undo): Refunds creature costs and deducts drop yields from on-hand inventory.
   - Dynamic `title` tooltips list exact costs and yields based on current modifier state.
   - `.creature-title-label` specifies `min-height: 2.4rem` and `<br>` after creature name to keep cards and buttons aligned across desktop and mobile screens.

---

## 🔖 5. Versioning & Git Conventions

### Versioning Format & Lifecycle
Follow Semantic Versioning (`MAJOR.MINOR.PATCH`):
- **Pre-Releases**: `vX.Y.Z-beta.N` (e.g., `v1.0.0-beta.2`) used on feature/dev iterations during testing phases.
- **Production Releases**: Clean `vX.Y.Z` (e.g., `v1.0.0`) used for official, non-beta production releases merged to `main`.

### Embedded Version Single Source of Truth
The version string is declared in JavaScript at the top of the `<script>` tag in `nether_costs.html`:
```javascript
const APP_VERSION = "v1.0.0";
```
On page load (`DOMContentLoaded`), this value is assigned to the header element `<span id="app-version">`.

### Git Branching Model
- **`main`**: Stable production release branch. Holds official non-beta releases tagged with clean semantic tags (e.g. `v1.0.0`).
- **`dev`**: Active feature development and pre-release testing branch (`-beta.N` tags).

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

---

*This document serves as the permanent specification for the Idle Apocalypse Nether Costs Calculator project.*
