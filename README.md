# teamsetup28 — AI Impact Assessment, Team Input App

Web app for the Sourcing / Logistics / Customs / Labelling AI impact assessment
(Gartner IT 2030 framework). Team leads enter their as-is facts and automation
assumptions; **Send to Claude** derives the recommendation (FTE bridge, role
model, development plan per internal, transition roadmap).

Pure static HTML/CSS/JS — no build step, no backend, no dependencies.

## What team leads enter

| Section | Content |
|---|---|
| 01 Baseline | FTE internal/external, systems owned, AI in daily use |
| 02 Capabilities | 4–6 capabilities: %FTE (Σ=100), AI level today, assumed 2028 level (+ vendor cap `*`), year reached, demand Δ%, key constraint |
| 03 Skillsets | S1–S5 depth needed, BASE vs AI-FIRST (H/M/L) |
| 04 People sheet | One row per internal: role (no names), core skills, S1–S5 current depth, AI adoption, appetite, development direction |
| 05 Free text | Biggest opportunity, biggest risk, decision needed |

**Save** persists per team in the browser (`localStorage`), with JSON
export/import for handing files around. **Load example** prefills the
Logistics illustration from the input deck.

## Send to Claude

Builds a structured prompt with the derivation rules (FTE bridge =
baseline × demand Δ × automation effect + supervision work; `>2028` levels
contribute nothing to the 2028 bridge; automation gains land on the external
share first; per-internal plans are DRAFTs for HR/works-council alignment)
and calls the Anthropic Messages API directly from the browser
(`anthropic-dangerous-direct-browser-access`). The recommendation renders
inline and can be downloaded as Markdown.

Requires an **Anthropic API key** (Connection section). The key is stored
only in the browser's localStorage and sent only to `api.anthropic.com`.

## Run locally

Open `index.html` in a browser. That's it.

## Deploy to GitHub Pages

Repo: **github.com/ttschaffler/teamsetup28** (already initialized locally,
remote set — just push):

```bash
git push -u origin main
```

Then: **Settings → Pages → Source: Deploy from a branch → `main` / root**.
The app is served at **https://ttschaffler.github.io/teamsetup28/** after
~1 minute.

> **Note on private repos:** GitHub Pages sites are publicly reachable (via
> the URL) even from private repos unless you are on GitHub Enterprise Cloud
> with Pages access control. The app holds no data server-side — all input
> stays in each user's browser — but if the URL itself should not be public,
> host it on Enterprise Pages, an internal web server, or just share the
> folder and open `index.html` locally.

## Data & privacy

- No server, no database: input lives in each team lead's browser until they
  export it or press Send to Claude.
- People sheet: use **role labels, not names**. Person-level development
  input is sensitive — align handling with HR and works council.
- Each team lead needs their own API key, or you distribute one workspace
  key for the exercise and rotate it afterwards.

## Customize

- Teams: edit the `TEAMS` array at the top of `app.js`.
- Skillset definitions: `SKILLSETS` array.
- Model: `MODEL` constant (default `claude-sonnet-4-6`).
- Derivation rules: `buildPrompt()` in `app.js`.
