/* Legends XI shared data — player database, formations, fit rules. Append new players at the END of RAW so saved ids stay stable. */
/* ---------------- DATA ----------------
 [name, pos, ovr, nation, decades, arsenal, a,b,c,d]  outfield a-d = PAC SHO PAS DEF ; GK a-d = DIV REF HAN KIC */
const RAW=[
['David Seaman','GK',88,'ENG','90 00',1,87,88,86,72],['Jens Lehmann','GK',85,'GER','00',1,84,85,82,78],['David Raya','GK',86,'ESP','20',1,83,85,84,90],
['Gianluigi Buffon','GK',93,'ITA','90 00 10',0,91,94,92,70],['Iker Casillas','GK',91,'ESP','00 10',0,93,95,86,68],['Manuel Neuer','GK',92,'GER','10 20',0,90,90,88,92],
['Peter Schmeichel','GK',90,'DEN','90',0,90,91,88,80],['Edwin van der Sar','GK',88,'NED','90 00',0,86,88,88,85],['Alisson','GK',90,'BRA','10 20',0,88,89,88,88],
['Tony Adams','CB',88,'ENG','90 00',1,70,55,68,90],['Martin Keown','CB',85,'ENG','90 00',1,72,40,62,88],['Sol Campbell','CB',88,'ENG','90 00',1,80,50,64,90],
['Kolo Touré','CB',85,'CIV','00 10',1,84,45,66,86],['William Saliba','CB',88,'FRA','20',1,84,40,76,90],['Gabriel','CB',87,'BRA','20',1,74,55,66,89],
['Laurent Koscielny','CB',85,'FRA','10',1,80,40,70,87],['Paolo Maldini','CB',94,'ITA','90 00',0,82,55,80,96],['Fabio Cannavaro','CB',91,'ITA','90 00',0,82,45,70,94],
['Alessandro Nesta','CB',91,'ITA','90 00',0,80,40,74,94],['Carles Puyol','CB',89,'ESP','00 10',0,78,45,70,91],['Sergio Ramos','CB',90,'ESP','00 10 20',0,80,68,76,91],
['Virgil van Dijk','CB',91,'NED','10 20',0,83,60,78,92],['John Terry','CB',89,'ENG','00 10',0,66,55,70,91],['Rio Ferdinand','CB',88,'ENG','00 10',0,80,45,72,90],
['Thiago Silva','CB',89,'BRA','10 20',0,76,50,76,91],
['Ashley Cole','LB',89,'ENG','00 10',1,90,55,78,88],['Lee Dixon','RB',85,'ENG','90 00',1,80,50,74,85],['Lauren','RB',84,'CMR','00',1,80,55,74,84],
['Ben White','RB',85,'ENG','20',1,80,50,78,85],['Roberto Carlos','LB',91,'BRA','90 00',0,95,80,82,84],['Marcelo','LB',87,'BRA','00 10',0,86,70,86,76],
['Cafu','RB',91,'BRA','90 00',0,92,65,82,87],['Dani Alves','RB',89,'BRA','00 10',0,88,68,88,80],['Philipp Lahm','RB',89,'GER','00 10',0,84,55,88,90],
['Javier Zanetti','RB',88,'ARG','90 00',0,82,55,80,88],
['Patrick Vieira','CDM',91,'FRA','90 00',1,80,72,82,90],['Gilberto Silva','CDM',85,'BRA','00',1,68,55,76,87],['Declan Rice','CDM',89,'ENG','20',1,78,72,82,88],
['Emmanuel Petit','CM',86,'FRA','90',1,70,70,84,82],['Cesc Fàbregas','CM',89,'ESP','00 10',1,74,78,93,62],['Santi Cazorla','CM',87,'ESP','10',1,72,80,90,58],
['Mikel Arteta','CM',84,'ESP','00 10',1,68,70,86,72],['Claude Makélélé','CDM',88,'FRA','90 00',0,74,50,80,91],['Roy Keane','CDM',89,'IRL','90 00',0,74,68,82,89],
['Andrea Pirlo','CM',91,'ITA','00 10',0,62,80,96,64],['Xavi','CM',93,'ESP','00 10',0,70,72,97,66],['Andrés Iniesta','CM',93,'ESP','00 10',0,78,76,93,60],
['Steven Gerrard','CM',90,'ENG','00 10',0,80,88,88,74],['Frank Lampard','CM',89,'ENG','00 10',0,74,90,86,66],['Paul Scholes','CM',89,'ENG','90 00',0,68,86,92,68],
['Luka Modrić','CM',92,'CRO','10 20',0,76,78,94,72],['Toni Kroos','CM',91,'GER','10 20',0,56,84,95,70],['Sergio Busquets','CDM',89,'ESP','10 20',0,60,55,90,86],
["N'Golo Kanté",'CDM',89,'FRA','10 20',0,82,62,78,90],
['Martin Ødegaard','CAM',89,'NOR','20',1,76,82,93,58],['Dennis Bergkamp','CF',92,'NED','90 00',1,78,90,93,42],['Tomáš Rosický','CAM',85,'CZE','00 10',1,78,78,87,50],
['Zinedine Zidane','CAM',95,'FRA','90 00',0,80,88,96,60],['Kaká','CAM',92,'BRA','00 10',0,92,88,88,45],['Ronaldinho','CAM',94,'BRA','00',0,90,88,92,40],
['Rivaldo','CAM',91,'BRA','90 00',0,84,90,86,45],['Kevin De Bruyne','CAM',92,'BEL','10 20',0,78,88,96,60],['Francesco Totti','CF',91,'ITA','90 00 10',0,78,90,92,45],
['Roberto Baggio','CF',92,'ITA','90',0,84,92,90,40],['Alessandro Del Piero','CF',90,'ITA','90 00',0,82,90,88,42],
['Robert Pires','LW',88,'FRA','00',1,84,84,88,50],['Marc Overmars','LW',87,'NED','90',1,94,80,80,40],['Gabriel Martinelli','LW',85,'BRA','20',1,92,80,78,55],
['Alexis Sánchez','LW',88,'CHI','10',1,88,86,84,55],['Bukayo Saka','RW',90,'ENG','20',1,88,86,88,62],['Freddie Ljungberg','RW',85,'SWE','90 00',1,84,80,80,55],
['Luís Figo','RW',91,'POR','90 00',0,86,84,90,48],['David Beckham','RW',89,'ENG','90 00',0,74,84,95,60],['Arjen Robben','RW',91,'NED','00 10',0,92,88,86,40],
['Lionel Messi','RW',97,'ARG','00 10 20',0,90,95,95,38],['Mohamed Salah','RW',91,'EGY','10 20',0,93,90,84,45],['Ryan Giggs','LW',88,'WAL','90 00',0,90,80,86,45],
['Pavel Nedvěd','LW',90,'CZE','90 00',0,84,88,88,65],['Franck Ribéry','LW',90,'FRA','00 10',0,90,84,88,45],['Eden Hazard','LW',90,'BEL','10',0,91,84,88,35],
['Neymar','LW',91,'BRA','10 20',0,93,88,88,35],['Cristiano Ronaldo','LW',96,'POR','00 10 20',0,95,96,84,40],
['Thierry Henry','ST',94,'FRA','90 00',1,96,93,86,45],['Ian Wright','ST',88,'ENG','90',1,88,90,72,40],['Robin van Persie','ST',90,'NED','00 10',1,80,92,86,42],
['Nicolas Anelka','ST',85,'FRA','90 00',1,92,86,74,38],['Pierre-Emerick Aubameyang','ST',88,'GAB','10 20',1,95,88,74,40],['Kanu','ST',83,'NGA','90 00',1,74,82,82,40],
['Sylvain Wiltord','ST',83,'FRA','00',1,86,82,78,42],['Ronaldo Nazário','ST',96,'BRA','90 00',0,97,96,82,35],['Marco van Basten','ST',93,'NED','90',0,82,96,84,40],
['Gabriel Batistuta','ST',91,'ARG','90 00',0,82,94,72,40],['Andriy Shevchenko','ST',91,'UKR','90 00',0,90,92,78,42],['Raúl','ST',90,'ESP','90 00',0,82,90,84,40],
['Romário','ST',92,'BRA','90',0,88,94,80,30],['Alan Shearer','ST',90,'ENG','90 00',0,80,93,76,45],['George Weah','ST',90,'LBR','90',0,92,90,80,40],
["Samuel Eto'o",'ST',90,'CMR','00 10',0,92,90,78,45],['Zlatan Ibrahimović','ST',91,'SWE','00 10',0,78,92,86,40],['Didier Drogba','ST',89,'CIV','00 10',0,82,90,74,45],
['Wayne Rooney','ST',89,'ENG','00 10',0,84,88,86,55],['Luis Suárez','CF',92,'URU','10',0,84,93,86,45],['Robert Lewandowski','ST',92,'POL','10 20',0,80,95,82,40],
['Karim Benzema','ST',91,'FRA','10 20',0,80,90,88,40],['Harry Kane','ST',90,'ENG','10 20',0,70,93,88,45],['Kylian Mbappé','ST',93,'FRA','10 20',0,98,92,84,36],
['Erling Haaland','ST',92,'NOR','20',0,92,95,70,45],
['Oliver Kahn','GK',92,'GER','90 00',0,88,93,90,78],['Pepe','CB',87,'POR','00 10 20',0,78,50,66,89],['Jaap Stam','CB',89,'NED','90 00',0,80,45,66,92],
['Kyle Walker','RB',86,'ENG','10 20',0,94,58,76,84],['Alphonso Davies','LB',85,'CAN','20',0,96,60,76,78],['Frank Rijkaard','CDM',89,'NED','90',0,76,68,86,89],
['Jurriën Timber','RB',85,'NED','20',1,84,50,78,86],['Riccardo Calafiori','LB',83,'ITA','20',1,80,58,78,83],['Thomas Partey','CDM',85,'GHA','10 20',1,72,72,82,86],
['Kai Havertz','CF',85,'GER','10 20',1,78,84,82,55],['Leandro Trossard','LW',83,'BEL','10 20',1,82,83,82,45],['Gabriel Jesus','ST',83,'BRA','10 20',1,86,82,80,50],
['Martín Zubimendi','CDM',86,'ESP','20',1,66,64,88,85],['Viktor Gyökeres','ST',86,'SWE','20',1,88,88,72,45],['Oleksandr Zinchenko','LB',82,'UKR','10 20',1,74,65,86,76],
['Eberechi Eze','CAM',85,'ENG','20',1,84,84,86,45]
];
const PL=RAW.map((r,i)=>({id:i,name:r[0],pos:r[1],ovr:r[2],nat:r[3],dec:r[4].split(' '),ars:!!r[5],s:[r[6],r[7],r[8],r[9]]}));
PL.forEach(p=>{const m=p.name.match(/\b((van der|van|de) \S+)$/i);let s=m?m[1]:p.name.split(' ').slice(-1)[0];
  if(p.name==='Cristiano Ronaldo')s='C. Ronaldo'; if(p.name==='Ronaldo Nazário')s='Ronaldo';
  p.short=s.charAt(0).toUpperCase()+s.slice(1);});
