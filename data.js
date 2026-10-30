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
['Kyle Walker','RB',86,'ENG','10 20',0,94,58,76,84],['Alphonso Davies','LB',85,'CAN','20',0,96,60,76,78],['Frank Rijkaard','CDM',89,'NED','90',0,76,68,86,89]
];
const PL=RAW.map((r,i)=>({id:i,name:r[0],pos:r[1],ovr:r[2],nat:r[3],dec:r[4].split(' '),ars:!!r[5],s:[r[6],r[7],r[8],r[9]]}));
PL.forEach(p=>{const m=p.name.match(/\b((van der|van|de) \S+)$/i);let s=m?m[1]:p.name.split(' ').slice(-1)[0];
  if(p.name==='Cristiano Ronaldo')s='C. Ronaldo'; if(p.name==='Ronaldo Nazário')s='Ronaldo';
  p.short=s.charAt(0).toUpperCase()+s.slice(1);});
const byName=n=>{const p=PL.find(x=>x.name===n);return p?p.id:null};
const eraLabel=p=>{const f=d=>"'"+d+'s';return p.dec.length>1?f(p.dec[0])+'–'+f(p.dec[p.dec.length-1]):f(p.dec[0])};
const statLbl=p=>p.pos==='GK'?['DIV','REF','HAN','KIC']:['PAC','SHO','PAS','DEF'];

const FORMS={
 '4-3-3':[['GK',.5,.02],['LB',.14,.24],['CB',.37,.18],['CB',.63,.18],['RB',.86,.24],['CM',.27,.47],['CDM',.5,.38],['CM',.73,.47],['LW',.16,.72],['ST',.5,.8],['RW',.84,.72]],
 '4-4-2':[['GK',.5,.02],['LB',.14,.24],['CB',.37,.18],['CB',.63,.18],['RB',.86,.24],['LM',.14,.52],['CM',.38,.44],['CM',.62,.44],['RM',.86,.52],['ST',.38,.78],['ST',.62,.78]],
 '4-2-3-1':[['GK',.5,.02],['LB',.14,.24],['CB',.37,.18],['CB',.63,.18],['RB',.86,.24],['CDM',.37,.38],['CDM',.63,.38],['LW',.16,.62],['CAM',.5,.6],['RW',.84,.62],['ST',.5,.8]],
 '3-4-1-2':[['GK',.5,.02],['CB',.26,.2],['CB',.5,.17],['CB',.74,.2],['LM',.1,.5],['CDM',.36,.4],['CDM',.64,.4],['RM',.9,.5],['CAM',.5,.62],['ST',.38,.8],['ST',.62,.8]],
 '3-5-2':[['GK',.5,.02],['CB',.26,.2],['CB',.5,.17],['CB',.74,.2],['LM',.1,.5],['CM',.32,.48],['CDM',.5,.37],['CM',.68,.48],['RM',.9,.5],['ST',.38,.78],['ST',.62,.78]]
};
const COMPAT={GK:['GK'],CB:['CB'],LB:['LB'],RB:['RB'],CDM:['CDM','CM'],CM:['CM','CDM','CAM'],CAM:['CAM','CF','CM'],LW:['LW'],RW:['RW'],LM:['LW','LM','LB'],RM:['RW','RM','RB'],ST:['ST','CF']};
const LINE={GK:'G',CB:'D',LB:'D',RB:'D',CDM:'M',CM:'M',CAM:'M',CF:'A',LW:'A',RW:'A',LM:'M',RM:'M',ST:'A'};
function fit(p,slotPos){if(COMPAT[slotPos].includes(p.pos))return 'nat';const a=LINE[p.pos],b=LINE[slotPos];if(a==='G'||b==='G')return 'off';if(a===b||(b==='M'&&a==='A'&&(slotPos==='LM'||slotPos==='RM')))return 'line';return 'off'}
const effOvr=(p,sp)=>{const f=fit(p,sp);return p.ovr-(f==='nat'?0:f==='line'?4:12)};
const fitColor=f=>f==='nat'?'var(--ok)':f==='line'?'var(--warn)':'var(--bad)';

const PRESETS={
 inv:{form:'4-4-2',names:['Jens Lehmann','Ashley Cole','Sol Campbell','Kolo Touré','Lauren','Robert Pires','Patrick Vieira','Gilberto Silva','Freddie Ljungberg','Thierry Henry','Dennis Bergkamp']},
 ars:{form:'4-2-3-1',names:['David Seaman','Ashley Cole','Tony Adams','Sol Campbell','Lee Dixon','Patrick Vieira','Declan Rice','Robert Pires','Dennis Bergkamp','Bukayo Saka','Thierry Henry']},
 dark:{form:'3-4-1-2',names:['Oliver Kahn','Jaap Stam','Sergio Ramos','Pepe','Alphonso Davies','Patrick Vieira','Frank Rijkaard','Kyle Walker','Luis Suárez','Didier Drogba','Zlatan Ibrahimović']},
 mod:{form:'4-3-3',names:['David Raya','Ashley Cole','William Saliba','Gabriel','Ben White','Santi Cazorla','Declan Rice','Martin Ødegaard','Gabriel Martinelli','Thierry Henry','Bukayo Saka']}
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
const SHIRTS={'Oliver Kahn':1,'Pepe':3,'Sergio Ramos':4,'Jaap Stam':6,'Kyle Walker':2,'Alphonso Davies':19,'Patrick Vieira':14,'Frank Rijkaard':8,'Luis Suárez':9,'Didier Drogba':11,'Zlatan Ibrahimović':10};
function shirtNums(xi){const used=new Set(),out=xi.map(id=>{const n=id!=null&&PL[id]?SHIRTS[PL[id].name]:undefined;if(n&&!used.has(n)){used.add(n);return n}return 0});
  let c=1;return out.map((n,i)=>{if(n)return n;if(PL[xi[i]]&&PL[xi[i]].pos==='GK'&&!used.has(1)){used.add(1);return 1}while(used.has(c))c++;used.add(c);return c})}
