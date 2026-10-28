/* Legends XI — deterministic 22-player match simulation.
   simulateMatch(teamA, teamB, seed, durSeconds) -> recorded match (frames + events + stats).
   team = {name, form, xi:[player ids], kit:{shirt, shorts, gk}}
   Depends on data.js globals: PL, FORMS, fit. No DOM. */
const SIM = (function () {
  'use strict';
  const W = 68, L = 105, GH = 3.66, CX = 34, DT = 1 / 60, FR = 10, STEP_PER_FRAME = 6;
  let seed = 1;
  function rng() { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, hyp = Math.hypot;
  const gauss = () => { const u = 1 - rng(), v = rng(); return clamp(Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v), -3, 3); };
  let M = null;

  /* ---------- setup ---------- */
  function makeSide(t, team) {
    const sl = FORMS[team.form];
    return sl.map((s, i) => {
      const p = PL[team.xi[i]], f = fit(p, s[0]), m = f === 'nat' ? 1 : f === 'line' ? .95 : .86, gk = s[0] === 'GK';
      return {
        team: t, i, idx: t * 11 + i, slot: s[0], sx: s[1], sy: s[2], d: p, gk,
        pac: p.s[0] * m, sho: gk ? 40 : p.s[1] * m, pas: gk ? p.s[3] : p.s[2] * m, def: gk ? 60 : p.s[3] * m, ovr: p.ovr * m,
        x: 0, y: 0, vx: 0, vy: 0, fcx: 0, fcy: 1, cd: 0, stun: 0, think: 0, hold: 0, run: null, runCD: rng() * 4,
        st: { pass: 0, passOk: 0, shots: 0, sot: 0, goals: 0, ast: 0, kp: 0, tkl: 0, int: 0, saves: 0, fouls: 0, yc: 0, touches: 0, drb: 0, conceded: 0 }
      };
    });
  }
  const dir = t => ((t === 0) !== M.swap) ? 1 : -1;            // +1 = attacking toward y = L
  const oppGoalY = t => dir(t) > 0 ? L : 0;
  const ownGoalY = t => dir(t) > 0 ? 0 : L;
  const slotX = p => dir(p.team) > 0 ? p.sx * W : (1 - p.sx) * W;
  const pk = p => p ? p.idx : -1;
  const minute = () => Math.min(90, M.t / M.dur * 90);
  function ev(type, data) { M.events.push(Object.assign({ t: M.t, min: minute(), type }, data || {})); }
  function nearest(list, x, y, excl) { let best = null, bd = 1e9; for (const p of list) { if (p === excl) continue; const d = hyp(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } } return [best, bd]; }
  const outfield = t => M.teams[t].filter(p => !p.gk);
  const inAttBox = (p, t) => Math.abs(p.x - CX) < 20.16 && Math.abs(p.y - oppGoalY(t)) < 16.5;
  const jog = p => 4.6 + p.pac * .03;

  function accelTo(p, vx, vy, dt) {
    const a = Math.min(1, dt * 7); p.vx += (vx - p.vx) * a; p.vy += (vy - p.vy) * a;
    const s = hyp(p.vx, p.vy); if (s > .6) { const k = Math.min(1, dt * 10); p.fcx += (p.vx / s - p.fcx) * k; p.fcy += (p.vy / s - p.fcy) * k; const n = hyp(p.fcx, p.fcy) || 1; p.fcx /= n; p.fcy /= n; }
  }
  function moveTo(p, tx, ty, spd, dt, arrive) { arrive = arrive || 1.8; const dx = tx - p.x, dy = ty - p.y, d = hyp(dx, dy); const s = d < arrive ? spd * d / arrive : spd; accelTo(p, d > .05 ? dx / d * s : 0, d > .05 ? dy / d * s : 0, dt); }
  function face(p, x, y) { const dx = x - p.x, dy = y - p.y, d = hyp(dx, dy) || 1; p.fcx = dx / d; p.fcy = dy / d; }

  function formTarget(p) {
    const b = M.ball, t = p.team, d = dir(t), poss = M.possTeam;
    if (p.gk) {
      const own = ownGoalY(t); const prog = Math.abs(b.y - own);
      const depth = clamp(1.5 + Math.max(0, prog - 25) * .06, 1.2, 7);
      return [CX + (b.x - CX) * .18, own + d * depth];
    }
    let depth = 3 + p.sy * 62; if (poss === t) depth += 9; else depth -= 5;
    const by = d > 0 ? b.y : L - b.y; depth += (by - 52.5) * .5;
    depth = clamp(depth, p.sy > .6 ? 28 : p.sy > .3 ? 14 : 6, p.sy < .3 ? 62 : 97);
    let x = slotX(p); x = CX + (x - CX) * (poss === t ? 1.08 : .86); x += (b.x - CX) * .3; x = clamp(x, 2, W - 2);
    return [x, d > 0 ? depth : L - depth];
  }

  /* ---------- ball contacts ---------- */
  function kick(p, vx, vy, vz, kind) {
    const b = M.ball;
    Object.assign(b, { owner: null, vx, vy, vz: vz || 0, z: vz ? .05 : 0, last: p, np: p, npT: .28, shot: false, recv: null, gkRolled: false, shotInfo: null, kind });
    b.rolled = new Set();
    b.passer = (kind === 'pass' || kind === 'through' || kind === 'cross' || kind === 'long') ? p : null;
    if (b.passer) { p.st.pass++; M.stats[p.team].passes++; }
  }
  function gain(p, how) {
    const b = M.ball, prevTeam = M.possTeam;
    if (b.passer && b.passer !== p) {
      if (b.passer.team === p.team) { b.passer.st.passOk++; M.stats[p.team].passOk++; M.assist = { p: b.passer, to: p, t: M.t }; }
      else if (!p.gk) { p.st.int++; M.stats[p.team].int++; ev('intercept', { p: pk(p), from: pk(b.passer) }); how = 'intercept'; }
    }
    if (b.shotInfo && b.shotInfo.p.team !== p.team && !p.gk) { ev('block', { p: pk(p), shooter: pk(b.shotInfo.p) }); how = 'block'; }
    const cross = b.kind === 'cross' || b.kind === 'long';
    if (cross && b.z > .45 && inAttBox(p, p.team) && p.team === (b.last && b.last.team) && !p.gk) M.firstTime = { p, header: b.z > 1.0 };
    Object.assign(b, { owner: p, last: p, passer: null, recv: null, shot: false, gkRolled: false, shotInfo: null, kind: null, z: 0, vz: 0 });
    p.think = .25 + rng() * .3; p.hold = p.gk ? 1.1 + rng() * .8 : 0; p.st.touches++;
    for (const q of M.all) q.run = null;
    if (prevTeam !== p.team) { M.possTeam = p.team; if (how === 'tackle' || how === 'intercept' || how === 'block') { M.transition = { team: p.team, t: M.t }; ev('turnover', { team: p.team, how, p: pk(p) }); } }
  }

  function lanePenalty(p, tx, ty) {
    let pen = 0; const vx = tx - p.x, vy = ty - p.y, d2 = vx * vx + vy * vy || 1;
    for (const o of M.teams[1 - p.team]) { const t = clamp(((o.x - p.x) * vx + (o.y - p.y) * vy) / d2, 0, 1); const od = hyp(o.x - (p.x + vx * t), o.y - (p.y + vy * t)); if (od < 3 && t > .08) pen += (3 - od) * .7; }
    return pen;
  }
  function openness(m) { let md = 99; for (const o of M.teams[1 - m.team]) md = Math.min(md, hyp(o.x - m.x, o.y - m.y)); return md; }
  function pickPass(p, fwdBias, allowGK) {
    const d = dir(p.team); let best = null, bs = -1e9;
    for (const m of M.teams[p.team]) {
      if (m === p) continue; if (m.gk && !allowGK) continue;
      const dist = hyp(m.x - p.x, m.y - p.y); if (dist < 4 || dist > 42) continue;
      const gain_ = (m.y - p.y) * d;
      let sc = gain_ * fwdBias * .07 + Math.min(openness(m), 8) * .13 - dist * .012 - lanePenalty(p, m.x, m.y) + rng() * .35;
      if (gain_ < -14) sc -= .5;
      if (sc > bs) { bs = sc; best = m; }
    }
    return best;
  }
  function pass(p, fwdBias, through, allowGK) {
    const m = pickPass(p, fwdBias, allowGK); if (!m) return false;
    const b = M.ball, d = dir(p.team);
    let tx = m.x + m.vx * .45, ty = m.y + m.vy * .45;
    if (through && !m.gk) { ty += d * (6 + rng() * 4); tx += (CX - tx) * .12; ty = clamp(ty, 1.5, L - 1.5); tx = clamp(tx, 1.5, W - 1.5); m.run = { x: tx, y: ty }; }
    const err = (1 - p.pas / 100) * .17 * gauss(); const ax = tx - b.x, ay = ty - b.y, dd = hyp(ax, ay) || 1, ang = Math.atan2(ay, ax) + err;
    const v0 = Math.min(28, dd * .7 + (through ? 6 : 8.5));
    face(p, tx, ty); kick(p, Math.cos(ang) * v0, Math.sin(ang) * v0, 0, through ? 'through' : 'pass'); b.recv = m;
    return true;
  }
  function lob(p, tx, ty, recv, kind, vz) {
    const b = M.ball; vz = vz || 6.5; const T = 2 * vz / 9.8; const D = hyp(tx - b.x, ty - b.y) || 1;
    const err = (1 - p.pas / 100) * .12 * gauss(); const ang = Math.atan2(ty - b.y, tx - b.x) + err;
    const vh = Math.min(31, D / T * 1.06);
    face(p, tx, ty); kick(p, Math.cos(ang) * vh, Math.sin(ang) * vh, vz, kind); b.recv = recv; if (recv) recv.run = { x: tx, y: ty };
  }
  function cross(p) {
    const t = p.team, gy = oppGoalY(t), d = dir(t);
    const targets = M.teams[t].filter(m => m !== p && !m.gk && Math.abs(m.y - gy) < 26 && Math.abs(m.x - CX) < 22);
    if (!targets.length) return false;
    targets.sort((a, c) => (a.sy > c.sy ? -1 : 1) || hyp(a.x - CX, a.y - gy) - hyp(c.x - CX, c.y - gy));
    const m = targets[0]; const tx = clamp(CX + (m.x - CX) * .5 + gauss() * 3, CX - 9, CX + 9), ty = gy - d * (6 + rng() * 6);
    lob(p, tx, ty, m, 'cross', 6 + rng() * 1.2); ev('cross', { p: pk(p), to: pk(m) }); return true;
  }
  function xgOf(x, y, t, kind) {
    const gy = oppGoalY(t), dd = hyp(x - CX, y - gy), lat = Math.abs(x - CX);
    const base = Math.exp(-dd / 8.5) * 1.05, af = clamp(1 - lat / (dd + 4) * .9, .2, 1);
    let xg = base * af; if (kind === 'header') xg *= .55; if (kind === 'fk') xg *= .55; if (kind === 'pen') xg = .76;
    return clamp(xg, .01, .82);
  }
  function shoot(p, power, lat, kind) {
    kind = kind || 'shot';
    const b = M.ball, d = dir(p.team), gy = oppGoalY(p.team) + d * .5;
    let tx = CX + clamp(lat, -1, 1) * 2.9;
    const accm = kind === 'header' ? 1.35 : kind === 'pen' ? .45 : kind === 'volley' ? 1.2 : 1;
    const sd0 = 1 + hyp(p.x - CX, p.y - gy) * .085 + (1 - p.sho / 100) * 8; tx += sd0 * (.65 + Math.abs(power - .7) * 1.5) * gauss() * accm;
    const dx = tx - b.x, dy = gy - b.y, dist = hyp(dx, dy) || 1;
    const sp = kind === 'header' ? 13 + p.sho * .07 : 17 + power * 13 + p.sho * .05;
    let vz = kind === 'header' ? .4 + rng() * 1.6 : Math.max(0, 1 + Math.max(0, power - .6) * 14 + rng() * 1.2 + dist * .03 - (dist < 10 ? 1.5 : 0));
    if (kind === 'pen') vz = rng() * 2.4; if (kind === 'fk') vz = 2.6 + rng() * 2.2;
    const xg = kind === 'pen' ? .76 : clamp(xgOf(p.x, p.y, p.team, kind) * 1.7, .01, .85);
    face(p, tx, gy); kick(p, dx / dist * sp, dy / dist * sp, vz, 'shot');
    b.shot = true; b.shotTeam = p.team; b.shotQ = clamp(Math.abs(tx - CX) / GH, 0, 1.3);
    const counter = !!(M.transition && M.transition.team === p.team && M.t - M.transition.t < 12);
    b.shotInfo = { p, xg, kind, counter };
    p.st.shots++; M.stats[p.team].shots++; M.stats[p.team].xg += xg;
    if (M.assist && M.assist.to === p && M.t - M.assist.t < 5) M.assist.p.st.kp++;
    ev('shot', { p: pk(p), xg, kind, counter, dist: Math.round(hyp(p.x - CX, p.y - oppGoalY(p.team))) });
  }

  /* ---------- restarts ---------- */
  function placeBall(x, y) { Object.assign(M.ball, { x, y, z: 0, vx: 0, vy: 0, vz: 0 }); }
  function restartAt(t, x, y, type, taker) {
    const [n] = nearest(outfield(t), x, y); const p = taker || n;
    p.x = x; p.y = y; p.vx = p.vy = 0; placeBall(x, y); face(p, CX, L / 2); gain(p, 'restart');
    M.pause = type === 'throw' ? .9 : 1.4; M.cut = true; ev(type, { team: t, p: pk(p) });
  }
  function restartGK(t) { const gk = M.teams[t].find(q => q.gk); gk.x = CX; gk.y = ownGoalY(t) + dir(t) * 5; placeBall(gk.x, gk.y); gain(gk, 'restart'); gk.hold = .6; M.pause = 1.2; M.cut = true; ev('goalkick', { team: t }); }
  function corner(t, x) {
    const gy = oppGoalY(t); const cx = x < CX ? .6 : W - .6, cy = gy - dir(t) * .6;
    const taker = outfield(t).reduce((a, c) => c.pas > a.pas ? c : a);
    // pile attackers into the box
    for (const p of outfield(t)) if (p !== taker && p.sy > .3) { p.x = CX + gauss() * 8; p.y = gy - dir(t) * (6 + rng() * 9); }
    for (const p of outfield(1 - t)) if (p.sy < .55) { p.x = CX + gauss() * 9; p.y = gy - dir(t) * (4 + rng() * 9); }
    restartAt(t, cx, cy, 'corner', taker); M.pending = { type: 'corner', p: taker }; M.stats[t].corners++;
  }
  function freeKick(t, x, y) {
    const gy = oppGoalY(t), dist = hyp(x - CX, y - gy);
    if (dist < 30 && Math.abs(x - CX) < 18 && rng() < .55) {
      const taker = outfield(t).reduce((a, c) => c.sho + c.pas > a.sho + a.pas ? c : a);
      restartAt(t, x, y, 'freekick', taker); face(taker, CX, gy); M.pending = { type: 'fk', p: taker }; M.pause = 2;
      M.events[M.events.length - 1].direct = true;
    } else restartAt(t, x, y, 'freekick');
  }
  function penalty(t) {
    const gy = oppGoalY(t), sy = gy - dir(t) * 11;
    const taker = outfield(t).reduce((a, c) => c.sho > a.sho ? c : a);
    for (const p of M.all) { if (p.gk || p === taker) continue; if (Math.abs(p.y - gy) < 18 && Math.abs(p.x - CX) < 22) { p.y = gy - dir(t) * (18 + rng() * 4); } }
    const gk = M.teams[1 - t].find(q => q.gk); gk.x = CX; gk.y = gy - dir(t) * .4;
    restartAt(t, CX, sy, 'penalty', taker); face(taker, CX, gy); M.pending = { type: 'pen', p: taker }; M.pause = 2.4;
  }
  function kickoff(team) {
    for (const p of M.all) {
      let depth = p.gk ? 1.5 : Math.min(3 + p.sy * 60, 47);
      p.x = slotX(p); p.y = dir(p.team) > 0 ? depth : L - depth; p.vx = p.vy = 0; p.run = null; p.stun = 0; p.cd = 0; p.fcx = 0; p.fcy = dir(p.team);
    }
    const st = M.teams[team].reduce((a, p) => p.sy > a.sy ? p : a);
    st.x = CX; st.y = L / 2 - dir(team) * .6;
    placeBall(CX, L / 2); M.possTeam = team; gain(st, 'kickoff'); M.pause = 1.2; M.cut = true; M.transition = null;
  }

  /* ---------- AI ---------- */
  function tackle(def, own) {
    def.cd = 1.35;
    const pr = clamp(.22 + (def.def - (own.pac + own.pas) / 2) / 260, .06, .6);
    if (rng() < pr) { def.st.tkl++; M.stats[def.team].tkl++; gain(def, 'tackle'); ev('tackle', { p: pk(def), v: pk(own) }); return; }
    if (rng() < .13) { foul(def, own); return; }
    def.stun = .35; if (rng() < .35) { own.st.drb++; ev('beat', { p: pk(own), v: pk(def) }); }
  }
  function foul(def, own) {
    def.st.fouls++; M.stats[def.team].fouls++;
    let card = null; if (rng() < .22) { if (def.st.yc) card = 'lucky'; else { def.st.yc = 1; card = 'yellow'; M.stats[def.team].yc++; } }
    const pen = inAttBox(own, own.team);
    ev('foul', { p: pk(def), v: pk(own), card, pen });
    if (pen) penalty(own.team); else freeKick(own.team, clamp(own.x, 1, W - 1), clamp(own.y, 1, L - 1));
  }
  function ownerAI(p, dt) {
    const t = p.team, d = dir(t), gy = oppGoalY(t);
    if (M.firstTime && M.firstTime.p === p) { const h = M.firstTime.header; M.firstTime = null; shoot(p, .7, gauss() * .8, h ? 'header' : 'volley'); return; }
    if (p.gk) { p.hold -= dt; accelTo(p, 0, 0, dt); if (p.hold <= 0) { if (rng() < .3) { const fw = outfield(t).reduce((a, c) => c.sy > a.sy ? c : a); lob(p, fw.x, fw.y + d * 3, fw, 'long', 9); ev('longball', { p: pk(p), to: pk(fw) }); } else if (!pass(p, .1, false)) lob(p, CX, L / 2, null, 'long', 9); } return; }
    const [no, nd] = nearest(M.teams[1 - t], p.x, p.y);
    const dist = hyp(p.x - CX, p.y - gy), angOk = Math.abs(p.x - CX) < 6 + dist * .7;
    p.think -= dt;
    if (p.think <= 0) {
      p.think = .32 + rng() * .45 - (p.pas - 75) / 450;
      const xg = xgOf(p.x, p.y, t, 'shot');
      if (dist < 32 && angOk && rng() < clamp(xg * 5 + .1 + (dist < 13 ? .3 : 0), .08, .92) * (p.sho / 86)) { shoot(p, .55 + rng() * .33, gauss() * .9); return; }
      const wide = p.x < 16 || p.x > W - 16, final3 = Math.abs(p.y - gy) < 34;
      if (wide && final3 && rng() < .42 && cross(p)) return;
      if (nd < 3.2 && rng() < .62) { pass(p, final3 ? .6 : .25, rng() < .2); return; }
      if (rng() < (nd > 8 ? .1 : .24)) { pass(p, final3 ? 1 : .65, rng() < (final3 ? .5 : .3)); return; }
    }
    let tx = CX + (p.x - CX) * .72, ty = p.y + d * 10;
    if (no && nd < 6) { const side = p.x < no.x ? -1 : 1; tx = p.x + side * 4; }
    if (dist < 22) tx = CX + (p.x - CX) * .45;
    moveTo(p, clamp(tx, 3, W - 3), ty, jog(p) * (nd > 6 ? 1.12 : .9), dt, .5);
  }
  function gkAI(p, dt) {
    const b = M.ball, t = p.team, own = ownGoalY(t), d = dir(t);
    if (b.shot && b.shotTeam !== t && !b.owner && (own - b.y) / (b.vy || 1e-6) > 0) {
      const tt = (own - b.y) / b.vy; const cx = clamp(b.x + b.vx * tt, CX - GH - .4, CX + GH + .4);
      moveTo(p, cx, own + d * 1.1, 9.5, dt, .3); return;
    }
    const inBox = Math.abs(b.x - CX) < 20 && Math.abs(b.y - own) < 16;
    if (!b.owner && inBox && hyp(b.vx, b.vy) < 10) { const [, nd] = nearest(M.teams[1 - t], b.x, b.y); if (hyp(b.x - p.x, b.y - p.y) < nd + 2) { moveTo(p, b.x, b.y, 7.5, dt, .3); return; } }
    const [tx, ty] = formTarget(p); moveTo(p, tx, ty, 6, dt, 1);
  }
  function receiverMove(p, dt) {
    const b = M.ball;
    if (p.run && hyp(p.run.x - p.x, p.run.y - p.y) > 1) { moveTo(p, p.run.x, p.run.y, jog(p) * 1.25, dt, .6); return; }
    const sp = hyp(b.vx, b.vy), stop = sp / .6, ex = b.x + (sp ? b.vx / sp * stop : 0), ey = b.y + (sp ? b.vy / sp * stop : 0);
    const vx = ex - b.x, vy = ey - b.y, l2 = vx * vx + vy * vy || 1, tt = clamp(((p.x - b.x) * vx + (p.y - b.y) * vy) / l2, .15, 1);
    moveTo(p, b.x + vx * tt, b.y + vy * tt, jog(p) * 1.15, dt, .4);
  }

  /* ---------- step ---------- */
  function step(dt) {
    const b = M.ball;
    M.t += dt;
    if (M.pause > 0) {
      M.pause -= dt;
      if (M.celebrate) { const c = M.celebrate; moveTo(c.p, c.x, c.y, 7, dt); for (const q of M.teams[c.p.team]) if (q !== c.p && !q.gk) moveTo(q, c.p.x + (q.i % 3 - 1) * 1.4, c.p.y + (q.i % 2 ? 1.2 : -1.2), 6.5, dt, 1); for (const q of M.teams[1 - c.p.team]) accelTo(q, 0, 0, dt); integrate(dt); }
      else for (const p of M.all) accelTo(p, 0, 0, dt);
      if (M.pause <= 0) {
        if (M.after) { const a = M.after; M.after = null; M.celebrate = null; a(); return; }
        const pd = M.pending; M.pending = null;
        if (pd) { if (pd.type === 'pen') shoot(pd.p, .72, (rng() < .5 ? -1 : 1) * (.45 + rng() * .5), 'pen'); else if (pd.type === 'fk') shoot(pd.p, .75, gauss() * 1.1, 'fk'); else if (pd.type === 'corner') { if (!cross(pd.p)) pass(pd.p, .1, false); } }
      }
      if (b.owner) ballFollow();
      return;
    }
    if (!M.swap && M.t >= M.dur / 2) { M.swap = true; ev('ht', { score: M.score.slice() }); kickoff(1); M.pause = 2; return; }
    if (b.owner) M.poss[b.owner.team] += dt; else if (M.possTeam >= 0) M.poss[M.possTeam] += dt * .5;
    b.npT -= dt;
    for (const p of M.all) { p.cd -= dt; p.stun -= dt; p.runCD -= dt; }
    const own = b.owner, ot = own ? own.team : -1;
    // final-third entry lanes
    if (own && !own.gk) { const f3 = Math.abs(own.y - oppGoalY(ot)) < 35; if (f3 && !M.inF3[ot]) { M.inF3[ot] = true; let lane = own.x < W / 3 ? 0 : own.x > 2 * W / 3 ? 2 : 1; if (dir(ot) < 0) lane = 2 - lane; M.stats[ot].lanes[lane]++; } if (!f3) M.inF3[ot] = false; }
    const tgtX = b.x + b.vx * .3, tgtY = b.y + b.vy * .3;
    const chaser = [], cover = [];
    for (const t of [0, 1]) {
      if (ot === t) { chaser[t] = cover[t] = null; continue; }
      const of = outfield(t); const [c1] = nearest(of, own ? own.x : tgtX, own ? own.y : tgtY); chaser[t] = c1;
      cover[t] = ot >= 0 ? nearest(of, own.x, own.y, c1)[0] : null;
    }
    for (const p of M.all) {
      if (p.stun > 0) { accelTo(p, 0, 0, dt); continue; }
      if (p.gk && own !== p) { gkAI(p, dt); continue; }
      if (own === p) { ownerAI(p, dt); continue; }
      if (b.recv === p) { receiverMove(p, dt); continue; }
      if (p.run) { moveTo(p, p.run.x, p.run.y, jog(p) * 1.22, dt); if (hyp(p.run.x - p.x, p.run.y - p.y) < 1) p.run = null; continue; }
      const t = p.team;
      if (p === chaser[t]) {
        const tx = own ? own.x + own.vx * .25 : tgtX, ty = own ? own.y + own.vy * .25 : tgtY;
        moveTo(p, tx, ty, jog(p) * 1.16, dt, .4);
        if (own && p.cd <= 0 && hyp(own.x - p.x, own.y - p.y) < 1.2) tackle(p, own);
        continue;
      }
      if (p === cover[t] && own) { const og = ownGoalY(t); moveTo(p, own.x + (CX - own.x) * .25, own.y + (og - own.y) * Math.min(.3, 6 / (Math.abs(og - own.y) + 1)), jog(p), dt); continue; }
      let [tx, ty] = formTarget(p);
      if (ot === t && p.sy > .45 && p.runCD <= 0 && rng() < .03) {
        p.runCD = 5 + rng() * 5; const d = dir(t);
        const rx = clamp(p.x + gauss() * 6, 4, W - 4), ry = clamp(p.y + d * (8 + rng() * 8), 2, L - 2); p.run = { x: rx, y: ry };
      }
      moveTo(p, tx, ty, jog(p) * (hyp(tx - p.x, ty - p.y) > 8 ? 1.12 : .82), dt, 2.5);
    }
    integrate(dt);
    if (M.after) return; // a goal or restart scheduled inside integrate/ball
    ballUpdate(dt);
  }
  function integrate(dt) {
    const b = M.ball;
    for (const p of M.all) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.gk) { const og = ownGoalY(p.team); p.x = clamp(p.x, CX - 20, CX + 20); p.y = og === 0 ? clamp(p.y, .3, 16.5) : clamp(p.y, L - 16.5, L - .3); }
      p.x = clamp(p.x, .3, W - .3); p.y = clamp(p.y, .3, L - .3);
    }
    const A = M.all;
    for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) {
      const a = A[i], c = A[j], dx = c.x - a.x, dy = c.y - a.y, d = hyp(dx, dy);
      if (d < 1.05 && d > .001) { const push = (1.05 - d) / 2, nx = dx / d, ny = dy / d; if (b.owner !== a) { a.x -= nx * push; a.y -= ny * push; } if (b.owner !== c) { c.x += nx * push; c.y += ny * push; } }
    }
  }
  function ballFollow() { const b = M.ball, p = b.owner; b.x = clamp(p.x + p.fcx * .72, .1, W - .1); b.y = clamp(p.y + p.fcy * .72, .1, L - .1); b.z = 0; b.vx = p.vx; b.vy = p.vy; }
  function ballUpdate(dt) {
    const b = M.ball;
    if (b.owner) { ballFollow(); return; }
    const py = b.y;
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.z > 0 || b.vz > 0) { b.z += b.vz * dt; b.vz -= 9.8 * dt; if (b.z <= 0) { b.z = 0; b.vz = -b.vz * .42; if (b.vz < 1.2) b.vz = 0; } }
    const c = b.z > .15 ? .12 : (b.shot ? .32 : .6), k = Math.exp(-c * dt); b.vx *= k; b.vy *= k;
    const sp = hyp(b.vx, b.vy); if (sp < .15) b.vx = b.vy = 0;
    if (b.shot && sp < 7) { b.shot = false; }
    // keeper
    if (b.shot && !b.gkRolled) {
      const gk = M.teams[1 - b.shotTeam].find(q => q.gk), d = hyp(gk.x - b.x, gk.y - b.y), reach = 1.75 + (gk.ovr - 80) * .045;
      if (d < reach && b.z < 2.7) {
        b.gkRolled = true; const si = b.shotInfo;
        let pr = .7 + (gk.ovr - 86) * .025 - (sp - 22) * .018 - b.shotQ * .3 + (d < .9 ? .15 : 0) + (si && si.kind === 'header' ? .08 : 0);
        if (si && si.kind === 'pen') pr = .24 + (gk.ovr - 86) * .02;
        pr = clamp(pr, .06, .94);
        if (rng() < pr) {
          gk.st.saves++; M.stats[gk.team].saves++;
          if (si) { si.p.st.sot++; M.stats[si.p.team].sot++; }
          const shooter = si ? pk(si.p) : -1, xg = si ? si.xg : 0; b.shotInfo = null;
          if (sp < 24 && rng() < .55) { ev('save', { p: pk(gk), shooter, xg, held: true }); gain(gk, 'save'); placeBall(gk.x, gk.y); ballFollow(); }
          else if (si && rng() < .45) { ev('save', { p: pk(gk), shooter, xg, held: false, corner: true }); corner(si.p.team, b.x); }
          else { ev('save', { p: pk(gk), shooter, xg, held: false }); const out = dir(gk.team); b.vy = Math.abs(b.vy) * .35 * out; b.vx = (rng() - .5) * 14; b.vz = rng() * 3; b.z = .2; b.shot = false; b.last = gk; b.rolled = new Set(); b.passer = null; }
          return;
        }
      }
    }
    // pickups
    if (b.z < 1.9) {
      let cand = null, cd = 9;
      for (const p of M.all) { if (p === b.np && b.npT > 0) continue; if (p.stun > 0) continue; const r = p.gk ? 1.35 : (b.recv === p ? 1.35 : 1.0), d = hyp(p.x - b.x, p.y - b.y); if (d < r && d < cd) { cd = d; cand = p; } }
      if (cand) {
        const p = cand, same = b.last && b.last.team === p.team;
        if (p.gk && b.shot && !b.gkRolled) { /* save logic decides */ }
        else if (same || b.recv === p || (sp < 9 && (!b.recv || cd < hyp(b.recv.x - b.x, b.recv.y - b.y) - .8))) { if (b.shot && b.shotInfo) { ev('miss', { p: pk(b.shotInfo.p), xg: b.shotInfo.xg, deflected: true }); b.shotInfo = null; } gain(p); }
        else if (!b.rolled.has(p)) { b.rolled.add(p); const ch = sp > 22 ? .14 : clamp(.4 + (p.def - 70) / 90, .2, .8); if (rng() < ch) gain(p); else { b.vx *= .9; b.vy *= .9; } }
      }
    }
    // goal line
    if (b.y > L || b.y < 0) {
      const atk = (b.y > L) === !M.swap ? 0 : 1;   // team attacking that end
      const lineY = b.y > L ? L : 0, ax = Math.abs(b.x - CX);
      if (ax < GH + .25 && ax > GH - .12 && b.z < 2.5 && b.shotInfo || ax < GH && b.z > 2.36 && b.z < 2.62 && b.shotInfo) {
        const si = b.shotInfo; b.shotInfo = null; ev('woodwork', { p: pk(si.p), xg: si.xg, bar: ax < GH - .12 });
        b.y = lineY + (lineY ? -.15 : .15); b.vy *= -.45; b.vx += (rng() - .5) * 6; b.shot = false; return;
      }
      if (ax < GH && b.z < 2.44) { goal(atk); return; }
      if (b.shotInfo) { const si = b.shotInfo; ev('miss', { p: pk(si.p), xg: si.xg, over: b.z >= 2.44, kind: si.kind }); b.shotInfo = null; }
      if (b.last && b.last.team === atk) restartGK(1 - atk); else corner(atk, b.x);
      return;
    }
    if (b.x < 0 || b.x > W) { const t = b.last ? 1 - b.last.team : 0; if (b.shotInfo) { ev('miss', { p: pk(b.shotInfo.p), xg: b.shotInfo.xg }); b.shotInfo = null; } restartAt(t, b.x < 0 ? .4 : W - .4, clamp(b.y, 1, L - 1), 'throw'); }
  }
  function goal(t) {
    const b = M.ball, si = b.shotInfo; M.score[t]++;
    let sc = b.last, og = !sc || sc.team !== t;
    if (si && si.p.team === t) { sc = si.p; og = false; }
    let ast = null;
    if (!og) { sc.st.goals++; if (si) { sc.st.sot++; M.stats[t].sot++; } if (M.assist && M.assist.to === sc && M.t - M.assist.t < 10 && M.assist.p !== sc) { ast = M.assist.p; ast.st.ast++; } }
    const gk = M.teams[1 - t].find(q => q.gk); gk.st.conceded++;
    ev('goal', { team: t, p: og ? pk(b.last) : pk(sc), ast: pk(ast), og, kind: si ? si.kind : 'shot', counter: si ? si.counter : false, xg: si ? si.xg : 0, score: M.score.slice() });
    b.shotInfo = null; b.vx *= .15; b.vy *= .15; b.owner = null;
    const scorer = og ? null : sc;
    if (scorer) { const cy = oppGoalY(t) - dir(t) * 2; M.celebrate = { p: scorer, x: scorer.x < CX ? 2 : W - 2, y: cy }; }
    M.pause = 3.4; M.after = () => kickoff(1 - t);
  }

  /* ---------- run + record ---------- */
  function simulateMatch(A, B, seedVal, dur) {
    seed = seedVal | 0 || 1;
    M = { t: 0, dur: dur || 480, swap: false, score: [0, 0], events: [], pause: 0, possTeam: -1, poss: [0, 0], inF3: [false, false], transition: null, pending: null, after: null, celebrate: null, cut: false, firstTime: null, assist: null };
    M.stats = [0, 1].map(() => ({ passes: 0, passOk: 0, shots: 0, sot: 0, xg: 0, corners: 0, fouls: 0, yc: 0, tkl: 0, int: 0, saves: 0, lanes: [0, 0, 0] }));
    M.teams = [makeSide(0, A), makeSide(1, B)]; M.all = M.teams[0].concat(M.teams[1]);
    M.ball = { x: CX, y: L / 2, z: 0, vx: 0, vy: 0, vz: 0, owner: null, last: null, np: null, npT: 0, rolled: new Set(), shot: false, shotTeam: -1, shotQ: 0, gkRolled: false, recv: null, passer: null, shotInfo: null, kind: null };
    kickoff(0); ev('ko', {});
    const nFrames = Math.ceil(M.dur * FR) + 2, STR = 22 * 3 + 4;
    const frames = new Float32Array(nFrames * STR), clock = new Float32Array(nFrames), score = new Uint8Array(nFrames * 2), cut = new Uint8Array(nFrames), poss = new Int8Array(nFrames);
    let f = 0, s = 0;
    const rec = () => {
      if (f >= nFrames) return; const o = f * STR;
      for (const p of M.all) { const k = o + p.idx * 3; frames[k] = p.x; frames[k + 1] = p.y; frames[k + 2] = Math.atan2(p.fcx, p.fcy); }
      const b = M.ball, k = o + 66; frames[k] = b.x; frames[k + 1] = b.y; frames[k + 2] = b.z; frames[k + 3] = b.owner ? b.owner.idx : -1;
      clock[f] = minute(); score[f * 2] = M.score[0]; score[f * 2 + 1] = M.score[1]; cut[f] = M.cut ? 1 : 0; poss[f] = M.possTeam; M.cut = false; f++;
    };
    rec();
    while (M.t < M.dur) {
      const evBefore = M.events.length;
      step(DT); s++;
      for (let i = evBefore; i < M.events.length; i++) M.events[i].f = f;
      if (s % STEP_PER_FRAME === 0) rec();
    }
    ev('ft', { score: M.score.slice() }); M.events[M.events.length - 1].f = f - 1;
    // ratings
    for (const p of M.all) {
      const st = p.st, conc = M.score[1 - p.team];
      let r = 6.2 + st.goals * .95 + st.ast * .55 + st.sot * .1 + st.kp * .1 + Math.min(st.passOk, 30) * .025 + Math.min(st.tkl + st.int, 8) * .15 + st.drb * .08 + st.saves * .28 - st.yc * .3 - (st.pass - st.passOk) * .04;
      if (p.gk) r -= conc * .35; else if (LINE[p.slot] === 'D') r -= conc * .15;
      if (M.score[p.team] > M.score[1 - p.team]) r += .3; if (conc === 0 && (p.gk || LINE[p.slot] === 'D')) r += .5;
      p.rating = Math.round(clamp(r, 3, 10) * 10) / 10;
    }
    const totalPoss = (M.poss[0] + M.poss[1]) || 1;
    const out = {
      seed: seedVal, dur: M.dur, fr: FR, stride: STR, nFrames: f, frames, clock, score, cut, poss,
      final: M.score.slice(), events: M.events,
      stats: M.stats.map((s, i) => Object.assign({}, s, { poss: Math.round(M.poss[i] / totalPoss * 100), xg: Math.round(s.xg * 100) / 100 })),
      players: M.all.map(p => ({ idx: p.idx, team: p.team, slot: p.slot, id: p.d.id, name: p.d.name, short: p.d.short, ovr: Math.round(p.ovr), gk: p.gk, rating: p.rating, st: Object.assign({}, p.st) })),
      teams: [A, B]
    };
    M = null; return out;
  }
  return { simulateMatch, W, L, GH, CX };
})();
if (typeof module !== 'undefined') module.exports = SIM;