const byName=n=>{const p=PL.find(x=>x.name===n);return p?p.id:null};
const eraLabel=p=>{const f=d=>"'"+d+'s';return p.dec.length>1?f(p.dec[0])+'–'+f(p.dec[p.dec.length-1]):f(p.dec[0])};
const statLbl=p=>p.pos==='GK'?['DIV','REF','HAN','KIC']:['PAC','SHO','PAS','DEF'];

const FORM_BASE={
 '4-3-3':[['GK',.5,.02],['LB',.14,.24],['CB',.37,.18],['CB',.63,.18],['RB',.86,.24],['CM',.27,.47],['CDM',.5,.38],['CM',.73,.47],['LW',.16,.72],['ST',.5,.8],['RW',.84,.72]],
 '4-4-2':[['GK',.5,.02],['LB',.14,.24],['CB',.37,.18],['CB',.63,.18],['RB',.86,.24],['LM',.14,.52],['CM',.38,.44],['CM',.62,.44],['RM',.86,.52],['ST',.38,.78],['ST',.62,.78]],
 '4-2-3-1':[['GK',.5,.02],['LB',.14,.24],['CB',.37,.18],['CB',.63,.18],['RB',.86,.24],['CDM',.37,.38],['CDM',.63,.38],['LW',.16,.62],['CAM',.5,.6],['RW',.84,.62],['ST',.5,.8]],
 '3-4-1-2':[['GK',.5,.02],['CB',.26,.2],['CB',.5,.17],['CB',.74,.2],['LM',.1,.5],['CDM',.36,.4],['CDM',.64,.4],['RM',.9,.5],['CAM',.5,.62],['ST',.38,.8],['ST',.62,.8]],
 '3-5-2':[['GK',.5,.02],['CB',.26,.2],['CB',.5,.17],['CB',.74,.2],['LM',.1,.5],['CM',.32,.48],['CDM',.5,.37],['CM',.68,.48],['RM',.9,.5],['ST',.38,.78],['ST',.62,.78]],
 '4-1-4-1':[['GK',.5,.02],['LB',.14,.24],['CB',.37,.18],['CB',.63,.18],['RB',.86,.24],['CDM',.5,.36],['LM',.12,.54],['CM',.37,.5],['CM',.63,.5],['RM',.88,.54],['ST',.5,.8]],
 '4-4-1-1':[['GK',.5,.02],['LB',.14,.24],['CB',.37,.18],['CB',.63,.18],['RB',.86,.24],['LM',.14,.48],['CM',.38,.42],['CM',.62,.42],['RM',.86,.48],['CAM',.5,.64],['ST',.5,.8]],
 '4-1-2-1-2':[['GK',.5,.02],['LB',.14,.24],['CB',.37,.18],['CB',.63,.18],['RB',.86,.24],['CDM',.5,.36],['CM',.3,.48],['CM',.7,.48],['CAM',.5,.61],['ST',.38,.8],['ST',.62,.8]],
 '4-3-2-1':[['GK',.5,.02],['LB',.14,.24],['CB',.37,.18],['CB',.63,.18],['RB',.86,.24],['CM',.27,.45],['CDM',.5,.38],['CM',.73,.45],['CAM',.33,.64],['CAM',.67,.64],['ST',.5,.82]],
 '3-4-3':[['GK',.5,.02],['CB',.26,.2],['CB',.5,.17],['CB',.74,.2],['LM',.1,.48],['CM',.37,.43],['CM',.63,.43],['RM',.9,.48],['LW',.18,.72],['ST',.5,.8],['RW',.82,.72]],
 '5-3-2':[['GK',.5,.02],['LB',.08,.3],['CB',.3,.19],['CB',.5,.16],['CB',.7,.19],['RB',.92,.3],['CM',.28,.46],['CDM',.5,.4],['CM',.72,.46],['ST',.38,.78],['ST',.62,.78]],
 '5-4-1':[['GK',.5,.02],['LB',.08,.3],['CB',.3,.19],['CB',.5,.16],['CB',.7,.19],['RB',.92,.3],['LM',.14,.52],['CM',.38,.45],['CM',.62,.45],['RM',.86,.52],['ST',.5,.8]]
};
/* Custom shapes: drag any outfield player anywhere on the pitch. A custom shape is stored as a formation key
   "~<base>:" + 10 x 4 digits (xxyy, hundredths) for slots 1-10, so it travels through saves, team codes and both match engines
   unchanged. Each slot's role (CB, CM, RW...) is re-read from where it now stands. */
