/* Smart Home Estimator — app logic (vanilla JS, no build step) */
(function(){
'use strict';
const CFG=Object.assign({appName:'Smart Home Estimator',company:{},currency:'BDT',defaultNotes:'',estimateValidityDays:30,showExampleProject:true},window.APP_CONFIG||{});
const CO=CFG.company||{};
if(!window.CATALOG||!window.EstimateCore){document.getElementById('main').innerHTML='<p style="padding:40px">Product list could not be loaded (data/products.js).</p>';return;}
// Pricing lives in estimate-core.js so the admin panel and the server compute the same totals
const CORE=window.EstimateCore.create(window.CATALOG,CFG);
const GROUPS=CORE.GROUPS, PMAP=CORE.PMAP, SUGGEST=CORE.SUGGEST;
const PRODUCTS=CORE.PRODUCTS.filter(p=>!p.hidden);   // archived products stay in PMAP so saved projects still show them
const {catLabel,fmt,variantOf,lineInfo,roomTotal,projTotal,projCount,onRequestCount,priceLabel,unitText,estNo}=CORE;
// ---------- constants ----------
const ROOM_TYPES=[
  {t:'foyer',label:'Foyer',def:1,ico:'door'},{t:'living',label:'Living room',def:1,ico:'sofa'},{t:'family',label:'Family living',def:2,ico:'sofa'},
  {t:'dining',label:'Dining',def:1,ico:'dining'},{t:'kitchen',label:'Kitchen',def:2,ico:'kitchen'},{t:'bedroom',label:'Bedroom',def:3,ico:'bed'},
  {t:'child',label:"Child's room",def:1,ico:'star'},{t:'guest',label:'Guest room',def:1,ico:'bed'},{t:'bath',label:'Bathroom',def:4,ico:'bath'},{t:'balcony',label:'Balcony',def:3,ico:'sun'}];
const CUSTOM_CATS=['Networking','Audio & Video','Electrical','Installation & Labour','Furniture & Fit-out','Other'];
const DEFAULT_NOTES=CFG.defaultNotes||'Prices are retail estimates in Bangladeshi Taka (BDT). Items marked "Price on request" are not included in the total. Final quotation may change after a site survey.';

// ---------- icons ----------
const ICONS={
  door:'<path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"/><path d="M3 21h18"/><circle cx="14.5" cy="12" r=".8"/>',
  sofa:'<path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3"/><path d="M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v4H2z"/><path d="M5 17v2M19 17v2"/>',
  dining:'<circle cx="12" cy="12" r="5"/><path d="M3 4v6a2 2 0 0 0 2 2v8M5 4v4M21 4c-1.7 0-3 2-3 5s1.3 3 3 3v8"/>',
  kitchen:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 10h16M8 6.5h.01M12 6.5h.01M8 14v3"/>',
  bed:'<path d="M3 18V7M21 18v-5a3 3 0 0 0-3-3H10v8"/><path d="M3 14h18M3 18h18"/><circle cx="6.5" cy="10.5" r="1.5"/>',
  star:'<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
  bath:'<path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z"/><path d="M6 12V5a2 2 0 0 1 3.5-1.3M7 19l-1 2M17 19l1 2"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  home:'<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  download:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',file:'<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/>',
  box:'<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',chat:'<path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12z"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',arrowR:'<path d="M5 12h14M13 6l6 6-6 6"/>',arrowL:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1"/>',
  upload:'<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'};
const ico=(n,cls='i')=>`<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]||''}</svg>`;

// ---------- utils ----------
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const $=s=>document.querySelector(s);
const clone=o=>JSON.parse(JSON.stringify(o));

// ---------- storage ----------
const KEY='smart-home-estimator:v1';
let store={projects:[],active:null};
function load(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&Array.isArray(s.projects))store=s;}catch(e){}}
let saveT=null;
function save(){if(ADMIN)return;clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){}},250);}

// ---------- server sync ----------
// api/public/bootstrap.js sets ESTIMATOR_API when the app runs on its own server. On a plain static host it is absent
// and projects stay in this browser only.
const API=!!window.ESTIMATOR_API;
const EDIT_ID=API?new URLSearchParams(location.search).get('edit'):null;
let ADMIN=false;                       // an admin is editing a client's budget (?edit=<projectId>)
const TKEY='smart-home-estimator:token';
let tok=null;
function token(){if(tok)return tok;try{tok=localStorage.getItem(TKEY);}catch(e){}
  if(!tok){tok=uid()+uid()+uid();try{localStorage.setItem(TKEY,tok);}catch(e){}}return tok;}
const sync={state:'off',queue:new Set(),t:null};
// Skip the untouched example and empty new projects
function syncable(p){if(!p)return false;if(ADMIN)return true;
  if(p.example&&(!p.client.name||p.client.name==='Example client'))return false;
  return !!((p.name||'').trim()||(p.client.name||'').trim()||projCount(p));}
function queueSync(p){if(!API||!syncable(p))return;sync.queue.add(p.id);clearTimeout(sync.t);sync.t=setTimeout(flushSync,ADMIN?800:2000);}
async function flushSync(){
  const ids=[...sync.queue];sync.queue.clear();if(!ids.length)return;
  setSync('saving');let ok=true;
  for(const id of ids){const p=store.projects.find(x=>x.id===id);if(!p)continue;
    try{const r=ADMIN?await fetch('api/admin/projects/'+encodeURIComponent(id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:p})})
        :await fetch('api/public/projects/'+encodeURIComponent(id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:token(),project:p})});
      if(r.ok){const d=await r.json().catch(()=>({}));if(d.rev){p.rev=d.rev;save();}   // server revision this browser has seen
        if(d.prices)applyPrices(p,d.prices);}
      else{ok=false;if(r.status===429||r.status>=500)sync.queue.add(id);}
      if(r.status===401&&ADMIN){toast('Your admin session ended. Sign in again in another tab, then make any change to save.');}}
    catch(e){ok=false;sync.queue.add(id);}}
  setSync(ok?'saved':'error');
  if(sync.queue.size){clearTimeout(sync.t);sync.t=setTimeout(flushSync,15000);}
}
// Budgets with status "new" follow the product list: the server sends back today's price for any line that changed
function applyPrices(p,prices){let n=0;
  p.rooms.forEach(r=>r.items.forEach(it=>{if(Object.prototype.hasOwnProperty.call(prices,it.id)&&it.price!==prices[it.id]){it.price=prices[it.id];n++;}}));
  if(!n)return;save();
  if(cur()===p&&p.step>1&&!ui.picker&&!ui.modal)render();else renderChrome();}
function setSync(s){sync.state=s;const el=$('#syncState');if(!el)return;
  const t={saving:'Saving…',saved:'Saved',error:'Not saved yet · will retry',idle:'',off:''}[s]||'';
  el.textContent=t;el.className='sync-state '+s;el.hidden=!t;}
// Pull this browser's projects from the server (picks up changes made by the admin), then push anything newer here.
// The server bumps `rev` on every save; a higher rev than ours means someone else (the admin) changed it.
let lastPull=0;
async function pullServer(){
  if(!API||ADMIN)return;lastPull=Date.now();
  try{const r=await fetch('api/public/projects?token='+encodeURIComponent(token()));if(!r.ok)return;const d=await r.json();
    const seen=new Set();let changed=false;
    (d.projects||[]).forEach(sp=>{seen.add(sp.id);const i=store.projects.findIndex(x=>x.id===sp.id);
      if(i<0){store.projects.push(sp);changed=true;}
      else if((sp.rev||0)>(store.projects[i].rev||0)){store.projects[i]=sp;changed=true;}
      else if((store.projects[i].updated||0)>(sp.updated||0))queueSync(store.projects[i]);});
    store.projects.forEach(p=>{if(!seen.has(p.id))queueSync(p);});
    if(changed){save();if(!ui.picker&&!ui.modal)render();}
  }catch(e){}
}
// Coming back to the tab after a while: pick up price changes and admin edits made in the meantime
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&Date.now()-lastPull>60000)pullServer();});
function deleteRemote(p){if(!API||ADMIN)return;
  fetch('api/public/projects/'+encodeURIComponent(p.id),{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:token()})}).catch(()=>{});}

