# Legends XI

Two-player football legends game.

- `/` (index.html) Solo: XI builder on a pitch and touch-controlled quick match vs CPU (old `/solo.html` links redirect here)
- `/h2h.html` Head-to-Head: two managers, simulation or live online (old `/?room=` invite links redirect here)
- Broadcast 3D (FIFA 12 iOS style) playable view: Solo page vs CPU, home page "Player 1 vs CPU", and as a per-phone view option in online live matches
- `broadcast.js` 3D sideline-camera renderer for live matches
- `data.js` players · `sim.js` seeded match engine · `studio.js` commentary/pundits · `live.js` live two-player engine (host-authoritative)

Online rooms use Supabase Realtime broadcast + presence only (no tables).

- `/hub.html` Matchday Hub for thenonnegotiablog.com: next Arsenal match in Brisbane time with countdown and .ics calendar download, Legend of the Week, Weekly Dream XI challenge (reads your saved XI)
- `fixtures.json` hub fixtures: edit kick-off times here (UTC) when they move
- `og.png` link-preview image

## Formations and custom shapes
12 base formations live in `FORM_BASE` (data.js). Dragging a player onto open grass creates a custom shape stored as a formation key `~<base>:<40 digits>` (xxyy per outfield slot); `FORMS` is a Proxy that parses these, so saves, team codes and both match engines work unchanged. Roles are re-read from position (`roleAt`), `formLabel()` gives the display name.

## Skills and tackles
`SKILLS`, `skillMove`, `skillBall` and `ACT_CODE` (data.js) are shared by the live engine and the sim. Live snapshots carry `k: [idx, code, progress]`; recorded sims carry `actK`/`actU`. `BROADCAST.makeRig` / `BROADCAST.animate` (broadcast.js) draw the players and pose two-footed slides and skill moves in both 3D views.
