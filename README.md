# Pokémon Twitch Chat RPG

A Twitch chat–driven Pokémon catching game with a retro "trainer storage OS" web companion. Viewers catch, collect, trade favorites, shop, and battle entirely from chat, then manage their collection on a neon-styled trainer card site.

**Live site:** [pokemon.dranben.com](https://pokemon.dranben.com)

> This repository is the **frontend** — the static trainer-card web app. It talks to a separate Cloudflare Worker backend (`pokemon.brandenkenn.workers.dev`) that holds the game logic, Twitch OAuth exchange, and the player database. The Worker lives in its own project and is not included here.

---

## How it plays

The game runs in a Twitch channel's chat. Viewers type commands; the bot responds and records progress to their trainer account. This site is where players view their collection, manage favorites, and shop.

### Chat commands

| Command | What it does |
| --- | --- |
| `!catchpokemon` | Catch a wild Pokémon |
| `!catchstats` | Your trainer summary |
| `!mypokemon` | Link to your storage page |
| `!globalstats` | Server-wide catch stats |
| `!market` | List all items for sale |
| `!get [item]` | Buy an item (e.g. `!get incense`, `!get master-ball`, `!get charm`) |
| `!bag` | View your items and active buffs |
| `!battle @username` | Challenge another trainer |
| `!acceptbattle @username` | Accept a challenge (within 60 seconds) |

### How battles work

1. Set a Pokémon in **Favorite Slot 1** (the Battle Slot) on your trainer page — that's your fighter.
2. Type `!battle @username` to challenge someone.
3. They have **60 seconds** to reply with `!acceptbattle @you`.
4. The winner is decided by each Pokémon's **base stats + IVs** — stronger Pokémon win more often, but it's never guaranteed.

---

## Web app features

- **Trainer card** with three tabs: **Collection**, **My Bag**, and **Poké Mart**.
- **Search any trainer** by name to view their public collection and stats.
- **Collection grid** with live sprites (from [pokemondb](https://pokemondb.net)), per-Pokémon IVs (ATK / DEF / STA, 0–15), and perfect-stat highlighting.
- **Shiny** (✨) and **Pokérus** (🧬) tagging.
- **Favorites** — 4 display slots; slot 1 doubles as the battle fighter.
- **Sort & filter** — newest, oldest, Pokédex #, A–Z, or shinies first; live name filter.
- **Detail view** — pulls live types and the Pokédex flavor entry from [PokeAPI](https://pokeapi.co).
- **Poké Mart & Bag** — browse and buy items; view and use consumables and active buffs (Bottle Cap, Master Ball, Incense).
- **Owner actions** (when logged in as the trainer being viewed) — set/clear favorites, release Pokémon.
- **Twitch login** via OAuth; session persisted in `localStorage`.
- **Repair Storage** — one-click local cache/session reset.

---

## Tech stack

- **Frontend:** vanilla HTML, CSS, and JavaScript — no framework, no build step.
- **Styling:** custom neon/retro theme with the [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) font.
- **Backend (separate):** Cloudflare Worker — Twitch OAuth token exchange, game logic, and player data.
- **External data:** sprites from pokemondb, Pokédex entries and types from PokeAPI.

---

## Project structure

```
.
├── index.html   # Trainer card markup: header, tabs, modals, info drawer
├── script.js    # App logic: auth, data fetching, rendering, favorites, market, bag
└── style.css    # Neon/retro theme and layout
```

---

## Running locally

This is a fully static site, so any static file server works:

```bash
# Python
python -m http.server 8000

# or Node
npx serve
```

Then open the served URL (e.g. `http://localhost:8000`).

The app fetches from the public Worker, so you can browse and search trainers locally. **Twitch login won't work from localhost** — the OAuth `redirect_uri` is fixed to the production domain — so owner-only actions (catching is chat-side; releasing, buying, favoriting) require the live site.

## Configuration

Backend and auth endpoints are defined at the top of [`script.js`](script.js):

```js
const CLIENT_ID   = "...";                                  // Twitch app client ID
const REDIRECT_URI = "https://pokemon.dranben.com";         // OAuth redirect target
const WORKER_URL   = "https://pokemon.brandenkenn.workers.dev"; // Backend Worker
```

Point these at your own Twitch application and Worker deployment to run a separate instance.

---

## Credits

Built for the Twitch community. Pokémon sprites and data via pokemondb and PokeAPI; Pokémon is © Nintendo / Game Freak / The Pokémon Company — this is a non-commercial fan project.