// ---------- project helpers ----------
function newRooms(counts){const rooms=[{id:uid(),type:'whole',name:'Whole home (central devices)',items:[]}];
  ROOM_TYPES.forEach(rt=>{const n=counts[rt.t]??0;for(let i=1;i<=n;i++)rooms.push({id:uid(),type:rt.t,name:n>1?`${rt.label} ${i}`:rt.label,items:[]});});return rooms;}
function blankProject(){const counts={};ROOM_TYPES.forEach(r=>counts[r.t]=r.def);
  return {id:uid(),name:'',client:{name:'',phone:'',whatsapp:'',email:'',address:'',contactTime:''},apt:{building:'',address:'',unit:'',floor:'',size:''},notes:DEFAULT_NOTES,rooms:newRooms(counts),created:Date.now(),updated:Date.now(),step:1};}
function exampleProject(){const p=blankProject();p.example=true;p.name='Ashfield Residence';p.client.name='Example client';
  p.apt={building:'Ashfield Tower',address:'Gulshan 2, Dhaka',unit:'C7',floor:'7',size:'2,450'};
  const by=t=>p.rooms.filter(r=>r.type===t);
  const add=(room,pid,o)=>{if(!PMAP[pid]||PMAP[pid].hidden)return;const it=Object.assign({id:uid(),pid,opt:[]},o);it.price=CORE.catalogPrice(it);room.items.push(it);};
  add(by('whole')[0],'p42',{qty:1});
  add(by('foyer')[0],'c200',{qty:1,opt:['Black','24 mm faceplate','No hook']});add(by('foyer')[0],'p23',{qty:1});
  add(by('living')[0],'n7',{qty:1,opt:['Standard (matte grey)']});add(by('living')[0],'blend',{qty:2,opt:['3-gang','Live + Neutral']});
  add(by('living')[0],'p16',{qty:1});add(by('living')[0],'p36',{length:12});add(by('living')[0],'p19',{qty:1});
  by('bedroom').forEach(r=>{add(r,'blend',{qty:1,opt:['2-gang','Live + Neutral']});add(r,'p16',{qty:1});});
  by('kitchen').forEach(r=>{add(r,'p21',{qty:1});add(r,'p20',{qty:1});});
  by('bath').forEach(r=>add(r,'p17',{qty:1}));
  add(by('balcony')[0],'p25',{qty:1});
  p.rooms.find(r=>r.type==='family').items.push({id:uid(),custom:{name:'Wi-Fi mesh router',cat:'Networking',unit:'pcs',price:9500,note:''},qty:2});
  p.step=3;return p;}

// ---------- state ----------
let ui={view:'home',roomId:null,picker:null,modal:null,errors:{}};
const cur=()=>store.projects.find(p=>p.id===store.active)||null;
function touch(){const p=cur();if(p){p.updated=Date.now();queueSync(p);}save();}

// ---------- render: chrome ----------
function renderChrome(){
  const p=ui.view==='home'?null:cur();
  $('#projName').innerHTML=p?`<b>${esc(p.name||'Untitled project')}</b><span>${esc([p.apt.building,p.apt.unit&&('Flat '+p.apt.unit)].filter(Boolean).join(' · ')||'Smart home budget')}</span>`:'';
  $('#projName').hidden=!p;
  const t=projTotal(p);
  $('#totalPill').innerHTML=p?`<small>Estimate total</small><b class="num">${fmt(t)}</b>`:'';
  const steps=[['Project details',1],['Rooms',2],['Products',3],['Summary',4]];
  $('#steps').innerHTML=p?steps.map(([l,n])=>`<button class="step ${p.step===n?'on':''} ${p.step>n?'done':''}" data-act="step" data-n="${n}"><span class="n">${n}</span>${l}</button>`).join(''):'';
  $('#steps').hidden=!p;
  const b=$('#bottom');
  if(p){const nxt=p.step<4?`<button class="btn primary sm" data-act="step" data-n="${p.step+1}">Next ${ico('arrowR')}</button>`:`<button class="btn accent sm" data-act="pdf">${ico('download')} PDF</button>`;
    b.innerHTML=`<div><small>Estimate total</small><b class="num">${fmt(t)}</b></div>${nxt}`;b.style.display='';}
  else{b.innerHTML='';b.style.display='none';}
}

// ---------- render: home ----------
function renderHome(){
  const ps=[...store.projects].sort((a,b)=>b.updated-a.updated);
  const cards=ps.map(p=>`<button class="proj-card" data-act="open" data-id="${p.id}">
    <div style="display:flex;gap:6px;flex-wrap:wrap">${p.example?'<span class="tag example">Example</span>':''}<span class="tag">${p.rooms.length} rooms</span><span class="tag">${projCount(p)} items</span></div>
    <h3>${esc(p.name||'Untitled project')}</h3>
    <div class="meta">${esc(p.client.name||'No client name')}${p.apt.building?' · '+esc(p.apt.building):''}</div>
    <div class="foot"><b class="num">${fmt(projTotal(p))}</b><span class="muted" style="font-size:12px">Edited ${new Date(p.updated).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span></div></button>`).join('');
  return `<section class="home-hero">
    <div><div class="eyebrow">Smart home budget planner</div><h1>Plan every room. See the cost as you go.</h1>
    <p>Add your apartment's rooms, pick smart devices for each one, and download a clear, room-by-room estimate as a PDF.</p></div>
    <div class="how"><div><b>1 · Project</b><span>Your name and apartment</span></div><div><b>2 · Rooms</b><span>Bedrooms, baths, balconies…</span></div><div><b>3 · Products</b><span>Pick devices per room</span></div><div><b>4 · Estimate</b><span>Review and download PDF</span></div></div>
  </section>
  <div class="sec-head"><div><h2>Your projects</h2><p>${API?`Projects are saved in this browser and shared with ${esc(CO.name||'us')} so we can help you.`:'Projects are saved in this browser.'} Use "Save project file" to keep a copy elsewhere.</p></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="import">${ico('upload')} Open project file</button><button class="btn primary" data-act="new">${ico('plus')} New project</button></div></div>
  <div class="proj-grid"><button class="proj-card new" data-act="new"><span class="plus">${ico('plus')}</span><b style="color:var(--ink)">Start a new estimate</b><span style="font-size:13px">About 5 minutes for a full apartment</span></button>${cards}</div>`;
}

// ---------- render: step 1 ----------
function f(id,label,val,opts={}){const e=ui.errors[id];
  return `<div class="field"><label for="${id}">${label}${opts.req?' <span class="req">*</span>':''}</label>
  <input class="input ${e?'err':''}" id="${id}" data-bind="${opts.bind}" value="${esc(val)}" ${opts.type?`type="${opts.type}"`:''} ${opts.ph?`placeholder="${esc(opts.ph)}"`:''} ${opts.mode?`inputmode="${opts.mode}"`:''} autocomplete="${opts.ac||'off'}">
  ${e?`<span class="err-msg">${e}</span>`:opts.hint?`<span class="hint">${opts.hint}</span>`:''}</div>`;}
