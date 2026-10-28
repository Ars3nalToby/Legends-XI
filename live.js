/* Legends XI — live two-player match (each player controls their own team on their own phone).
   Host-authoritative: Player 1's phone runs the physics; Player 2 sends inputs and renders snapshots.
   LIVE.start({teams:[A,B], kits:[ka,kb], role:0|1, host:bool, net:{send(type,data), on(type,fn)}, dur, onExit(result)})
   Depends on data.js (PL, FORMS, fit). */
const LIVE = (function () {
  'use strict';
  const W = 68, L = 105, GH = 3.66, CX = 34;
  const rand = Math.random, clamp = (v, a, b) => v < a ? a : v > b ? b : v, hyp = Math.hypot;
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ======================= ENGINE (runs on host) ======================= */
  function Engine(teams, dur) {
    const M = this;
    M.dur = dur; M.clock = 0; M.half = false; M.score = [0, 0]; M.events = []; M.state = 'play'; M.pause = 0; M.after = null; M.banner = null; M.bannerId = 0;
    M.teams = teams.map((t, ti) => FORMS[t.form].map((s, i) => {
      const p = PL[t.xi[i]], f = fit(p, s[0]), m = f === 'nat' ? 1 : f === 'line' ? .95 : .86, gk = s[0] === 'GK';
      return { team: ti, i, idx: ti * 11 + i, slot: s[0], fx: ti === 0 ? s[1] : 1 - s[1], fy: s[2], d: p, gk, pac: p.s[0] * m, sho: gk ? 40 : p.s[1] * m, pas: gk ? p.s[3] : p.s[2] * m, def: gk ? 60 : p.s[3] * m, ovr: p.ovr * m, x: 0, y: 0, vx: 0, vy: 0, fcx: 0, fcy: ti ? -1 : 1, cd: 0, stun: 0, hold: 0, run: null };
    }));
    M.all = M.teams[0].concat(M.teams[1]);
    M.ball = { x: CX, y: L / 2, z: 0, vx: 0, vy: 0, vz: 0, owner: null, last: null, np: null, npT: 0, rolled: new Set(), shot: false, shotTeam: -1, shotQ: 0, gkRolled: false, recv: null };
    M.active = [null, null]; M.lock = [0, 0]; M.idle = [0, 0];
    M.inp = [0, 1].map(() => ({ wx: 0, wy: 0, sprint: false, press: false, charging: false, power: 0, q: [] }));
    M.kickoff(0); M.say('Kick off', 1.2);
  }
  const E = Engine.prototype;
  E.ad = t => t === 0 ? 1 : -1;
  E.goalY = t => t === 0 ? L : 0;
  E.say = function (text, t) { this.banner = text; this.bannerId++; this.bannerT = t || 1.2; };
  E.jog = function (p) { return 4.6 + p.pac * .03; };
  E.near = function (list, x, y, ex) { let b = null, bd = 1e9; for (const p of list) { if (p === ex) continue; const d = hyp(p.x - x, p.y - y); if (d < bd) { bd = d; b = p; } } return [b, bd]; };
  E.accel = function (p, vx, vy, dt) { const a = Math.min(1, dt * 7); p.vx += (vx - p.vx) * a; p.vy += (vy - p.vy) * a; const s = hyp(p.vx, p.vy); if (s > .6) { const k = Math.min(1, dt * 10); p.fcx += (p.vx / s - p.fcx) * k; p.fcy += (p.vy / s - p.fcy) * k; const n = hyp(p.fcx, p.fcy) || 1; p.fcx /= n; p.fcy /= n; } };
  E.move = function (p, tx, ty, spd, dt, arr) { arr = arr || 1.8; const dx = tx - p.x, dy = ty - p.y, d = hyp(dx, dy), s = d < arr ? spd * d / arr : spd; this.accel(p, d > .05 ? dx / d * s : 0, d > .05 ? dy / d * s : 0, dt); };
  E.kickoff = function (team) {
    const M = this;
    for (const p of M.all) { const depth = p.gk ? 1.5 : Math.min(3 + p.fy * 60, 47); p.x = p.fx * W; p.y = p.team === 0 ? depth : L - depth; p.vx = p.vy = 0; p.run = null; p.stun = 0; p.cd = 0; p.fcx = 0; p.fcy = p.team ? -1 : 1; }
    const st = M.teams[team].reduce((a, p) => p.fy > a.fy ? p : a); st.x = CX; st.y = L / 2 + (team === 0 ? -.6 : .6);
    Object.assign(M.ball, { x: CX, y: L / 2, z: 0, vx: 0, vy: 0, vz: 0, owner: null, last: null, np: null, npT: 0, shot: false, recv: null, gkRolled: false });
    M.gain(st); M.pause = 1; M.state = 'play';
  };
  E.gain = function (p) { const b = this.ball; Object.assign(b, { owner: p, last: p, shot: false, recv: null, gkRolled: false, z: 0, vz: 0 }); p.hold = p.gk ? .9 : 0; for (const q of this.all) q.run = null; };
  E.kick = function (p, vx, vy, vz) { const b = this.ball; Object.assign(b, { owner: null, vx, vy, vz: vz || 0, z: vz ? .05 : 0, last: p, np: p, npT: .28, shot: false, recv: null, gkRolled: false }); b.rolled = new Set(); };
  E.formTarget = function (p) {
    const b = this.ball, t = p.team, poss = b.owner ? b.owner.team : -1;
    if (p.gk) { const own = t === 0 ? 0 : L, d = clamp(1.2 + Math.max(0, Math.abs(b.y - own) - 25) * .06, 1, 6); return [CX + (b.x - CX) * .18, t === 0 ? d : L - d]; }
    let depth = 3 + p.fy * 62; if (poss === t) depth += 9; else if (poss === 1 - t) depth -= 5;
    const by = t === 0 ? b.y : L - b.y; depth += (by - 52.5) * .5;
    depth = clamp(depth, p.fy > .6 ? 28 : p.fy > .3 ? 14 : 6, p.fy < .3 ? 60 : 96);
    let x = p.fx * W; x = CX + (x - CX) * (poss === t ? 1.08 : .9); x += (b.x - CX) * .32; x = clamp(x, 2, W - 2);
    return [x, t === 0 ? depth : L - depth];
  };
  E.pass = function (p, dx, dy, through, minCos) {
    const M = this, b = M.ball, mates = M.teams[p.team].filter(q => q !== p), opps = M.teams[1 - p.team], ad = M.ad(p.team);
    let n = hyp(dx, dy); if (n < .1) { dx = p.fcx; dy = p.fcy; n = 1; } dx /= n; dy /= n;
    let best = null, bs = -1e9;
    for (const m of mates) {
      const vx = m.x - p.x, vy = m.y - p.y, d = hyp(vx, vy); if (d < 3 || d > 48) continue; const cos = (vx * dx + vy * dy) / d; if (cos < (minCos == null ? .25 : minCos)) continue;
      let sc = cos * 1.7 - d / 38 + (vy * ad) / 80;
      for (const o of opps) { const t = clamp(((o.x - p.x) * vx + (o.y - p.y) * vy) / (d * d), 0, 1); const od = hyp(o.x - (p.x + vx * t), o.y - (p.y + vy * t)); if (od < 2.2 && t > .1) sc -= (2.2 - od) * .45; }
      if (m.gk) sc -= .8; if (sc > bs) { bs = sc; best = m; }
    }
    if (!best) best = M.near(mates.filter(q => !q.gk), p.x + dx * 12, p.y + dy * 12)[0];
    let tx = best.x + best.vx * .45, ty = best.y + best.vy * .45;
    if (through) { ty += ad * (6 + rand() * 3); tx += (CX - tx) * .12; ty = clamp(ty, 1.5, L - 1.5); tx = clamp(tx, 1.5, W - 1.5); best.run = { x: tx, y: ty }; }
    const err = (1 - p.pas / 100) * .16 * gauss(), ax = tx - b.x, ay = ty - b.y, dd = hyp(ax, ay) || 1, ang = Math.atan2(ay, ax) + err;
    const v0 = Math.min(27, dd * .75 + (through ? 6 : 8));
    M.kick(p, Math.cos(ang) * v0, Math.sin(ang) * v0, 0); b.recv = best;
    M.active[p.team] = best; M.lock[p.team] = .6;
  };
  E.shoot = function (p, power, lat) {
    const M = this, b = M.ball, gy = M.goalY(p.team) + (p.team === 0 ? .5 : -.5);
    let tx = CX + clamp(lat, -1, 1) * 2.9; tx += (1 - p.sho / 100) * 7 * (.55 + Math.abs(power - .7)) * gauss();
    const dx = tx - b.x, dy = gy - b.y, d = hyp(dx, dy) || 1, sp = 17 + power * 13 + p.sho * .05;
    const vz = Math.max(0, 1 + Math.max(0, power - .6) * 14 + rand() * 1.2 + d * .03 - (d < 10 ? 1.5 : 0));
    M.kick(p, dx / d * sp, dy / d * sp, vz); b.shot = true; b.shotTeam = p.team; b.shotQ = clamp(Math.abs(tx - CX) / GH, 0, 1.3);
  };
  E.pickActive = function (t) {
    const M = this, b = M.ball, mine = M.teams[t];
    if (b.owner && b.owner.team === t) { M.active[t] = b.owner; return; }
    if (b.recv && b.recv.team === t) { M.active[t] = b.recv; return; }
    if (M.lock[t] > 0 && M.active[t]) return;
    const tx = b.x + b.vx * .3, ty = b.y + b.vy * .3; const [n, nd] = M.near(mine.filter(q => !q.gk), tx, ty);
    const a = M.active[t]; if (!a || a.gk) { M.active[t] = n; return; }
    if (n !== a && nd < hyp(a.x - tx, a.y - ty) - 2.5) M.active[t] = n;
  };
  E.recvMove = function (p, dt) {
    const b = this.ball; if (p.run && hyp(p.run.x - p.x, p.run.y - p.y) > 1) { this.move(p, p.run.x, p.run.y, this.jog(p) * 1.25, dt, .6); return; }
    const sp = hyp(b.vx, b.vy), stop = sp / .6, ex = b.x + (sp ? b.vx / sp * stop : 0), ey = b.y + (sp ? b.vy / sp * stop : 0);
    const vx = ex - b.x, vy = ey - b.y, l2 = vx * vx + vy * vy || 1, t = clamp(((p.x - b.x) * vx + (p.y - b.y) * vy) / l2, .15, 1);
    this.move(p, b.x + vx * t, b.y + vy * t, this.jog(p) * 1.15, dt, .4);
  };
  E.gkAI = function (p, dt) {
    const M = this, b = M.ball, t = p.team, own = t === 0 ? 0 : L;
    if (b.owner === p) { p.hold -= dt; M.accel(p, 0, 0, dt); return; }
    if (b.shot && b.shotTeam !== t && !b.owner && (own - b.y) / (b.vy || 1e-6) > 0) { const tt = (own - b.y) / b.vy; const cx = clamp(b.x + b.vx * tt, CX - GH - .4, CX + GH + .4); M.move(p, cx, t === 0 ? 1.1 : L - 1.1, 9.5, dt, .3); return; }
    const inBox = Math.abs(b.x - CX) < 20 && Math.abs(b.y - own) < 16;
    if (!b.owner && inBox && hyp(b.vx, b.vy) < 9) { const [, nd] = M.near(M.all.filter(q => q.team !== t), b.x, b.y); if (hyp(b.x - p.x, b.y - p.y) < nd + 2) { M.move(p, b.x, b.y, 7.5, dt, .3); return; } }
    const [tx, ty] = M.formTarget(p); M.move(p, tx, ty, 6, dt, 1);
  };
  E.tackle = function (A, o) {
    const M = this, d = hyp(o.x - A.x, o.y - A.y); A.cd = .8;
    if (d < 2.3) { A.vx += (o.x - A.x) / d * 6; A.vy += (o.y - A.y) / d * 6; const pr = clamp(.46 + (A.def - o.pac * .6 - 30) / 160, .15, .8); if (rand() < pr) { M.gain(A); M.ball.x = A.x; M.ball.y = A.y; M.say('Tackle!', .7); } else A.stun = .55; }
    else { A.vx += (o.x - A.x) / d * 3; A.vy += (o.y - A.y) / d * 3; }
  };
  E.step = function (dt) {
    const M = this, b = M.ball;
    if (M.bannerT > 0) { M.bannerT -= dt; if (M.bannerT <= 0) M.banner = null; }
    if (M.state === 'goal' || M.state === 'ht') { M.pause -= dt; if (M.pause <= 0) { const a = M.after; M.after = null; a && a(); } return; }
    if (M.state === 'ft') return;
    if (M.pause > 0) { M.pause -= dt; return; }
    M.clock += dt / M.dur * 90;
    if (!M.half && M.clock >= 45) { M.half = true; M.clock = 45; M.state = 'ht'; M.pause = 2.5; M.say('Half time ' + M.score[0] + '–' + M.score[1], 2.5); M.after = () => { M.kickoff(1); M.say('Second half', 1); }; return; }
    if (M.clock >= 90) { M.clock = 90; M.state = 'ft'; M.say('Full time ' + M.score[0] + '–' + M.score[1], 4); return; }
    b.npT -= dt; M.lock[0] -= dt; M.lock[1] -= dt;
    for (const p of M.all) { p.cd -= dt; p.stun -= dt; }
    M.pickActive(0); M.pickActive(1);
    for (const t of [0, 1]) {
      const A = M.active[t], I = M.inp[t]; if (!A) continue;
      const mag = Math.min(1, hyp(I.wx, I.wy)); const q = I.q.splice(0);
      if (mag > .15 || q.length) M.idle[t] = 0; else M.idle[t] += dt;
      if (A.stun > 0) M.accel(A, 0, 0, dt);
      else if (mag > .15) { const sp = M.jog(A) * (I.sprint ? 1.32 : 1) * (b.owner === A ? .9 : 1) * (.45 + .55 * mag); M.accel(A, I.wx / mag * sp, I.wy / mag * sp, dt); }
      else if (!b.owner && hyp(b.x - A.x, b.y - A.y) < 14 && b.recv !== A) M.move(A, b.x + b.vx * .2, b.y + b.vy * .2, M.jog(A), dt, .5);
      else if (b.recv === A) M.recvMove(A, dt);
      else M.accel(A, 0, 0, dt);
      if (b.owner === A) {
        for (const e of q) {
          if (b.owner !== A) break;
          if (e.k === 'pass') M.pass(A, e.x, e.y, false, hyp(e.x, e.y) > .15 ? .25 : -.1);
          else if (e.k === 'thr') M.pass(A, e.x, e.y, true, hyp(e.x, e.y) > .15 ? .2 : -.1);
          else if (e.k === 'shoot') { let lat = e.x; if (Math.abs(e.x) < .2 && Math.abs(e.y) < .2) lat = A.x < CX ? .55 : -.55; M.shoot(A, clamp(e.p, 0, 1.05), lat); I.charging = false; I.power = 0; }
        }
        if (I.charging && b.owner === A) I.power = Math.min(1.05, I.power + dt / .85);
        if (A.gk) { A.hold -= dt; if (A.hold < -2.6) M.pass(A, 0, M.ad(t), false, -.3); }
        else if (M.idle[t] > 6) { M.pass(A, 0, M.ad(t), false, -.2); M.idle[t] = 0; }
      } else {
        I.charging = false; I.power = 0;
        for (const e of q) {
          if (e.k === 'switch') { const [n] = M.near(M.teams[t].filter(x => !x.gk), b.x, b.y, A); if (n) { M.active[t] = n; M.lock[t] = 1.2; } }
          else if (e.k === 'tackle' && A.cd <= 0 && b.owner && b.owner.team !== t) M.tackle(A, b.owner);
        }
        if (b.owner && b.owner.team !== t && !b.owner.gk) { const o = b.owner; if (hyp(o.x - A.x, o.y - A.y) < 1 && A.stun <= 0 && rand() < dt * .55 * (A.def / 85)) M.gain(A); }
      }
    }
    // AI for everyone else
    const ownT = b.owner ? b.owner.team : -1;
    const helper = [0, 1].map(t => M.near(M.teams[t].filter(q => !q.gk && q !== M.active[t]), b.x, b.y)[0]);
    for (const p of M.all) {
      const t = p.team; if (p === M.active[t]) continue; if (p.stun > 0) { M.accel(p, 0, 0, dt); continue; }
      if (p.gk) { if (b.owner === p) { p.hold -= dt; M.accel(p, 0, 0, dt); if (p.hold <= 0) M.pass(p, rand() - .5, M.ad(t), false, -.2); } else M.gkAI(p, dt); continue; }
      if (b.recv === p) { M.recvMove(p, dt); continue; }
      if (p.run) { M.move(p, p.run.x, p.run.y, M.jog(p) * 1.25, dt); if (hyp(p.run.x - p.x, p.run.y - p.y) < 1) p.run = null; continue; }
      if (p === helper[t] && ownT !== t) {
        const A = M.active[t];
        const chase = M.inp[t].press || (!b.owner && (!A || hyp(b.x - p.x, b.y - p.y) < hyp(b.x - A.x, b.y - A.y) - 3));
        if (chase) { M.move(p, b.x + b.vx * .3, b.y + b.vy * .3, M.jog(p) * 1.15, dt, .4); if (b.owner && b.owner.team !== t && p.cd <= 0 && hyp(b.owner.x - p.x, b.owner.y - p.y) < 1.2) { p.cd = 1; if (rand() < clamp(.3 + (p.def - b.owner.pac) / 300, .08, .55)) M.gain(p); } continue; }
        const og = t === 0 ? 0 : L; M.move(p, b.x + (CX - b.x) * .25, b.y + (og - b.y) * Math.min(.3, 6 / (Math.abs(og - b.y) + 1)), M.jog(p), dt); continue;
      }
      const [tx, ty] = M.formTarget(p); let ox = 0, oy = 0;
      if (ownT === t && p.fy > .55) { const ph = (M.clock * 4 + p.i) * .6; ox = Math.sin(ph) * 3; oy = M.ad(t) * Math.max(0, Math.sin(ph * .7)) * 5; }
      M.move(p, tx + ox, clamp(ty + oy, 1, L - 1), M.jog(p) * (hyp(tx - p.x, ty - p.y) > 8 ? 1.15 : .85), dt, 2.5);
    }
    // integrate
    for (const p of M.all) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.gk) { p.x = clamp(p.x, CX - 20, CX + 20); p.y = p.team === 0 ? clamp(p.y, .3, 16.5) : clamp(p.y, L - 16.5, L - .3); } p.x = clamp(p.x, .3, W - .3); p.y = clamp(p.y, .3, L - .3); }
    const A_ = M.all; for (let i = 0; i < A_.length; i++) for (let j = i + 1; j < A_.length; j++) { const a = A_[i], c = A_[j], dx = c.x - a.x, dy = c.y - a.y, d = hyp(dx, dy); if (d < 1.05 && d > .001) { const pu = (1.05 - d) / 2, nx = dx / d, ny = dy / d; if (b.owner !== a) { a.x -= nx * pu; a.y -= ny * pu; } if (b.owner !== c) { c.x += nx * pu; c.y += ny * pu; } } }
    M.ballStep(dt);
  };
  E.ballStep = function (dt) {
    const M = this, b = M.ball;
    if (b.owner) { const p = b.owner; b.x = clamp(p.x + p.fcx * .72, .1, W - .1); b.y = clamp(p.y + p.fcy * .72, .1, L - .1); b.z = 0; b.vx = p.vx; b.vy = p.vy; return; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.z > 0 || b.vz > 0) { b.z += b.vz * dt; b.vz -= 9.8 * dt; if (b.z <= 0) { b.z = 0; b.vz = -b.vz * .42; if (b.vz < 1.2) b.vz = 0; } }
    const c = b.z > .15 ? .12 : (b.shot ? .32 : .6), k = Math.exp(-c * dt); b.vx *= k; b.vy *= k; const sp = hyp(b.vx, b.vy); if (sp < .15) b.vx = b.vy = 0; if (b.shot && sp < 7) b.shot = false;
    if (b.shot && !b.gkRolled) {
      const gk = M.teams[1 - b.shotTeam].find(q => q.gk), d = hyp(gk.x - b.x, gk.y - b.y), reach = 1.6 + (gk.ovr - 80) * .045;
      if (d < reach && b.z < 2.7) { b.gkRolled = true; const pr = clamp(.62 + (gk.ovr - 86) * .025 - (sp - 22) * .018 - b.shotQ * .3 + (d < .9 ? .15 : 0), .08, .94);
        if (rand() < pr) { if (sp < 24 && rand() < .55) { M.gain(gk); b.x = gk.x; b.y = gk.y; M.say('Saved!', .8); } else { const out = gk.team === 0 ? 1 : -1; b.vy = Math.abs(b.vy) * .35 * out; b.vx = (rand() - .5) * 14; b.vz = rand() * 3; b.shot = false; b.last = gk; b.rolled = new Set(); M.say('Parried!', .7); } } }
    }
    if (b.z < 1.9) {
      let cand = null, cd = 9; for (const p of M.all) { if (p === b.np && b.npT > 0) continue; if (p.stun > 0) continue; const r = p.gk ? 1.35 : (b.recv === p ? 1.35 : 1), d = hyp(p.x - b.x, p.y - b.y); if (d < r && d < cd) { cd = d; cand = p; } }
      if (cand) { const p = cand, same = b.last && b.last.team === p.team;
        if (p.gk && b.shot && !b.gkRolled) { } else if (same || b.recv === p || (sp < 9 && (!b.recv || cd < hyp(b.recv.x - b.x, b.recv.y - b.y) - .8))) M.gain(p);
        else if (!b.rolled.has(p)) { b.rolled.add(p); const ch = sp > 22 ? .14 : clamp(.4 + (p.def - 70) / 90, .2, .8); if (rand() < ch) M.gain(p); else { b.vx *= .9; b.vy *= .9; } } }
    }
    if (b.y > L || b.y < 0) { const atk = b.y > L ? 0 : 1; if (Math.abs(b.x - CX) < GH && b.z < 2.44) { M.goal(atk); return; } if (b.last && b.last.team === atk) M.restartGK(1 - atk); else M.restartAt(atk, b.x < CX ? .6 : W - .6, atk === 0 ? L - .6 : .6, 'Corner'); return; }
    if (b.x < 0 || b.x > W) M.restartAt(b.last ? 1 - b.last.team : 0, b.x < 0 ? .4 : W - .4, clamp(b.y, 1, L - 1), 'Throw-in');
  };
  E.restartAt = function (t, x, y, label) { const M = this, b = M.ball, [p] = M.near(M.teams[t].filter(q => !q.gk), x, y); p.x = x; p.y = y; p.vx = p.vy = 0; p.fcx = label === 'Corner' ? (x < CX ? 1 : -1) : (x < CX ? .6 : -.6); p.fcy = label === 'Corner' ? 0 : M.ad(t) * .8; Object.assign(b, { vx: 0, vy: 0, vz: 0, z: 0 }); M.gain(p); M.pause = .7; M.say(label, .8); };
  E.restartGK = function (t) { const M = this, gk = M.teams[t].find(q => q.gk); gk.x = CX; gk.y = t === 0 ? 5 : L - 5; Object.assign(M.ball, { vx: 0, vy: 0, vz: 0, z: 0 }); M.gain(gk); gk.hold = 1; M.pause = .6; M.say('Goal kick', .8); };
  E.goal = function (t) {
    const M = this, b = M.ball; M.score[t]++; const sc = b.last && b.last.team === t ? b.last : null; const min = Math.max(1, Math.ceil(M.clock));
    M.events.push({ t, name: sc ? sc.d.short : 'Own goal', min }); b.vx *= .2; b.vy *= .2;
    M.state = 'goal'; M.pause = 2.6; M.say('GOAL! ' + (sc ? sc.d.short : 'Own goal') + ' ' + min + "'", 2.6); M.after = () => M.kickoff(1 - t);
  };
  // compact snapshot for the network
  E.snap = function () {
    const M = this, b = M.ball, P = [];
    for (const p of M.all) P.push(Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100, Math.round(p.fcx * 100) / 100, Math.round(p.fcy * 100) / 100);
    return { c: Math.round(M.clock * 100) / 100, s: M.score, p: P, b: [Math.round(b.x * 100) / 100, Math.round(b.y * 100) / 100, Math.round(b.z * 100) / 100], o: b.owner ? b.owner.idx : -1, r: b.recv ? b.recv.idx : -1, a: [M.active[0] ? M.active[0].idx : -1, M.active[1] ? M.active[1].idx : -1], w: [M.inp[0].charging ? M.inp[0].power : 0, M.inp[1].charging ? M.inp[1].power : 0], bn: M.banner, bi: M.bannerId, st: M.state, ev: M.events };
  };

  /* ======================= UI ======================= */
  const CSS = `
#lv{position:fixed;inset:0;z-index:150;background:#08110d;touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden;font-family:'Barlow',system-ui,sans-serif;color:#eef4ef}
#lv canvas.f{position:absolute;inset:0;width:100%;height:100%}
#lv .top{position:absolute;left:0;right:0;top:0;padding:calc(env(safe-area-inset-top,0px) + 8px) max(10px,env(safe-area-inset-right,0px)) 0 max(10px,env(safe-area-inset-left,0px));display:flex;gap:8px;align-items:flex-start;pointer-events:none}
#lv .bug{display:flex;font-family:'Saira Extra Condensed','Arial Narrow',sans-serif;font-weight:800;font-size:20px;line-height:1;background:#0b1511ee;border-radius:4px;overflow:hidden}
#lv .bug>*{padding:6px 9px;display:flex;align-items:center}
#lv .bug .sc{white-space:nowrap;min-width:54px;justify-content:center;font-variant-numeric:tabular-nums}
#lv .bug .ck{background:#ffffff14;min-width:46px;justify-content:center}
#lv .net{font-size:12px}
#lv .net i{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;background:#52d37f}
#lv .rad{margin-left:auto;background:#0b1511cc;border-radius:4px;border:1px solid #ffffff22}
#lv .x{pointer-events:auto;width:40px;height:40px;border-radius:50%;border:0;background:#0b1511dd;color:#fff;font-size:18px}
#lv .zone{position:absolute;left:0;bottom:0;width:50%;height:72%}
#lv .stick{position:absolute;width:120px;height:120px;border-radius:50%;border:2px solid #ffffff55;background:#ffffff10;transform:translate(-50%,-50%);pointer-events:none;opacity:.6;left:calc(max(10px,env(safe-area-inset-left,0px)) + 80px);top:calc(100% - env(safe-area-inset-bottom,0px) - 100px)}
#lv .knob{position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;background:#ffffffcc}
#lv .pad{position:absolute;right:max(10px,env(safe-area-inset-right,0px));bottom:calc(env(safe-area-inset-bottom,0px) + 12px);width:224px;height:196px}
#lv .pb{position:absolute;border-radius:50%;border:2px solid #ffffff66;background:#0b1511b8;color:#fff;font-family:'Saira Extra Condensed','Arial Narrow',sans-serif;font-weight:800;text-transform:uppercase;display:flex;align-items:center;justify-content:center;touch-action:none}
#lv .pb.dn{transform:scale(.92);background:#ffffff33}
#lv .pb.s{width:96px;height:96px;right:0;bottom:0;font-size:22px;background:var(--kit)}
#lv .pb.p{width:74px;height:74px;right:106px;bottom:6px;font-size:18px}
#lv .pb.t{width:66px;height:66px;right:14px;bottom:108px;font-size:15px}
#lv .pb.r{width:62px;height:62px;right:110px;bottom:96px;font-size:14px}
#lv .ban{position:absolute;left:0;right:0;top:32%;text-align:center;pointer-events:none;font-family:'Saira Extra Condensed','Arial Narrow',sans-serif;font-weight:800;text-transform:uppercase;font-size:clamp(40px,10vw,96px);line-height:.9;text-shadow:0 6px 20px #000;opacity:0;transition:opacity .2s}
#lv .ban.on{opacity:1}
#lv .ov{position:absolute;inset:0;background:#000c;display:flex;align-items:center;justify-content:center;padding:20px;z-index:5}
#lv .card{background:#12201a;border-radius:10px;padding:22px;max-width:420px;width:100%;text-align:center;display:flex;flex-direction:column;gap:12px}
#lv .card h2{font-family:'Saira Extra Condensed','Arial Narrow',sans-serif;font-weight:800;font-size:40px;margin:0;text-transform:uppercase;line-height:1}
#lv .card .big{font-family:'Saira Extra Condensed','Arial Narrow',sans-serif;font-weight:800;font-size:60px;line-height:1}
#lv .card ul{list-style:none;margin:0;padding:0;font-size:14px;color:#cfdcd2}
#lv .card button{font-family:'Saira Extra Condensed','Arial Narrow',sans-serif;font-weight:800;text-transform:uppercase;font-size:20px;padding:12px;border:0;border-radius:4px;background:#e3182c;color:#fff}
#lv .card button.g{background:#192b22}
#lv .you{position:absolute;left:max(10px,env(safe-area-inset-left,0px));top:calc(env(safe-area-inset-top,0px) + 50px);font-size:12px;background:#000a;padding:4px 10px;border-radius:999px;pointer-events:none;white-space:nowrap}`;

  function start(o) {
    if (!document.getElementById('lvcss')) { const st = document.createElement('style'); st.id = 'lvcss'; st.textContent = CSS; document.head.appendChild(st); }
    const role = o.role, host = o.host, kits = o.kits, teams = o.teams, net = o.net;
    const root = document.createElement('div'); root.id = 'lv'; root.style.setProperty('--kit', kits[role].a);
    const ab0 = t => (t.name || 'XI').replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase(); const ab = t => ab0(teams[0]) === ab0(teams[1]) ? 'P' + (teams.indexOf(t) + 1) : ab0(t);
    root.innerHTML = `<canvas class="f"></canvas><div class="top"><div class="bug"><span style="background:${kits[0].a};color:${txt(kits[0].a)}">${esc(ab(teams[0]))}</span><span class="sc">0 – 0</span><span style="background:${kits[1].a};color:${txt(kits[1].a)}">${esc(ab(teams[1]))}</span><span class="ck">0'</span></div><canvas class="rad" width="120" height="80"></canvas><button class="x" aria-label="Leave match">✕</button></div>
      <div class="you"><span class="net"><i></i><span class="nt">Connected</span></span> You are ${esc(teams[role].mgr || 'Player ' + (role + 1))} · attacking up</div>
      <div class="zone"></div><div class="stick"><div class="knob"></div></div>
      <div class="pad"><button class="pb r">Sprint</button><button class="pb t">Through</button><button class="pb p">Pass</button><button class="pb s">Shoot</button></div>
      <div class="ban"></div><div class="ov" hidden><div class="card"></div></div>`;
    document.body.appendChild(root); document.body.style.overflow = 'hidden';
    const $ = s => root.querySelector(s), cv = $('canvas.f'), ctx = cv.getContext('2d'), rc = $('.rad'), rctx = rc.getContext('2d');
    let eng = host ? new Engine(teams, o.dur) : null;
    let snaps = [], cur = null, alive = true, raf = 0, lastT = performance.now(), acc = 0, lastSend = 0, lastHeard = performance.now(), ended = false, lastBanner = -1, wl = null;
    const names = teams.flatMap(t => t.xi.map(id => PL[id].short)); const gks = teams.flatMap(t => FORMS[t.form].map(s => s[0] === 'GK'));
    const inp = { jx: 0, jy: 0, sprint: false, press: false, charging: false, chargeT: 0, q: [] };
    let dims = { w: 0, h: 0, dpr: 1, land: false, s: 10 }; const cam = { x: CX, y: L / 2 };
    try { navigator.wakeLock && navigator.wakeLock.request('screen').then(w => wl = w).catch(() => { }); } catch (e) { }

    function txt(hex) { const c = parseInt(hex.slice(1), 16), r = c >> 16, g = c >> 8 & 255, b = c & 255; return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#0a1410' : '#fff'; }
    function resize() { const r = root.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = r.width * dpr; cv.height = r.height * dpr; dims = { w: r.width, h: r.height, dpr, land: r.width > r.height, s: r.width > r.height ? Math.max(r.height / 40, r.width / 70) : r.width / 40 }; if (dims.land) { rc.width = 120; rc.height = 80; } else { rc.width = 64; rc.height = 96; } }
    window.addEventListener('resize', resize); resize();
    // world (x,y) -> view coords where my team attacks up/right
    const vx = x => role === 0 ? x : W - x, vy = y => role === 0 ? y : L - y;
    function S(x, y) { const X = vx(x), Y = vy(y), cx = vx(cam.x), cy = vy(cam.y), s = dims.s; return dims.land ? [dims.w / 2 + (Y - cy) * s, dims.h / 2 + (X - cx) * s] : [dims.w / 2 + (X - cx) * s, dims.h / 2 - (Y - cy) * s]; }
    function worldDir() { let wx, wy; if (dims.land) { wx = inp.jy; wy = inp.jx; } else { wx = inp.jx; wy = -inp.jy; } if (role === 1) { wx = -wx; wy = -wy; } return [wx, wy]; }

    /* --- input --- */
    const stick = $('.stick'), knob = $('.knob'), zone = $('.zone'); let sid = null, sx = 0, sy = 0; const SR = 50;
    zone.addEventListener('pointerdown', e => { if (sid !== null) return; sid = e.pointerId; zone.setPointerCapture(e.pointerId); const r = root.getBoundingClientRect(); sx = e.clientX; sy = e.clientY; stick.style.left = (sx - r.left) + 'px'; stick.style.top = (sy - r.top) + 'px'; stick.style.opacity = '1'; e.preventDefault(); });
    zone.addEventListener('pointermove', e => { if (e.pointerId !== sid) return; let dx = e.clientX - sx, dy = e.clientY - sy; const d = hyp(dx, dy); if (d > SR) { dx = dx / d * SR; dy = dy / d * SR; } knob.style.transform = `translate(${dx}px,${dy}px)`; inp.jx = dx / SR; inp.jy = dy / SR; });
    const endS = e => { if (e.pointerId !== sid) return; sid = null; inp.jx = inp.jy = 0; knob.style.transform = ''; stick.style.opacity = '.6'; };
    zone.addEventListener('pointerup', endS); zone.addEventListener('pointercancel', endS);
    const myBall = () => { const sn = cur; return sn && sn.o >= 0 && Math.floor(sn.o / 11) === role; };
    function push(k, extra) { const [x, y] = worldDir(); const ev = Object.assign({ k, x, y }, extra || {}); inp.q.push(ev); if (!host) sendInput(true); }
    function btn(sel, down, up) { const el = $(sel); el.addEventListener('pointerdown', e => { e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add('dn'); down(); }); const u = () => { el.classList.remove('dn'); up && up(); }; el.addEventListener('pointerup', u); el.addEventListener('pointercancel', u); el.addEventListener('contextmenu', e => e.preventDefault()); }
    btn('.pb.s', () => { if (myBall()) { inp.charging = true; inp.chargeT = performance.now(); if (!host) sendInput(true); } else push('tackle'); }, () => { if (inp.charging) { inp.charging = false; const p = Math.min(1.05, (performance.now() - inp.chargeT) / 850); push('shoot', { p }); } });
    btn('.pb.p', () => push(myBall() ? 'pass' : 'switch'));
    btn('.pb.t', () => { if (myBall()) push('thr'); else { inp.press = true; if (!host) sendInput(true); } }, () => { inp.press = false; });
    btn('.pb.r', () => { inp.sprint = true; }, () => { inp.sprint = false; });
    $('.x').addEventListener('click', () => confirmLeave());
    const keys = {};
    function keyAxis() { let x = 0, y = 0; if (keys.a || keys.arrowleft) x--; if (keys.d || keys.arrowright) x++; if (keys.w || keys.arrowup) y--; if (keys.s || keys.arrowdown) y++; if (sid === null) { const n = hyp(x, y) || 1; inp.jx = x / n; inp.jy = y / n; } }
    const kd = e => { const k = e.key.toLowerCase(); if (keys[k]) return; keys[k] = true; if (['w', 'a', 's', 'd', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(k)) { keyAxis(); e.preventDefault(); } if (k === 'shift') inp.sprint = true; if (k === 'j') push(myBall() ? 'pass' : 'switch'); if (k === 'l') { if (myBall()) push('thr'); else inp.press = true; } if (k === 'k') { if (myBall()) { inp.charging = true; inp.chargeT = performance.now(); } else push('tackle'); } };
    const ku = e => { const k = e.key.toLowerCase(); keys[k] = false; keyAxis(); if (k === 'shift') inp.sprint = false; if (k === 'l') inp.press = false; if (k === 'k' && inp.charging) { inp.charging = false; push('shoot', { p: Math.min(1.05, (performance.now() - inp.chargeT) / 850) }); } };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    /* --- net --- */
    let seq = 0;
    function sendInput(force) { const now = performance.now(); if (!force && now - lastSend < 50) return; lastSend = now; const [x, y] = worldDir(); net.send('lv-in', { r: role, n: ++seq, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, sp: inp.sprint, pr: inp.press, ch: inp.charging, q: inp.q.splice(0) }); }
    const offs = [];
    if (host) {
      offs.push(net.on('lv-in', d => { if (!eng || d.r === role) return; lastHeard = performance.now(); const I = eng.inp[d.r]; I.wx = d.x; I.wy = d.y; I.sprint = d.sp; I.press = d.pr; if (d.ch && !I.charging) { I.charging = true; I.power = 0; } if (!d.ch && I.charging && !(d.q || []).some(e => e.k === 'shoot')) { } I.q.push(...(d.q || [])); }));
    } else {
      offs.push(net.on('lv-snap', d => { lastHeard = performance.now(); d._t = performance.now(); snaps.push(d); if (snaps.length > 30) snaps.shift(); }));
    }
    offs.push(net.on('lv-leave', () => { if (!ended) { ended = true; showEnd('Your opponent left the match.'); } }));

    /* --- loop --- */
    function loop(now) {
      if (!alive) return; let dt = Math.min(.25, (now - lastT) / 1000); lastT = now;
      if (host) {
        const I = eng.inp[role], [x, y] = worldDir(); I.wx = x; I.wy = y; I.sprint = inp.sprint; I.press = inp.press;
        if (inp.charging && !I.charging) { I.charging = true; I.power = 0; } if (!inp.charging && I.charging && !inp.q.some(e => e.k === 'shoot')) I.charging = false;
        I.q.push(...inp.q.splice(0));
        acc += dt; while (acc >= 1 / 60) { eng.step(1 / 60); acc -= 1 / 60; }
        cur = eng.snap();
        if (now - lastSend > 50) { lastSend = now; net.send('lv-snap', cur); }
        if (cur.st === 'ft' && !ended) { ended = true; setTimeout(() => finish(cur), 2500); }
      } else {
        sendInput(false);
        // render 110ms behind newest snapshot, interpolating
        const target = now - 110; let a = null, b = null;
        for (let i = snaps.length - 1; i >= 0; i--) { if (snaps[i]._t <= target) { a = snaps[i]; b = snaps[i + 1] || snaps[i]; break; } }
        if (!a && snaps.length) a = b = snaps[0];
        if (a) { const k = b === a ? 0 : clamp((target - a._t) / (b._t - a._t), 0, 1); cur = lerpSnap(a, b, k); }
        if (cur && cur.st === 'ft' && !ended) { ended = true; setTimeout(() => finish(cur), 2500); }
      }
      if (cur) { camStep(dt); draw(); hud(); }
      const quiet = (now - lastHeard) / 1000; $('.nt').textContent = quiet > 4 ? 'Waiting for opponent…' : 'Connected'; $('.net i').style.background = quiet > 4 ? '#f2b63d' : '#52d37f';
      raf = requestAnimationFrame(loop);
    }
    function lerpSnap(a, b, k) { const p = a.p.map((v, i) => v + (b.p[i] - v) * k); const bl = a.b.map((v, i) => v + (b.b[i] - v) * k); return Object.assign({}, b, { p, b: bl, c: a.c + (b.c - a.c) * k }); }
    function camStep(dt) { const s = cur; let tx = s.b[0], ty = s.b[1]; const k = Math.min(1, dt * 3.2); cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
      let hw, hh; if (dims.land) { hw = dims.h / 2 / dims.s; hh = dims.w / 2 / dims.s; } else { hw = dims.w / 2 / dims.s; hh = dims.h / 2 / dims.s; }
      cam.x = hw * 2 > W + 8 ? CX : clamp(cam.x, hw - 4, W - hw + 4); cam.y = hh * 2 > L + 12 ? L / 2 : clamp(cam.y, hh - 6, L - hh + 6); }
    function poly(pts, fill, stroke) { ctx.beginPath(); pts.forEach(([x, y], i) => { const [a, b] = S(x, y); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); } }
    function pl(pts) { ctx.beginPath(); pts.forEach(([x, y], i) => { const [a, b] = S(x, y); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }); ctx.stroke(); }
    const arc = (cx, cy, r, a0, a1, n) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; };
    const R = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    function draw() {
      const s = dims.s, sn = cur; ctx.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0); ctx.fillStyle = '#0d1f15'; ctx.fillRect(0, 0, dims.w, dims.h);
      poly(R(-4, -4, W + 4, L + 4), '#17582f'); for (let i = 0; i < 20; i++) poly(R(0, i * 5.25, W, (i + 1) * 5.25), i % 2 ? '#1d6a3a' : '#1a6135');
      ctx.lineWidth = Math.max(1.2, s * .12); ctx.strokeStyle = '#ffffffd0'; poly(R(0, 0, W, L), null, '#ffffffd0'); pl([[0, L / 2], [W, L / 2]]); pl(arc(CX, L / 2, 9.15, 0, Math.PI * 2, 48));
      for (const e of [0, 1]) { const y0 = e ? L : 0, sg = e ? -1 : 1; poly(R(CX - 20.16, y0, CX + 20.16, y0 + sg * 16.5), null, '#ffffffd0'); poly(R(CX - 9.16, y0, CX + 9.16, y0 + sg * 5.5), null, '#ffffffd0'); const a = Math.acos(5.5 / 9.15); pl(e ? arc(CX, y0 - 11, 9.15, -Math.PI / 2 - a, -Math.PI / 2 + a, 16) : arc(CX, 11, 9.15, Math.PI / 2 - a, Math.PI / 2 + a, 16)); poly(R(CX - GH, y0, CX + GH, y0 - sg * 2.2), '#ffffff22', '#ffffff'); }
      const r = Math.max(8.5, s * .78), P = sn.p, A = sn.a;
      const order = [...Array(22).keys()].sort((i, j) => { const [, ay] = S(P[i * 4], P[i * 4 + 1]), [, by] = S(P[j * 4], P[j * 4 + 1]); return ay - by; });
      if (sn.r >= 0) { const [x, y] = S(P[sn.r * 4], P[sn.r * 4 + 1]); ctx.strokeStyle = '#ffffff55'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(x, y, Math.max(9, s * 1.2), 0, 7); ctx.stroke(); ctx.setLineDash([]); }
      for (const i of order) {
        const t = i < 11 ? 0 : 1, [x, y] = S(P[i * 4], P[i * 4 + 1]), k = kits[t];
        ctx.fillStyle = '#0006'; ctx.beginPath(); ctx.ellipse(x + r * .25, y + r * .35, r * .95, r * .6, 0, 0, 7); ctx.fill();
        const act = A[t] === i;
        if (act) { ctx.strokeStyle = t === role ? '#ffe14d' : '#ffffff99'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r + 5, 0, 7); ctx.stroke(); }
        ctx.fillStyle = k.b; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.fillStyle = gks[i] ? (t ? '#6d3cc2' : '#1f8f5a') : k.a; ctx.beginPath(); ctx.arc(x, y, r * .74, 0, 7); ctx.fill();
        const [nx, ny] = S(P[i * 4] + P[i * 4 + 2] * .6, P[i * 4 + 1] + P[i * 4 + 3] * .6); ctx.fillStyle = '#0008'; ctx.beginPath(); ctx.arc(nx, ny, r * .22, 0, 7); ctx.fill();
        if (act || sn.o === i) { ctx.font = `700 ${Math.max(12, Math.min(16, s * .9))}px 'Saira Extra Condensed',Arial Narrow,sans-serif`; ctx.textAlign = 'center'; const tx = names[i].toUpperCase(), tw = ctx.measureText(tx).width; ctx.fillStyle = '#000a'; ctx.fillRect(x - tw / 2 - 4, y - r - 22, tw + 8, 16); ctx.fillStyle = t === role ? '#fff' : '#ffe9a8'; ctx.fillText(tx, x, y - r - 9); }
        if (act && sn.w[t] > 0) { const w = 60, h = 8, X = x - w / 2, Y = y + r + 10, pw = Math.min(1, sn.w[t]); ctx.fillStyle = '#000b'; ctx.fillRect(X - 2, Y - 2, w + 4, h + 4); ctx.fillStyle = '#ffffff22'; ctx.fillRect(X + w * .45, Y, w * .43, h); ctx.fillStyle = pw > .9 ? '#ef5a55' : pw > .45 ? '#52d37f' : '#f2b63d'; ctx.fillRect(X, Y, w * pw, h); }
      }
      const [bx, by] = S(sn.b[0], sn.b[1]), bz = sn.b[2], br = Math.max(4, s * .3) * (1 + bz * .12);
      ctx.fillStyle = '#0007'; ctx.beginPath(); ctx.ellipse(bx + bz * s * .35, by + bz * s * .35, br, br * .7, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx, by - bz * s * .5, br, 0, 7); ctx.fill(); ctx.strokeStyle = '#222'; ctx.lineWidth = 1; ctx.stroke();
      // radar
      rctx.clearRect(0, 0, rc.width, rc.height); const RW = rc.width, RH = rc.height; rctx.strokeStyle = '#ffffff55'; rctx.strokeRect(2.5, 2.5, RW - 5, RH - 5);
      const Rd = (x, y) => { const X = vx(x), Y = vy(y); return dims.land ? [3 + Y / L * (RW - 6), 3 + X / W * (RH - 6)] : [3 + X / W * (RW - 6), 3 + (1 - Y / L) * (RH - 6)]; };
      for (let i = 0; i < 22; i++) { const [x, y] = Rd(P[i * 4], P[i * 4 + 1]); rctx.fillStyle = A[i < 11 ? 0 : 1] === i && (i < 11 ? 0 : 1) === role ? '#ffe14d' : kits[i < 11 ? 0 : 1].a; rctx.beginPath(); rctx.arc(x, y, 2.3, 0, 7); rctx.fill(); }
      const [rbx, rby] = Rd(sn.b[0], sn.b[1]); rctx.fillStyle = '#fff'; rctx.fillRect(rbx - 1.5, rby - 1.5, 3, 3);
    }
    let hc = ''; let lastMode = '';
    function hud() {
      const sn = cur, h = sn.s[0] + '|' + sn.s[1] + '|' + Math.floor(sn.c); if (h !== hc) { hc = h; $('.sc').textContent = sn.s[0] + ' – ' + sn.s[1]; $('.ck').textContent = Math.floor(sn.c) + "'"; }
      if (sn.bi !== lastBanner) { lastBanner = sn.bi; const b = $('.ban'); if (sn.bn) { b.textContent = sn.bn; b.classList.add('on'); clearTimeout(hud.t); hud.t = setTimeout(() => b.classList.remove('on'), 1500); if (/GOAL/.test(sn.bn)) try { navigator.vibrate && navigator.vibrate([60, 40, 60]); } catch (e) { } } }
      const mode = myBall() ? 'att' : 'def'; if (mode !== lastMode) { lastMode = mode; $('.pb.s').textContent = mode === 'att' ? 'Shoot' : 'Tackle'; $('.pb.p').textContent = mode === 'att' ? 'Pass' : 'Switch'; $('.pb.t').textContent = mode === 'att' ? 'Through' : 'Press'; }
    }
    function showEnd(msg, extra) { const ov = $('.ov'); ov.hidden = false; $('.card').innerHTML = msg + (extra || '') + `<button class="lvx">Back to the room</button>`; $('.lvx').onclick = () => close(); }
    function finish(sn) {
      const ev = sn.ev || []; const res = sn.s[0] === sn.s[1] ? 'Draw' : (sn.s[role] > sn.s[1 - role] ? 'You win' : 'You lose');
      const rows = ev.map(e => `<li>${esc(teams[e.t].name)}: ${esc(e.name)} ${e.min}'</li>`).join('');
      showEnd(`<div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#d8b462">Full time</div><h2>${res}</h2><div class="big">${sn.s[0]} – ${sn.s[1]}</div>${rows ? `<ul>${rows}</ul>` : ''}`);
      o.onResult && o.onResult({ score: sn.s.slice(), events: ev });
    }
    function confirmLeave() { const ov = $('.ov'); ov.hidden = false; $('.card').innerHTML = `<h2>Leave the match?</h2><p style="margin:0;color:#cfdcd2">Your opponent will be told you left.</p><button class="lvy">Leave</button><button class="g lvn">Keep playing</button>`; $('.lvy').onclick = () => { net.send('lv-leave', { r: role }); close(); }; $('.lvn').onclick = () => { ov.hidden = true; }; }
    function close() { alive = false; cancelAnimationFrame(raf); offs.forEach(f => f && f()); window.removeEventListener('resize', resize); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); try { wl && wl.release(); } catch (e) { } root.remove(); document.body.style.overflow = ''; o.onExit && o.onExit(); }
    raf = requestAnimationFrame(loop);
    return { close };
  }
  return { start, Engine };
})();
