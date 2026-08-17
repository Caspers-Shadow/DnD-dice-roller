# 🎲 The Faerie's Fortune

A fantasy-themed 3D dice roller designed as a lightweight digital companion for tabletop role-playing games.

Roll your dice, keep track of your results, and customise your gaming table with different fantasy-inspired themes.

The project is currently a **client-side web application**, with plans to expand it into a multiplayer tabletop companion for players and Dungeon Masters.

```bash
https://caspers-shadow.github.io/DnD-dice-roller/
```

---

## ✨ Features

### 🎲 Multiple Dice

Roll a variety of standard tabletop dice:

* d4
* d6
* d8
* d10
* d12
* d20
* d%

The dice are rendered in 3D using **Three.js** and feature animated rolling.

### ⚔️ Critical Rolls

The d20 includes special feedback for:

* Critical hits
* Fumbles

Roll results are visually highlighted when they occur.

### 📜 Roll Log

Every roll is added to a local roll history.

The log records:

* Dice type
* Result
* Time of the roll
* Critical hits
* Fumbles

Only the most recent rolls are displayed to keep the interface compact.

### 🌌 Fantasy Themes

The table can be customised with different environments:

* Emerald Table
* Dragonfire Hoard
* Ninth Moon
* Sunlit Parchment
* Frostspire

Each theme changes the environment, colours, lighting and ambient effects.

### ✨ Ambient Effects

The application includes procedural visual effects such as:

* Fireflies
* Embers
* Smoke
* Stars
* Snow
* Magical fairies
* Mountains
* Forests
* Hills
* Moonlight
* Sunlight

The environment is generated dynamically rather than relying entirely on external image assets.

### 💾 Theme Persistence

The selected theme is saved using browser `localStorage`, allowing the user's preferred table theme to remain selected when they return.

---

## 🛠️ Technologies

This project currently uses:

* **HTML5**
* **CSS3**
* **JavaScript**
* **Three.js**
* **Canvas API**
* **SVG**
* **LocalStorage**

Three.js is loaded through CDNJS.

The project is currently designed as a static website and does not require a backend or Node.js server to run the dice roller.

---

## 🚀 Running the Project

Because this is a static website, no build process is required.

### Option 1 — Open locally

Clone the repository:

```bash
git clone https://github.com/Caspers-Shadow/DnD-dice-roller.git
```

Open the project folder and launch:

```text
index.html
```

in a web browser.

### Option 2 — GitHub Pages

The project can be deployed directly using GitHub Pages.

The main entry point is:

```text
index.html
```

Once GitHub Pages is enabled, the website can be accessed through the generated GitHub Pages URL.

A custom domain can also be configured through GitHub Pages.

---

# 🗺️ Future Development

The long-term goal is to evolve Roll the Bones from a simple dice roller into a **digital tabletop companion** for D&D and other tabletop role-playing games.

## 👥 Parties

Players will eventually be able to create or join a party.

A party could contain:

* Party name
* Dungeon Master
* Players
* Campaign information
* Shared notes
* Shared roll history

---

## 🧙 Dungeon Master Mode

A Dungeon Master could have a dedicated dashboard showing the activity of the entire party.

The DM could see:

* Every player's rolls
* Roll history
* Player notes
* Shared campaign notes
* Current encounters
* Important events
* NPC information
* Hidden DM notes

The DM could also potentially make rolls privately without revealing them to players.

---

## 📜 Individual Player Logs

Each player would have their own personal roll history.

For example:

```text
Mariska
────────────────────
d20 → 18
d20 → 7
d8  → 6
d20 → 20 ⚔️ Critical!
d6  → 3
```

Players would only see their own private information unless something is intentionally shared with the party.

---

## 📝 Player Notes

Players could create their own notes during a campaign.

Possible categories include:

* Character notes
* NPCs
* Locations
* Quests
* Items
* Clues
* Lore
* Important events

Players could also mark notes as:

**Private**

or

**Shared with Party**

---

## 🗺️ Campaign System

A future version could allow users to create campaigns containing multiple sessions.

For example:

```text
Campaign
└── The Lost Kingdom
    ├── Session 1
    ├── Session 2
    ├── Session 3
    └── Session 4
```

Each session could have its own:

* Roll history
* Notes
* Events
* Encounters
* Players
* DM notes