function renderStep1(p){
  return `${p.example?exampleBanner():''}<div class="sec-head"><div><h2>Project details</h2><p>These details appear at the top of your estimate PDF.${API&&!ADMIN?` Your estimate is saved with ${esc(CO.name||'us')} as you work, so we can follow up with you.`:''}</p></div></div>
  <form class="panel form" id="f1" novalidate>
    <div class="fgroup"><h3>${ico('file')} Project</h3><div class="fgrid">
      ${f('pname','Project name',p.name,{req:1,bind:'name',ph:'e.g. Rahman Residence'})}</div></div>
    <div class="fgroup"><h3>${ico('edit')} Contact</h3><div class="fgrid">
      ${f('cname','Your name',p.client.name,{req:1,bind:'client.name',ac:'name'})}
      ${f('cphone','Phone',p.client.phone,{bind:'client.phone',type:'tel',ph:'+880 1XXX-XXXXXX',ac:'tel'})}
      ${f('cwa','WhatsApp',p.client.whatsapp,{bind:'client.whatsapp',type:'tel',ph:'If different from phone',ac:'tel'})}
      ${f('cemail','Email',p.client.email,{bind:'client.email',type:'email',ac:'email'})}
      ${f('caddr','Your address / area',p.client.address,{bind:'client.address',ph:'e.g. Banani, Dhaka',ac:'address-level2'})}
      ${f('ctime','Best time to contact you',p.client.contactTime,{bind:'client.contactTime',ph:'e.g. Weekdays after 6 pm'})}</div></div>
    <div class="fgroup"><h3>${ico('home')} Apartment</h3><div class="fgrid">
      ${f('abuilding','Building / project',p.apt.building,{bind:'apt.building',ph:'e.g. Ashfield Tower'})}
      ${f('aunit','Flat / unit',p.apt.unit,{bind:'apt.unit',ph:'e.g. C7'})}
      ${f('afloor','Floor',p.apt.floor,{bind:'apt.floor',mode:'numeric'})}
      ${f('asize','Size (sq ft)',p.apt.size,{bind:'apt.size',mode:'numeric',ph:'e.g. 1,850'})}
      <div class="field" style="grid-column:1/-1"><label for="aaddr">Address</label><input class="input" id="aaddr" data-bind="apt.address" value="${esc(p.apt.address)}" placeholder="Area, city" autocomplete="street-address"></div></div></div>
    <div class="fgroup"><h3>${ico('info')} Notes on the estimate</h3><div class="field"><textarea class="input" id="pnotes" data-bind="notes" aria-label="Notes">${esc(p.notes)}</textarea><span class="hint">Printed at the end of the PDF.</span></div></div>
  </form>
  <div class="actions"><button class="btn ghost" data-act="home">${ico('arrowL')} All projects</button><button class="btn primary" data-act="step" data-n="2">Continue to rooms ${ico('arrowR')}</button></div>`;
}

// ---------- render: step 2 ----------
function renderStep2(p){
  const counts={};ROOM_TYPES.forEach(rt=>counts[rt.t]=p.rooms.filter(r=>r.type===rt.t).length);
  const cards=ROOM_TYPES.map(rt=>`<div class="rt ${counts[rt.t]?'has':''}"><div class="rt-top"><span class="rt-ico">${ico(rt.ico)}</span><b>${rt.label}</b></div>
    <div class="counter"><button data-act="rc" data-t="${rt.t}" data-d="-1" ${counts[rt.t]?'':'disabled'} aria-label="Remove ${rt.label}">−</button><output class="num" aria-live="polite">${counts[rt.t]}</output><button data-act="rc" data-t="${rt.t}" data-d="1" aria-label="Add ${rt.label}">+</button></div></div>`).join('');
  const list=p.rooms.map(r=>`<div class="room-row"><span class="rt-ico" style="width:28px;height:28px">${ico(r.type==='whole'?'home':(ROOM_TYPES.find(x=>x.t===r.type)||{ico:'star'}).ico)}</span>
    <input value="${esc(r.name)}" data-rename="${r.id}" aria-label="Room name" id="rn-${r.id}"><span class="cnt">${r.items.length?r.items.length+' items':''}</span>
    ${r.type==='whole'?'':`<button class="icon-btn" data-act="rmroom" data-id="${r.id}" aria-label="Remove ${esc(r.name)}">${ico('trash')}</button>`}</div>`).join('');
  return `${p.example?exampleBanner():''}<div class="sec-head"><div><h2>Rooms</h2><p>Set how many of each room your apartment has. You can rename any room below.</p></div><span class="tag">${p.rooms.length} rooms in total</span></div>
  <div class="room-types">${cards}</div>
  <div class="panel card-pad" style="margin-top:16px"><h3>Add a room with your own name</h3><p class="muted" style="font-size:13.5px">For example: Study, Prayer room, Servant's room, Rooftop.</p>
    <div class="custom-room"><input class="input" id="customRoom" placeholder="Room name" maxlength="40"><button class="btn primary" data-act="addroom">${ico('plus')} Add room</button></div></div>
  <div style="margin-top:22px"><div class="eyebrow">Your rooms</div><div class="room-list">${list}</div></div>
  <div class="actions"><button class="btn ghost" data-act="step" data-n="1">${ico('arrowL')} Back</button><button class="btn primary" data-act="step" data-n="3">Choose products ${ico('arrowR')}</button></div>`;
}

// ---------- render: step 3 ----------
function itemRow(it){const l=lineInfo(it);if(!l)return '';
  const img=l.img?`<img class="thumb" src="${l.img}" alt="">`:`<div class="thumb ph">${ico(l.custom?'tag':'box')}</div>`;
  let ctrl;
  const isLen=l.custom?it.custom.unit==='m':PMAP[it.pid].unit.type==='length';
  if(isLen){ctrl=`<div><div class="stepper"><button data-act="len" data-id="${it.id}" data-d="-1" aria-label="Less">−</button><input type="number" min="0" step="0.5" value="${it.length||0}" data-len="${it.id}" aria-label="Length in metres"><button data-act="len" data-id="${it.id}" data-d="1" aria-label="More">+</button></div><div class="len-note">${l.custom?'metres':esc(l.qtyText)}</div></div>`;}
  else ctrl=`<div class="stepper"><button data-act="qty" data-id="${it.id}" data-d="-1" aria-label="Fewer">−</button><input type="number" min="1" step="1" value="${it.qty||1}" data-qty="${it.id}" aria-label="Quantity"><button data-act="qty" data-id="${it.id}" data-d="1" aria-label="More">+</button></div>`;
  return `<div class="item">${img}<div class="t"><b>${esc(l.name)} ${l.custom?'<span class="tag custom">Custom</span>':''}</b>${l.opt?`<div class="opt">${esc(l.opt)}</div>`:''}
    <div class="codes"><span>${esc(catLabel(l.cat))}</span>${l.code?`<span class="mono">${esc(l.code)}</span>`:''}${l.custom?`<button class="btn ghost sm" style="padding:0 4px;font-size:12px" data-act="editcustom" data-id="${it.id}">Edit</button>`:''}</div></div>
    <div class="qty">${ctrl}</div>
    <div class="amt">${l.onRequest?'<span class="req">Price on request</span>':`<b class="num">${fmt(l.amount)}</b><small class="num">${fmt(l.price)} / ${esc(l.unitLabel)}</small>`}${ADMIN&&!l.custom?priceEdit(it,l):''}</div>
    <button class="icon-btn rm" data-act="rmitem" data-id="${it.id}" aria-label="Remove ${esc(l.name)}">${ico('trash')}</button></div>`;}
// Admin edit mode: per-line unit price override. Empty = back to the current catalog price.
function priceEdit(it,l){
  const note=l.override?`<span class="ovr-note">Override${l.catalogPrice?' · list '+fmt(l.catalogPrice):''}</span>`:
    l.priceChanged?`<span class="ovr-note warn">List price now ${l.catalogPrice?fmt(l.catalogPrice):'on request'}</span>`:'';
  return `<label class="ovr">Unit price <input type="number" min="0" step="1" inputmode="numeric" value="${l.price??''}" data-price="${it.id}" placeholder="On request" aria-label="Unit price for ${esc(l.name)}"></label>${note}`;}