function roleAt(x,y){const w=x<.5?'L':'R',wide=v=>x<v||x>1-v;
  if(y<.3)return wide(.25)?w+'B':'CB';
  if(y<.42)return wide(.2)?(y<.36?w+'B':w+'M'):'CDM';
  if(y<.58)return wide(.22)?w+'M':'CM';
  if(y<.7)return wide(.25)?w+'W':'CAM';
  return wide(.25)?w+'W':'ST'}
const _fc={};
function parseForm(k){if(typeof k!=='string'||k[0]!=='~')return null;if(_fc[k])return _fc[k];
  const m=k.match(/^~([0-9-]{5,9}):(\d{40})$/);if(!m||!FORM_BASE[m[1]])return null;const d=m[2],out=[['GK',.5,.02]];
  for(let i=0;i<10;i++){const x=+d.substr(i*4,2)/100,y=+d.substr(i*4+2,2)/100;if(x<.04||x>.96||y<.08||y>.88)return null;out.push([roleAt(x,y),x,y])}
  return _fc[k]=out}
const FORMS=new Proxy(FORM_BASE,{get:(t,k)=>k in t?t[k]:parseForm(k)||undefined,has:(t,k)=>k in t||!!parseForm(k)});
const isCustom=f=>typeof f==='string'&&f[0]==='~';
const formBase=f=>isCustom(f)?f.slice(1,f.indexOf(':')):f;
const p2=v=>String(Math.round(Math.min(.96,Math.max(.04,v))*100)).padStart(2,'0');
function formMove(f,i,x,y){const sl=FORMS[f];if(!sl||i<1||i>10)return f;x=Math.min(.94,Math.max(.06,x));y=Math.min(.86,Math.max(.1,y));
  return '~'+formBase(f)+':'+sl.slice(1).map((s,j)=>j+1===i?p2(x)+p2(y):p2(s[1])+p2(s[2])).join('')}
