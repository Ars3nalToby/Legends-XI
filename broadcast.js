/* Legends XI — "Broadcast 3D" view for live matches (FIFA 12 iOS style).
   A sideline TV camera that follows the ball, 3D players, red marker over the player you control.
   BROADCAST.create(container, {kits, role, names, gks}) -> {render(snap, dt), resize(), dispose(), dirFromStick(jx, jy)}
   Pure renderer: reads the same snapshots as the 2D view, so it works for host, guest and vs-CPU. Needs three.js (global THREE). */
const BROADCAST = (function () {
  'use strict';
  const W = 68, L = 105, CX = 34, GH = 3.66;
  // sim (x across, y along) -> world: X along the length, Z across the width
  const WX = y => y - L / 2, WZ = x => x - CX;

  function create(container, o) {
    const role = o.role, kits = o.kits, gks = o.gks;
    const cv = document.createElement('canvas'); cv.className = 'g'; container.prepend(cv);
    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: (window.devicePixelRatio || 1) < 2, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.outputEncoding = THREE.sRGBEncoding;
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#2a3b52'); scene.fog = new THREE.Fog('#2a3b52', 140, 260);
    const camera = new THREE.PerspectiveCamera(36, 1, .5, 600);
    scene.add(new THREE.HemisphereLight('#e8f1ff', '#3d5c2a', .9));
    const sun = new THREE.DirectionalLight('#fffaf0', .75); sun.position.set(-30, 80, 40); scene.add(sun);

    /* ---- pitch ---- */
    const k = 14, MX = 7, MY = 9, cw = (L + MY * 2) * k, ch = (W + MX * 2) * k;
    const c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d');
    g.fillStyle = '#2f8a3a'; g.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 18; i++) { g.fillStyle = i % 2 ? '#3a9c43' : '#2f8a3a'; g.fillRect((MY + i * L / 18) * k, 0, L / 18 * k + 1, ch); }
    // subtle grain
    for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.04)'; g.fillRect(Math.random() * cw, Math.random() * ch, 2, 2); }
    const P = (x, y) => [(y + MY) * k, (x + MX) * k];
    g.strokeStyle = '#f7faf4'; g.lineWidth = .14 * k; g.lineJoin = 'round';
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
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(260, 200), new THREE.MeshLambertMaterial({ color: '#2b6f33' })); apron.rotation.x = -Math.PI / 2; apron.position.y = -.03; scene.add(apron);

    /* ---- goals ---- */
    const white = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const netMat = new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true, transparent: true, opacity: .32 });
    for (const e of [0, 1]) {
      const gx = WX(e ? L : 0), s = e ? 1 : -1, grp = new THREE.Group();
      const post = new THREE.CylinderGeometry(.07, .07, 2.44, 10);
      for (const z of [-GH, GH]) { const m = new THREE.Mesh(post, white); m.position.set(0, 1.22, z); grp.add(m); }
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, GH * 2 + .14, 10), white); bar.rotation.x = Math.PI / 2; bar.position.set(0, 2.44, 0); grp.add(bar);
      const net = new THREE.Mesh(new THREE.BoxGeometry(2, 2.44, GH * 2, 3, 6, 14), netMat); net.position.set(s * 1, 1.22, 0); grp.add(net);
      grp.position.x = gx; scene.add(grp);
    }

    /* ---- ad boards ---- */
    const ad = document.createElement('canvas'); ad.width = 2048; ad.height = 96; const ax = ad.getContext('2d');
    const brands = [['LEGENDS XI', '#e3182c', '#ffffff'], ['HEAD-TO-HEAD', '#0f2a6b', '#ffd23f'], ['1990 – 2026', '#ffffff', '#111111'], ['BRISBANE', '#ffd23f', '#0f2a6b'], ['GUNNERS', '#e3182c', '#ffffff'], ['LEGENDS XI', '#111111', '#d8b462'], ['FULL TIME', '#1f8f5a', '#ffffff'], ['NORTH BANK', '#ffffff', '#e3182c']];
    brands.forEach(([t, bg, fg], i) => { ax.fillStyle = bg; ax.fillRect(i * 256, 0, 256, 96); ax.fillStyle = fg; ax.font = '800 46px "Saira Extra Condensed","Arial Narrow",Impact,sans-serif'; ax.textAlign = 'center'; ax.textBaseline = 'middle'; ax.fillText(t, i * 256 + 128, 50); });
    const adT = new THREE.CanvasTexture(ad); adT.encoding = THREE.sRGBEncoding; adT.wrapS = THREE.RepeatWrapping;
    const board = (len, x, z, ry) => { const t = adT.clone(); t.needsUpdate = true; t.repeat.set(len / 64, 1); const m = new THREE.Mesh(new THREE.PlaneGeometry(len, .95), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })); m.position.set(x, .48, z); m.rotation.y = ry; scene.add(m); };
    board(L + 10, 0, -(W / 2 + 4), 0); board(L + 10, 0, W / 2 + 4, Math.PI); board(W + 6, -(L / 2 + 5), 0, Math.PI / 2); board(W + 6, L / 2 + 5, 0, -Math.PI / 2);

    /* ---- stands + crowd ---- */
    const standMat = new THREE.MeshLambertMaterial({ color: '#3a4656' }), roofMat = new THREE.MeshLambertMaterial({ color: '#d9dde3' });
    const sides = [{ cx: 0, cz: -(W / 2 + 6), len: L + 26, ry: 0 }, { cx: 0, cz: W / 2 + 6, len: L + 26, ry: Math.PI }, { cx: -(L / 2 + 7), cz: 0, len: W + 22, ry: Math.PI / 2 }, { cx: L / 2 + 7, cz: 0, len: W + 22, ry: -Math.PI / 2 }];
    const pal = ['#e3182c', '#ffffff', '#e3182c', '#1d2f6b', '#f5d130', '#d9d9d9', '#2a2a2a', '#7fb8e6', '#c22', '#ffffff'];
    const TIERS = 9; let total = 0; sides.forEach(s => total += Math.floor(s.len / .75) * TIERS);
    const fans = new THREE.InstancedMesh(new THREE.BoxGeometry(.48, .66, .34), new THREE.MeshLambertMaterial(), total);
    const m4 = new THREE.Matrix4(), col = new THREE.Color(); let fi = 0;
    sides.forEach(s => {
      const grp = new THREE.Group(); grp.position.set(s.cx, 0, s.cz); grp.rotation.y = s.ry;
      for (let t = 0; t < TIERS; t++) { const st = new THREE.Mesh(new THREE.BoxGeometry(s.len, .8 + t * 1.05, 1.3), standMat); st.position.set(0, (.8 + t * 1.05) / 2, -t * 1.3); grp.add(st); }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(s.len, .4, TIERS * 1.3 + 2), roofMat); roof.position.set(0, .8 + TIERS * 1.05 + 4, -(TIERS * 1.3) / 2 + .6); grp.add(roof);
      scene.add(grp); grp.updateMatrixWorld(true);
      const cols = Math.floor(s.len / .75);
      for (let t = 0; t < TIERS; t++) for (let i = 0; i < cols; i++) {
        const v = new THREE.Vector3(-s.len / 2 + .38 + i * .75 + (Math.random() - .5) * .2, .8 + t * 1.05 + .33, -t * 1.3).applyMatrix4(grp.matrixWorld);
        m4.makeRotationY(s.ry); m4.setPosition(v); fans.setMatrixAt(fi, m4); col.set(pal[(Math.random() * pal.length) | 0]); fans.setColorAt(fi, col); fi++;
      }
    });
    fans.instanceMatrix.needsUpdate = true; if (fans.instanceColor) fans.instanceColor.needsUpdate = true; scene.add(fans);

    /* ---- players ---- */
    const geo = {
      torso: new THREE.BoxGeometry(.52, .64, .3), shorts: new THREE.BoxGeometry(.52, .28, .32), head: new THREE.SphereGeometry(.15, 14, 12), hair: new THREE.SphereGeometry(.16, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      thigh: new THREE.BoxGeometry(.18, .38, .18), shin: new THREE.BoxGeometry(.16, .4, .16), boot: new THREE.BoxGeometry(.16, .1, .3), arm: new THREE.BoxGeometry(.13, .54, .13), sleeve: new THREE.BoxGeometry(.15, .22, .15),
      num: new THREE.PlaneGeometry(.3, .3), blob: new THREE.CircleGeometry(.6, 18)
    };
    const skins = ['#f1c9a5', '#e0b08a', '#c68e63', '#9a6440', '#6b4127', '#4e2f1c'], hairs = ['#1a1209', '#3a2412', '#6b4a24', '#111111', '#c79b5b', '#2a1a10'];
    const blobMat = new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .32, depthWrite: false });
    const gkCols = ['#22c55e', '#a855f7', '#0ea5e9', '#f97316'].filter(x => x !== kits[0].a && x !== kits[1].a);
    function numTex(n, fg) { const cc = document.createElement('canvas'); cc.width = cc.height = 64; const x = cc.getContext('2d'); x.fillStyle = fg; x.font = '800 46px "Saira Extra Condensed","Arial Narrow",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), 32, 36); const t = new THREE.CanvasTexture(cc); t.encoding = THREE.sRGBEncoding; return t; }
    function txtCol(hex) { const v = parseInt(hex.slice(1), 16), r = v >> 16, gg = v >> 8 & 255, b = v & 255; return (r * 299 + gg * 587 + b * 114) / 1000 > 150 ? '#111111' : '#ffffff'; }
    const rigs = [];
    for (let i = 0; i < 22; i++) {
      const t = i < 11 ? 0 : 1, kt = kits[t], gk = gks[i];
      const shirt = gk ? gkCols[t] : kt.a, shorts = gk ? '#151515' : (kt.shorts || kt.b), socks = gk ? gkCols[t] : (kt.socks || kt.a);
      const ms = new THREE.MeshLambertMaterial({ color: shirt }), mh = new THREE.MeshLambertMaterial({ color: shorts }), mk = new THREE.MeshLambertMaterial({ color: socks });
      const sk = new THREE.MeshLambertMaterial({ color: skins[(i * 7 + 3) % skins.length] }), hr = new THREE.MeshLambertMaterial({ color: hairs[(i * 5 + 1) % hairs.length] }), bt = new THREE.MeshLambertMaterial({ color: '#111' });
      const grp = new THREE.Group(), body = new THREE.Group(); grp.add(body);
      const torso = new THREE.Mesh(geo.torso, ms); torso.position.y = 1.2; body.add(torso);
      const sh = new THREE.Mesh(geo.shorts, mh); sh.position.y = .82; body.add(sh);
      const head = new THREE.Mesh(geo.head, sk); head.position.y = 1.67; body.add(head);
      const hair = new THREE.Mesh(geo.hair, hr); hair.position.y = 1.69; body.add(hair);
      const num = new THREE.Mesh(geo.num, new THREE.MeshBasicMaterial({ map: numTex(o.nums && o.nums[i] ? o.nums[i] : (gk ? 1 : (i % 11) + 1), txtCol(shirt)), transparent: true })); num.position.set(0, 1.25, -.155); num.rotation.y = Math.PI; body.add(num);
      const leg = sx => { const p = new THREE.Group(); p.position.set(sx, .74, 0); const a = new THREE.Mesh(geo.thigh, sk); a.position.y = -.19; p.add(a); const s = new THREE.Mesh(geo.shin, mk); s.position.y = -.55; p.add(s); const b = new THREE.Mesh(geo.boot, bt); b.position.set(0, -.72, .06); p.add(b); body.add(p); return p; };
      const sleeveMat = (!gk && kt.id === 'red') ? new THREE.MeshLambertMaterial({ color: '#ffffff' }) : ms;
      const arm = sx => { const p = new THREE.Group(); p.position.set(sx, 1.48, 0); const a = new THREE.Mesh(geo.arm, sk); a.position.y = -.28; p.add(a); const s = new THREE.Mesh(geo.sleeve, sleeveMat); s.position.y = -.08; p.add(s); body.add(p); return p; };
      const r = { grp, body, lL: leg(-.13), lR: leg(.13), aL: arm(-.34), aR: arm(.34), phase: i * .7, spd: 0, px: null, pz: null };
      const blob = new THREE.Mesh(geo.blob, blobMat); blob.rotation.x = -Math.PI / 2; blob.position.y = .02; grp.add(blob);
      scene.add(grp); rigs.push(r);
    }

    /* ---- ball ---- */
    const bc = document.createElement('canvas'); bc.width = 128; bc.height = 64; const bx = bc.getContext('2d'); bx.fillStyle = '#fff'; bx.fillRect(0, 0, 128, 64); bx.fillStyle = '#1a1a1a';
    for (const [x, y] of [[16, 16], [56, 10], [96, 18], [30, 46], [74, 40], [112, 50]]) { bx.beginPath(); for (let a = 0; a < 5; a++) { const an = a / 5 * Math.PI * 2 - Math.PI / 2; bx.lineTo(x + Math.cos(an) * 8, y + Math.sin(an) * 8); } bx.fill(); }
    const ballT = new THREE.CanvasTexture(bc); ballT.encoding = THREE.sRGBEncoding;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.2, 18, 14), new THREE.MeshLambertMaterial({ map: ballT, emissive: '#222222' })); scene.add(ball);
    const bshadow = new THREE.Mesh(new THREE.CircleGeometry(.24, 14), blobMat); bshadow.rotation.x = -Math.PI / 2; bshadow.position.y = .025; scene.add(bshadow);

    /* ---- markers ---- */
    const marker = new THREE.Mesh(new THREE.ConeGeometry(.4, .62, 3), new THREE.MeshBasicMaterial({ color: '#e3182c' })); marker.rotation.x = Math.PI; scene.add(marker);
    const markerEdge = new THREE.Mesh(new THREE.ConeGeometry(.4, .62, 3), new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true })); markerEdge.rotation.x = Math.PI; markerEdge.scale.set(1, 1, 1); scene.add(markerEdge); markerEdge.renderOrder = -1;
    const foot = new THREE.Mesh(new THREE.RingGeometry(.62, .8, 32), new THREE.MeshBasicMaterial({ color: '#ffe14d', transparent: true, opacity: .9, depthWrite: false })); foot.rotation.x = -Math.PI / 2; foot.position.y = .035; scene.add(foot);
    const arrowShape = new THREE.Shape(); arrowShape.moveTo(0, .62); arrowShape.lineTo(.42, .05); arrowShape.lineTo(.16, .12); arrowShape.lineTo(.16, -.38); arrowShape.lineTo(-.16, -.38); arrowShape.lineTo(-.16, .12); arrowShape.lineTo(-.42, .05); arrowShape.lineTo(0, .62);
    const arrowG = new THREE.Group(); const arrowM = new THREE.Mesh(new THREE.ShapeGeometry(arrowShape), new THREE.MeshBasicMaterial({ color: '#ffe14d', transparent: true, opacity: .95, side: THREE.DoubleSide, depthWrite: false }));
    arrowM.rotation.x = Math.PI / 2; arrowM.position.set(0, .04, 1.32); arrowG.add(arrowM); scene.add(arrowG);
    const recvRing = new THREE.Mesh(new THREE.RingGeometry(.7, .82, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .55, depthWrite: false })); recvRing.rotation.x = -Math.PI / 2; recvRing.position.y = .035; scene.add(recvRing);
    const oppMark = new THREE.Mesh(new THREE.RingGeometry(.62, .74, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .35, depthWrite: false })); oppMark.rotation.x = -Math.PI / 2; oppMark.position.y = .034; scene.add(oppMark);

    /* ---- camera rig ---- */
    const side = role === 0 ? 1 : -1;            // camera sits on +Z touchline for Player 1, -Z for Player 2, so each sees their attack going right
    const camT = new THREE.Vector3(), camP = new THREE.Vector3(), look = new THREE.Vector3(); let first = true, aspect = 1.6;
    function resize() { const r = container.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); aspect = r.width / Math.max(1, r.height); camera.aspect = aspect; camera.fov = aspect < 1 ? 60 : aspect < 1.5 ? 44 : 38; camera.updateProjectionMatrix(); }
    resize();

    const ZOOMS = [{ h: 14, d: 25, n: 'Close' }, { h: 21, d: 37, n: 'Wide' }, { h: 30, d: 52, n: 'Extra wide' }];
    let zi = 1; try { const v = +localStorage.getItem('lxi.camzoom2'); if (v >= 0 && v < ZOOMS.length) zi = v; } catch (e) { }
    function cycleZoom() { zi = (zi + 1) % ZOOMS.length; try { localStorage.setItem('lxi.camzoom2', zi); } catch (e) { } return ZOOMS[zi].n; }
    let t0 = 0;
    /* resolution: cap the pixel ratio at 1.5. A fixed cap is the biggest single GPU saving on 3x phones and avoids resizing the canvas mid-match. */
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); resize();
    function render(sn, dt) {
      t0 += dt; const Pp = sn.p, me = sn.a[role], them = sn.a[1 - role];
      for (let i = 0; i < 22; i++) {
        const r = rigs[i], x = Pp[i * 4], y = Pp[i * 4 + 1], X = WX(y), Z = WZ(x);
        if (r.px !== null && dt > 0) { const v = Math.hypot(X - r.px, Z - r.pz) / dt; r.spd += (Math.min(v, 12) - r.spd) * Math.min(1, dt * 8); }
        r.px = X; r.pz = Z; r.grp.position.set(X, 0, Z);
        const fx = Pp[i * 4 + 2], fy = Pp[i * 4 + 3]; const want = Math.atan2(fy, fx); let d = want - r.grp.rotation.y; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; r.grp.rotation.y += d * Math.min(1, dt * 12);
        r.phase += dt * (2.4 + r.spd * 1.45); const sw = Math.sin(r.phase) * Math.min(1, r.spd * .14);
        r.lL.rotation.x = sw; r.lR.rotation.x = -sw; r.aL.rotation.x = -sw * .85; r.aR.rotation.x = sw * .85;
        r.body.rotation.x = Math.min(.2, r.spd * .022); r.body.position.y = Math.abs(Math.sin(r.phase)) * Math.min(.07, r.spd * .009);
      }
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
    try { const dyn = new Set([ball, bshadow, marker, markerEdge, foot, arrowG, recvRing, oppMark].concat(rigs.map(r => r.grp))); scene.updateMatrixWorld(true); scene.children.forEach(o => { if (!dyn.has(o)) o.traverse(c => { c.matrixAutoUpdate = false; }); }); } catch (e) { }
    return { render, resize, dispose, dirFromStick, cycleZoom, zoomName: () => ZOOMS[zi].n };
  }
  return { create };
})();