function renderStep3(p){
  if(!p.rooms.find(r=>r.id===ui.roomId))ui.roomId=p.rooms[0]&&p.rooms[0].id;
  const room=p.rooms.find(r=>r.id===ui.roomId);
  const rail=p.rooms.map((r,i)=>`${i===1?'<div class="rail-sep"></div>':''}<button class="rail-item ${r.id===ui.roomId?'on':''} ${r.items.length?'has':''}" data-act="room" data-id="${r.id}"><span class="dot"></span><span class="nm">${esc(r.name)}</span><span class="sub num">${r.items.length?fmt(roomTotal(r)).replace('BDT ',''):'—'}</span></button>`).join('');
  const chips=p.rooms.map(r=>`<button class="room-chip ${r.id===ui.roomId?'on':''}" data-act="room" data-id="${r.id}">${esc(r.name)}${r.items.length?`<small>${r.items.length}</small>`:''}</button>`).join('');
  const sug=(SUGGEST[room.type]||SUGGEST.custom).map(id=>PMAP[id]).filter(Boolean)
    .map(pp=>`<button class="sug" data-act="quick" data-pid="${pp.id}">${pp.img?`<img src="${pp.img}" alt="">`:''}${esc(pp.name.replace(' (Black)',''))}</button>`).join('');
  const canCopy=copySources(p,room).length>0;
  const body=room.items.length?`<div class="items">${room.items.map(itemRow).join('')}</div>`:
    `<div class="empty"><div class="ill">${ico('box')}</div><h3>No products in ${esc(room.name)} yet</h3><p>Pick a suggestion above, browse all products by category${canCopy?', or copy the devices from a room you already planned':''}.</p>
    <div class="empty-btns"><button class="btn primary" data-act="picker">${ico('plus')} Add products</button>${canCopy?`<button class="btn" data-act="copyroom">${ico('copy')} Copy from another room</button>`:''}</div></div>`;
  return `${p.example?exampleBanner():''}<div class="builder">
    <aside class="panel rail" aria-label="Rooms">${rail}<div class="rail-sep"></div><button class="rail-item" data-act="step" data-n="2"><span class="dot" style="background:none">${''}</span><span class="nm muted" style="font-weight:500">${ico('edit')} Edit rooms</span></button></aside>
    <section style="min-width:0"><div class="room-chips">${chips}</div>
    <div class="panel sheet"><div class="sheet-head"><div><div class="eyebrow">${room.type==='whole'?'Hubs, gateways and central control':'Room'}</div><h2>${esc(room.name)}</h2></div>
      <div class="btns">${canCopy&&room.items.length?`<button class="btn" data-act="copyroom" title="Copy devices from another room">${ico('copy')} Copy from room</button>`:''}<button class="btn" data-act="custom">${ico('tag')} Add your own item</button><button class="btn primary" data-act="picker">${ico('plus')} Add products</button></div></div>
      <div class="suggest"><span class="lbl">Suggested:</span>${sug}</div>
      ${body}
      <div class="sheet-foot"><span class="muted">${room.items.length} item${room.items.length===1?'':'s'} in this room</span><b class="num">${fmt(roomTotal(room))}</b></div></div>
    <div class="actions"><button class="btn ghost" data-act="step" data-n="2">${ico('arrowL')} Rooms</button><button class="btn primary" data-act="step" data-n="4">Review estimate ${ico('arrowR')}</button></div></section></div>`;
}