---

# 💡 Potential Future Features

Some additional features that could make the project much more interesting:

### 🎯 Roll Modifiers

Allow players to add modifiers to their rolls.

For example:

```text
d20 + 5
```

The interface could display:

```text
Natural Roll: 15
Modifier: +5
Total: 20
```

---

### 🎲 Custom Rolls

Allow users to enter custom dice expressions such as:

```text
2d6 + 3
```

```text
1d20 + 5
```

```text
4d8 + 2
```

This would make the roller much more useful for actual tabletop games.

---

### ⚔️ Advantage & Disadvantage

Add dedicated buttons for:

**Advantage**

```text
d20 → 14, 19
Result → 19
```

**Disadvantage**

```text
d20 → 14, 5
Result → 5
```

---

### 🎭 Character Profiles

Players could create characters containing:

* Character name
* Class
* Race
* Level
* Stats
* HP
* Armour Class
* Inventory
* Abilities

The dice roller could then automatically apply relevant modifiers.

---

### ❤️ HP Tracker

Players could track their character's health.

For example:

```text
ARIA
████████████░░░░
32 / 40 HP
```

The DM could potentially update or view player HP during encounters.

---

### ⚔️ Initiative Tracker

A dedicated combat tracker could display:

```text
COMBAT

1. Goblin       18
2. Aria         16
3. Kael         13
4. Dragon       11
5. Mira          8
```

The DM could advance the turn order.

---

### 🗺️ Virtual Tabletop

Eventually the application could grow beyond dice into a lightweight virtual tabletop.

Possible features:

* Battle maps
* Character tokens
* Fog of war
* Player positions
* DM-only areas
* Map markers
* Shared drawings

---

### 🔒 Private DM Rolls

A particularly useful feature would be **secret rolls**.

The DM could roll:

```text
DM SECRET ROLL
d20 → 17
```

Players would simply see:

```text
The Dungeon Master rolled a die...
```

This would allow the DM to perform perception checks, NPC checks and other hidden rolls.

---

### 🔗 Shareable Campaigns

Give each campaign a unique code:

```text
ROLL-7F4K2
```

Players enter the code to join the campaign.

This would make it possible to start playing without requiring complicated setup.

---

### 💬 Party Chat

A campaign could eventually have a small built-in chat.

For example:

```text
[ARIA] I think we should investigate the tower.

[KAEL] Agreed.

[DM] You hear something moving upstairs...
```

---

### 🎨 More Table Customisation

The current theme system could eventually become a full table customisation system.

Players could choose:

* Dice appearance
* Dice materials
* Table style
* Background
* Lighting
* Particle effects
* Sound effects
* Roll animations

---

# 🧠 Project Vision

The ultimate goal is not simply to create another online dice roller.

The goal is to create a **digital gaming table** that helps players and Dungeon Masters manage the small details of a tabletop campaign while keeping the experience immersive.

The dice roller is the starting point.

Future versions could combine:

**🎲 Dice + 📝 Notes + 👥 Party + 🧙 DM + ⚔️ Combat + 🗺️ Campaign**

into one unified tabletop experience.

---

# 📌 Current Status

**Version:** 1.0

### Currently implemented

* [x] 3D dice
* [x] d4
* [x] d6
* [x] d8
* [x] d10
* [x] d12
* [x] d20
* [x] d%
* [x] Roll animation
* [x] Critical hit detection
* [x] Fumble detection
* [x] Roll history
* [x] Multiple fantasy themes
* [x] Animated environments
* [x] Theme persistence
* [x] Keyboard accessibility
* [x] Reduced-motion support

### Planned

* [ ] User accounts
* [ ] Party system
* [ ] Dungeon Master mode
* [ ] Individual player logs
* [ ] Shared party roll history
* [ ] Player notes
* [ ] Campaigns
* [ ] Custom dice expressions
* [ ] Roll modifiers
* [ ] Advantage/disadvantage
* [ ] Character sheets
* [ ] HP tracking
* [ ] Initiative tracker
* [ ] Private DM rolls
* [ ] Party chat
* [ ] Campaign codes
* [ ] Battle maps

---

## 📄 License

This project is currently a personal/student project.

---

## 🎲 Roll the Bones

*Every adventure begins with a roll.*