/* "4-2-3-1" style label: base shapes keep their name; custom shapes are grouped into lines by depth */
function formLabel(f){if(!isCustom(f))return f;const ys=FORMS[f].slice(1).map(s=>s[2]).sort((a,b)=>a-b),g=[1];
  for(let i=1;i<ys.length;i++){if(ys[i]-ys[i-1]>.075)g.push(1);else g[g.length-1]++}return g.join('-')}

const COMPAT={GK:['GK'],CB:['CB'],LB:['LB'],RB:['RB'],CDM:['CDM','CM'],CM:['CM','CDM','CAM'],CAM:['CAM','CF','CM'],LW:['LW'],RW:['RW'],LM:['LW','LM','LB'],RM:['RW','RM','RB'],ST:['ST','CF']};
const LINE={GK:'G',CB:'D',LB:'D',RB:'D',CDM:'M',CM:'M',CAM:'M',CF:'A',LW:'A',RW:'A',LM:'M',RM:'M',ST:'A'};
function fit(p,slotPos){if(COMPAT[slotPos].includes(p.pos))return 'nat';const a=LINE[p.pos],b=LINE[slotPos];if(a==='G'||b==='G')return 'off';if(a===b||(b==='M'&&a==='A'&&(slotPos==='LM'||slotPos==='RM')))return 'line';return 'off'}
const effOvr=(p,sp)=>{const f=fit(p,sp);return p.ovr-(f==='nat'?0:f==='line'?4:12)};
const fitColor=f=>f==='nat'?'var(--ok)':f==='line'?'var(--warn)':'var(--bad)';