// ---------- render: step 4 ----------
function renderStep4(p){
  const total=projTotal(p),rooms=p.rooms.filter(r=>r.items.length),max=Math.max(1,...rooms.map(roomTotal));
  const cats={};p.rooms.forEach(r=>r.items.forEach(it=>{const l=lineInfo(it);if(!l)return;const k=catLabel(l.cat);cats[k]=(cats[k]||0)+l.amount;}));
  const catRows=Object.entries(cats).sort((a,b)=>b[1]-a[1]);const cmax=Math.max(1,...catRows.map(c=>c[1]));
  const req=onRequestCount(p);
  const lines=rooms.map(r=>`<tr class="room"><td colspan="3">${esc(r.name)}</td><td class="r num">${fmt(roomTotal(r))}</td></tr>`+
    r.items.map(it=>{const l=lineInfo(it);return `<tr><td>${esc(l.name)}${l.opt?`<div class="muted" style="font-size:12.5px">${esc(l.opt)}</div>`:''}</td><td class="num">${esc(l.qtyText)}</td><td class="r num">${l.onRequest?'—':fmt(l.price)}</td><td class="r num">${l.onRequest?'On request':fmt(l.amount)}</td></tr>`;}).join('')).join('');
  return `${p.example?exampleBanner():''}<div class="sec-head"><div><h2>Estimate summary</h2><p>${esc(p.name||'Untitled project')}${p.client.name?' · '+esc(p.client.name):''}</p></div></div>
  <div class="sum-grid"><div style="display:flex;flex-direction:column;gap:20px;min-width:0">
    <div class="panel grand"><div class="eyebrow">Estimated budget</div><div class="big num">${fmt(total)}</div>
      <div class="stats"><div><b class="num">${rooms.length}</b>rooms with products</div><div><b class="num">${projCount(p)}</b>line items</div><div><b class="num">${p.apt.size?esc(p.apt.size):'—'}</b>sq ft</div></div>
      <div class="btns"><button class="btn light" data-act="pdf" ${projCount(p)?'':'disabled'}>${ico('download')} Download PDF estimate</button><button class="btn outline" data-act="export">${ico('file')} Save project file</button></div></div>
    ${req?`<div class="note-box">${ico('info')}<span>${req} item${req>1?'s are':' is'} priced on request and not included in the total.</span></div>`:''}
    <div class="panel card-pad"><h3>All items</h3>${rooms.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Product</th><th>Qty</th><th class="r">Unit price</th><th class="r">Amount</th></tr></thead><tbody>${lines}</tbody></table></div>`:'<p class="muted">No products added yet.</p>'}</div>
  </div>
  <div style="display:flex;flex-direction:column;gap:20px;min-width:0">
    ${contactCard()}
    <div class="panel card-pad"><h3>By room</h3>${rooms.map(r=>`<div class="bar-row"><span class="nm">${esc(r.name)}</span><span class="v num">${fmt(roomTotal(r))}</span><div class="bar"><i style="width:${(roomTotal(r)/max*100).toFixed(1)}%"></i></div><span class="c">${r.items.length} items</span></div>`).join('')||'<p class="muted">—</p>'}</div>
    <div class="panel card-pad"><h3>By category</h3>${catRows.map(([k,v])=>`<div class="bar-row"><span class="nm">${esc(k)}</span><span class="v num">${fmt(v)}</span><div class="bar"><i style="width:${(v/cmax*100).toFixed(1)}%;background:var(--amber)"></i></div></div>`).join('')||'<p class="muted">—</p>'}</div>
  </div></div>
  <div class="actions"><button class="btn ghost" data-act="step" data-n="3">${ico('arrowL')} Back to products</button>${ADMIN?'':`<button class="btn danger ghost" data-act="delproj">${ico('trash')} Delete project</button>`}</div>`;
}
function contactCard(){if(!CO.name&&!CO.phone&&!CO.email)return '';
  const wa=(CO.whatsapp||'').replace(/\D/g,'');
  return `<div class="panel contact-card"><h3>Talk to ${esc(CO.name||'us')}</h3><p class="muted" style="font-size:13.5px">Send us your estimate PDF and we'll arrange a site survey and final quotation.</p>
  ${CO.phone?`<a class="row" href="tel:${esc(CO.phone.replace(/\s/g,''))}">${ico('phone')}<span>${esc(CO.phone)}</span></a>`:''}
  ${wa?`<a class="row" href="https://wa.me/${wa}" target="_blank" rel="noopener">${ico('chat')}<span>WhatsApp</span></a>`:''}
  ${CO.email?`<a class="row" href="mailto:${esc(CO.email)}">${ico('mail')}<span>${esc(CO.email)}</span></a>`:''}
  ${CO.website?`<a class="row" href="${/^https?:/.test(CO.website)?esc(CO.website):'https://'+esc(CO.website)}" target="_blank" rel="noopener">${ico('globe')}<span>${esc(CO.website)}</span></a>`:''}</div>`;}
function exampleBanner(){return `<div class="banner"><span><span class="tag example">Example</span>&nbsp; This is a sample project with example selections. Change anything, or start your own.</span><button class="btn primary sm" data-act="new">${ico('plus')} Start my own project</button></div>`;}

// ---------- render: picker ----------
function renderPicker(){
  const p=cur(),pk=ui.picker;const room=p.rooms.find(r=>r.id===pk.roomId)||p.rooms[0];
  const q=pk.q.trim().toLowerCase();
  const inGroup=PRODUCTS.filter(x=>pk.group==='all'||x.group===pk.group);
  const catsIn=[...new Set(inGroup.map(x=>x.cat))];
  const list=inGroup.filter(x=>(!pk.cat||x.cat===pk.cat)&&(!q||(x.name+' '+x.cat+' '+catLabel(x.cat)+' '+x.blurb+' '+x.model+' '+x.code).toLowerCase().includes(q)));
  const tabs=[{id:'all',label:'All'}].concat(GROUPS).map(g=>{const n=g.id==='all'?PRODUCTS.length:PRODUCTS.filter(x=>x.group===g.id).length;return `<button class="tabbtn ${pk.group===g.id?'on':''}" data-act="pgroup" data-g="${g.id}">${esc(g.label)}<small>${n}</small></button>`;}).join('');
  const chips=catsIn.length>1?`<div class="catchips"><button class="catchip ${!pk.cat?'on':''}" data-act="pcat" data-c="">All categories</button>${catsIn.map(c=>`<button class="catchip ${pk.cat===c?'on':''}" data-act="pcat" data-c="${esc(c)}">${esc(catLabel(c))}</button>`).join('')}</div>`:'';
  const cards=list.map(x=>`<button class="pcard" data-act="pick" data-pid="${x.id}"><div class="pimg ${x.img?'':'none'}">${x.img?`<img src="${x.img}" alt="" loading="lazy">`:'Image on request'}</div>
    <div class="pb"><span class="pc">${esc(catLabel(x.cat))}</span><span class="pn">${esc(x.name)}</span><span class="pd">${esc(x.blurb)}</span>
    <div class="pp"><b class="num">${priceLabel(x)}</b><span class="unit">${x.variants?x.variants.length+' options':unitText(x)}</span></div></div></button>`).join('');
  const customCard=`<button class="pcard customc" data-act="custom">${ico('tag')}<b style="color:var(--ink)">Can't find it?</b><span style="font-size:13px">Add your own item, like a Wi-Fi router, with your own price.</span></button>`;
  const roomOpts=p.rooms.map(r=>`<option value="${r.id}" ${r.id===room.id?'selected':''}>${esc(r.name)}</option>`).join('');
  let cfg='';
  if(pk.sel){const x=PMAP[pk.sel];const v=variantOf(x,pk.opt);const price=v?v.price:x.price;
    const isLen=x.unit.type==='length';const billQ=isLen?Math.max(0,Math.ceil((+pk.len||0)/x.unit.step-1e-9)):(+pk.qty||0);
    cfg=`<div class="cfg">${x.img?`<img src="${x.img}" alt="">`:`<div class="ph">${ico('box')}</div>`}<div style="min-width:0">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><span class="eyebrow" style="color:var(--accent)">${esc(catLabel((v&&v.cat)||x.cat))}</span><h4>${esc(x.name)}</h4></div><button class="icon-btn" data-act="unsel" aria-label="Close">${ico('x')}</button></div>
      <p class="muted" style="font-size:13.5px;margin-top:4px">${esc(x.blurb)}</p>
      <div class="spec">${x.specs.map(s=>`<span>${esc(s)}</span>`).join('')}${(v&&v.power||x.power)?`<span>Power: ${esc((v&&v.power)||x.power)}</span>`:''}</div>
      ${x.options?`<div class="opts">${x.options.map((o,i)=>`<div class="seg"><span>${esc(o.label)}</span><div>${o.choices.map(c=>`<button class="${pk.opt[i]===c?'on':''}" data-act="opt" data-i="${i}" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>`).join('')}</div>`:''}
      <div class="cfg-foot"><div class="field"><label for="cfgq">${isLen?(x.unit.step===1?'Length (metres)':`Length needed (metres) · sold in ${x.unit.step} m rolls`):'Quantity'}</label>
        <div class="stepper" style="width:max-content"><button data-act="cq" data-d="-1" aria-label="Less">−</button><input id="cfgq" type="number" min="${isLen?0:1}" step="${isLen?0.5:1}" value="${isLen?pk.len:pk.qty}"><button data-act="cq" data-d="1" aria-label="More">+</button></div>
        ${isLen&&x.unit.step>1?`<span class="hint">${billQ} roll${billQ===1?'':'s'} = ${billQ*x.unit.step} m</span>`:''}</div>
        <div class="tot"><small>${price?fmt(price)+' '+unitText(x):'Price on request'}</small><b class="num">${price?fmt(price*billQ):'On request'}</b></div>
        <button class="btn accent" data-act="addsel" ${billQ>0?'':'disabled'}>${ico('plus')} Add to ${esc(room.name)}</button></div>
      ${v?`<div class="muted mono" style="font-size:11.5px;margin-top:8px">Code ${esc(v.code)} · ${esc(v.model)}</div>`:x.code?`<div class="muted mono" style="font-size:11.5px;margin-top:8px">Code ${esc(x.code)} · ${esc(x.model)}</div>`:''}
    </div></div>`;}
  return `<div class="scrim" data-act="closepicker"></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="Add products">
    <div class="dr-head"><div class="dr-row"><h3>Add products</h3><button class="icon-btn" data-act="closepicker" aria-label="Close">${ico('x')}</button></div>
      <div class="dr-row"><label class="muted" for="pkRoom" style="font-size:13px;white-space:nowrap">Adding to</label><select class="input" id="pkRoom">${roomOpts}</select></div>
      <div class="dr-row"><div class="search">${ico('search')}<input class="input" id="pkSearch" placeholder="Search products, e.g. curtain, camera, switch" value="${esc(pk.q)}" autocomplete="off"></div></div>
      <div class="tabs">${tabs}</div>${chips}</div>
    <div class="dr-body" id="drBody">${list.length?`<div class="pgrid">${cards}${customCard}</div>`:`<div class="noresult"><p>No products match "${esc(pk.q)}".</p><div style="margin-top:12px"><button class="btn primary" data-act="custom">${ico('tag')} Add it as your own item</button></div></div>`}</div>
    ${cfg}</aside>`;
}

// ---------- render: custom item modal ----------
function renderCustom(){
  const p=cur(),m=ui.modal;const c=m.data;
  const allCats=[...new Set(PRODUCTS.map(x=>catLabel(x.cat)).concat(CUSTOM_CATS))].sort();
  const roomOpts=p.rooms.map(r=>`<option value="${r.id}" ${r.id===m.roomId?'selected':''}>${esc(r.name)}</option>`).join('');
  const e=ui.errors;const amt=(+c.price||0)*(c.unit==='m'?(+c.length||0):(+c.qty||0));
  return `<div class="scrim" data-act="closemodal" style="z-index:49"></div><div class="modal" role="dialog" aria-modal="true" aria-label="Your own item"><div class="modal-card">
    <div style="display:flex;justify-content:space-between;align-items:center"><h3>${m.editId?'Edit your item':'Add your own item'}</h3><button class="icon-btn" data-act="closemodal" aria-label="Close">${ico('x')}</button></div>
    <p class="muted" style="font-size:13.5px;margin-top:-8px">For anything not in our list. It is marked "Custom" on your estimate.</p>
    <div class="field"><label for="cuName">Item name <span class="req">*</span></label><input class="input ${e.cuName?'err':''}" id="cuName" value="${esc(c.name)}" placeholder="e.g. Wi-Fi router" maxlength="80">${e.cuName?`<span class="err-msg">${e.cuName}</span>`:''}</div>
    <div class="fgrid" style="grid-template-columns:1fr 1fr"><div class="field"><label for="cuCat">Category</label><input class="input" id="cuCat" list="cuCats" value="${esc(c.cat)}" placeholder="Choose or type a new one"><datalist id="cuCats">${allCats.map(x=>`<option value="${esc(x)}">`).join('')}</datalist></div>
      <div class="field"><label for="cuRoom">Room</label><select class="input" id="cuRoom">${roomOpts}</select></div></div>
    <div class="field"><label>Priced by</label><div class="unit-toggle"><button class="${c.unit!=='m'?'on':''}" data-act="cuunit" data-u="pcs">Quantity</button><button class="${c.unit==='m'?'on':''}" data-act="cuunit" data-u="m">Length (m)</button></div></div>
    <div class="fgrid" style="grid-template-columns:1fr 1fr"><div class="field"><label for="cuPrice">Price per ${c.unit==='m'?'metre':'piece'} (BDT) <span class="req">*</span></label><input class="input ${e.cuPrice?'err':''}" id="cuPrice" type="number" min="0" step="1" inputmode="numeric" value="${esc(c.price)}" placeholder="0">${e.cuPrice?`<span class="err-msg">${e.cuPrice}</span>`:''}</div>
      <div class="field"><label for="cuQty">${c.unit==='m'?'Length (metres)':'Quantity'}</label><input class="input" id="cuQty" type="number" min="0" step="${c.unit==='m'?0.5:1}" value="${esc(c.unit==='m'?c.length:c.qty)}"></div></div>
    <div class="field"><label for="cuNote">Note (optional)</label><input class="input" id="cuNote" value="${esc(c.note)}" placeholder="Brand, model or supplier" maxlength="120"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:14px">
      <div><small class="muted">Line total</small><div style="font-family:var(--f-display);font-weight:600;font-size:20px" class="num" id="cuAmt">${fmt(amt)}</div></div>
      <div style="display:flex;gap:8px"><button class="btn ghost" data-act="closemodal">Cancel</button><button class="btn accent" data-act="savecustom">${m.editId?'Save changes':ico('plus')+' Add item'}</button></div></div>
  </div></div>`;
}
// ---------- copy devices from another room ----------
// Rooms that have products, same room type first (Bedroom 1 → Bedroom 2)
function copySources(p,target){return p.rooms.filter(r=>r.id!==target.id&&r.items.length).sort((a,b)=>(b.type===target.type)-(a.type===target.type));}
function renderCopy(){
  const p=cur(),target=p.rooms.find(r=>r.id===ui.modal.roomId);const src=copySources(p,target);
  const rows=src.map(r=>{const names=r.items.map(it=>{const l=lineInfo(it);return l?l.name:'';}).filter(Boolean);
    return `<button class="copy-row" data-act="copyfrom" data-id="${r.id}"><span class="copy-main"><b>${esc(r.name)}</b><span class="muted">${esc(names.slice(0,3).join(', '))}${names.length>3?` and ${names.length-3} more`:''}</span></span>
      <span class="copy-side"><b class="num">${fmt(roomTotal(r))}</b><small>${r.items.length} item${r.items.length===1?'':'s'}</small></span></button>`;}).join('');
  return `<div class="scrim" data-act="closemodal" style="z-index:49"></div><div class="modal" role="dialog" aria-modal="true" aria-label="Copy from another room"><div class="modal-card">
    <div style="display:flex;justify-content:space-between;align-items:center"><h3>Copy devices to ${esc(target.name)}</h3><button class="icon-btn" data-act="closemodal" aria-label="Close">${ico('x')}</button></div>
    <p class="muted" style="font-size:13.5px;margin-top:-8px">All products and quantities from the room you pick are added to ${esc(target.name)}${target.items.length?' (on top of what is already there)':''}. You can change them afterwards.</p>
    <div class="copy-list">${rows}</div></div></div>`;}
function copyRoom(fromId){
  const p=cur(),target=p.rooms.find(r=>r.id===ui.modal.roomId),src=p.rooms.find(r=>r.id===fromId);if(!target||!src)return;
  const snap=clone(target.items);
  src.items.forEach(it=>{
    const same=!it.custom&&target.items.find(x=>!x.custom&&x.pid===it.pid&&JSON.stringify(x.opt||[])===JSON.stringify(it.opt||[]));
    if(same){if(it.length!=null)same.length=(+same.length||0)+(+it.length||0);else same.qty=(+same.qty||0)+(+it.qty||0);}
    else target.items.push(Object.assign(clone(it),{id:uid()}));});
  ui.modal=null;touch();render();
  toast(`Copied ${src.items.length} item${src.items.length===1?'':'s'} from ${src.name}`,()=>{const r=cur().rooms.find(x=>x.id===target.id);if(r){r.items=snap;touch();render();}});}
function renderConfirm(){const m=ui.modal;
  return `<div class="scrim" data-act="closemodal" style="z-index:49"></div><div class="modal" role="alertdialog" aria-modal="true"><div class="modal-card" style="width:min(420px,100%)">
  <h3>${esc(m.title)}</h3><p class="muted">${esc(m.text)}</p><div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn ghost" data-act="closemodal">Cancel</button><button class="btn primary" data-act="confirmyes" style="background:var(--danger);border-color:var(--danger)">${esc(m.yes)}</button></div></div></div>`;}

// ---------- main render ----------
function render(keepScroll){
  renderChrome();const p=cur();const main=$('#main');
  if(ui.view==='home'||!p){ui.view='home';main.innerHTML=renderHome();}
  else main.innerHTML=[null,renderStep1,renderStep2,renderStep3,renderStep4][p.step](p);
  renderLayer();
}
function renderLayer(){
  const L=$('#layer');
  if(ui.modal&&ui.modal.kind==='custom')L.innerHTML=(ui.picker?renderPicker():'')+renderCustom();
  else if(ui.modal&&ui.modal.kind==='confirm')L.innerHTML=renderConfirm();
  else if(ui.modal&&ui.modal.kind==='copy')L.innerHTML=renderCopy();
  else if(ui.picker)L.innerHTML=renderPicker();
  else L.innerHTML='';
  document.body.style.overflow=(ui.picker||ui.modal)?'hidden':'';
}
function rerenderPicker(focusSearch){const s=$('#drBody')?$('#drBody').scrollTop:0;renderLayer();const b=$('#drBody');if(b)b.scrollTop=s;
  if(focusSearch){const i=$('#pkSearch');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}}}

// ---------- toast ----------
let toastT;
function toast(msg,undo){clearTimeout(toastT);const h=$('#toastHost');
  h.innerHTML=`<div class="toast" role="status"><span>${esc(msg)}</span>${undo?'<button data-act="undo">Undo</button>':''}</div>`;
  ui.undo=undo||null;toastT=setTimeout(()=>{h.innerHTML='';ui.undo=null;},undo?6000:2600);}

// ---------- validation / steps ----------
function validate1(p){const e={};if(!p.name.trim())e.pname='Give your project a name, e.g. "Rahman Residence".';
  if(!p.client.name.trim())e.cname='Add your name so it appears on the estimate.';
  if(p.client.email&&!/^\S+@\S+\.\S+$/.test(p.client.email))e.cemail='This email looks incomplete.';ui.errors=e;return !Object.keys(e).length;}
function goStep(n){const p=cur();if(!p)return;
  if(n>1&&p.step===1&&!validate1(p)){render();const k=Object.keys(ui.errors)[0];const el=document.getElementById(k);if(el)el.focus();return;}
  if(n>1&&!validate1(p)){p.step=1;render();return;}
  ui.errors={};p.step=n;touch();render();window.scrollTo({top:0,behavior:'smooth'});}

// ---------- room ops ----------
function roomCount(t,d){const p=cur();const same=p.rooms.filter(r=>r.type===t);const rt=ROOM_TYPES.find(x=>x.t===t);
  if(d>0){const n=same.length+1;if(same.length===1&&same[0].name===rt.label)same[0].name=rt.label+' 1';
    const r={id:uid(),type:t,name:n>1?`${rt.label} ${n}`:rt.label,items:[]};
    const lastIdx=same.length?p.rooms.indexOf(same[same.length-1]):p.rooms.length-1;
    const order=ROOM_TYPES.map(x=>x.t);
    if(same.length)p.rooms.splice(lastIdx+1,0,r);else{let at=p.rooms.length;for(let i=1;i<p.rooms.length;i++){if(order.indexOf(p.rooms[i].type)>order.indexOf(t)||p.rooms[i].type==='custom'){at=i;break;}}p.rooms.splice(at,0,r);}
  }else if(same.length){const r=same[same.length-1];removeRoom(r.id);return;}
  touch();render();}
function removeRoom(id){const p=cur();const snap=clone(p.rooms);const r=p.rooms.find(x=>x.id===id);if(!r)return;
  p.rooms=p.rooms.filter(x=>x.id!==id);
  const same=p.rooms.filter(x=>x.type===r.type&&r.type!=='custom');const rt=ROOM_TYPES.find(x=>x.t===r.type);
  if(rt&&same.length===1&&same[0].name===rt.label+' 1')same[0].name=rt.label;
  touch();render();toast(`Removed ${r.name}${r.items.length?` and its ${r.items.length} item${r.items.length>1?'s':''}`:''}`,()=>{cur().rooms=snap;touch();render();});}

// ---------- item ops ----------
function addItem(roomId,pid,opt,qty,len){const p=cur();const room=p.rooms.find(r=>r.id===roomId);const x=PMAP[pid];
  const same=room.items.find(it=>it.pid===pid&&JSON.stringify(it.opt||[])===JSON.stringify(opt||[]));
  if(same){if(x.unit.type==='length')same.length=(+same.length||0)+(+len||0);else same.qty=(+same.qty||0)+(+qty||1);}
  else{const it=x.unit.type==='length'?{id:uid(),pid,opt:opt||[],length:+len||x.unit.step}:{id:uid(),pid,opt:opt||[],qty:+qty||1};
    it.price=CORE.catalogPrice(it);room.items.push(it);}   // freeze today's price on the line
  touch();return room;}
function findItem(id){const p=cur();for(const r of p.rooms){const it=r.items.find(i=>i.id===id);if(it)return {room:r,it};}return null;}

// ---------- picker ----------
function openPicker(){const p=cur();ui.picker={roomId:ui.roomId||p.rooms[0].id,group:'all',cat:'',q:'',sel:null,opt:[],qty:1,len:5};renderLayer();setTimeout(()=>{const s=$('#pkSearch');if(s&&window.matchMedia('(min-width:641px)').matches)s.focus();},50);}
function selectProduct(pid){const x=PMAP[pid];const pk=ui.picker;pk.sel=pid;pk.opt=x.options?x.options.map(o=>o.choices[0]):[];pk.qty=1;pk.len=x.unit.type==='length'?x.unit.step:0;rerenderPicker();}

// ---------- custom ----------
function openCustom(editId){const p=cur();let data={name:'',cat:'',unit:'pcs',price:'',qty:1,length:1,note:''},roomId=(ui.picker&&ui.picker.roomId)||ui.roomId||p.rooms[0].id;
  if(editId){const f=findItem(editId);data=Object.assign({},f.it.custom,{qty:f.it.qty||1,length:f.it.length||1});roomId=f.room.id;}
  else if(ui.picker&&ui.picker.q)data.name=ui.picker.q;
  ui.errors={};ui.modal={kind:'custom',data,roomId,editId};renderLayer();setTimeout(()=>{const n=$('#cuName');if(n)n.focus();},30);}
function readCustom(){const m=ui.modal;const c=m.data;const g=id=>{const el=document.getElementById(id);return el?el.value:'';};
  c.name=g('cuName');c.cat=g('cuCat');c.price=g('cuPrice');c.note=g('cuNote');m.roomId=g('cuRoom')||m.roomId;
  const q=g('cuQty');if(c.unit==='m')c.length=q;else c.qty=q;}
function saveCustom(){readCustom();const m=ui.modal,c=m.data;const e={};
  if(!c.name.trim())e.cuName='Enter a name for the item.';if(c.price===''||isNaN(+c.price)||+c.price<0)e.cuPrice='Enter the price in BDT, e.g. 9500.';
  ui.errors=e;if(Object.keys(e).length){renderLayer();return;}
  const p=cur();const custom={name:c.name.trim(),cat:c.cat.trim()||'Other',unit:c.unit,price:+c.price,note:c.note.trim()};
  const qty=Math.max(1,Math.round(+c.qty||1)),length=Math.max(0,+c.length||0);
  if(m.editId){const f=findItem(m.editId);f.it.custom=custom;if(custom.unit==='m'){f.it.length=length;delete f.it.qty;}else{f.it.qty=qty;delete f.it.length;}
    if(f.room.id!==m.roomId){f.room.items=f.room.items.filter(i=>i.id!==f.it.id);p.rooms.find(r=>r.id===m.roomId).items.push(f.it);}}
  else{const room=p.rooms.find(r=>r.id===m.roomId);room.items.push(custom.unit==='m'?{id:uid(),custom,length}:{id:uid(),custom,qty});}
  const rn=p.rooms.find(r=>r.id===m.roomId).name;ui.modal=null;ui.errors={};touch();
  if(!ui.picker)ui.roomId=m.roomId;render();toast(`${m.editId?'Updated':'Added'} ${custom.name} in ${rn}`);}

// ---------- PDF ----------
function dl(filename,data){
  const blob=data instanceof Blob?data:new Blob([data],{type:filename.endsWith('.json')?'application/json':'application/octet-stream'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);toast('Downloaded '+filename);return Promise.resolve();}
function safeName(s){return window.EstimatorPDF?window.EstimatorPDF.safeName(s):(s||'Smart Home');}
async function makePDF(){
  const p=cur();if(!window.jspdf||!window.EstimatorPDF){toast('The PDF tool could not load. Check that assets/vendor is uploaded.');return;}
  toast('Preparing your PDF…');
  try{const out=await window.EstimatorPDF.make(p,CORE,CFG);return dl(window.EstimatorPDF.fileName(p),out);}
  catch(e){toast('The PDF could not be created: '+e.message);}
}

// ---------- events ----------
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;const p=cur();
  switch(a){
    case 'home':if(ADMIN){location.href='admin/#/budgets/'+encodeURIComponent(store.active);break;}ui.view='home';ui.picker=null;ui.modal=null;render();break;
    case 'new':{const np=blankProject();store.projects.push(np);store.active=np.id;ui.view='project';ui.errors={};ui.roomId=null;save();render();window.scrollTo(0,0);setTimeout(()=>{const i=$('#pname');if(i)i.focus();},30);break;}
    case 'open':store.active=b.dataset.id;ui.view='project';ui.roomId=null;ui.errors={};save();render();window.scrollTo(0,0);break;
    case 'import':$('#importFile').click();break;
    case 'step':goStep(+b.dataset.n);break;
    case 'rc':roomCount(b.dataset.t,+b.dataset.d);break;
    case 'rmroom':removeRoom(b.dataset.id);break;
    case 'addroom':{const i=$('#customRoom');const v=i.value.trim();if(!v){i.focus();i.classList.add('err');return;}p.rooms.push({id:uid(),type:'custom',name:v,items:[]});touch();render();toast('Added '+v);break;}
    case 'room':ui.roomId=b.dataset.id;render();break;
    case 'picker':openPicker();break;
    case 'closepicker':ui.picker=null;renderLayer();render();break;
    case 'pgroup':ui.picker.group=b.dataset.g;ui.picker.cat='';ui.picker.sel=null;rerenderPicker();$('#drBody').scrollTop=0;break;
    case 'pcat':ui.picker.cat=b.dataset.c;ui.picker.sel=null;rerenderPicker();break;
    case 'pick':selectProduct(b.dataset.pid);break;
    case 'unsel':ui.picker.sel=null;rerenderPicker();break;
    case 'opt':ui.picker.opt[+b.dataset.i]=b.dataset.v;rerenderPicker();break;
    case 'cq':{const x=PMAP[ui.picker.sel];const d=+b.dataset.d;if(x.unit.type==='length')ui.picker.len=Math.max(0,(+ui.picker.len||0)+d*(x.unit.step>1?1:1));else ui.picker.qty=Math.max(1,(+ui.picker.qty||1)+d);rerenderPicker();break;}
    case 'addsel':{const pk=ui.picker;const x=PMAP[pk.sel];const room=addItem(pk.roomId,pk.sel,pk.opt,pk.qty,pk.len);pk.sel=null;rerenderPicker();renderChrome();
      toast(`Added ${x.name}${x.unit.type==='length'?'':' ×'+pk.qty} to ${room.name}`);break;}
    case 'quick':{const x=PMAP[b.dataset.pid];if(x.options||x.unit.type==='length'){openPicker();selectProduct(x.id);}else{const room=addItem(ui.roomId,x.id,[],1,0);render();toast(`Added ${x.name} to ${room.name}`);}break;}
    case 'qty':{const f=findItem(b.dataset.id);f.it.qty=Math.max(1,(+f.it.qty||1)+(+b.dataset.d));touch();render();break;}
    case 'len':{const f=findItem(b.dataset.id);f.it.length=Math.max(0,(+f.it.length||0)+(+b.dataset.d));touch();render();break;}
    case 'rmitem':{const f=findItem(b.dataset.id);const snap=clone(f.room.items);const nm=(lineInfo(f.it)||{}).name;f.room.items=f.room.items.filter(i=>i.id!==f.it.id);touch();render();
      toast(`Removed ${nm}`,()=>{const r=cur().rooms.find(x=>x.id===f.room.id);if(r){r.items=snap;touch();render();}});break;}
    case 'custom':openCustom();break;
    case 'copyroom':ui.modal={kind:'copy',roomId:ui.roomId};renderLayer();break;
    case 'copyfrom':copyRoom(b.dataset.id);break;
    case 'editcustom':openCustom(b.dataset.id);break;
    case 'cuunit':readCustom();ui.modal.data.unit=b.dataset.u;renderLayer();break;
    case 'savecustom':saveCustom();break;
    case 'closemodal':ui.modal=null;ui.errors={};renderLayer();break;
    case 'pdf':if(projCount(p))makePDF();else toast('Add at least one product first.');break;
    case 'export':dl(`${safeName(p.name)} - project.json`,JSON.stringify({app:'smart-home-estimator',version:1,project:p},null,2));break;
    case 'delproj':ui.modal={kind:'confirm',title:'Delete this project?',text:`"${p.name||'Untitled project'}" and all its rooms and products will be removed from this browser.`,yes:'Delete project',
      fn:()=>{const snap=clone(p);store.projects=store.projects.filter(x=>x.id!==p.id);store.active=null;ui.view='home';save();render();deleteRemote(snap);
        toast('Project deleted',()=>{snap.updated=Date.now();store.projects.push(snap);save();queueSync(snap);render();});}};renderLayer();break;
    case 'confirmyes':{const fn=ui.modal.fn;ui.modal=null;renderLayer();fn&&fn();break;}
    case 'undo':if(ui.undo){const u=ui.undo;ui.undo=null;$('#toastHost').innerHTML='';u();}break;
  }
});
document.addEventListener('input',e=>{
  const t=e.target;const p=cur();
  if(t.dataset.bind&&p){const path=t.dataset.bind.split('.');let o=p;while(path.length>1)o=o[path.shift()];o[path[0]]=t.value;
    if(ui.errors[t.id]){delete ui.errors[t.id];t.classList.remove('err');const m=t.parentElement.querySelector('.err-msg');if(m)m.remove();}touch();renderChrome();return;}
  if(t.dataset.rename){const r=p.rooms.find(x=>x.id===t.dataset.rename);if(r){r.name=t.value;touch();}return;}
  if(t.id==='pkSearch'){ui.picker.q=t.value;ui.picker.sel=null;rerenderPicker(true);return;}
  if(t.id==='cfgq'){const x=PMAP[ui.picker.sel];if(x.unit.type==='length')ui.picker.len=t.value;else ui.picker.qty=t.value;
    clearTimeout(t._t);t._t=setTimeout(()=>{rerenderPicker();const i=$('#cfgq');if(i){i.focus();i.setSelectionRange&&0;}},350);return;}
  if(t.id==='customRoom')t.classList.remove('err');
  if(['cuPrice','cuQty'].includes(t.id)&&ui.modal){readCustom();const c=ui.modal.data;const amt=(+c.price||0)*(c.unit==='m'?(+c.length||0):(+c.qty||0));const el=$('#cuAmt');if(el)el.textContent=fmt(amt);}
});
document.addEventListener('change',e=>{
  const t=e.target;const p=cur();
  if(t.dataset.qty){const f=findItem(t.dataset.qty);f.it.qty=Math.max(1,Math.round(+t.value||1));touch();render();}
  else if(t.dataset.len){const f=findItem(t.dataset.len);f.it.length=Math.max(0,+t.value||0);touch();render();}
  else if(t.dataset.price&&ADMIN){const f=findItem(t.dataset.price);const v=t.value.trim();
    if(v===''||isNaN(+v)){f.it.price=CORE.catalogPrice(f.it);delete f.it.override;}else{f.it.price=Math.max(0,Math.round(+v));f.it.override=true;}
    touch();render();}
  else if(t.dataset.rename){render();}
  else if(t.id==='pkRoom'){ui.picker.roomId=t.value;ui.roomId=t.value;rerenderPicker();render();}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(ui.modal){ui.modal=null;renderLayer();}else if(ui.picker){if(ui.picker.sel){ui.picker.sel=null;rerenderPicker();}else{ui.picker=null;render();}}}
  if(e.key==='Enter'&&e.target.id==='customRoom'){e.preventDefault();document.querySelector('[data-act="addroom"]').click();}
  if(e.key==='Enter'&&e.target.closest&&e.target.closest('.modal-card')&&e.target.tagName==='INPUT'){e.preventDefault();saveCustom();}
});
document.addEventListener('submit',e=>e.preventDefault());
$('#importFile').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;const rd=new FileReader();
  rd.onload=()=>{try{const d=JSON.parse(rd.result);const pr=d.project||d;if(!pr||!Array.isArray(pr.rooms))throw 0;pr.id=uid();pr.updated=Date.now();pr.example=false;pr.step=pr.step||3;
    store.projects.push(pr);store.active=pr.id;ui.view='project';save();render();toast('Opened '+(pr.name||'project'));}catch(err){toast('That file is not a Smart Home Estimator project.');}
    e.target.value='';};rd.readAsText(file);});

