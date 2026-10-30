/* Legends XI — "Broadcast 3D" view for live matches (FIFA 12 iOS style), plus the shared 3D player model.
   A sideline TV camera that follows the ball, 3D players, red marker over the player you control.
   BROADCAST.create(container, {kits, role, names, gks, nums, pids}) -> {render(snap, dt), resize(), dispose(), dirFromStick(jx, jy)}
   BROADCAST.makeRig({shirt, shorts, socks, trim, sleeve, num, gk, seed}) -> rig (local forward = +Z, feet at y = 0)
   BROADCAST.animate(rig, speed, dt, actCode, actProgress) -> runs the gait, then layers slide tackles / skill moves on top
   Pure renderer: reads the same snapshots as the 2D view, so it works for host, guest and vs-CPU. Needs three.js (global THREE). */
const BROADCAST = (function () {
  'use strict';
  const W = 68, L = 105, CX = 34, GH = 3.66;
  // sim (x across, y along) -> world: X along the length, Z across the width
  const WX = y => y - L / 2, WZ = x => x - CX;
  const DISPLAY = '"Saira Extra Condensed","Arial Narrow",Impact,sans-serif';

  /* ======================= shared player model ======================= */
  let GEO = null;
  function geo() {
    if (GEO) return GEO;
    const C = (rt, rb, h, s) => new THREE.CylinderGeometry(rt, rb, h, s || 10);
    GEO = {
      torso: C(.25, .2, .6, 14), shorts: C(.22, .245, .27, 12), neck: C(.06, .07, .12, 8),
      head: new THREE.SphereGeometry(.125, 16, 12), cap: new THREE.SphereGeometry(.135, 16, 9, 0, Math.PI * 2, 0, Math.PI * .52),
      afro: new THREE.SphereGeometry(.175, 14, 10), bun: new THREE.SphereGeometry(.07, 10, 8), tail: new THREE.BoxGeometry(.2, .2, .09),
      thigh: C(.088, .07, .38), sock: C(.066, .052, .38), boot: new THREE.BoxGeometry(.11, .075, .27),
      sleeve: C(.078, .07, .22), fore: C(.058, .044, .36), glove: new THREE.SphereGeometry(.075, 10, 8),
      blob: new THREE.CircleGeometry(.6, 18)
    };
    GEO.torso.scale(1, 1, .64); GEO.shorts.scale(1, 1, .72);
    return GEO;
  }
  const SKINS = ['#f3d0b0', '#e8b992', '#d29f74', '#b47c52', '#8d5a36', '#6a4026', '#4b2c1a'];
  const HAIRS = ['#16100a', '#2d1c0e', '#4a3018', '#7a5530', '#b88a50', '#d8c08a', '#111111'];
  const BOOTS = ['#111111', '#f4f4f4', '#ff5a1f', '#19c3ff', '#e9ff3a', '#d4af37', '#ff2e88'];
  const hash = n => { let h = (n | 0) * 2654435761; h ^= h >>> 15; h = Math.imul(h, 2246822519); h ^= h >>> 13; return (h >>> 0); };
  function txtCol(hex) { const v = parseInt(String(hex).slice(1), 16), r = v >> 16, g = v >> 8 & 255, b = v & 255; return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111111' : '#ffffff'; }
  // Shirt texture wraps the torso: front (u = 0/1) gets the collar and a crest, the back (u = .5) gets the number.
  function shirtTex(shirt, trim, num) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = shirt; x.fillRect(0, 0, 256, 128);
    const sh = x.createLinearGradient(0, 0, 0, 128); sh.addColorStop(0, 'rgba(255,255,255,.10)'); sh.addColorStop(1, 'rgba(0,0,0,.16)'); x.fillStyle = sh; x.fillRect(0, 0, 256, 128);
    x.fillStyle = trim; x.fillRect(0, 0, 256, 6);                                   // collar band
    for (const cx of [0, 256]) { x.beginPath(); x.moveTo(cx - 22, 0); x.lineTo(cx, 24); x.lineTo(cx + 22, 0); x.closePath(); x.fill(); }   // V-neck
    x.fillStyle = shirt; for (const cx of [0, 256]) { x.beginPath(); x.moveTo(cx - 14, 0); x.lineTo(cx, 15); x.lineTo(cx + 14, 0); x.closePath(); x.fill(); }
    x.fillStyle = trim; x.globalAlpha = .9; x.beginPath(); x.arc(226, 40, 9, 0, 7); x.fill(); x.globalAlpha = 1;   // crest
    x.fillStyle = txtCol(shirt); x.strokeStyle = trim; x.lineWidth = 3; x.font = `800 72px ${DISPLAY}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.strokeText(String(num), 128, 66); x.fillText(String(num), 128, 66);
    x.fillStyle = trim; x.fillRect(0, 122, 256, 6);                                 // hem
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  function sockTex(sock, band) { const c = document.createElement('canvas'); c.width = 8; c.height = 64; const x = c.getContext('2d'); x.fillStyle = sock; x.fillRect(0, 0, 8, 64); x.fillStyle = band; x.fillRect(0, 4, 8, 7); x.fillRect(0, 14, 8, 3); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; }

  function makeRig(o) {
    const G = geo(), h = hash(o.seed == null ? Math.random() * 1e6 : o.seed + 17);
    const lam = c => new THREE.MeshLambertMaterial({ color: c });
    const skinC = SKINS[h % SKINS.length], hairC = HAIRS[(h >>> 4) % HAIRS.length], bootC = BOOTS[(h >>> 8) % BOOTS.length], style = (h >>> 12) % 7;
    const trim = o.trim || '#ffffff', sk = lam(skinC), hr = lam(hairC), bt = lam(bootC);
    const ms = new THREE.MeshLambertMaterial({ map: shirtTex(o.shirt, trim, o.num || 7) });
    const slv = lam(o.sleeve || o.shirt), sh = lam(o.shorts), so = new THREE.MeshLambertMaterial({ map: sockTex(o.socks || o.shirt, trim) });
    const grp = new THREE.Group(), body = new THREE.Group(); body.position.y = .92; grp.add(body);
    const add = (g, m, p, x, y, z) => { const e = new THREE.Mesh(g, m); e.position.set(x || 0, y || 0, z || 0); p.add(e); return e; };
    add(G.torso, ms, body, 0, .4); add(G.shorts, sh, body, 0, .02); add(G.neck, sk, body, 0, .75);
    const headG = new THREE.Group(); headG.position.y = .9; body.add(headG);
    const head = add(G.head, sk, headG); head.scale.set(1, 1.1, 1.05);
    // hair styles: crop, buzz, afro, bald, long, bun, crop
    if (style === 2) add(G.afro, hr, headG, 0, .06, -.02);
    else if (style !== 3) { const c = add(G.cap, hr, headG, 0, .015, -.008); if (style === 1) c.scale.set(.97, .9, .97); }
    if (style === 4) add(G.tail, hr, headG, 0, -.06, -.1);
    if (style === 5) add(G.bun, hr, headG, 0, .14, -.07);
    const leg = sx => { const p = new THREE.Group(); p.position.set(sx, -.06, 0); add(G.thigh, sk, p, 0, -.19); const knee = new THREE.Group(); knee.position.y = -.38; p.add(knee); add(G.sock, so, knee, 0, -.19); add(G.boot, bt, knee, 0, -.41, .06); body.add(p); p.knee = knee; return p; };
    const arm = sx => { const p = new THREE.Group(); p.position.set(sx * .3, .62, 0); add(G.sleeve, o.gk ? ms : slv, p, 0, -.1); add(G.fore, o.gk ? slv : sk, p, 0, -.37); if (o.gk) add(G.glove, lam('#f5f5f5'), p, 0, -.56); p.rotation.z = sx * .12; body.add(p); return p; };
    const r = { grp, body, head: headG, lL: leg(-.11), lR: leg(.11), aL: arm(-1), aR: arm(1), phase: (h % 628) / 100, spd: 0 };
    const blob = new THREE.Mesh(G.blob, new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .32, depthWrite: false })); blob.rotation.x = -Math.PI / 2; blob.position.y = .02; grp.add(blob); r.blob = blob;
    return r;
  }

  /* gait + actions. code: 1 two-footed slide, 2 standing tackle, 3 croqueta, 4 roulette, 5 stepover, 6 elastico, 7 rainbow flick, 8 cruyff (data.js ACT_CODE) */
  const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  function animate(r, spd, dt, code, u) {
    r.spd += (Math.min(spd, 12) - r.spd) * Math.min(1, dt * 8);
    r.phase += dt * (2.4 + r.spd * 1.45);
    const s = Math.sin(r.phase), run = Math.min(1, r.spd * .14), sw = s * run;
    const B = r.body, lL = r.lL, lR = r.lR, aL = r.aL, aR = r.aR;
    // base: running gait with knee bend
    lL.rotation.set(sw * .9, 0, 0); lR.rotation.set(-sw * .9, 0, 0);
    lL.knee.rotation.x = Math.max(0, -s) * run * 1.2 + .05; lR.knee.rotation.x = Math.max(0, s) * run * 1.2 + .05;
    aL.rotation.set(-sw * .8, 0, -.12); aR.rotation.set(sw * .8, 0, .12);
    B.rotation.set(Math.min(.22, r.spd * .024), 0, 0); B.position.set(0, .92 + Math.abs(s) * Math.min(.07, r.spd * .009), 0);
    r.head.rotation.set(0, 0, 0);
    if (!code) return;
    const w = sm(Math.min(u / .14, (1 - u) / .2, 1));          // blend in, hold, blend out
    const mix = (o, k, v) => { o.rotation[k] += (v - o.rotation[k]) * w; };
    switch (code) {
      case 1: { // two-footed slide: lean back, hips to the turf, both legs together and stretched out, studs showing
        mix(B, 'x', -1.12); B.position.y += (.36 - B.position.y) * w; B.position.z = .1 * w;
        mix(lL, 'x', -.42); mix(lR, 'x', -.42); mix(lL, 'z', .05); mix(lR, 'z', -.05);
        lL.knee.rotation.x *= 1 - w; lR.knee.rotation.x *= 1 - w;
        mix(aL, 'x', 1.5); mix(aL, 'z', -.5); mix(aR, 'x', -.9); mix(aR, 'z', .9); mix(r.head, 'x', .5);
        break;
      }
      case 2: { mix(B, 'x', .32); mix(lR, 'x', -1.1); lR.knee.rotation.x *= 1 - w; mix(lL, 'x', .25); lL.knee.rotation.x += .5 * w; mix(aL, 'z', -.6); mix(aR, 'z', .6); break; }
      case 3: { const q = Math.sin(u * Math.PI * 2); mix(lL, 'z', -.45 * q); mix(lR, 'z', -.45 * q); mix(B, 'z', .18 * q); mix(B, 'x', .2); mix(aL, 'z', -.7); mix(aR, 'z', .7); break; }
      case 4: { mix(B, 'x', .28); mix(lR, 'x', -.9 * Math.sin(u * Math.PI)); mix(lL, 'x', .3); lL.knee.rotation.x += .4 * w; mix(aL, 'z', -.9); mix(aR, 'z', .9); B.position.y -= .06 * w; break; }
      case 5: { // stepovers: right leg loops round the ball, then the left
        const first = u < .5, q = Math.sin((first ? u : u - .5) * 2 * Math.PI), leg = first ? lR : lL, sg = first ? -1 : 1;
        mix(leg, 'z', sg * .75 * Math.max(0, q)); mix(leg, 'x', -.55 * Math.max(0, q)); leg.knee.rotation.x += .5 * w * Math.max(0, q);
        mix(B, 'z', -sg * .2 * q); mix(B, 'x', .18); mix(aL, 'z', -.8); mix(aR, 'z', .8); break;
      }
      case 6: { const q = u < .32 ? u / .32 : 1 - (u - .32) / .68; mix(lR, 'z', -.85 * q); mix(lR, 'x', -.35); mix(B, 'z', .22 * q); mix(B, 'x', .16); mix(aL, 'z', -.8); mix(aR, 'z', .5); break; }
      case 7: { // rainbow flick: heel flicks the ball up behind, little hop
        const q = Math.sin(Math.min(1, u / .45) * Math.PI); mix(lR, 'x', .9 * q); lR.knee.rotation.x += 1.6 * w * q; mix(lL, 'x', -.15);
        B.position.y += .16 * Math.sin(u * Math.PI) * w; mix(aL, 'x', -1.2); mix(aR, 'x', -1.2); mix(aL, 'z', -.5); mix(aR, 'z', .5); mix(r.head, 'x', -.35); break;
      }
      case 8: { const q = Math.sin(Math.min(1, u / .55) * Math.PI); mix(lR, 'x', -.5 * q); mix(lR, 'z', .55 * q); lL.knee.rotation.x += .45 * w; mix(B, 'x', .3); mix(B, 'z', -.15 * q); mix(aL, 'z', -.9); mix(aR, 'z', .7); break; }
    }
  }

  /* ======================= stadium helpers ======================= */
  function glowTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,250,230,1)'); g.addColorStop(.25, 'rgba(255,245,210,.55)'); g.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
  function skyTex(top, mid, low) { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, top); g.addColorStop(.62, mid); g.addColorStop(1, low); x.fillStyle = g; x.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; }
  // net: a real mesh of lines over the back, roof and sides of the goal. e = +1 / -1 for the end; X axis is length.
  function goalNet(depth, half, hgt, s) {
    const pts = [], step = .3, push = (a, b) => pts.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    const bx = s * depth;
    for (let z = -half; z <= half + 1e-6; z += step) { push([bx, 0, z], [bx, hgt * .85, z]); push([bx, hgt * .85, z], [0, hgt, z]); }
    for (let y = 0; y <= hgt * .85 + 1e-6; y += step) push([bx, y, -half], [bx, y, half]);
    for (let d = 0; d <= 1.0001; d += step / depth) { push([bx * d, hgt - (hgt * .15) * d, -half], [bx * d, hgt - (hgt * .15) * d, half]); }
    for (const z of [-half, half]) { for (let d = 0; d <= 1.0001; d += step / depth) push([bx * d, 0, z], [bx * d, hgt - (hgt * .15) * d, z]); for (let y = 0; y <= hgt; y += step) push([0, y, z], [bx, Math.min(y, hgt * .85), z]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: .42 }));
  }
  function cornerFlag(color) { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.5, 6), new THREE.MeshLambertMaterial({ color: '#f2f2f2' })); p.position.y = .75; g.add(p); const f = new THREE.Mesh(new THREE.PlaneGeometry(.42, .3), new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide })); f.position.set(.21, 1.33, 0); g.add(f); g.flag = f; return g; }

  function create(container, o) {
    const role = o.role, kits = o.kits, gks = o.gks;
    const cv = document.createElement('canvas'); cv.className = 'g'; container.prepend(cv);
    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: (window.devicePixelRatio || 1) < 2, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.outputEncoding = THREE.sRGBEncoding;
    const scene = new THREE.Scene(); scene.background = skyTex('#060b18', '#16263f', '#3b4f66'); scene.fog = new THREE.Fog('#1d2c42', 150, 280);
    const camera = new THREE.PerspectiveCamera(36, 1, .5, 600);
    scene.add(new THREE.HemisphereLight('#e8f1ff', '#3d5c2a', .82));
    const sun = new THREE.DirectionalLight('#fff6e6', .7); sun.position.set(-30, 80, 40); scene.add(sun);
    const rim = new THREE.DirectionalLight('#bcd4ff', .32); rim.position.set(40, 50, -60); scene.add(rim);

    /* ---- pitch: two-way mowing, crisp lines, darker run-off ---- */
    const k = 14, MX = 7, MY = 9, cw = (L + MY * 2) * k, ch = (W + MX * 2) * k;
    const c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d');
    g.fillStyle = '#2a7a35'; g.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 18; i++) { g.fillStyle = i % 2 ? '#3a9a44' : '#2f873a'; g.fillRect((MY + i * L / 18) * k, MX * k, L / 18 * k + 1, W * k); }
    for (let j = 0; j < 8; j++) { g.fillStyle = j % 2 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.035)'; g.fillRect(MY * k, (MX + j * W / 8) * k, L * k, W / 8 * k + 1); }
    const vg = g.createRadialGradient(cw / 2, ch / 2, ch * .2, cw / 2, ch / 2, cw * .62); vg.addColorStop(0, 'rgba(255,255,230,.06)'); vg.addColorStop(1, 'rgba(0,0,0,.22)'); g.fillStyle = vg; g.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.045)'; g.fillRect(Math.random() * cw, Math.random() * ch, 2, 2); }
    const P = (x, y) => [(y + MY) * k, (x + MX) * k];
    g.strokeStyle = '#f7faf4'; g.lineWidth = .13 * k; g.lineJoin = 'round';
    const rect = (x0, y0, x1, y1) => { const a = P(x0, y0), b = P(x1, y1); g.strokeRect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])); };
    rect(0, 0, W, L); g.beginPath(); g.moveTo(...P(0, L / 2)); g.lineTo(...P(W, L / 2)); g.stroke();
    g.beginPath(); g.arc(...P(CX, L / 2), 9.15 * k, 0, 7); g.stroke();
    g.fillStyle = '#f7faf4'; g.beginPath(); g.arc(...P(CX, L / 2), .25 * k, 0, 7); g.fill();
    for (const e of [0, 1]) {
      const y0 = e ? L : 0, sg = e ? -1 : 1; rect(CX - 20.16, y0, CX + 20.16, y0 + sg * 16.5); rect(CX - 9.16, y0, CX + 9.16, y0 + sg * 5.5);
      const sp = P(CX, y0 + sg * 11); g.beginPath(); g.arc(sp[0], sp[1], .25 * k, 0, 7); g.fill();
      const a = Math.acos(5.5 / 9.15); g.beginPath(); if (e) g.arc(sp[0], sp[1], 9.15 * k, Math.PI - a, Math.PI + a); else g.arc(sp[0], sp[1], 9.15 * k, -a, a); g.stroke();
    }
    for (const [x, y] of [[0, 0], [W, 0], [0, L], [W, L]]) { g.beginPath(); g.arc(...P(x, y), 1 * k, 0, 7); g.stroke(); }
    const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const pitch = new THREE.Mesh(new THREE.PlaneGeometry(L + MY * 2, W + MX * 2), new THREE.MeshLambertMaterial({ map: tex })); pitch.rotation.x = -Math.PI / 2; scene.add(pitch);
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(260, 200), new THREE.MeshLambertMaterial({ color: '#1f4f28' })); apron.rotation.x = -Math.PI / 2; apron.position.y = -.03; scene.add(apron);

    /* ---- goals with proper nets ---- */
    const white = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    for (const e of [0, 1]) {
      const gx = WX(e ? L : 0), s = e ? 1 : -1, grp = new THREE.Group();
      const post = new THREE.CylinderGeometry(.07, .07, 2.44, 10);
      for (const z of [-GH, GH]) { const m = new THREE.Mesh(post, white); m.position.set(0, 1.22, z); grp.add(m); }
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, GH * 2 + .14, 10), white); bar.rotation.x = Math.PI / 2; bar.position.set(0, 2.44, 0); grp.add(bar);
      grp.add(goalNet(2.1, GH, 2.44, s));
      grp.position.x = gx; scene.add(grp);
    }
    const flags = []; for (const [x, y] of [[0, 0], [W, 0], [0, L], [W, L]]) { const f = cornerFlag('#e3182c'); f.position.set(WX(y), 0, WZ(x)); scene.add(f); flags.push(f); }

    /* ---- ad boards ---- */
    const ad = document.createElement('canvas'); ad.width = 2048; ad.height = 96; const ax = ad.getContext('2d');
    const brands = [['LEGENDS XI', '#e3182c', '#ffffff'], ['HEAD-TO-HEAD', '#0f2a6b', '#ffd23f'], ['1990 – 2026', '#ffffff', '#111111'], ['BRISBANE', '#ffd23f', '#0f2a6b'], ['GUNNERS', '#e3182c', '#ffffff'], ['LEGENDS XI', '#111111', '#d8b462'], ['FULL TIME', '#1f8f5a', '#ffffff'], ['NORTH BANK', '#ffffff', '#e3182c']];
    brands.forEach(([t, bg, fg], i) => { ax.fillStyle = bg; ax.fillRect(i * 256, 0, 256, 96); ax.fillStyle = fg; ax.font = `800 46px ${DISPLAY}`; ax.textAlign = 'center'; ax.textBaseline = 'middle'; ax.fillText(t, i * 256 + 128, 50); });
    const adT = new THREE.CanvasTexture(ad); adT.encoding = THREE.sRGBEncoding; adT.wrapS = THREE.RepeatWrapping;
    const board = (len, x, z, ry) => { const t = adT.clone(); t.needsUpdate = true; t.repeat.set(len / 64, 1); const m = new THREE.Mesh(new THREE.PlaneGeometry(len, .95), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })); m.position.set(x, .48, z); m.rotation.y = ry; scene.add(m); };
    board(L + 10, 0, -(W / 2 + 4), 0); board(L + 10, 0, W / 2 + 4, Math.PI); board(W + 6, -(L / 2 + 5), 0, Math.PI / 2); board(W + 6, L / 2 + 5, 0, -Math.PI / 2);

    /* ---- stands (red seats), roof with light strip, crowd (one instanced mesh: keeps the GPU cost flat) ---- */
    const seatMats = [new THREE.MeshLambertMaterial({ color: '#8f1a24' }), new THREE.MeshLambertMaterial({ color: '#a8222d' })], roofMat = new THREE.MeshLambertMaterial({ color: '#cfd5dd' }), stripMat = new THREE.MeshBasicMaterial({ color: '#fff6dc' });
    const sides = [{ cx: 0, cz: -(W / 2 + 6), len: L + 26, ry: 0 }, { cx: 0, cz: W / 2 + 6, len: L + 26, ry: Math.PI }, { cx: -(L / 2 + 7), cz: 0, len: W + 22, ry: Math.PI / 2 }, { cx: L / 2 + 7, cz: 0, len: W + 22, ry: -Math.PI / 2 }];
    const pal = ['#e3182c', '#ffffff', '#e3182c', '#1d2f6b', '#f5d130', '#d9d9d9', '#2a2a2a', '#7fb8e6', '#c22', '#ffffff', '#e3182c'];
    const TIERS = 9; let total = 0; sides.forEach(s => total += Math.floor(s.len / .75) * TIERS);
    const fans = new THREE.InstancedMesh(new THREE.BoxGeometry(.48, .6, .32), new THREE.MeshLambertMaterial(), total);
    const m4 = new THREE.Matrix4(), col = new THREE.Color(); let fi = 0;
    sides.forEach(s => {
      const grp = new THREE.Group(); grp.position.set(s.cx, 0, s.cz); grp.rotation.y = s.ry;
      for (let t = 0; t < TIERS; t++) { const st = new THREE.Mesh(new THREE.BoxGeometry(s.len, .8 + t * 1.05, 1.3), seatMats[t % 2]); st.position.set(0, (.8 + t * 1.05) / 2, -t * 1.3); grp.add(st); }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(s.len, .4, TIERS * 1.3 + 2), roofMat); roof.position.set(0, .8 + TIERS * 1.05 + 4, -(TIERS * 1.3) / 2 + .6); grp.add(roof);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(s.len * .96, .14, .14), stripMat); strip.position.set(0, .8 + TIERS * 1.05 + 3.72, 1.55); grp.add(strip);
      scene.add(grp); grp.updateMatrixWorld(true);
      const cols = Math.floor(s.len / .75);
      for (let t = 0; t < TIERS; t++) for (let i = 0; i < cols; i++) {
        const v = new THREE.Vector3(-s.len / 2 + .38 + i * .75 + (Math.random() - .5) * .2, .8 + t * 1.05 + .3, -t * 1.3).applyMatrix4(grp.matrixWorld);
        m4.makeRotationY(s.ry); m4.setPosition(v); fans.setMatrixAt(fi, m4); col.set(pal[(Math.random() * pal.length) | 0]); fans.setColorAt(fi, col);
        fi++;
      }
    });
    for (const im of [fans]) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; scene.add(im); }

    /* ---- floodlight pylons with glow ---- */
    const gT = glowTex(), poleM = new THREE.MeshLambertMaterial({ color: '#39424e' }), lampM = new THREE.MeshBasicMaterial({ color: '#fffbe8' });
    for (const [px, pz] of [[-L / 2 - 16, -W / 2 - 18], [L / 2 + 16, -W / 2 - 18], [-L / 2 - 16, W / 2 + 18], [L / 2 + 16, W / 2 + 18]]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.35, .6, 34, 8), poleM); pole.position.set(px, 17, pz); scene.add(pole);
      const head = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.6, .5), lampM); head.position.set(px, 35, pz); head.lookAt(0, 0, 0); scene.add(head);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: gT, color: '#fff3d6', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.set(26, 26, 1); glow.position.set(px, 35, pz); scene.add(glow);
    }

    /* ---- players ---- */
    const gkCols = ['#22c55e', '#a855f7', '#0ea5e9', '#f97316'].filter(x => x !== kits[0].a && x !== kits[1].a);
    const rigs = [];
    for (let i = 0; i < 22; i++) {
      const t = i < 11 ? 0 : 1, kt = kits[t], gk = gks[i];
      const shirt = gk ? gkCols[t] : kt.a, num = o.nums && o.nums[i] ? o.nums[i] : (gk ? 1 : (i % 11) + 1);
      const r = makeRig({ shirt, shorts: gk ? '#151515' : (kt.shorts || kt.b), socks: gk ? gkCols[t] : (kt.socks || kt.a), trim: gk ? '#111111' : kt.b, sleeve: (!gk && kt.id === 'red') ? '#ffffff' : shirt, num, gk, seed: o.pids ? o.pids[i] : i * 31 });
      r.px = null; r.pz = null; scene.add(r.grp); rigs.push(r);
    }

    /* ---- ball ---- */
    const bc = document.createElement('canvas'); bc.width = 128; bc.height = 64; const bx = bc.getContext('2d'); bx.fillStyle = '#fff'; bx.fillRect(0, 0, 128, 64); bx.fillStyle = '#1a1a1a';
    for (const [x, y] of [[16, 16], [56, 10], [96, 18], [30, 46], [74, 40], [112, 50]]) { bx.beginPath(); for (let a = 0; a < 5; a++) { const an = a / 5 * Math.PI * 2 - Math.PI / 2; bx.lineTo(x + Math.cos(an) * 8, y + Math.sin(an) * 8); } bx.fill(); }
    const ballT = new THREE.CanvasTexture(bc); ballT.encoding = THREE.sRGBEncoding;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.2, 18, 14), new THREE.MeshLambertMaterial({ map: ballT, emissive: '#222222' })); scene.add(ball);
    const blobMat = new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .32, depthWrite: false });
    const bshadow = new THREE.Mesh(new THREE.CircleGeometry(.24, 14), blobMat); bshadow.rotation.x = -Math.PI / 2; bshadow.position.y = .025; scene.add(bshadow);

    /* ---- markers ---- */
    const marker = new THREE.Mesh(new THREE.ConeGeometry(.4, .62, 3), new THREE.MeshBasicMaterial({ color: '#e3182c' })); marker.rotation.x = Math.PI; scene.add(marker);
    const markerEdge = new THREE.Mesh(new THREE.ConeGeometry(.4, .62, 3), new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true })); markerEdge.rotation.x = Math.PI; scene.add(markerEdge); markerEdge.renderOrder = -1;
    const foot = new THREE.Mesh(new THREE.RingGeometry(.62, .8, 32), new THREE.MeshBasicMaterial({ color: '#ffe14d', transparent: true, opacity: .9, depthWrite: false })); foot.rotation.x = -Math.PI / 2; foot.position.y = .035; scene.add(foot);
    const arrowShape = new THREE.Shape(); arrowShape.moveTo(0, .62); arrowShape.lineTo(.42, .05); arrowShape.lineTo(.16, .12); arrowShape.lineTo(.16, -.38); arrowShape.lineTo(-.16, -.38); arrowShape.lineTo(-.16, .12); arrowShape.lineTo(-.42, .05); arrowShape.lineTo(0, .62);
    const arrowG = new THREE.Group(); const arrowM = new THREE.Mesh(new THREE.ShapeGeometry(arrowShape), new THREE.MeshBasicMaterial({ color: '#ffe14d', transparent: true, opacity: .95, side: THREE.DoubleSide, depthWrite: false }));
    arrowM.rotation.x = Math.PI / 2; arrowM.position.set(0, .04, 1.32); arrowG.add(arrowM); scene.add(arrowG);
    const recvRing = new THREE.Mesh(new THREE.RingGeometry(.7, .82, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .55, depthWrite: false })); recvRing.rotation.x = -Math.PI / 2; recvRing.position.y = .035; scene.add(recvRing);
    const oppMark = new THREE.Mesh(new THREE.RingGeometry(.62, .74, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .35, depthWrite: false })); oppMark.rotation.x = -Math.PI / 2; oppMark.position.y = .034; scene.add(oppMark);
    // skill flash: a gold ring that bursts under whoever pulls off a skill
    const flash = new THREE.Mesh(new THREE.RingGeometry(.6, .95, 32), new THREE.MeshBasicMaterial({ color: '#ffd23f', transparent: true, opacity: 0, depthWrite: false })); flash.rotation.x = -Math.PI / 2; flash.position.y = .036; scene.add(flash);

    /* ---- camera rig ---- */
    const side = role === 0 ? 1 : -1;            // camera sits on +Z touchline for Player 1, -Z for Player 2, so each sees their attack going right
    const camT = new THREE.Vector3(), camP = new THREE.Vector3(), look = new THREE.Vector3(); let first = true, aspect = 1.6;
    function resize() { const r = container.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); aspect = r.width / Math.max(1, r.height); camera.aspect = aspect; camera.fov = aspect < 1 ? 60 : aspect < 1.5 ? 44 : 38; camera.updateProjectionMatrix(); }
    resize();

    const ZOOMS = [{ h: 14, d: 25, n: 'Close' }, { h: 21, d: 37, n: 'Wide' }, { h: 30, d: 52, n: 'Extra wide' }];
    let zi = 1; try { const v = +localStorage.getItem('lxi.camzoom2'); if (v >= 0 && v < ZOOMS.length) zi = v; } catch (e) { }
    function cycleZoom() { zi = (zi + 1) % ZOOMS.length; try { localStorage.setItem('lxi.camzoom2', zi); } catch (e) { } return ZOOMS[zi].n; }
    let t0 = 0; const actC = new Uint8Array(22), actU = new Float32Array(22); let flashI = -1, flashT = 0;
    function render(sn, dt) {
      t0 += dt; const Pp = sn.p, me = sn.a[role], them = sn.a[1 - role];
      actC.fill(0); const K = sn.k || []; for (let j = 0; j + 2 < K.length; j += 3) { const i = K[j]; actC[i] = K[j + 1]; actU[i] = K[j + 2] / 100; if (K[j + 1] >= 3 && K[j + 2] < 25 && flashI !== i) { flashI = i; flashT = 0; } }
      for (let i = 0; i < 22; i++) {
        const r = rigs[i], x = Pp[i * 4], y = Pp[i * 4 + 1], X = WX(y), Z = WZ(x);
        let v = 0; if (r.px !== null && dt > 0) v = Math.hypot(X - r.px, Z - r.pz) / dt;
        r.px = X; r.pz = Z; r.grp.position.set(X, 0, Z);
        const fx = Pp[i * 4 + 2], fy = Pp[i * 4 + 3]; const want = Math.atan2(fy, fx); let d = want - r.grp.rotation.y; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; r.grp.rotation.y += d * Math.min(1, dt * (actC[i] ? 20 : 12));
        animate(r, actC[i] === 1 ? 0 : v, dt, actC[i], actU[i]);
      }
      if (flashI >= 0) { flashT += dt; const g = rigs[flashI].grp.position, q = flashT / .55; flash.position.set(g.x, .036, g.z); flash.scale.setScalar(1 + q * 1.8); flash.material.opacity = Math.max(0, .85 * (1 - q)); if (q >= 1) flashI = -1; } else flash.material.opacity = 0;
      for (const f of flags) f.flag.rotation.y = Math.sin(t0 * 3 + f.position.x) * .35;
      const bX = WX(sn.b[1]), bZ = WZ(sn.b[0]), bz = sn.b[2];
      if (dt > 0 && ball.userData.px !== undefined) { const dX = bX - ball.userData.px, dZ = bZ - ball.userData.pz; ball.rotation.z -= dX / .2; ball.rotation.x += dZ / .2; }
      ball.userData.px = bX; ball.userData.pz = bZ;
      ball.position.set(bX, .2 + bz, bZ); bshadow.position.set(bX + bz * .25, .025, bZ + bz * .25); bshadow.scale.setScalar(1 / (1 + bz * .25));
      if (me >= 0) { const g = rigs[me].grp.position, bob = Math.sin(t0 * 5) * .08; marker.visible = markerEdge.visible = foot.visible = arrowG.visible = true; arrowG.position.set(g.x, 0, g.z); arrowG.rotation.y = rigs[me].grp.rotation.y; arrowM.position.z = 1.32 + Math.sin(t0 * 6) * .07; marker.position.set(g.x, 2.45 + bob, g.z); markerEdge.position.set(g.x, 2.43 + bob, g.z); marker.rotation.y = markerEdge.rotation.y = t0 * 1.6; foot.position.set(g.x, .035, g.z); }
      else marker.visible = markerEdge.visible = foot.visible = arrowG.visible = false;
      if (them >= 0) { const g = rigs[them].grp.position; oppMark.visible = true; oppMark.position.set(g.x, .034, g.z); } else oppMark.visible = false;
      if (sn.r >= 0 && sn.r !== me) { const g = rigs[sn.r].grp.position; recvRing.visible = true; recvRing.position.set(g.x, .035, g.z); recvRing.scale.setScalar(1 + Math.sin(t0 * 8) * .08); } else recvRing.visible = false;
      // broadcast camera: follow the ball along the touchline, lean ahead of the ball carrier
      let lead = 0; if (sn.o >= 0) lead = (sn.o < 11 ? 1 : -1) * 5;
      const edge = 12 + zi * 6, tx = Math.max(-L / 2 + edge, Math.min(L / 2 - edge, bX + lead)), tz = bZ * .6;
      const portrait = aspect < 1, Z0 = ZOOMS[zi], h = portrait ? Z0.h * 1.6 : Z0.h, dist = portrait ? Z0.d * 1.3 : Z0.d;
      camT.set(tx, 0, tz);
      const desired = new THREE.Vector3(tx, h, tz * .35 + side * (W / 2 * .35 + dist));
      const kk = first ? 1 : 1 - Math.exp(-dt * 2.6); camP.lerp(desired, kk); look.lerp(camT, first ? 1 : 1 - Math.exp(-dt * 3.6)); first = false;
      camera.position.copy(camP); camera.lookAt(look.x, 0, look.z);
      renderer.render(scene, camera);
    }
    // stick on screen -> sim direction. Screen right = my attacking direction (sim +y for Player 1, -y for Player 2); screen up = away from the camera.
    function dirFromStick(jx, jy) { return role === 0 ? [jy, jx] : [-jy, -jx]; }
    function dispose() { try { renderer.dispose(); } catch (e) { } cv.remove(); }
    /* static scenery never moves: freeze its matrices so three.js skips them every frame */
    try { const dyn = new Set([ball, bshadow, marker, markerEdge, foot, arrowG, recvRing, oppMark, flash].concat(rigs.map(r => r.grp), flags)); scene.updateMatrixWorld(true); scene.children.forEach(o => { if (!dyn.has(o)) o.traverse(c => { c.matrixAutoUpdate = false; }); }); } catch (e) { }
    return { render, resize, dispose, dirFromStick, cycleZoom, zoomName: () => ZOOMS[zi].n };
  }
  return { create, makeRig, animate, goalNet, cornerFlag, glowTex, skyTex };
})();