const PRESETS={
 inv:{form:'4-4-2',names:['Jens Lehmann','Ashley Cole','Sol Campbell','Kolo Touré','Lauren','Robert Pires','Patrick Vieira','Gilberto Silva','Freddie Ljungberg','Thierry Henry','Dennis Bergkamp']},
 ars:{form:'4-2-3-1',names:['David Seaman','Ashley Cole','Tony Adams','Sol Campbell','Lee Dixon','Patrick Vieira','Declan Rice','Robert Pires','Dennis Bergkamp','Bukayo Saka','Thierry Henry']},
 dark:{form:'3-4-1-2',names:['Oliver Kahn','Jaap Stam','Sergio Ramos','Pepe','Alphonso Davies','Patrick Vieira','Frank Rijkaard','Kyle Walker','Luis Suárez','Didier Drogba','Zlatan Ibrahimović']},
 mod:{form:'4-3-3',names:['David Raya','Riccardo Calafiori','Gabriel','William Saliba','Ben White','Declan Rice','Thomas Partey','Martin Ødegaard','Gabriel Martinelli','Kai Havertz','Bukayo Saka']}
};

function teamStats(form,xi){const sl=FORMS[form];let sum=0,n=0,chem=0,gun=0;
  xi.forEach((id,i)=>{if(id==null)return;const p=PL[id],f=fit(p,sl[i][0]);sum+=effOvr(p,sl[i][0]);n++;chem+=f==='nat'?3:f==='line'?1:0;if(p.ars)gun++});
  return {ovr:n?Math.round(sum/n):0,chem,gun,n}}
function autofill(form,xi,pool){const sl=FORMS[form];const out=xi.slice();const used=new Set(out.filter(x=>x!=null));
  const order=[...sl.keys()].sort((a,b)=>(sl[a][0]==='GK'?-1:0)-(sl[b][0]==='GK'?-1:0));
  for(const i of order){if(out[i]!=null)continue;let best=null,bs=-1;for(const p of pool){if(used.has(p.id))continue;const v=effOvr(p,sl[i][0])+(fit(p,sl[i][0])==='nat'?.5:0);if(v>bs){bs=v;best=p}}
    if(best){out[i]=best.id;used.add(best.id)}}
  return out}

