# Legends XI

Two-player football legends game.

- `/` Head-to-Head: online rooms (each player picks an XI on their own phone), then a synced 3D simulation or a live match where each player controls their own team. Also works on one phone.
- `/solo.html` Solo XI builder and touch-controlled quick match vs CPU
- `data.js` players · `sim.js` seeded match engine · `studio.js` commentary/pundits · `live.js` live two-player engine (host-authoritative)

Online rooms use Supabase Realtime broadcast + presence only (no tables).