// ---------- boot ----------
document.title=CFG.appName;
const bt=document.querySelector('.brand span:last-child');if(bt)bt.textContent=CFG.appName;
if(CO.logo){const m=document.querySelector('.brand-mark');if(m)m.outerHTML=`<img class="brand-logo" src="${esc(CO.logo)}" alt="">`;}
const sf=document.getElementById('siteFoot');if(sf)sf.innerHTML=`<span>${esc(CO.name||CFG.appName)}${CO.address?' · '+esc(CO.address):''}</span><span>Prices updated ${esc((window.CATALOG.updated||''))} · ${API?`Your projects are saved in this browser and with ${esc(CO.name||'us')}`:'Your projects are saved in this browser only'}</span>`;
// Admin edit mode: load one client budget from the server and save changes back to it (never to localStorage)
async function bootAdmin(){
  try{const r=await fetch('api/admin/projects/'+encodeURIComponent(EDIT_ID));
    if(r.status===401){location.href='admin/?next='+encodeURIComponent(location.pathname+location.search);return false;}
    if(!r.ok)throw new Error('Budget not found');
    const d=await r.json();const pr=d.project.data;pr.id=d.project.id;delete pr.example;
    ADMIN=true;store={projects:[pr],active:pr.id};ui.view='project';
    const bar=document.createElement('div');bar.className='admin-bar';
    bar.innerHTML=`<div class="admin-bar-in"><b>Admin</b><span>Editing ${esc(pr.client&&pr.client.name||'client')}'s budget · changes save automatically</span><span class="sync-state" id="syncState" hidden></span><a class="btn sm" href="admin/#/budgets/${encodeURIComponent(pr.id)}">Back to admin</a></div>`;
    document.body.prepend(bar);return true;}
  catch(e){$('#main').innerHTML=`<p style="padding:40px">This budget could not be opened (${esc(e.message)}). <a href="admin/">Back to admin</a></p>`;return false;}
}
(async function boot(){
  if(EDIT_ID){if(!await bootAdmin())return;}
  else{load();
    if(!store.projects.length&&CFG.showExampleProject!==false){const ex=exampleProject();store.projects.push(ex);save();}
    if(store.active&&cur()){ui.view='project';}}
  render();
  if(API&&!ADMIN){const el=document.createElement('span');el.id='syncState';el.hidden=true;$('.top-in').appendChild(el);pullServer();}
})();
})();