/* Real shirt numbers where we know them (Dark Arts Warriors squad). Anyone else gets the lowest free number. */
const SHIRTS={'Oliver Kahn':1,'Pepe':3,'Sergio Ramos':4,'Jaap Stam':6,'Kyle Walker':2,'Alphonso Davies':19,'Patrick Vieira':14,'Frank Rijkaard':8,'Luis Suárez':9,'Didier Drogba':11,'Zlatan Ibrahimović':10,
 'David Raya':22,'William Saliba':2,'Gabriel':6,'Ben White':4,'Riccardo Calafiori':33,'Declan Rice':41,'Thomas Partey':5,'Martin Ødegaard':8,'Bukayo Saka':7,'Kai Havertz':29,'Gabriel Martinelli':11,'Jurriën Timber':12,'Martín Zubimendi':36,'Viktor Gyökeres':14,'Eberechi Eze':10};
function shirtNums(xi){const used=new Set(),out=xi.map(id=>{const n=id!=null&&PL[id]?SHIRTS[PL[id].name]:undefined;if(n&&!used.has(n)){used.add(n);return n}return 0});
  let c=1;return out.map((n,i)=>{if(n)return n;if(PL[xi[i]]&&PL[xi[i]].pos==='GK'&&!used.has(1)){used.add(1);return 1}while(used.has(c))c++;used.add(c);return c})}

/* ---------- Skill moves and tackle animations, shared by the live engine, the 22-player sim and both 3D renderers ----------
   s = {k, fx, fy (attack dir), lx, ly (unit vector away from the nearest defender), ex, ey (exit dir), spin}
   skillMove(s, u) -> [vx, vy, faceX, faceY] for progress u in 0..1. skillBall(s, u) -> [forward offset, height] while the ball is lifted. */
const SKILLS={
  cro:{name:'La Croqueta',dur:.34,beat:0},
  rou:{name:'Marseille turn',dur:.62,beat:-.05},
  step:{name:'Stepover',dur:.5,beat:.03},
  ela:{name:'Elastico',dur:.4,beat:.05},
  flick:{name:'Rainbow flick',dur:.7,beat:.07},
  cru:{name:'Cruyff turn',dur:.52,beat:0}
};
const SKILL_KEYS=Object.keys(SKILLS);
/* action codes carried in snapshots / recorded frames: 1 two-footed slide, 2 standing tackle, 3+ skills in SKILL_KEYS order */
const ACT_CODE={slide:1,poke:2};SKILL_KEYS.forEach((k,i)=>ACT_CODE[k]=3+i);
function skillSetup(k,fx,fy,ox,oy,px,py){ // ox,oy: nearest defender position relative to player
  let lx=-fy,ly=fx;if(ox*lx+oy*ly>0){lx=-lx;ly=-ly}
  const s={k,t:0,dur:SKILLS[k].dur,fx,fy,lx,ly,ex:fx,ey:fy,spin:(lx*fy-ly*fx)>0?-1:1};
  if(k==='cru'){let ex=lx*.85+fx*.3,ey=ly*.85+fy*.3;const n=Math.hypot(ex,ey)||1;s.ex=ex/n;s.ey=ey/n}
  return s}
function skillMove(s,u){const f=(lat,fw)=>[s.lx*lat+s.fx*fw,s.ly*lat+s.fy*fw];let v,fc=[s.fx,s.fy];
  switch(s.k){
    case 'cro':v=f(6.8*(1-u)+.8,2.5+5*u);fc=[s.fx*.7+s.lx*.3,s.fy*.7+s.ly*.3];break;
    case 'rou':{const a=u*Math.PI*2*s.spin,c=Math.cos(a),sn=Math.sin(a);fc=[s.fx*c-s.fy*sn,s.fx*sn+s.fy*c];v=f(3.4*Math.sin(u*Math.PI)+.6,1.8+2.2*u);break}
    case 'step':v=u<.45?f(-1.6,1.2):f(5.6*(1-u)+.6,2+5*(u-.45));break;
    case 'ela':v=u<.3?f(-3,1.5):f(7.5*(1-u)+.5,2+3*u);break;
    case 'flick':v=f(.2,3+3.6*u);break;
    case 'cru':if(u<.5){v=f(.4,1.6*(1-2*u));fc=[s.fx*(1-u)+s.ex*u,s.fy*(1-u)+s.ey*u]}else{const sp=2+6*(u-.5);v=[s.ex*sp,s.ey*sp];fc=[s.ex,s.ey]}break;
    default:v=f(0,3)}
  const n=Math.hypot(fc[0],fc[1])||1;return [v[0],v[1],fc[0]/n,fc[1]/n]}
function skillBall(s,u){if(s.k!=='flick')return null;return [-.45+2.1*u,Math.sin(Math.min(1,u*1.1)*Math.PI)*1.9]}
