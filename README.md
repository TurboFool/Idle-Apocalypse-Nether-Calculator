# Idle Apocalypse - Nether Costs Calculator

A premium, self-contained, and offline-ready companion tool for the mobile game *Idle Apocalypse*. This tool helps you calculate the cascading summoning costs of Nether Creatures (Netherlings, Demons, and Mountains) required to achieve your target goals (Scrolls, Doomsday Device upgrades, and Lesley's trades).

---

## 🚀 Features

- **Cascading Summon Engine**: Automatically computes how many of each creature you need to summon to cover resource costs, counting downstream requirements (e.g., how many Netherlings are needed to produce the Flames for Demon summons, and how many Demons are needed to produce the Crystals for Mountain summons).
- **Action Plan & Sequential Roadmap**: Context-aware status banners ("Goal Achievable!" vs "You still need X Nether Orbs to meet your goal") paired with a chronological, step-by-step roadmap detailing the exact order and yields of creature summons needed to reach your target.
- **Two-Way Creature Upgrade Levels & Shiny Skins**: Select creature levels (`[1][2][3]`) directly in the Upgrades & Modifiers panel with instant bidirectional sync to checklist goals, plus toggleable **Shiny Skins** (+3 drop yield each) for Netherlings, Demons, and Mountains.
- **Custom Goals Engine**:
  - **Live Summon Progress Tracking**: Creature progress automatically increments when you use `+`/`-` creature summon buttons, reducing remaining creature requirements and preventing deficit surges. Cards include visual progress bars and manual `[-]` / `[+]` steppers.
  - **Completion Confirmation & Reset**: Prompts the user before marking the goal achieved and resetting progress when the final summon target is reached.
  - **Complementary / Surplus Goals**: Mark goals where creature drops (like Stars from Mountains) are surplus byproducts that remain in inventory rather than being consumed.
  - **Quick Target**: Collapsible card for spur-of-the-moment calculations. Supports custom resource pools, creature summons, real-time summon progress tracking with interactive steppers, and complementary goal toggles, alongside Target toggling, Clear, and "Save as Goal..." shortcut.
  - **Saved Custom Goals**: Reusable custom targets categorized under the **Custom** tab. Create, target, track, achieve, edit, and delete custom goals with persistent local storage.
- **Auto-Deduct on Goal Achievement**: Global toggle in the checklist toolbar that automatically subtracts goal costs from on-hand resources upon achievement (flooring at 0 and alerting if inventory was insufficient) and refunds them if undone.
- **Interactive Modifiers Card**: Supports custom inputs for your active **Nether Pie level** (0 to 3) and **Bounty upgrade** (+1 drop yield to all creatures) to adjust drop rates dynamically.
- **Dynamic Creature Drop yields**: Displays current live creature drop numbers on a dedicated, glowing yields panel with interactive `+` and `-` summon buttons for live tracking.
- **Progress Checklist**: Easily select which scrolls, upgrades, trades, or custom goals you are targeting. Mark them as **Achieved** to hide them from the checklist and dynamically update your permanent upgrades (like creature levels).
- **Offline Persistence**: Saves your inventory numbers, target selections, custom goals, modifications, and completed items directly in your browser's local storage (`localStorage`). No servers, no sign-ups.
- **Import / Export Backup**: Save your progress as a lightweight `.json` backup file so you can transfer your checklist state between mobile devices, tablets, and desktops.

---

## 🛠️ How to Use

1. **Launch the Calculator**:
   Open [nether_costs.html](nether_costs.html) directly in any modern desktop or mobile web browser.
2. **Input Inventory**:
   Enter your current on-hand resources (**Orbs**, **Flames**, **Crystals**, **Stars**) in the inputs or use the quick increment buttons (+1, -1, etc.).
3. **Set Upgrades**:
   Adjust your active Nether Pie level and toggle the Bounty check in the *Upgrades & Modifiers* card to reflect your current in-game status.
4. **Target Goals & Custom Targets**:
   - Go through the checklist in the right-hand panel and click **Target** on any items you want to acquire. Filter by category (Creatures, Scrolls, DDD, Lesley, Custom) or search by name.
   - Use the **Quick Target** card to plan custom combinations of resources and creature summons on the fly.
   - Click **+ Add Custom Goal** or **Save as Goal...** to create permanent reusable custom targets.
5. **Summoning Recommendations**:
   The *Nether Requirements* panel will output exactly how many Netherlings, Demons, and Mountains you need to summon, along with a detailed step-by-step log of the calculation cascade.
6. **Mark Achievements**:
   When you purchase an upgrade in-game or achieve a goal, click **Achieved** on the card. This hides the card and automatically updates your creature levels (updating their base drop rates for future calculations).

---

## 🔒 Security & Offline Architecture (Base64 Images)

### Why is there Base64 data inside the HTML file?
The `nether_costs.html` file is designed as a **completely self-contained, single-file application**. 
To ensure it can run 100% offline, load instantly, and never depend on third-party image hosts (which can break over time, go down, or track users), all graphical game assets (icons for resources and creatures) are embedded directly inside the HTML using **Base64 Data URIs** (e.g., `data:image/webp;base64,...`).

### Is it safe?
**Yes.** These Base64 strings are merely the raw binary byte arrays of the original WebP images encoded into ASCII text so the browser can render them inline. They do not run scripts, perform network requests, or execute code. 

### How to verify the images yourself
For security-conscious users, the repository includes verification scripts in the `scratch/` folder to confirm that the Base64 data corresponds exactly to the raw image assets:

1. Open a PowerShell command prompt in the project root.
2. Run the verification script:
   ```powershell
   powershell -File scratch/verify_base64.ps1
   ```
3. The script reads the raw WebP files in `assets/` and compares their binary hashes against the Base64 strings embedded inside `nether_costs.html`. It will print a confirmation that each matches the original asset exactly:
   ```text
   crystal matches expected base64 exactly.
   orb matches expected base64 exactly.
   mountain matches expected base64 exactly.
   ...
   ```

---

## 📂 Project Structure

```text
├── assets/                  # Original WebP game icons
├── reference/               # Source materials and spreadsheets
│   ├── Idle Apocalypse Nether Raw Data.xlsx  # Raw source data from the game
│   └── code_sample.html     # Reference code template
├── scratch/                 # Developer helper and math test scripts
│   ├── find_scrolls.ps1     # Parses wiki documents for scroll text
│   ├── inject_base64.ps1    # Encodes assets/ and updates nether_costs.html
│   ├── test_math.js         # JScript runner verifying cascade math calculations
│   └── verify_base64.ps1    # Security verification script
├── nether_costs.html        # The self-contained, fully-compiled application
├── GEMINI.md                # Antigravity developer rules & multi-device git policies
├── PROJECT_MASTER.md        # Master technical specification & developer guide
└── README.md                # Project documentation
```
