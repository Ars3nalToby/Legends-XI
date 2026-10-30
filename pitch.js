/* Legends XI: the starting-XI pitch.
   PITCH.html({key, form, xi, kit, draft}) returns markup for a floodlit pitch with the formation drawn on it.
   Slots are <button class="ps" data-slot="KEY:i"> so each page keeps its own tap handler; PITCH.onSwap(key, i, j) fires after a drag-swap.
   Needs data.js (PL, FORMS, LINE, fit, effOvr, fitColor, teamStats, shirtNums). */
const PITCH = (function () {
  'use strict';
  const CSS = `
.pt-wrap{display:flex;flex-direction:column;gap:10px}
.pth{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 14px;align-items:flex-end;padding:2px 2px 0}
.pth .shape{font-family:var(--display,'Arial Narrow',Impact,sans-serif);font-weight:800;font-size:clamp(40px,12vw,58px);line-height:.82;letter-spacing:.01em;display:flex;align-items:flex-end;gap:2px;color:var(--fg,#eef4ef)}
.pth .shape i{font-style:normal;color:var(--brass,#d8b462);font-size:.5em;margin:0 3px .12em;opacity:.8}
.pth .shape small{display:none;font-size:11px;letter-spacing:.2em;color:var(--muted,#93a99c);font-weight:700;margin-bottom:7px;margin-left:8px;text-transform:uppercase}
.pth .pkps{display:flex;flex-wrap:nowrap;gap:9px;justify-content:flex-end;align-items:flex-end}
.pth .pkk{text-align:right;line-height:1}
.pth .pkk b{display:block;font-family:var(--display,'Arial Narrow',Impact,sans-serif);font-weight:800;font-size:21px;font-variant-numeric:tabular-nums}
.pth .pkk span{font-size:10px;letter-spacing:.14em;color:var(--muted,#93a99c);text-transform:uppercase}
.pth .shape.long{font-size:clamp(34px,10vw,52px)}
.pth .bar{flex:1 0 100%;height:4px;border-radius:99px;background:#ffffff14;overflow:hidden}
.pth .bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--brass,#d8b462),var(--ok,#52d37f));transition:width .5s cubic-bezier(.2,.8,.2,1)}
.pt{position:relative;width:100%;max-width:520px;margin:0 auto;aspect-ratio:68/108;border-radius:18px;overflow:hidden;isolation:isolate;
  background:
   radial-gradient(70% 22% at 6% 0%,#fff3,transparent 70%),radial-gradient(70% 22% at 94% 0%,#fff3,transparent 70%),
   radial-gradient(120% 90% at 50% 45%,#348a4d 0%,#256b3a 52%,#12391f 100%);
  box-shadow:0 0 0 1px #ffffff22,0 0 0 5px #0b1812,0 0 0 6px color-mix(in srgb,var(--brass,#d8b462) 55%,transparent),0 26px 50px -22px #000;touch-action:pan-y;user-select:none;-webkit-user-select:none}
.pt::before{content:"";position:absolute;inset:0;z-index:-1;background:repeating-linear-gradient(180deg,#ffffff0b 0 8.333%,#00000014 8.333% 16.666%)}
.pt::after{content:"";position:absolute;inset:0;pointer-events:none;mix-blend-mode:overlay;opacity:.55;background:
   url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .45 0'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>"),
   radial-gradient(100% 100% at 50% 50%,transparent 55%,#000a 100%)}
.pt svg.pl{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.pt .fw{position:absolute;left:0;right:0;top:41%;transform:translateY(-50%);text-align:center;font-family:var(--display,'Arial Narrow',Impact,sans-serif);font-weight:800;font-size:clamp(90px,34vw,170px);line-height:.8;letter-spacing:.02em;color:#fff;opacity:.075;pointer-events:none;white-space:nowrap}
.pt .rl{position:absolute;left:9px;transform:translateY(-50%);font-family:var(--display,'Arial Narrow',Impact,sans-serif);font-weight:700;font-size:10px;letter-spacing:.2em;color:#ffffffa0;text-transform:uppercase;pointer-events:none;writing-mode:vertical-rl;rotate:180deg;opacity:.55}
.pt .dir{position:absolute;right:10px;top:10px;font-family:var(--display,'Arial Narrow',Impact,sans-serif);font-weight:700;font-size:10px;letter-spacing:.2em;color:#fff9;display:flex;align-items:center;gap:5px}
.ps{position:absolute;transform:translate(-50%,-50%);width:22%;max-width:90px;display:flex;flex-direction:column;align-items:center;gap:3px;border:0;background:none;padding:0;color:#fff;cursor:pointer;-webkit-touch-callout:none;touch-action:pan-y;z-index:2}
.ps .tok{position:relative;width:min(50px,13.2vw);aspect-ratio:1;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 28%,#ffffff2e,#0000 55%),#0d1f15;box-shadow:0 0 0 2.5px var(--fit,#ffffff55),0 6px 12px -2px #000c,inset 0 0 0 1px #fff2;transition:transform .18s cubic-bezier(.2,.8,.2,1),box-shadow .2s}
.ps:active .tok{transform:scale(.94)}
.ps svg.jer{width:78%;height:78%;filter:drop-shadow(0 2px 2px #0008)}
.ps .num{position:absolute;left:0;right:0;top:47%;transform:translateY(-50%);text-align:center;font-family:var(--display,'Arial Narrow',Impact,sans-serif);font-weight:800;font-size:clamp(13px,4.2vw,18px);line-height:1;pointer-events:none;text-shadow:0 1px 0 #0006}
.ps .rt{position:absolute;right:-7px;top:-5px;min-width:24px;padding:2px 5px 1px;border-radius:99px;background:linear-gradient(180deg,#f0d38a,#b88b2c);color:#241a05;font-family:var(--display,'Arial Narrow',Impact,sans-serif);font-weight:800;font-size:clamp(12px,3.7vw,15px);line-height:1.1;text-align:center;box-shadow:0 2px 5px #0009}
.ps .gn{position:absolute;left:-4px;top:-4px;width:15px;height:15px;border-radius:50%;background:var(--red,#e3182c);box-shadow:0 0 0 2px #0d1f15;display:grid;place-items:center;font-size:8px;line-height:1;color:#fff}
.ps .pn{display:block;max-width:100%;padding:2px 7px 1px;border-radius:5px;background:linear-gradient(180deg,#0b1510e6,#050b08f2);box-shadow:0 3px 8px -2px #000b,inset 0 0 0 1px #ffffff1c;font-family:var(--display,'Arial Narrow',Impact,sans-serif);font-weight:700;text-transform:uppercase;letter-spacing:.03em;font-size:clamp(10px,3.1vw,13px);line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center}
.ps .pn small{display:block;font-size:.72em;letter-spacing:.14em;color:var(--brass,#d8b462);line-height:1;margin-bottom:1px}
.ps.ars .pn{box-shadow:0 3px 8px -2px #000b,inset 2px 0 0 var(--red,#e3182c),inset 0 0 0 1px #ffffff1c}
.ps.empty .tok{background:#00000040;box-shadow:0 0 0 2px #ffffffa0 inset;border:0;outline:2px dashed #ffffffa0;outline-offset:-2px;animation:ptpulse 2.2s ease-in-out infinite}
.ps.empty .tok b{font-family:var(--display,'Arial Narrow',Impact,sans-serif);font-weight:800;font-size:clamp(24px,7.5vw,32px);line-height:1;color:#fff}
.ps.empty .pn{background:#00000066;color:#fffc;box-shadow:none}
@keyframes ptpulse{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.07);opacity:1}}
.ps.dragging{opacity:.3}
.ps.over .tok{transform:scale(1.18);box-shadow:0 0 0 3px var(--brass,#d8b462),0 0 22px 2px var(--brass,#d8b462)}
.pt-ghost{position:fixed;z-index:400;pointer-events:none;transform:translate(-50%,-62%) scale(1.15);filter:drop-shadow(0 12px 14px #000a)}
.pth .shape em.cust{font-style:normal;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#241a05;background:var(--brass,#d8b462);border-radius:4px;padding:3px 6px 2px;margin:0 0 .5em 10px;align-self:flex-end;line-height:1}
.pt .fw.sm{font-size:clamp(60px,20vw,110px)}
.pt.drag-on{box-shadow:0 0 0 1px #ffffff55,0 0 0 5px #0b1812,0 0 0 6px var(--brass,#d8b462),0 26px 50px -22px #000}
.pt.drag-on::before{background:repeating-linear-gradient(180deg,#ffffff0b 0 8.333%,#00000014 8.333% 16.666%),repeating-linear-gradient(90deg,#ffffff10 0 1px,transparent 1px 12.5%)}
.pt-ghost .ps{position:static;transform:none;width:auto;max-width:none}
.pt-ghost em{position:absolute;left:50%;top:100%;transform:translate(-50%,6px);white-space:nowrap;font-style:normal;font-family:var(--display,'Arial Narrow',Impact,sans-serif);font-weight:800;font-size:13px;letter-spacing:.08em;text-transform:uppercase;background:var(--brass,#d8b462);color:#241a05;padding:3px 8px 2px;border-radius:5px}
.pt-reset{border:1px solid var(--brass,#d8b462);background:none;color:var(--brass,#d8b462);font:inherit;font-weight:700;border-radius:99px;padding:2px 10px;margin-left:4px;cursor:pointer}
.pt-hint{font-size:12.5px;color:var(--muted,#93a99c);text-align:center;margin:0}
@media (prefers-reduced-motion:reduce){.ps.empty .tok{animation:none}}
`;
  let styled = false;
  function ensureStyle() { if (styled) return; styled = true; const s = document.createElement('style'); s.id = 'pitch-css'; s.textContent = CSS; document.head.appendChild(s); }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const topOf = s => 90 - s[2] * 99;     // % from top. Goal at the bottom, attack runs up the screen.
  function jersey(a, b) {
    return `<svg class="jer" viewBox="0 0 48 46" aria-hidden="true"><path d="M15 3 6 8 1 19l8 4 3-5v26h24V18l3 5 8-4-5-11-9-5c-2 4-7 6-9 6s-7-2-9-6z" fill="${a}" stroke="${b}" stroke-width="2" stroke-linejoin="round"/><path d="M15 3c2 4 7 6 9 6s7-2 9-6" fill="none" stroke="${b}" stroke-width="2.4" stroke-linecap="round"/><path d="M12 18v26M36 18v26" stroke="#0003" stroke-width="1" fill="none"/></svg>`;
  }
  const txtOn = hex => { const v = parseInt(String(hex).replace('#', ''), 16), r = v >> 16, g = v >> 8 & 255, b = v & 255; return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#101010' : '#ffffff'; };
  const LINES = { D: 'DEF', M: 'MID', A: 'ATT' };
  const SVGLINES = `<g fill="none" stroke="#ffffff" stroke-opacity=".5" stroke-width=".36" stroke-linecap="round"><rect x="2" y="2" width="64" height="88" rx="1"/><line x1="2" y1="2" x2="66" y2="2" stroke-opacity=".7"/><path d="M24.5 2a9.5 9.5 0 0 0 19 0" /><rect x="13.5" y="73.5" width="41" height="16.5"/><rect x="24.5" y="83.5" width="19" height="6.5"/><path d="M27 73.5a9 9 0 0 0 14 0"/><path d="M2 5a3 3 0 0 0 3-3M66 5a3 3 0 0 1-3-3M2 87a3 3 0 0 1 3 3M66 87a3 3 0 0 0-3 3"/></g><circle cx="34" cy="81" r=".6" fill="#fff" fill-opacity=".6"/><g stroke="#fff" stroke-opacity=".28" stroke-width=".25"><rect x="28.5" y="90" width="11" height="2.5" fill="#fff" fill-opacity=".08"/>${Array.from({ length: 6 }, (_, i) => `<line x1="${29.4 + i * 1.8}" y1="90" x2="${29.4 + i * 1.8}" y2="92.5"/>`).join('')}</g>`;

  function html(o) {
    ensureStyle();
    const sl = FORMS[o.form], kit = o.kit || { a: '#e3182c', b: '#ffffff' }, st = teamStats(o.form, o.xi), nums = shirtNums(o.xi.map(x => x != null && PL[x] ? x : null));
    const groups = { D: [], M: [], A: [] };
    sl.forEach((s, i) => { const l = LINE[s[0]]; if (groups[l]) groups[l].push({ i, x: s[1] * 68, y: topOf(s) * .92, ty: topOf(s) }); });
    const counts = ['D', 'M', 'A'].map(l => groups[l].length);
    const lab = formLabel(o.form), cust = isCustom(o.form);
    const shape = `<div class="shape${lab.length > 5 ? ' long' : ''}">${lab.split('-').map(n => `<span>${n}</span>`).join('<i>·</i>')}${cust ? '<em class="cust">custom</em>' : ''}</div>`;
    const shapeSvg = ['D', 'M', 'A'].map(l => { const g = groups[l].slice().sort((a, b) => a.x - b.x); return g.length > 1 ? `<polyline points="${g.map(p => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')}" fill="none" stroke="#fff" stroke-opacity=".34" stroke-width=".3" stroke-dasharray="1.2 1.2" stroke-linecap="round"/>` : ''; }).join('');
    const rowCentre = ['D', 'M', 'A'].map(l => { const g = groups[l]; return g.length ? { l, y: g.reduce((a, p) => a + p.ty, 0) / g.length, n: g.length } : null; }).filter(Boolean);
    const labels = rowCentre.map(r => `<span class="rl" style="top:${r.y}%">${LINES[r.l]} ${r.n}</span>`).join('');
    const slots = sl.map((s, i) => {
      const id = o.xi[i], p = id != null && PL[id] ? PL[id] : null, f = p ? fit(p, s[0]) : null, left = Math.min(88, Math.max(12, s[1] * 100)), top = topOf(s);
      const cls = 'ps ' + (p ? 'filled' + (p.ars ? ' ars' : '') : 'empty'), attrs = `${o.slotAttr ? o.slotAttr(i) : `data-slot="${esc(o.key)}:${i}"`} data-i="${i}"`;
      if (p) return `<button class="${cls}" style="left:${left}%;top:${top}%" ${attrs} data-pid="${p.id}" aria-label="${esc(s[0] + ': ' + p.name + ', rating ' + effOvr(p, s[0]) + '. Tap to change, press and hold to move')}"><span class="tok" style="--fit:${fitColor(f)}">${jersey(kit.a, kit.b)}<b class="num" style="color:${txtOn(kit.a)}">${nums[i]}</b><i class="rt">${effOvr(p, s[0])}</i>${p.ars ? '<i class="gn" aria-hidden="true">★</i>' : ''}</span><span class="pn"><small>${s[0]}</small>${esc(p.short)}</span></button>`;
      return `<button class="${cls}" style="left:${left}%;top:${top}%" ${attrs} aria-label="Add a ${s[0]}"><span class="tok"><b>+</b></span><span class="pn"><small>${s[0]}</small>pick</span></button>`;
    }).join('');
    const kp = `<div class="pkk"><b>${st.ovr || '–'}</b><span>OVR</span></div><div class="pkk"><b>${st.chem}<small style="font-size:14px;opacity:.6">/33</small></b><span>Chem</span></div><div class="pkk"><b>${st.n}<small style="font-size:14px;opacity:.6">/11</small></b><span>Picked</span></div>${st.gun ? `<div class="pkk"><b style="color:var(--red,#e3182c)">${st.gun}</b><span>Gunners</span></div>` : ''}`;
    return `<div class="pt-wrap"><div class="pth">${shape}<div class="pkps">${kp}</div><div class="bar"><i style="width:${Math.round(st.chem / 33 * 100)}%"></i></div></div>
      <div class="pt" data-key="${esc(o.key)}" data-form="${esc(o.form)}" role="group" aria-label="${esc(lab)} formation on the pitch">
        <svg class="pl" viewBox="0 0 68 92" preserveAspectRatio="none" aria-hidden="true">${SVGLINES}${shapeSvg}</svg>
        <div class="fw${lab.length > 5 ? ' sm' : ''}" aria-hidden="true">${lab}</div>${labels}<div class="dir" aria-hidden="true">ATTACK ▲</div>${slots}
      </div>${o.hint === false ? '' : `<p class="pt-hint">Tap a spot to pick a player · hold and drag onto a team-mate to swap, or onto open grass to move him there${cust ? ' · <button class="pt-reset" data-reset="${esc(o.key)}">Reset to ' + formBase(o.form) + '</button>' : ''}</p>`}</div>`;
  }

  /* ---- animation between renders: players glide to their new spots when the formation changes, and pop when newly picked ---- */
  const last = {};
  function sync() {
    document.querySelectorAll('.pt:not([data-seen])').forEach(pt => {
      pt.dataset.seen = '1'; const key = pt.dataset.key, form = pt.dataset.form, w = pt.clientWidth, h = pt.clientHeight, prev = last[key], cur = {};
      pt.querySelectorAll('.ps').forEach(el => {
        const i = +el.dataset.i, L = parseFloat(el.style.left), T = parseFloat(el.style.top), pid = el.dataset.pid || '';
        cur[i] = { L, T, pid };
        if (!prev || !el.animate || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
        const q = prev.p[i]; if (!q) return;
        if (prev.form !== form) { const dx = (q.L - L) / 100 * w, dy = (q.T - T) / 100 * h; el.animate([{ transform: `translate(-50%,-50%) translate(${dx}px,${dy}px)` }, { transform: 'translate(-50%,-50%)' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
        else if (q.pid !== pid && pid) el.querySelector('.tok').animate([{ transform: 'scale(.6)', opacity: .2 }, { transform: 'scale(1.15)', opacity: 1, offset: .6 }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
      });
      last[key] = { form, p: cur };
    });
  }
  new MutationObserver(sync).observe(document.documentElement, { childList: true, subtree: true });

  /* ---- drag a player: onto another spot = swap; onto open grass = move him there (custom shape, role re-read from where he stands).
     Mouse drags straight away; touch needs a short press-and-hold so normal scrolling still works. ---- */
  let D = null, blockClick = 0;
  const LONG = 260, MOVE = 8;
  function pickAt(x, y, pt) { const el = document.elementFromPoint(x, y); const s = el && el.closest && el.closest('.ps'); return s && pt.contains(s) ? s : null; }
  function grassAt(x, y, pt) { const r = pt.getBoundingClientRect(); if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null; const fx = (x - r.left) / r.width, ty = (y - r.top) / r.height * 100; return { x: Math.min(.94, Math.max(.06, fx)), y: Math.min(.86, Math.max(.1, (90 - ty) / 99)) }; }
  function begin(src, x, y, touch) { D = { src, pt: src.closest('.pt'), x, y, sx: x, sy: y, on: false, touch }; if (touch) D.timer = setTimeout(startDrag, LONG); }
  function startDrag() {
    if (!D || D.on) return; D.on = true; D.src.classList.add('dragging'); D.pt.classList.add('drag-on');
    const tok = D.src.querySelector('.tok'), g = document.createElement('div'), w = document.createElement('div'); g.className = 'pt-ghost'; w.className = 'ps filled'; w.appendChild(tok.cloneNode(true)); w.firstChild.style.width = tok.offsetWidth + 'px'; g.appendChild(w);
    const tag = document.createElement('em'); g.appendChild(tag); D.tag = tag; document.body.appendChild(g); D.ghost = g; move(D.x, D.y);
    try { navigator.vibrate && navigator.vibrate(12); } catch (_) { }
  }
  function move(x, y) {
    if (!D || !D.ghost) return; D.ghost.style.left = x + 'px'; D.ghost.style.top = y + 'px';
    const t = pickAt(x, y, D.pt); if (D.over && D.over !== t) D.over.classList.remove('over'); D.over = t && t !== D.src ? t : null; if (D.over) D.over.classList.add('over');
    D.grass = !D.over && +D.src.dataset.i > 0 ? grassAt(x, y, D.pt) : null;
    D.tag.textContent = D.over ? 'Swap' : D.grass ? 'Move · ' + roleAt(D.grass.x, D.grass.y) : '';
    D.tag.style.display = D.tag.textContent ? '' : 'none';
  }
  function end(commit) {
    if (!D) return; clearTimeout(D.timer); const d = D; D = null;
    if (d.ghost) d.ghost.remove(); d.src.classList.remove('dragging'); d.pt.classList.remove('drag-on'); if (d.over) d.over.classList.remove('over');
    if (!d.on) return; blockClick = Date.now() + 350; if (!commit) return;
    const key = d.pt.dataset.key, i = +d.src.dataset.i;
    if (d.over && PITCH.onSwap) PITCH.onSwap(key, i, +d.over.dataset.i);
    else if (d.grass && PITCH.onMove) PITCH.onMove(key, i, d.grass.x, d.grass.y);
  }
  const SRC = '.pt .ps:not([data-i="0"])';
  document.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button !== 0) return; const s = e.target.closest && e.target.closest(SRC); if (s) begin(s, e.clientX, e.clientY, false); });
  document.addEventListener('pointermove', e => { if (!D || D.touch) return; D.x = e.clientX; D.y = e.clientY; if (!D.on && Math.hypot(D.x - D.sx, D.y - D.sy) > MOVE) startDrag(); if (D.on) move(D.x, D.y); });
  document.addEventListener('pointerup', e => { if (D && !D.touch) end(true); });
  document.addEventListener('touchstart', e => { if (e.touches.length !== 1) { end(false); return; } const s = e.target.closest && e.target.closest(SRC); if (s) begin(s, e.touches[0].clientX, e.touches[0].clientY, true); }, { passive: true });
  document.addEventListener('touchmove', e => { if (!D || !D.touch) return; const t = e.touches[0]; D.x = t.clientX; D.y = t.clientY; if (!D.on) { if (Math.hypot(D.x - D.sx, D.y - D.sy) > MOVE) end(false); return; } e.preventDefault(); move(D.x, D.y); }, { passive: false });
  document.addEventListener('touchend', e => { if (D && D.touch) { if (D.on) e.preventDefault(); end(true); } }, { passive: false });
  document.addEventListener('touchcancel', () => { if (D && D.touch) end(false); });
  document.addEventListener('click', e => { if (Date.now() < blockClick) { e.stopPropagation(); e.preventDefault(); } }, true);
  document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('.pt .ps')) e.preventDefault(); });

  return { html, ensureStyle, sync, onSwap: null, onMove: null };
})();
