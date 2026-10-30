/* Legends XI — commentary box and pundit studio.
   All text is generated from a simulated match (sim.js) and is deterministic for a given seed.
   Commentators and pundits are fictional characters. */
const STUDIO = (function () {
  'use strict';
  const CAST = {
    pbp: { name: 'Pete Ashdown', role: 'Commentary' },
    co: { name: 'Simone Clarke', role: 'Co-commentary' },
    gerry: { name: 'Gerry Mallon', role: 'Former centre-half' },
    nadia: { name: 'Nadia Okoro', role: 'Tactics & data' },
    luca: { name: 'Luca Ferri', role: 'Former No.10' }
  };
  function mkRng(s) { s = s | 0 || 7; return function () { s = (s + 0x6D2B79F5) | 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  let R = Math.random;
  const pick = a => a[Math.floor(R() * a.length)];
  const yds = m => Math.round(m * 1.094);
  const pct = (a, b) => Math.round(a / ((a + b) || 1) * 100);
  const fmtXg = x => x.toFixed(2);


  /* ---------- Dark Arts Warriors: personality lines ---------- */
  const DARK = ['Oliver Kahn','Pepe','Sergio Ramos','Jaap Stam','Kyle Walker','Alphonso Davies','Patrick Vieira','Frank Rijkaard','Luis Suárez','Didier Drogba','Zlatan Ibrahimović'];
  const darkCount = team => team.xi.filter(id => id != null && PL[id] && DARK.includes(PL[id].name)).length;
  const TRAIT = {
    'Oliver Kahn': { tackle: [], save: ['${n} roars at his back line and keeps it out.', '${n} stares the striker down, and wins.'], goalAgainst: '${n} is screaming at his defence. You can hear him from the stands.' },
    'Pepe': { tackle: ['${n} goes in with everything. The referee reaches for the notebook, then thinks better of it.', '${n} makes his presence felt. ${v} will remember that one.'], foul: '${n} leaves a reminder on ${v}.' },
    'Sergio Ramos': { tackle: ['${n} leads by example, and ${v} is on the floor.', 'Captain ${n} clatters in. Fair? Debatable. Effective? Absolutely.'], foul: 'Captain ${n} again. He knows exactly how far to go.', header: 'Who else but ${n}? A captain\'s header.' },
    'Jaap Stam': { tackle: ['${n} slides in and wins it cleanly. Old school defending.', '${v} thought there was space. ${n} had other ideas.'] },
    'Kyle Walker': { beat: ['${n} simply runs past ${v}. Nobody catches him.', 'Pace! ${n} is gone down the right and ${v} can only watch.'], tackle: ['${n} recovers in a flash and steals it.'] },
    'Alphonso Davies': { beat: ['${n} burns ${v}! Pure speed.', 'Wing-back ${n} flies past ${v} like he was standing still.'] },
    'Patrick Vieira': { tackle: ['${n} steps in, all legs and authority.', '${n} dominates the middle. ${v} had no chance.'] },
    'Frank Rijkaard': { tackle: ['${n} reads it and takes it with the calm of a man who has done this a thousand times.', 'Elegant, but ${n} still wins the ball.'] },
    'Luis Suárez': { goal: ['That is ruthless from ${n}. Half a chance and he takes it.', '${n} smells blood and finishes it off. Cold.', 'Nothing wasted by ${n}. Ruthless.'], beat: ['${n} wriggles past ${v}.'] },
    'Didier Drogba': { goal: ['${n} muscles it in. Defenders bounce off him like he is made of steel.', '${n} bullies his marker and buries it.', 'Strength, then finish. That is ${n}.'], header: 'Up goes ${n} and he wins everything in the air.' },
    'Zlatan Ibrahimović': { goal: ['${n} scores, and you know he will tell everybody about it later.', 'Of course it is ${n}. He knew before the ball left the boot.', 'Confidence? ${n} has enough for the whole stadium.'], beat: ['${n} with a flick, a trick and a smirk past ${v}.'] }
  };
  const fillT = (s, n, v) => s.replace(/\$\{n\}/g, n).replace(/\$\{v\}/g, v || 'him');
  const traitLine = (p, kind, v) => { if (!p) return null; const t = TRAIT[p.name]; if (!t || !t[kind]) return null; const x = t[kind]; return fillT(Array.isArray(x) ? (x.length ? pick(x) : null) : x, p.short, v); };

  /* ---------- team profiles (pre-match) ---------- */
  function profile(team) {
    const sl = FORMS[team.form];
    const rows = sl.map((s, i) => { const p = PL[team.xi[i]]; return { p, slot: s[0], line: LINE[s[0]], eff: effOvr(p, s[0]), fit: fit(p, s[0]) }; });
    const avg = (arr, f) => arr.length ? arr.reduce((a, r) => a + f(r), 0) / arr.length : 0;
    const by = l => rows.filter(r => r.line === l);
    const D = by('D'), Mi = by('M'), A = by('A'), G = by('G');
    const chem = rows.reduce((a, r) => a + (r.fit === 'nat' ? 3 : r.fit === 'line' ? 1 : 0), 0);
    const dec = rows.flatMap(r => r.p.dec).map(d => +d < 50 ? 2000 + +d : 1900 + +d);
    return {
      team, rows, chem, ovr: avg(rows, r => r.eff),
      def: avg(D.concat(G), r => r.eff), mid: avg(Mi, r => r.eff), att: avg(A, r => r.eff),
      attPace: avg(A.length ? A : Mi, r => r.p.s[0]), defPace: avg(D, r => r.p.s[0]),
      central: rows.filter(r => ['CDM', 'CM', 'CAM'].includes(r.slot)).length,
      star: rows.slice().sort((a, b) => b.eff - a.eff)[0].p,
      creator: rows.filter(r => !r.p.pos.includes('GK')).sort((a, b) => b.p.s[2] - a.p.s[2])[0].p,
      striker: (A.length ? A : Mi).slice().sort((a, b) => b.p.s[1] - a.p.s[1])[0].p,
      wall: (D.length ? D : rows).slice().sort((a, b) => b.p.s[3] - a.p.s[3])[0].p,
      gk: G[0] ? G[0].p : rows[0].p,
      gunners: rows.filter(r => r.p.ars).length,
      offPos: rows.filter(r => r.fit === 'off').map(r => r.p),
      from: Math.min(...dec), to: Math.max(...dec)
    };
  }
  function probs(a, b) {
    const r = (a.ovr - b.ovr) + (a.chem - b.chem) / 8;
    const pa = 1 / (1 + Math.pow(10, -r / 6)), draw = .27 - Math.min(.12, Math.abs(r) * .012);
    return { a: Math.round(pa * (1 - draw) * 100), d: Math.round(draw * 100), b: 100 - Math.round(pa * (1 - draw) * 100) - Math.round(draw * 100) };
  }
  function predScore(pr) {
    const u = R() * 100; const lean = u < pr.a ? 0 : u < pr.a + pr.d ? 1 : 2;
    const hi = 1 + Math.floor(R() * 3), lo = Math.floor(R() * hi);
    return lean === 0 ? [hi, lo] : lean === 2 ? [lo, hi] : [hi - 1, hi - 1];
  }
  function preMatch(A, B, seed) {
    R = mkRng(seed + 11);
    const a = profile(A), b = profile(B), pr = probs(a, b), nA = A.name, nB = B.name;
    const panel = [];
    // Gerry: defence + Arsenal soft spot
    const defBetter = a.def >= b.def ? [a, nA, b, nB] : [b, nB, a, nA];
    let g = `${defBetter[1]} have the stronger spine at the back for me. ${defBetter[0].wall.short} in that defence, you don't get past him on a Sunday afternoon.`;
    const gun = a.gunners >= b.gunners ? [a, nA] : [b, nB];
    if (gun[0].gunners >= 5) g += ` And I see ${gun[1]} have picked ${gun[0].gunners} Arsenal players. Good. Proper football.`;
    else g += ` Where ${defBetter[3]} could be got at is pace: ${defBetter[2].defPace < 80 ? "they're not the quickest back line" : 'they need to hold their shape'}.`;
    panel.push({ who: 'gerry', text: g });
    // Nadia: formation and shape
    let n = `${A.form} against ${B.form}. `;
    if (a.central !== b.central) { const [w, nw, l] = a.central > b.central ? [a, nA, b] : [b, nB, a]; n += `${nw} have ${w.central} in the middle against ${l.central}, so expect them to win the central overload and dominate the ball.`; }
    else n += `Same numbers in central midfield, so this could come down to who wins the wide areas.`;
    const paceGap = [a.attPace - b.defPace, b.attPace - a.defPace];
    if (Math.max(...paceGap) > 4) { const i = paceGap[0] >= paceGap[1] ? 0 : 1; n += ` The number I'd watch: ${[nA, nB][i]}'s forwards average ${Math.round([a, b][i].attPace)} pace against a back line at ${Math.round([b, a][i].defPace)}. That's a transition threat.`; }
    if (a.offPos.length || b.offPos.length) { const o = a.offPos.length ? [a, nA] : [b, nB]; n += ` One concern: ${o[1]} have ${o[0].offPos.map(p => p.short).join(', ')} out of position.`; }
    panel.push({ who: 'nadia', text: n });
    // Luca: stars
    panel.push({ who: 'luca', text: `It's ${a.star.short} against ${b.star.short}, no? But the game is decided by who gets the ball to the front men. ${a.creator.short} for ${nA}, ${b.creator.short} for ${nB}. Whoever of them has time on the ball, wins. ${a.from === b.from && a.to === b.to ? '' : `Also beautiful: football from ${Math.min(a.from, b.from)} to ${Math.max(a.to, b.to)} on one pitch.`}` });
    [[A, nA], [B, nB]].forEach(([T, nm]) => { if (darkCount(T) >= 5) {
      panel.push({ who: 'gerry', text: `${nm} are built to intimidate. Big characters, big frames, nobody who takes a backward step. I would not want to line up against that back line, let alone try to get past it.` });
      panel.push({ who: 'luca', text: `It is not only the tackles. It is the mind games. ${nm} get into your head before the whistle, and by then half the game is already won. Be careful with the temper, though. One yellow too many and it turns.` });
    } });
    const preds = ['gerry', 'nadia', 'luca'].map(w => ({ who: w, score: predScore(pr) }));
    return { a, b, prob: pr, panel, preds };
  }

  /* ---------- live commentary ---------- */
  function commentary(res) {
    R = mkRng(res.seed + 29);
    const P = i => res.players[i], nm = i => (i >= 0 && P(i)) ? P(i).short : 'someone', tn = t => res.teams[t].name;
    const ev = res.events, out = []; let lastT = -99, lastCo = -99, lastTurn = -99;
    const say = (e, who, text, kind, force) => { if (!force && e.t - lastT < 2.6) return; out.push({ t: e.t, f: e.f, min: e.min, who, text, kind: kind || e.type }); lastT = e.t; };
    const next = (i, types, within) => { for (let j = i + 1; j < ev.length && ev[j].t - ev[i].t <= within; j++) if (types.includes(ev[j].type)) return ev[j]; return null; };
    let lastFill = 0;
    for (let i = 0; i < ev.length; i++) {
      const e = ev[i];
      // filler colour when quiet
      if (e.t - lastT > 38 && e.t - lastFill > 38 && e.type !== 'ft') {
        lastFill = e.t; const fe = { t: lastT + 20, f: Math.round((lastT + 20) * res.fr), min: e.min * (lastT + 20) / (e.t || 1) };
        if (fe.t < e.t) {
          const p = possAt(res, fe.f);
          say(fe, pick(['pbp', 'co']), pick([
            `${tn(p[0] >= p[1] ? 0 : 1)} have had ${Math.max(p[0], p[1])}% of the ball so far.`,
            `Patient stuff here, both sides probing for an opening.`,
            `You could fill a museum with the medals on this pitch.`,
            `${tn(0)} against ${tn(1)}. Bragging rights at stake, and you can feel it.`,
            `Lovely evening for it. The crowd are waiting for someone to light this up.`
          ]), 'colour');
        }
      }
      switch (e.type) {
        case 'ko': say(e, 'pbp', pick([`And we're under way! ${tn(0)} against ${tn(1)}.`, `Kick-off! ${tn(0)} versus ${tn(1)}, legends everywhere you look.`]), 'ko', true);
          out.push({ t: e.t + 3, f: e.f + 30, min: .5, who: 'co', text: `${res.teams[0].form} against ${res.teams[1].form}. Let's see who blinks first.`, kind: 'colour' }); lastT = e.t + 3; break;
        case 'turnover': {
          if (e.t - lastTurn < 8) break; lastTurn = e.t;
          const sh = next(i, ['shot'], 12);
          if (sh && res.players[sh.p].team === e.team) say(e, pick(['pbp', 'co']), pick([`Won back by ${nm(e.p)}, and ${tn(e.team)} break at speed!`, `Transition! ${nm(e.p)} wins it and they're away.`, `Turnover, and ${tn(e.team)} go straight for the throat.`]), 'transition', true);
          else if (R() < .12) say(e, 'pbp', `${nm(e.p)} wins it back for ${tn(e.team)}.`); break;
        }
        case 'tackle': if (R() < .5) say(e, 'pbp', traitLine(P(e.p), 'tackle', nm(e.v)) || pick([`Superb challenge from ${nm(e.p)} on ${nm(e.v)}.`, `${nm(e.p)} with a perfectly timed tackle.`, `${nm(e.v)} runs into a wall called ${nm(e.p)}.`])); break;
        case 'intercept': if (R() < .14) say(e, 'pbp', pick([`${nm(e.p)} reads it and steps in.`, `Cut out by ${nm(e.p)}.`])); break;
        case 'beat': if (R() < .35) say(e, 'pbp', traitLine(P(e.p), 'beat', nm(e.v)) || pick([`${nm(e.p)} skips past ${nm(e.v)}!`, `Lovely feet from ${nm(e.p)}, ${nm(e.v)} left behind.`, `${nm(e.p)} drops the shoulder and he's through ${nm(e.v)}.`])); break;
        case 'cross': say(e, 'pbp', pick([`${nm(e.p)} whips it in...`, `${nm(e.p)} looks up, crosses...`, `Ball in from ${nm(e.p)}...`])); break;
        case 'longball': if (R() < .4) say(e, 'pbp', `${nm(e.p)} goes long, looking for ${nm(e.to)}.`); break;
        case 'shot': {
          let t;
          if (e.kind === 'header') t = pick([`${nm(e.p)} rises... header!`, `Up goes ${nm(e.p)}!`]);
          else if (e.kind === 'pen') t = `${nm(e.p)} steps up...`;
          else if (e.kind === 'fk') t = `${nm(e.p)} over the free kick... strikes it!`;
          else if (e.kind === 'volley') t = `${nm(e.p)} on the volley!`;
          else if (e.dist > 22) t = pick([`${nm(e.p)} lets fly from ${yds(e.dist)} yards!`, `${nm(e.p)} tries his luck from distance!`]);
          else t = pick([`${nm(e.p)} shoots!`, `Chance for ${nm(e.p)}!`, `${nm(e.p)}, room to shoot...`]);
          say(e, 'pbp', t, 'shot', true); break;
        }
        case 'save': say(e, 'pbp', !e.held && R() < .5 && traitLine(P(e.p), 'save') ? traitLine(P(e.p), 'save') : e.held ? pick([`Saved, and held by ${nm(e.p)}.`, `${nm(e.p)} gathers it comfortably.`]) : pick([`Great save from ${nm(e.p)}!`, `${nm(e.p)} beats it away!`, `Fingertips from ${nm(e.p)}!`]) + (e.corner ? ' Corner.' : ''), 'save', true);
          if (e.xg > .25 && e.t - lastCo > 25) { lastCo = e.t; out.push({ t: e.t + 2.5, f: e.f + 25, min: e.min, who: 'co', text: `That was a ${fmtXg(e.xg)} xG chance. ${nm(e.p)} has kept them in it.`, kind: 'colour' }); } break;
        case 'miss': if (e.deflected) break; say(e, 'pbp', e.over ? pick(['Over the bar.', 'Blazed over!', 'Into the crowd.']) : pick(['Wide.', 'Just past the post!', 'Off target.']), 'miss', true);
          if (e.xg > .3 && e.t - lastCo > 25) { lastCo = e.t; out.push({ t: e.t + 2.5, f: e.f + 25, min: e.min, who: 'co', text: pick([`He'll be having nightmares about that one. ${fmtXg(e.xg)} xG.`, `How has that not gone in?`]), kind: 'colour' }); } break;
        case 'block': say(e, 'pbp', `Blocked by ${nm(e.p)}!`, 'block', true); break;
        case 'woodwork': say(e, 'pbp', e.bar ? `Off the crossbar! ${nm(e.p)} so close!` : `Off the post! ${nm(e.p)} can't believe it!`, 'woodwork', true); break;
        case 'goal': {
          const s = e.score, lead = s[e.team] > s[1 - e.team] ? `${tn(e.team)} lead ${Math.max(...s)}–${Math.min(...s)}!` : s[0] === s[1] ? `All square at ${s[0]}–${s[1]}!` : `${tn(e.team)} pull one back, ${s[0]}–${s[1]}.`;
          const who = e.og ? `Own goal! Off ${nm(e.p)}.` : pick([`GOAL! ${nm(e.p)}!`, `${nm(e.p).toUpperCase()}! WHAT A FINISH!`, `It's in! ${nm(e.p)}!`]);
          say(e, 'pbp', `${who} ${lead}`, 'goal', true);
          let co = '';
          const tl = !e.og && (e.kind === 'header' && traitLine(P(e.p), 'header')) || (!e.og && traitLine(P(e.p), 'goal'));
          if (tl) co = tl;
          else if (e.counter) co = `That's the transition. Won it back and within seconds it's in the net. That's what hurts you.`;
          else if (e.kind === 'header') co = `Brilliant movement in the box and a powerful header.`;
          else if (e.kind === 'pen') co = `Cool as you like from the spot.`;
          else if (e.kind === 'fk') co = `Free-kick genius. Nothing the keeper could do.`;
          else if (!e.og && e.xg < .08) co = `That was a ${fmtXg(e.xg)} xG chance. He's made something out of nothing!`;
          else if (e.ast >= 0) co = `Great ball from ${nm(e.ast)}, and the finish matched it.`;
          else co = pick([`Clinical. Absolutely clinical.`, `You give a player like that half a yard and that happens.`]);
          out.push({ t: e.t + 3, f: e.f + 30, min: e.min, who: 'co', text: co, kind: 'colour' }); lastT = e.t + 3; break;
        }
        case 'foul':
          if (e.pen) say(e, 'pbp', `PENALTY! ${nm(e.p)} brings down ${nm(e.v)} in the box!`, 'pen', true);
          else if (e.card === 'yellow') say(e, 'pbp', `${nm(e.p)} goes into the book for that on ${nm(e.v)}.`, 'card', true);
          else if (e.card === 'lucky') say(e, 'co', `${nm(e.p)} was already on a yellow. He's lucky to still be on the pitch.`, 'card', true);
          else if (R() < .25) say(e, 'pbp', traitLine(P(e.p), 'foul', nm(e.v)) || `Free kick. ${nm(e.p)} catches ${nm(e.v)}.`); break;
        case 'freekick': if (e.direct) say(e, 'co', `This is in range. ${nm(e.p)} fancies it.`, 'fk', true); break;
        case 'corner': if (R() < .5) say(e, 'pbp', `Corner to ${tn(e.team)}.`); break;
        case 'penalty': break;
        case 'ht': say(e, 'pbp', `Half-time. ${tn(0)} ${e.score[0]}, ${tn(1)} ${e.score[1]}.`, 'ht', true); break;
        case 'ft': {
          const s = e.score; const res_ = s[0] === s[1] ? `It finishes level, ${s[0]}–${s[1]}.` : `Full-time! ${tn(s[0] > s[1] ? 0 : 1)} win it ${Math.max(...s)}–${Math.min(...s)}.`;
          say(e, 'pbp', res_, 'ft', true); break;
        }
      }
    }
    out.sort((a, b) => a.t - b.t);
    return out;
  }
  function possAt(res, f) {
    let a = 0, b = 0; for (let i = 0; i <= f && i < res.nFrames; i += 5) { if (res.poss[i] === 0) a++; else if (res.poss[i] === 1) b++; }
    return [pct(a, b), 100 - pct(a, b)];
  }
  function upTo(res, minute) {
    const ev = res.events.filter(e => e.min <= minute);
    const s = [0, 1].map(t => ({ goals: 0, shots: 0, sot: 0, xg: 0, saves: 0, trans: 0 }));
    for (let i = 0; i < ev.length; i++) {
      const e = ev[i];
      if (e.type === 'shot') { const t = res.players[e.p].team; s[t].shots++; s[t].xg += e.xg; if (e.counter) s[t].trans++; }
      if (e.type === 'save') { const t = res.players[e.p].team; s[t].saves++; s[1 - t].sot++; }
      if (e.type === 'goal') { s[e.team].goals++; if (!e.og) s[e.team].sot++; }
    }
    return { s, ev };
  }
  function contributors(res, ev, t) {
    const sc = {}; const add = (i, v) => { if (i >= 0 && res.players[i].team === t) sc[i] = (sc[i] || 0) + v; };
    for (const e of ev) { if (e.type === 'goal' && !e.og) { add(e.p, 3); add(e.ast, 2); } if (e.type === 'shot') add(e.p, .5); if (e.type === 'save') add(e.p, 1); if (e.type === 'tackle' || e.type === 'intercept') add(e.p, .35); if (e.type === 'beat') add(e.p, .4); }
    const best = Object.entries(sc).sort((a, b) => b[1] - a[1])[0];
    return best ? res.players[+best[0]] : null;
  }
  function halfTime(res) {
    R = mkRng(res.seed + 47);
    const { s, ev } = upTo(res, 45), tn = t => res.teams[t].name;
    const htF = (res.events.find(e => e.type === 'ht') || { f: res.nFrames / 2 }).f, poss = possAt(res, htF);
    const lead = s[0].goals === s[1].goals ? -1 : s[0].goals > s[1].goals ? 0 : 1;
    const panel = [];
    const quiet = s[0].shots === 0 ? 0 : s[1].shots === 0 ? 1 : -1;
    panel.push({ who: 'gerry', text: lead < 0 ? `Level at the break, and honestly I've seen worse defending at this level, but not much. ${quiet >= 0 ? `${tn(quiet)} haven't had a single shot. Not one.` : 'Both keepers have had to work.'}` : `${tn(1 - lead)} have to look at themselves. ${s[1 - lead].goals === 0 ? 'Not a goal between them,' : 'Too easy,'} and the gaps between the lines are criminal.` });
    const xgLead = s[0].xg >= s[1].xg ? 0 : 1;
    let n = `Possession ${poss[0]}–${poss[1]}, shots ${s[0].shots}–${s[1].shots}, xG ${fmtXg(s[0].xg)} to ${fmtXg(s[1].xg)}. `;
    if (lead >= 0 && lead !== xgLead && Math.abs(s[0].xg - s[1].xg) > .3) n += `The scoreline is flattering ${tn(lead)}. ${tn(xgLead)} have created the better chances.`;
    else if (s[0].trans + s[1].trans > 0) { const tt = s[0].trans >= s[1].trans ? 0 : 1; n += `${tn(tt)} are doing damage in transition: ${s[tt].trans} of their shots came within seconds of winning the ball back.`; }
    else n += `${tn(poss[0] > poss[1] ? 0 : 1)} have the ball, but the question is what they're doing with it.`;
    panel.push({ who: 'nadia', text: n });
    const st = [0, 1].map(t => contributors(res, ev, t));
    const star = st[lead >= 0 ? lead : (s[0].xg >= s[1].xg ? 0 : 1)] || st[0] || st[1];
    panel.push({ who: 'luca', text: star ? `For me, ${star.short} is the man so far. Every time he's involved, something happens. ${tn(lead >= 0 ? 1 - lead : (poss[0] < poss[1] ? 0 : 1))} need to put someone tight on him in the second half.` : `It's like a chess match. Nobody wants to make the first mistake. Somebody needs to be brave in the second half.` });
    return { panel, s, poss };
  }
  function fullTime(res) {
    R = mkRng(res.seed + 83);
    const tn = t => res.teams[t].name, st = res.stats, f = res.final;
    const win = f[0] === f[1] ? -1 : f[0] > f[1] ? 0 : 1;
    const motm = res.players.slice().sort((a, b) => b.rating - a.rating)[0];
    const panel = [];
    let v;
    if (win < 0) v = `A draw, and on the balance of play ${Math.abs(st[0].xg - st[1].xg) < .4 ? "that's about right" : `${tn(st[0].xg > st[1].xg ? 0 : 1)} will feel they should have won it`}.`;
    else if (st[win].xg + .5 < st[1 - win].xg) v = `Smash and grab! ${tn(win)} win it with ${fmtXg(st[win].xg)} xG against ${fmtXg(st[1 - win].xg)}. Sometimes football isn't fair.`;
    else v = `${tn(win)} deserved that. More of the ball where it matters, better chances, and they took them.`;
    panel.push({ who: 'nadia', text: v + ` ${laneNote(res)}` });
    const defs = res.players.filter(p => !p.gk).sort((a, b) => (b.st.tkl + b.st.int) - (a.st.tkl + a.st.int))[0];
    const gk = res.players.filter(p => p.gk).sort((a, b) => b.st.saves - a.st.saves)[0];
    panel.push({ who: 'gerry', text: gk.st.saves >= 4 ? `Give some credit to ${gk.short}: ${gk.st.saves} saves. Without him this is a cricket score.` : `${defs.short} was immense. ${defs.st.tkl} tackles, ${defs.st.int} interceptions. That's the stuff nobody puts on a highlight reel.` });
    panel.push({ who: 'luca', text: `Man of the match? ${motm.short}, ${motm.rating.toFixed(1)}. ${motm.st.goals ? `${motm.st.goals} goal${motm.st.goals > 1 ? 's' : ''}` : motm.gk ? `${motm.st.saves} saves` : `${motm.st.passOk} completed passes`}${motm.st.ast ? `, ${motm.st.ast} assist${motm.st.ast > 1 ? 's' : ''}` : ''}. Pure class.` });
    const loser = win < 0 ? null : (res.teams[1 - win].mgr || tn(1 - win));
    panel.push({ who: 'gerry', text: loser ? `Right. ${loser}, I believe dinner is on you.` : `Nobody's buying dinner then. Rematch?` });
    return { panel, motm, win };
  }
  function laneNote(res) {
    const best = [0, 1].map(t => { const l = res.stats[t].lanes, tot = l[0] + l[1] + l[2] || 1, i = l.indexOf(Math.max(...l)); return { t, i, p: Math.round(l[i] / tot * 100), tot }; });
    const b = best[0].tot >= best[1].tot ? best[0] : best[1];
    return `${res.teams[b.t].name} got into the final third ${b.tot} times, ${b.p}% of it ${['down the left', 'through the middle', 'down the right'][b.i]}.`;
  }
  return { CAST, preMatch, commentary, halfTime, fullTime, profile, probs, possAt };
})();
if (typeof module !== 'undefined') module.exports = STUDIO;
